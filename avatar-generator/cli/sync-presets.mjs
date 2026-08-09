#!/usr/bin/env node
/**
 * Inject presets/ and avatars/ into the embedded <script type="application/json">
 * blocks in index.html, so the tool still works when opened straight off disk.
 *
 *   node cli/sync-presets.mjs
 *
 * The JSON files are the source of truth. This only refreshes the snapshot.
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const readJson = async (rel) => JSON.parse(await readFile(join(root, rel), 'utf8'));

const shotSuite = await readJson('presets/shot-suite-20.json');
const realism = await readJson('presets/realism.json');

const avatarFiles = (await readdir(join(root, 'avatars'))).filter((f) => f.endsWith('.json')).sort();
const seeds = [];
for (const f of avatarFiles) seeds.push(await readJson(join('avatars', f)));

const htmlPath = join(root, 'index.html');
let html = await readFile(htmlPath, 'utf8');

function inject(id, value) {
  const open = `<script type="application/json" id="${id}">`;
  const close = '<\/script>';
  const start = html.indexOf(open);
  if (start === -1) throw new Error(`missing block #${id} in index.html`);
  const from = start + open.length;
  const end = html.indexOf(close, from);
  if (end === -1) throw new Error(`unterminated block #${id}`);
  const json = JSON.stringify(value);
  if (json.includes('</script')) throw new Error(`#${id} contains a literal </script — escape it first`);
  html = html.slice(0, from) + json + html.slice(end);
}

inject('aag-shot-suite', shotSuite);
inject('aag-realism', realism);
inject('aag-seed-avatars', seeds);

await writeFile(htmlPath, html);
console.log(`synced: ${shotSuite.shots.length} shots, ${realism.presets.length} realism presets, ${seeds.length} avatar(s) [${seeds.map((s) => s.id).join(', ')}]`);
