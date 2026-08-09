#!/usr/bin/env node
/**
 * AI Avatar Generator — batch runner.
 *
 * Reads an avatar card, builds one prompt per shot from the shared composer in
 * lib/prompt.js, calls the OpenAI Images API, and writes every shot to its own
 * file. Never a collage, never a sheet.
 *
 *   export OPENAI_API_KEY=sk-...
 *   node cli/generate-set.mjs --avatar avatars/daniela.json --out out/daniela
 *   node cli/generate-set.mjs --avatar avatars/daniela.json --ref refs/daniela.jpg
 *   node cli/generate-set.mjs --avatar avatars/daniela.json --shots 01,08,19
 *   node cli/generate-set.mjs --avatar avatars/daniela.json --dry-run
 *
 * Zero dependencies — Node 18+ only.
 */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, basename, extname } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

await import('../lib/prompt.js');
const { buildPrompt, renderBasePrompt, outputFilename, pad2 } = globalThis.AAGPrompt;

/* ----------------------------------------------------------------- args -- */

function parseArgs(argv) {
  const out = { refs: [], flags: new Set() };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const takesValue = !['dry-run', 'help', 'overwrite', 'no-refs'].includes(key);
    if (!takesValue) { out.flags.add(key); continue; }
    const value = argv[++i];
    if (value === undefined) fail(`--${key} needs a value`);
    if (key === 'ref') out.refs.push(value);
    else out[key] = value;
  }
  return out;
}

function fail(msg) {
  console.error('error: ' + msg);
  process.exit(1);
}

const USAGE = `
AI Avatar Generator — batch runner

  node cli/generate-set.mjs --avatar <card.json> [options]

Options
  --avatar <path>      Avatar card JSON.                         (required)
  --out <dir>          Output directory.        default: out/<avatar-id>-r<identity_revision>
  --ref <path>         Master reference image. Repeatable, up to 16.
                       If omitted, any file in refs/<avatar-id>/ is picked up automatically.
  --no-refs            Ignore references and generate from the card text alone.
  --shots <list>       Comma-separated shot numbers or ids. default: all 20
  --suite <path>       Shot suite JSON.              default: presets/shot-suite-20.json
  --realism <path>     Realism presets JSON.         default: presets/realism.json
  --model <id>         default: from the card, else gpt-image-1.5
  --size <wxh>         1024x1024 | 1024x1536 | 1536x1024 | auto
  --quality <tier>     low | medium | high | auto
  --format <fmt>       png | jpeg | webp
  --concurrency <n>    Parallel requests. default: 2
  --extra "<text>"     Extra direction appended to every prompt this run.
  --base-url <url>     default: https://api.openai.com/v1  (or OPENAI_BASE_URL)
  --overwrite          Regenerate shots whose file already exists.
  --dry-run            Write the prompts and the manifest, call no API, spend nothing.

Environment
  OPENAI_API_KEY       Required unless --dry-run.
`;

const args = parseArgs(process.argv.slice(2));
if (args.flags.has('help') || !args.avatar) { console.log(USAGE); process.exit(args.avatar ? 0 : 1); }

const dryRun = args.flags.has('dry-run');
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey && !dryRun) fail('OPENAI_API_KEY is not set. Export it, or use --dry-run.');

/* ----------------------------------------------------------------- load -- */

const readJson = async (p) => JSON.parse(await readFile(p, 'utf8'));

const cardPath = resolve(args.avatar);
if (!existsSync(cardPath)) fail(`avatar card not found: ${cardPath}`);
const card = await readJson(cardPath);
if (!card.id || !card.identity_lock) fail('that file does not look like an avatar card (missing id / identity_lock)');

const suite = await readJson(resolve(args.suite || join(root, 'presets/shot-suite-20.json')));
const realism = await readJson(resolve(args.realism || join(root, 'presets/realism.json')));

/* base_prompt is derived, never authored — rebuild it so a stale card cannot
 * silently send a description that disagrees with identity_lock. */
const rebuilt = renderBasePrompt(card);
if (card.base_prompt && card.base_prompt.trim() !== rebuilt.trim()) {
  console.warn('note: base_prompt in the card differs from identity_lock; using the value rebuilt from identity_lock.');
}
card.base_prompt = rebuilt;

const defaults = card.generation_defaults || {};
const cfg = {
  model: args.model || defaults.model || 'gpt-image-1.5',
  size: args.size || defaults.size || '1024x1536',
  quality: args.quality || defaults.quality || 'high',
  format: args.format || defaults.output_format || 'png',
  inputFidelity: defaults.input_fidelity || 'high',
  baseUrl: (args['base-url'] || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, ''),
  concurrency: Math.max(1, Math.min(8, Number(args.concurrency) || 2)),
  extra: args.extra || '',
};

const revision = card.identity_revision || 1;
const outDir = resolve(args.out || join(root, 'out', `${card.id}-r${revision}`));

/* ------------------------------------------------------------ references -- */

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };

async function collectReferences() {
  if (args.flags.has('no-refs')) return [];
  let paths = args.refs.map((p) => resolve(p));
  if (!paths.length) {
    const auto = join(root, 'refs', card.id);
    if (existsSync(auto)) {
      paths = (await readdir(auto)).filter((f) => IMAGE_EXT.has(extname(f).toLowerCase())).sort().map((f) => join(auto, f));
    }
  }
  const refs = [];
  for (const p of paths.slice(0, 16)) {
    if (!existsSync(p)) fail(`reference not found: ${p}`);
    const ext = extname(p).toLowerCase();
    if (!IMAGE_EXT.has(ext)) fail(`unsupported reference type: ${p}`);
    refs.push({ path: p, name: basename(p), type: MIME[ext], bytes: await readFile(p) });
  }
  return refs;
}

const references = await collectReferences();

/* --------------------------------------------------------------- shots -- */

function selectShots() {
  const all = suite.shots.slice().sort((a, b) => a.order - b.order);
  if (!args.shots) return all;
  const wanted = args.shots.split(',').map((s) => s.trim()).filter(Boolean);
  const picked = [];
  for (const w of wanted) {
    const shot = /^\d+$/.test(w) ? all.find((s) => s.order === Number(w)) : all.find((s) => s.id === w);
    if (!shot) fail(`unknown shot: ${w}`);
    if (!picked.includes(shot)) picked.push(shot);
  }
  return picked;
}

const shots = selectShots();

/* ----------------------------------------------------------------- api -- */

class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}
const RETRYABLE = new Set([408, 409, 429, 500, 502, 503, 504]);

async function parseError(res) {
  let detail;
  try {
    const body = await res.json();
    detail = body?.error?.message || JSON.stringify(body).slice(0, 400);
  } catch {
    detail = (await res.text().catch(() => res.statusText)).slice(0, 400);
  }
  return new ApiError(`HTTP ${res.status} — ${detail}`, res.status);
}

async function callApi(prompt) {
  const headers = { Authorization: 'Bearer ' + apiKey };
  let res;

  if (references.length) {
    const form = new FormData();
    form.append('model', cfg.model);
    form.append('prompt', prompt);
    form.append('n', '1');
    if (cfg.size !== 'auto') form.append('size', cfg.size);
    if (cfg.quality !== 'auto') form.append('quality', cfg.quality);
    // input_fidelity exists only on gpt-image-1; gpt-image-1.5 rejects it and behaves as high.
    if (cfg.model === 'gpt-image-1') form.append('input_fidelity', cfg.inputFidelity);
    form.append('output_format', cfg.format);
    for (const ref of references) {
      form.append('image[]', new Blob([ref.bytes], { type: ref.type }), ref.name);
    }
    res = await fetch(cfg.baseUrl + '/images/edits', { method: 'POST', headers, body: form });
  } else {
    const body = { model: cfg.model, prompt, n: 1, output_format: cfg.format };
    if (cfg.size !== 'auto') body.size = cfg.size;
    if (cfg.quality !== 'auto') body.quality = cfg.quality;
    res = await fetch(cfg.baseUrl + '/images/generations', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  if (!res.ok) throw await parseError(res);
  const json = await res.json();
  const item = json.data?.[0];
  if (!item) throw new ApiError('API returned no image data', 200);
  if (item.b64_json) return Buffer.from(item.b64_json, 'base64');
  if (item.url) {
    const img = await fetch(item.url);
    if (!img.ok) throw new ApiError('could not download the generated image', img.status);
    return Buffer.from(await img.arrayBuffer());
  }
  throw new ApiError('API response had neither b64_json nor url', 200);
}

async function callWithRetry(prompt, label) {
  const maxAttempts = 4;
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try { return await callApi(prompt); }
    catch (err) {
      lastErr = err;
      const retryable = err instanceof ApiError ? RETRYABLE.has(err.status) : true;
      if (!retryable || attempt === maxAttempts) break;
      const wait = 2000 * 2 ** (attempt - 1);
      console.warn(`  ${label}: ${err.message} — retrying in ${wait / 1000}s (${attempt}/${maxAttempts - 1})`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

/* ----------------------------------------------------------------- run -- */

await mkdir(outDir, { recursive: true });
await mkdir(join(outDir, 'prompts'), { recursive: true });

console.log(`avatar     ${card.name} (${card.id}) — identity revision ${revision}`);
console.log(`shots      ${shots.length} of ${suite.shots.length} · suite ${suite.id}`);
console.log(`references ${references.length ? references.map((r) => r.name).join(', ') + '  → /images/edits' : 'none → /images/generations (text only)'}`);
console.log(`model      ${cfg.model} · ${cfg.size} · quality ${cfg.quality} · ${cfg.format}`);
console.log(`out        ${outDir}`);
if (dryRun) console.log('mode       DRY RUN — prompts only, no API calls\n');
else console.log('');

if (!references.length && !args.flags.has('no-refs')) {
  console.warn('warning: no master reference. Identity will drift more across the set.');
  console.warn(`         Drop an image in refs/${card.id}/ or pass --ref <path>, then rerun.\n`);
}

const results = [];
const queue = shots.slice();
let failures = 0;
let completed = 0;

async function worker() {
  while (queue.length) {
    const shot = queue.shift();
    const label = `${pad2(shot.order)} ${shot.id}`;
    const filename = outputFilename(card, shot, revision, cfg.format);
    const target = join(outDir, filename);
    const prompt = buildPrompt(card, shot, { realism }, { hasReferences: references.length > 0, extra: cfg.extra });

    await writeFile(join(outDir, 'prompts', filename.replace(/\.\w+$/, '.txt')), prompt);

    if (!dryRun && existsSync(target) && !args.flags.has('overwrite')) {
      console.log(`  ${label}  skipped (exists — use --overwrite)`);
      results.push({ ...shotMeta(shot, filename), status: 'skipped' });
      continue;
    }
    if (dryRun) {
      results.push({ ...shotMeta(shot, filename), status: 'dry-run', prompt });
      console.log(`  ${label}  prompt written (${prompt.length} chars)`);
      continue;
    }

    try {
      const bytes = await callWithRetry(prompt, label);
      await writeFile(target, bytes);
      completed++;
      console.log(`  ${label}  → ${filename}  (${(bytes.length / 1024).toFixed(0)} KB)  [${completed}/${shots.length}]`);
      results.push({ ...shotMeta(shot, filename), status: 'ok', bytes: bytes.length, prompt });
    } catch (err) {
      failures++;
      console.error(`  ${label}  FAILED — ${err.message}`);
      results.push({ ...shotMeta(shot, filename), status: 'failed', error: err.message, prompt });
    }
  }
}

function shotMeta(shot, filename) {
  return { order: shot.order, shot_id: shot.id, group: shot.group, label_es: shot.label_es, filename };
}

await Promise.all(Array.from({ length: Math.min(cfg.concurrency, shots.length) }, worker));

results.sort((a, b) => a.order - b.order);

const manifest = {
  generated_at: new Date().toISOString(),
  avatar_id: card.id,
  avatar_name: card.name,
  identity_revision: revision,
  card_revision: card.revision,
  shot_suite: suite.id,
  output_rule: suite.output_rule,
  backend: { api: cfg.baseUrl, ...cfg, apiKey: undefined },
  references: references.map((r) => ({ name: r.name, path: r.path, bytes: r.bytes.length })),
  results: results.map(({ prompt, ...rest }) => rest),
  card,
};
await writeFile(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

console.log('');
console.log(`manifest   ${join(outDir, 'manifest.json')}`);
console.log(`prompts    ${join(outDir, 'prompts')}/`);
if (dryRun) console.log(`\nDry run complete — ${results.length} prompts written, nothing spent.`);
else console.log(`\nDone: ${completed} generated, ${failures} failed, ${results.filter((r) => r.status === 'skipped').length} skipped.`);
if (failures) process.exitCode = 1;
