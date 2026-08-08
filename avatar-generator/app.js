/* AI Avatar Generator — application logic.
 *
 * Everything runs in the browser. The avatar registry lives in localStorage;
 * reference and output images live in IndexedDB. The OpenAI key is sent only
 * to the configured API base URL and is never transmitted anywhere else.
 *
 * Prompt composition lives in lib/prompt.js, shared with the Node CLI.
 */
'use strict';

/* ------------------------------------------------------------------ data -- */

const DATA = { shotSuite: null, realism: null, seeds: [] };

function readEmbedded(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  try { return JSON.parse(el.textContent); }
  catch (err) { console.error('bad embedded JSON in #' + id, err); return null; }
}

/* Prefer the canonical files under presets/ and avatars/ when the page is
 * served over http(s); fall back to the embedded snapshot on file:// . */
async function loadData() {
  DATA.shotSuite = readEmbedded('aag-shot-suite');
  DATA.realism = readEmbedded('aag-realism');
  DATA.seeds = readEmbedded('aag-seed-avatars') || [];

  /* The standalone single-file build has no sibling files to fetch. */
  if (location.protocol === 'file:' || (globalThis.AAG_DEFAULTS || {}).standalone) return;
  const tryFetch = async (url) => {
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      return res.ok ? await res.json() : null;
    } catch { return null; }
  };
  const [suite, realism, daniela] = await Promise.all([
    tryFetch('presets/shot-suite-20.json'),
    tryFetch('presets/realism.json'),
    tryFetch('avatars/daniela.json'),
  ]);
  if (suite && Array.isArray(suite.shots) && suite.shots.length) DATA.shotSuite = suite;
  if (realism && Array.isArray(realism.presets) && realism.presets.length) DATA.realism = realism;
  if (daniela && daniela.id) DATA.seeds = [daniela];
}

const shots = () => (DATA.shotSuite && DATA.shotSuite.shots) || [];
const shotById = (id) => shots().find((s) => s.id === id);

/* --------------------------------------------------------------- storage -- */

const LS_REGISTRY = 'aag.registry.v1';
const LS_SETTINGS = 'aag.settings.v1';

const memoryFallback = new Map();
const store = {
  get(key) {
    try { return localStorage.getItem(key); }
    catch { return memoryFallback.has(key) ? memoryFallback.get(key) : null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); }
    catch { memoryFallback.set(key, value); }
  },
};

const DEFAULT_SETTINGS = {
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-image-1.5',
  size: '1024x1536',
  quality: 'high',
  inputFidelity: 'high',
  outputFormat: 'png',
  concurrency: 2,
  rememberKey: true,
  demoMode: false,
};

let settings = { ...DEFAULT_SETTINGS, ...(globalThis.AAG_DEFAULTS || {}) };
let registry = { avatars: {}, activeId: null };

function loadSettings() {
  const base = { ...DEFAULT_SETTINGS, ...(globalThis.AAG_DEFAULTS || {}) };
  const raw = store.get(LS_SETTINGS);
  settings = base;
  if (raw) { try { settings = { ...base, ...JSON.parse(raw) }; } catch { /* keep defaults */ } }
}
function saveSettings() {
  const out = { ...settings };
  if (!out.rememberKey) out.apiKey = '';
  store.set(LS_SETTINGS, JSON.stringify(out));
}
function loadRegistry() {
  const raw = store.get(LS_REGISTRY);
  if (raw) { try { registry = JSON.parse(raw); } catch { /* keep defaults */ } }
  if (!registry.avatars) registry.avatars = {};
  for (const seed of DATA.seeds) {
    const existing = registry.avatars[seed.id];
    /* Seed cards ship with the app. Adopt a newer shipped revision unless the
     * user has already edited their own copy past it. */
    if (!existing || (seed.revision || 1) > (existing.revision || 1)) {
      registry.avatars[seed.id] = structuredClone(seed);
    }
  }
  if (!registry.activeId || !registry.avatars[registry.activeId]) {
    registry.activeId = Object.keys(registry.avatars)[0] || null;
  }
  saveRegistry();
}
function saveRegistry() { store.set(LS_REGISTRY, JSON.stringify(registry)); }
function activeCard() { return registry.activeId ? registry.avatars[registry.activeId] : null; }

/* IndexedDB for image blobs — localStorage cannot hold twenty PNGs. */

const DB_NAME = 'aag';
const DB_VERSION = 1;
let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('refs')) db.createObjectStore('refs', { keyPath: 'key' });
      if (!db.objectStoreNames.contains('outputs')) db.createObjectStore('outputs', { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }).catch((err) => { console.warn('IndexedDB unavailable', err); return null; });
  return dbPromise;
}

const blobMemory = new Map();

async function idbPut(storeName, record) {
  const db = await openDb();
  if (!db) { blobMemory.set(storeName + ':' + record.key, record); return; }
  await new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(record);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}
async function idbGet(storeName, key) {
  const db = await openDb();
  if (!db) return blobMemory.get(storeName + ':' + key) || null;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}
async function idbAll(storeName) {
  const db = await openDb();
  if (!db) return [...blobMemory.entries()].filter(([k]) => k.startsWith(storeName + ':')).map(([, v]) => v);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
async function idbDelete(storeName, key) {
  const db = await openDb();
  if (!db) { blobMemory.delete(storeName + ':' + key); return; }
  await new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

/* ------------------------------------------------------------- prompting -- */
/* Composition lives in lib/prompt.js so the browser tool and the Node CLI
 * always send byte-identical prompts. These are thin local bindings. */

const renderBasePrompt = (card) => AAGPrompt.renderBasePrompt(card);
const buildPrompt = (card, shot, opts) => AAGPrompt.buildPrompt(card, shot, { realism: DATA.realism }, opts);
const outputFilename = (card, shot, revision, ext) => AAGPrompt.outputFilename(card, shot, revision, ext);
const pad2 = (n) => AAGPrompt.pad2(n);

/* ------------------------------------------------------------ openai api -- */

class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

function supportsInputFidelity(model) { return model === 'gpt-image-1'; }

async function parseError(res) {
  let detail = '';
  try {
    const body = await res.json();
    detail = (body && body.error && body.error.message) || JSON.stringify(body).slice(0, 400);
  } catch {
    try { detail = (await res.text()).slice(0, 400); } catch { detail = res.statusText; }
  }
  return new ApiError(`HTTP ${res.status} — ${detail}`, res.status);
}

/* Demo mode: a locally drawn placeholder so the whole flow — queue, gallery,
 * downloads, ZIP — is walkable before any API is wired up. Deliberately plain
 * and watermarked so it can never be mistaken for real output. */
const GROUP_HUE = {
  A_identity_core: 196, B_expression_speech: 268, C_body_proportions: 152,
  D_pose_context: 32, E_work_lifestyle: 344,
};

function demoImage(card, shot) {
  const W = 768, H = 1024;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const hue = GROUP_HUE[shot.group] != null ? GROUP_HUE[shot.group] : 210;

  const grad = g.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, `hsl(${hue} 32% 24%)`);
  grad.addColorStop(1, `hsl(${hue + 24} 26% 13%)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);

  g.strokeStyle = 'rgba(255,255,255,.08)';
  g.lineWidth = 1;
  for (let y = 0; y < H; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }

  g.textAlign = 'center';
  g.fillStyle = 'rgba(255,255,255,.90)';
  g.font = '700 190px ui-sans-serif, system-ui, sans-serif';
  g.fillText(pad2(shot.order), W / 2, H / 2 - 40);

  g.font = '600 30px ui-sans-serif, system-ui, sans-serif';
  wrapText(g, shot.label_es, W / 2, H / 2 + 40, W - 110, 38);

  g.fillStyle = 'rgba(255,255,255,.55)';
  g.font = '400 22px ui-monospace, monospace';
  g.fillText(shot.id, W / 2, H - 150);
  g.fillText(card.name, W / 2, H - 112);

  g.fillStyle = 'rgba(255,255,255,.18)';
  g.font = '700 74px ui-sans-serif, system-ui, sans-serif';
  g.fillText('DEMO', W / 2, H - 44);

  return new Promise((resolve) => c.toBlob((b) => resolve(b), 'image/png'));
}

function wrapText(g, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (g.measureText(test).width > maxWidth && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  lines.forEach((l, i) => g.fillText(l, x, y + i * lineHeight));
}

async function generateImage({ prompt, references, signal, card, shot }) {
  if (settings.demoMode) {
    await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));
    if (signal && signal.aborted) throw Object.assign(new Error('aborted'), { name: 'AbortError' });
    return demoImage(card, shot);
  }

  const base = settings.baseUrl.replace(/\/+$/, '');
  const headers = { Authorization: 'Bearer ' + settings.apiKey };
  let res;

  if (references && references.length) {
    const form = new FormData();
    form.append('model', settings.model);
    form.append('prompt', prompt);
    form.append('n', '1');
    if (settings.size !== 'auto') form.append('size', settings.size);
    if (settings.quality !== 'auto') form.append('quality', settings.quality);
    if (supportsInputFidelity(settings.model)) form.append('input_fidelity', settings.inputFidelity);
    form.append('output_format', settings.outputFormat);
    references.slice(0, 16).forEach((ref, i) => {
      const ext = (ref.blob.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
      form.append('image[]', ref.blob, `ref_${i + 1}.${ext}`);
    });
    res = await fetch(base + '/images/edits', { method: 'POST', headers, body: form, signal });
  } else {
    const body = { model: settings.model, prompt, n: 1, output_format: settings.outputFormat };
    if (settings.size !== 'auto') body.size = settings.size;
    if (settings.quality !== 'auto') body.quality = settings.quality;
    res = await fetch(base + '/images/generations', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  }

  if (!res.ok) throw await parseError(res);
  const json = await res.json();
  const item = json.data && json.data[0];
  if (!item) throw new ApiError('The API returned no image data.', 200);

  if (item.b64_json) {
    const bin = atob(item.b64_json);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: 'image/' + settings.outputFormat });
  }
  if (item.url) {
    const imgRes = await fetch(item.url, { signal });
    if (!imgRes.ok) throw new ApiError('Could not download the generated image.', imgRes.status);
    return await imgRes.blob();
  }
  throw new ApiError('The API response contained neither b64_json nor url.', 200);
}

const RETRYABLE = new Set([408, 409, 429, 500, 502, 503, 504]);

async function generateWithRetry(args, onAttempt) {
  const maxAttempts = 4;
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (onAttempt) onAttempt(attempt);
      return await generateImage(args);
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      lastErr = err;
      const retryable = err instanceof ApiError ? RETRYABLE.has(err.status) : true;
      if (!retryable || attempt === maxAttempts) break;
      await new Promise((r) => setTimeout(r, 2000 * Math.pow(2, attempt - 1)));
    }
  }
  throw lastErr;
}

/* ------------------------------------------------------------------- zip -- */
/* Store-only ZIP writer. Twenty PNGs are already compressed; deflating them
 * again buys nothing and would cost a dependency. */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

async function makeZip(files) {
  const enc = new TextEncoder();
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = enc.encode(file.name);
    const data = new Uint8Array(await file.blob.arrayBuffer());
    const crc = crc32(data);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true);
    local.setUint16(8, 0, true);
    local.setUint16(10, 0, true);
    local.setUint16(12, 0x2821, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, nameBytes.length, true);
    local.setUint16(28, 0, true);
    chunks.push(new Uint8Array(local.buffer), nameBytes, data);

    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true);
    cd.setUint16(4, 20, true);
    cd.setUint16(6, 20, true);
    cd.setUint16(8, 0x0800, true);
    cd.setUint16(10, 0, true);
    cd.setUint16(12, 0, true);
    cd.setUint16(14, 0x2821, true);
    cd.setUint32(16, crc, true);
    cd.setUint32(20, data.length, true);
    cd.setUint32(24, data.length, true);
    cd.setUint16(28, nameBytes.length, true);
    cd.setUint32(42, offset, true);
    central.push(new Uint8Array(cd.buffer), nameBytes);

    offset += 30 + nameBytes.length + data.length;
  }

  const centralSize = central.reduce((n, c) => n + c.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);

  return new Blob([...chunks, ...central, new Uint8Array(end.buffer)], { type: 'application/zip' });
}

/* ------------------------------------------------------------------ util -- */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

function nowIso() { return new Date().toISOString(); }
function slugify(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'avatar';
}
function outputKey(card, shot, revision) { return `${card.id}:r${revision}:${shot.id}`; }

/* Object URLs are cached by key so repeated renders do not leak them. */
const urlCache = new Map();
function objectUrl(key, blob) {
  const hit = urlCache.get(key);
  if (hit && hit.blob === blob) return hit.url;
  if (hit) URL.revokeObjectURL(hit.url);
  const url = URL.createObjectURL(blob);
  urlCache.set(key, { blob, url });
  return url;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function toast(message, kind = 'info') {
  const el = $('#toast');
  el.textContent = message;
  el.className = 'toast show ' + kind;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.className = 'toast'; }, 5200);
}

function get(obj, path) { return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj); }
function set(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  let cur = obj;
  for (const k of keys) { if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = {}; cur = cur[k]; }
  cur[last] = value;
}

/* --------------------------------------------------------------- avatars -- */

function blankCard(name) {
  const id = slugify(name);
  return {
    schema_version: '1.0.0',
    id, name,
    created_at: nowIso(), updated_at: nowIso(),
    revision: 1, identity_revision: 1,
    tagline: '',
    identity_lock: {
      apparent_age: '', heritage: '',
      skin: { tone: '', undertone: '', texture: '', fitzpatrick: '' },
      hair: { colour: '', texture: '', length: '', default_styling: '' },
      eyes: { colour: '', shape: '', brows: '' },
      face: { shape: '', cheekbones: '', nose: '', mouth: '', jaw_chin: '' },
      distinguishing_marks: [],
      body: { height: '', build: '', posture: '', hands: '' },
      grooming: '', must_not: [], distinct_from: '',
    },
    persona: { profession: '', business: '', location: '', context: '', language: '', energy: '', goal: '', represents: [] },
    style: {
      wardrobe_base: '', wardrobe_working: '', wardrobe_offduty: '', accessories: '', palette: '',
      identity_backdrop: 'seamless mid-grey studio paper, evenly lit, two stops darker than the subject',
      environments: [],
    },
    realism: { default_preset: 'studio_softbox_neutral', group_presets: {}, extra_notes: '' },
    identity_anchors: {
      identity_token: id.toUpperCase() + '-v1', seed: null, master_reference_ids: [],
      higgsfield_soul_id: null, higgsfield_element_id: null, openai_file_ids: [],
    },
    master_references: [],
    base_prompt: '',
    shot_suite: 'identity-pack-20',
    generation_defaults: {
      backend: 'openai', model: settings.model, size: settings.size, quality: settings.quality,
      input_fidelity: settings.inputFidelity, output_format: settings.outputFormat, background: 'auto',
    },
    history: [],
  };
}

function uniqueId(base) {
  let id = base, n = 2;
  while (registry.avatars[id]) { id = `${base}-${n++}`; }
  return id;
}

function commitCard(card, { identityTouched, change }) {
  card.revision = (card.revision || 0) + 1;
  if (identityTouched) card.identity_revision = (card.identity_revision || 0) + 1;
  card.updated_at = nowIso();
  card.base_prompt = renderBasePrompt(card);
  card.history = card.history || [];
  card.history.push({
    at: card.updated_at,
    revision: card.revision,
    identity_revision: card.identity_revision,
    change: change || (identityTouched ? 'Identity edited.' : 'Card updated without touching identity.'),
    identity_touched: !!identityTouched,
  });
  registry.avatars[card.id] = card;
  saveRegistry();
}

/* ------------------------------------------------------------------- run -- */

const runState = { running: false, abort: null, done: 0, total: 0, statuses: new Map() };
let outputIndex = new Map();  // `${identity_revision}:${shotId}` -> record, for the active avatar

async function refreshOutputIndex() {
  const card = activeCard();
  outputIndex = new Map();
  if (!card) return;
  for (const rec of await idbAll('outputs')) {
    if (rec.avatarId === card.id) outputIndex.set(rec.identity_revision + ':' + rec.shotId, rec);
  }
}
function outputFor(shotId) {
  const card = activeCard();
  return card ? outputIndex.get(card.identity_revision + ':' + shotId) : null;
}
function hasStaleOutput(shotId) {
  return !outputFor(shotId) && [...outputIndex.keys()].some((k) => k.endsWith(':' + shotId));
}

function shotStatusOf(shotId) {
  const st = runState.statuses.get(shotId);
  if (st) return st;
  return outputFor(shotId) ? { state: 'ok', message: 'lista' } : { state: 'idle', message: '' };
}

function setShotStatus(shotId, state, message) {
  runState.statuses.set(shotId, { state, message: message || '' });
  patchShotCard(shotId);
}

function updateProgress() {
  const pct = runState.total ? Math.round((runState.done / runState.total) * 100) : 0;
  $('#progress-fill').style.width = pct + '%';
  $('#progress-label').textContent = runState.total ? `${runState.done}/${runState.total}` : 'listo';
}

async function getReferences(card) {
  const refs = [];
  for (const ref of card.master_references || []) {
    const rec = await idbGet('refs', ref.ref_id);
    if (rec && rec.blob) refs.push({ ref_id: ref.ref_id, role: ref.role, blob: rec.blob });
  }
  // The primary face reference goes first — some backends weight the first image higher.
  refs.sort((a, b) => (a.role === 'primary_face' ? -1 : 0) - (b.role === 'primary_face' ? -1 : 0));
  return refs;
}

async function runShots(list, { extra } = {}) {
  const card = activeCard();
  if (!card) { toast('Selecciona un avatar primero.', 'bad'); return; }
  if (!settings.demoMode && !settings.apiKey) {
    toast('Falta la API key. Ponla en «Conexión», o activa el modo demo para probar el flujo.', 'bad');
    switchTab('conexion');
    return;
  }
  if (runState.running) { toast('Ya hay una generación en curso.', 'warn'); return; }

  const refs = await getReferences(card);
  const controller = new AbortController();
  runState.running = true;
  runState.abort = controller;
  runState.done = 0;
  runState.total = list.length;
  updateProgress();
  renderRunControls();

  const revision = card.identity_revision;
  const queue = [...list];
  const concurrency = Math.max(1, Math.min(4, Number(settings.concurrency) || 1));
  let failures = 0;

  const worker = async () => {
    while (queue.length) {
      if (controller.signal.aborted) return;
      const shot = queue.shift();
      const prompt = buildPrompt(card, shot, { hasReferences: refs.length > 0, extra });
      setShotStatus(shot.id, 'running', 'generando…');
      try {
        const blob = await generateWithRetry(
          { prompt, references: refs, signal: controller.signal, card, shot },
          (attempt) => setShotStatus(shot.id, 'running', attempt > 1 ? `reintento ${attempt}/4…` : 'generando…')
        );
        const record = {
          key: outputKey(card, shot, revision),
          avatarId: card.id, shotId: shot.id, order: shot.order,
          identity_revision: revision,
          filename: outputFilename(card, shot, revision, settings.demoMode ? 'png' : settings.outputFormat),
          prompt,
          model: settings.demoMode ? 'demo' : settings.model,
          demo: settings.demoMode,
          created_at: nowIso(),
          blob,
        };
        await idbPut('outputs', record);
        outputIndex.set(revision + ':' + shot.id, record);
        setShotStatus(shot.id, 'ok', settings.demoMode ? 'demo' : 'lista');
      } catch (err) {
        if (err.name === 'AbortError') { runState.statuses.delete(shot.id); patchShotCard(shot.id); return; }
        failures++;
        setShotStatus(shot.id, 'error', err.message || String(err));
      }
      runState.done++;
      updateProgress();
    }
  };

  await Promise.all(Array.from({ length: concurrency }, worker));

  runState.running = false;
  runState.abort = null;
  renderRunControls();
  await renderSetTab();
  await renderFichaVisual();
  await renderSidebar();

  if (controller.signal.aborted) toast('Generación detenida.', 'warn');
  else if (failures) toast(`Terminado con ${failures} fallo(s). Reintenta las tomas marcadas en rojo.`, 'warn');
  else toast('Set completo. Cada toma es un archivo independiente.', 'ok');
}

/* -------------------------------------------------------------- rendering -- */

let shotFilter = 'all';

function switchTab(name) {
  $$('.tab').forEach((t) => t.classList.toggle('is-active', t.dataset.tab === name));
  $$('.tabpanel').forEach((p) => p.classList.toggle('is-active', p.id === 'panel-' + name));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* --- sidebar ------------------------------------------------------------- */

async function renderSidebar() {
  const ids = Object.keys(registry.avatars);
  $('#avatar-count').textContent = ids.length;

  const rows = await Promise.all(ids.map(async (id) => {
    const c = registry.avatars[id];
    const thumb = await avatarThumb(c);
    const initials = (c.name || id).split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
    return `<button class="avatar-row${id === registry.activeId ? ' is-active' : ''}" data-avatar="${esc(id)}">
      ${thumb ? `<img class="av" src="${thumb}" alt="">` : `<span class="av">${esc(initials)}</span>`}
      <span class="meta">
        <b>${esc(c.name)}</b>
        <span>${esc(c.id)} · id rev ${c.identity_revision || 1}</span>
      </span>
    </button>`;
  }));

  $('#avatar-list').innerHTML = rows.join('') ||
    '<p class="muted" style="padding:12px;font-size:12.5px">Todavía no hay avatares.</p>';
}

/** Best available thumbnail for an avatar: primary reference, else shot 01. */
async function avatarThumb(card) {
  const primary = (card.master_references || []).find((r) => r.role === 'primary_face')
    || (card.master_references || [])[0];
  if (primary) {
    const rec = await idbGet('refs', primary.ref_id);
    if (rec && rec.blob) return objectUrl('ref:' + primary.ref_id, rec.blob);
  }
  const anchor = await idbGet('outputs', `${card.id}:r${card.identity_revision}:closeup_front_neutral`);
  if (anchor && anchor.blob) return objectUrl('out:' + anchor.key, anchor.blob);
  return null;
}

/* --- the visual ficha ---------------------------------------------------- */

const FICHA_STRIP = [
  'standing_relaxed_environment', 'work_hands_on_task', 'fullbody_front_standing', 'lifestyle_window_light',
];

async function renderFichaVisual() {
  const card = activeCard();
  const host = $('#ficha-visual');
  if (!card) { host.innerHTML = ''; return; }

  const hero = await avatarThumb(card);
  const p = card.persona || {};

  const strip = FICHA_STRIP.map((id) => {
    const rec = outputFor(id);
    const shot = shotById(id);
    return rec
      ? `<div><img src="${objectUrl('out:' + rec.key, rec.blob)}" alt=""></div>`
      : `<div><span>${esc(shot ? pad2(shot.order) : '—')}</span></div>`;
  }).join('');

  const ageMatch = String((card.identity_lock && card.identity_lock.apparent_age) || '').match(/\d+/);
  const rows = [
    ['N', 'Nombre', card.name],
    ['E', 'Edad', ageMatch ? ageMatch[0] + ' años' : ''],
    ['U', 'Ubicación', p.location],
    ['P', 'Profesión', p.profession],
    ['C', 'Personalidad', p.energy],
    ['O', 'Objetivo', p.goal],
  ].filter(([, , v]) => v && String(v).trim());

  host.innerHTML = `
    <div class="ficha">
      <div class="ficha-media">
        <div class="ficha-hero">
          ${hero ? `<img src="${hero}" alt="${esc(card.name)}">` : `
            <div class="empty">
              <b>Sin referencia maestra</b>
              <span>Sube una foto en la pestaña Referencias, o genera la toma 01 y promuévela.</span>
            </div>`}
        </div>
        <div class="ficha-strip">${strip}</div>
      </div>
      <div class="ficha-body">
        <h3>Perfil</h3>
        <div class="ficha-rows">
          ${rows.map(([ic, k, v]) => `
            <div class="ficha-row">
              <span class="ic">${esc(ic)}</span>
              <span><b>${esc(k)}:</b> ${esc(v)}</span>
            </div>`).join('')}
        </div>

        <h3>Sobre ella</h3>
        ${p.context ? `<p>${esc(p.context)}</p>` : '<p class="ficha-empty">Sin descripción todavía.</p>'}

        <h3>Lo que la representa</h3>
        ${(p.represents || []).length
          ? `<ul class="ficha-list">${(p.represents || []).map((r) => `<li>${esc(r)}</li>`).join('')}</ul>`
          : '<p class="ficha-empty">Añade los valores de marca en la ficha, abajo.</p>'}
      </div>
    </div>`;
}

/* --- the editable form --------------------------------------------------- */

function fieldRow(label, path, value, opts = {}) {
  const attrs = `data-path="${esc(path)}" class="f-input"`;
  const control = opts.textarea
    ? `<textarea ${attrs} rows="${opts.rows || 2}">${esc(value)}</textarea>`
    : `<input ${attrs} type="text" value="${esc(value)}">`;
  return `<label class="field"><span>${esc(label)}</span>${control}</label>`;
}

function renderCardForm() {
  const card = activeCard();
  const host = $('#card-form');
  if (!card) {
    host.innerHTML = '<div class="empty-state"><b>Sin avatar seleccionado</b>Crea o importa uno para empezar.</div>';
    return;
  }

  const L = card.identity_lock;
  const presets = (DATA.realism && DATA.realism.presets) || [];
  const groups = Object.keys((DATA.shotSuite && DATA.shotSuite.groups) || {});
  const unlocked = $('#identity-unlocked') && $('#identity-unlocked').checked;

  host.innerHTML = `
    <div class="meta-line">
      <span class="pill">id <b>${esc(card.id)}</b></span>
      <span class="pill">rev <b>${card.revision}</b></span>
      <span class="pill identity">identidad rev <b>${card.identity_revision}</b></span>
      <span class="pill">${esc((card.updated_at || '').slice(0, 10))}</span>
    </div>

    <fieldset class="group">
      <legend>Cabecera</legend>
      <div class="grid2">
        ${fieldRow('Nombre', 'name', card.name)}
        ${fieldRow('Token de identidad', 'identity_anchors.identity_token', get(card, 'identity_anchors.identity_token') || '')}
      </div>
      ${fieldRow('Tagline', 'tagline', card.tagline, { textarea: true })}
    </fieldset>

    <fieldset class="group identity-block" id="identity-block" ${unlocked ? '' : 'disabled'}>
      <legend>Identidad <span class="lock-note">— editar aquí crea una nueva revisión de identidad</span></legend>
      <div class="grid2">
        ${fieldRow('Edad aparente', 'identity_lock.apparent_age', L.apparent_age, { textarea: true })}
        ${fieldRow('Origen / rasgos', 'identity_lock.heritage', L.heritage, { textarea: true })}
      </div>
      <h4>Piel</h4>
      <div class="grid2">
        ${fieldRow('Tono', 'identity_lock.skin.tone', L.skin.tone)}
        ${fieldRow('Subtono', 'identity_lock.skin.undertone', L.skin.undertone)}
        ${fieldRow('Fitzpatrick', 'identity_lock.skin.fitzpatrick', L.skin.fitzpatrick)}
        ${fieldRow('Textura', 'identity_lock.skin.texture', L.skin.texture, { textarea: true })}
      </div>
      <h4>Pelo</h4>
      <div class="grid2">
        ${fieldRow('Color', 'identity_lock.hair.colour', L.hair.colour, { textarea: true })}
        ${fieldRow('Textura', 'identity_lock.hair.texture', L.hair.texture, { textarea: true })}
        ${fieldRow('Largo', 'identity_lock.hair.length', L.hair.length)}
        ${fieldRow('Peinado por defecto', 'identity_lock.hair.default_styling', L.hair.default_styling, { textarea: true })}
      </div>
      <h4>Ojos y cejas</h4>
      <div class="grid2">
        ${fieldRow('Color', 'identity_lock.eyes.colour', L.eyes.colour)}
        ${fieldRow('Forma', 'identity_lock.eyes.shape', L.eyes.shape)}
        ${fieldRow('Cejas', 'identity_lock.eyes.brows', L.eyes.brows, { textarea: true })}
      </div>
      <h4>Rostro</h4>
      <div class="grid2">
        ${fieldRow('Forma', 'identity_lock.face.shape', L.face.shape)}
        ${fieldRow('Pómulos', 'identity_lock.face.cheekbones', L.face.cheekbones)}
        ${fieldRow('Nariz', 'identity_lock.face.nose', L.face.nose)}
        ${fieldRow('Boca', 'identity_lock.face.mouth', L.face.mouth)}
        ${fieldRow('Mandíbula y mentón', 'identity_lock.face.jaw_chin', L.face.jaw_chin)}
      </div>
      ${fieldRow('Marcas distintivas (una por línea)', 'identity_lock.distinguishing_marks', (L.distinguishing_marks || []).join('\n'), { textarea: true, rows: 3 })}
      <h4>Cuerpo</h4>
      <div class="grid2">
        ${fieldRow('Altura', 'identity_lock.body.height', L.body.height)}
        ${fieldRow('Complexión', 'identity_lock.body.build', L.body.build)}
        ${fieldRow('Postura', 'identity_lock.body.posture', L.body.posture, { textarea: true })}
        ${fieldRow('Manos', 'identity_lock.body.hands', L.body.hands, { textarea: true })}
      </div>
      ${fieldRow('Maquillaje / grooming', 'identity_lock.grooming', L.grooming, { textarea: true, rows: 3 })}
      ${fieldRow('Reglas anti-deriva (una por línea)', 'identity_lock.must_not', (L.must_not || []).join('\n'), { textarea: true, rows: 6 })}
      ${fieldRow('Distinta de', 'identity_lock.distinct_from', L.distinct_from, { textarea: true, rows: 3 })}
    </fieldset>

    <fieldset class="group">
      <legend>Persona</legend>
      <div class="grid2">
        ${fieldRow('Profesión', 'persona.profession', get(card, 'persona.profession') || '')}
        ${fieldRow('Negocio', 'persona.business', get(card, 'persona.business') || '')}
        ${fieldRow('Ubicación', 'persona.location', get(card, 'persona.location') || '')}
        ${fieldRow('Idioma', 'persona.language', get(card, 'persona.language') || '')}
      </div>
      ${fieldRow('Sobre ella (contexto)', 'persona.context', get(card, 'persona.context') || '', { textarea: true, rows: 4 })}
      ${fieldRow('Energía / actitud', 'persona.energy', get(card, 'persona.energy') || '', { textarea: true })}
      ${fieldRow('Objetivo', 'persona.goal', get(card, 'persona.goal') || '', { textarea: true })}
      ${fieldRow('Lo que la representa (uno por línea)', 'persona.represents', (get(card, 'persona.represents') || []).join('\n'), { textarea: true, rows: 5 })}
    </fieldset>

    <fieldset class="group">
      <legend>Estilo</legend>
      ${fieldRow('Vestuario base (bloque de identidad)', 'style.wardrobe_base', get(card, 'style.wardrobe_base') || '', { textarea: true })}
      ${fieldRow('Capa de trabajo — va encima de la base; déjalo vacío si no usa ninguna', 'style.wardrobe_working', get(card, 'style.wardrobe_working') || '', { textarea: true })}
      ${fieldRow('Vestuario fuera del trabajo', 'style.wardrobe_offduty', get(card, 'style.wardrobe_offduty') || '', { textarea: true })}
      <div class="grid2">
        ${fieldRow('Accesorios', 'style.accessories', get(card, 'style.accessories') || '', { textarea: true })}
        ${fieldRow('Paleta', 'style.palette', get(card, 'style.palette') || '', { textarea: true })}
      </div>
      ${fieldRow('Fondo de identidad', 'style.identity_backdrop', get(card, 'style.identity_backdrop') || '', { textarea: true })}
      ${fieldRow('Entornos (uno por línea)', 'style.environments', (get(card, 'style.environments') || []).join('\n'), { textarea: true, rows: 6 })}
    </fieldset>

    <fieldset class="group">
      <legend>Realismo</legend>
      <label class="field"><span>Preset por defecto</span>
        <select class="f-input" data-path="realism.default_preset">
          ${presets.map((p) => `<option value="${esc(p.id)}"${get(card, 'realism.default_preset') === p.id ? ' selected' : ''}>${esc(p.name)}</option>`).join('')}
        </select>
      </label>
      <div class="grid2">
        ${groups.map((g) => `
          <label class="field"><span>${esc(g.replace(/^[A-E]_/, '').replace(/_/g, ' '))}</span>
            <select class="f-input" data-path="realism.group_presets.${esc(g)}">
              <option value="">(usar por defecto)</option>
              ${presets.map((p) => `<option value="${esc(p.id)}"${get(card, 'realism.group_presets.' + g) === p.id ? ' selected' : ''}>${esc(p.name)}</option>`).join('')}
            </select>
          </label>`).join('')}
      </div>
      ${fieldRow('Notas extra', 'realism.extra_notes', get(card, 'realism.extra_notes') || '', { textarea: true, rows: 3 })}
    </fieldset>

    <fieldset class="group">
      <legend>Anclas de identidad (según backend)</legend>
      <div class="grid2">
        ${fieldRow('Higgsfield soul_id', 'identity_anchors.higgsfield_soul_id', get(card, 'identity_anchors.higgsfield_soul_id') || '')}
        ${fieldRow('Higgsfield element_id', 'identity_anchors.higgsfield_element_id', get(card, 'identity_anchors.higgsfield_element_id') || '')}
      </div>
      <p class="hint">La API de imágenes de OpenAI no expone <code>seed</code>. Aquí la identidad se fija con la
        referencia maestra y el bloque de identidad, no con un número.</p>
    </fieldset>

    <details class="group">
      <summary>Prompt base generado</summary>
      <pre class="prompt-view">${esc(renderBasePrompt(card))}</pre>
    </details>

    <details class="group">
      <summary>Historial (${(card.history || []).length})</summary>
      <ul class="history">
        ${(card.history || []).slice().reverse().map((h) => `
          <li><b>rev ${h.revision}</b>${h.identity_touched ? ' <span class="tag bad">identidad</span>' : ''}
          <span class="muted">${esc((h.at || '').slice(0, 16).replace('T', ' '))}</span><br>${esc(h.change)}</li>`).join('')}
      </ul>
    </details>`;
}

const LIST_FIELDS = new Set([
  'identity_lock.distinguishing_marks', 'identity_lock.must_not',
  'style.environments', 'persona.represents',
]);

function collectForm() {
  const card = structuredClone(activeCard());
  const before = JSON.stringify(card.identity_lock);

  for (const el of $$('#card-form .f-input')) {
    const path = el.dataset.path;
    if (!path) continue;
    let value = el.value;
    if (LIST_FIELDS.has(path)) value = value.split('\n').map((s) => s.trim()).filter(Boolean);
    if (path.startsWith('realism.group_presets.') && value === '') {
      const key = path.split('.').pop();
      if (card.realism && card.realism.group_presets) delete card.realism.group_presets[key];
      continue;
    }
    set(card, path, value);
  }

  return { card, identityTouched: JSON.stringify(card.identity_lock) !== before };
}

/* --- references ---------------------------------------------------------- */

async function renderReferences() {
  const card = activeCard();
  const host = $('#refs-list');
  if (!card) { host.innerHTML = ''; return; }

  const refs = card.master_references || [];
  $('#tab-refs-dot').hidden = refs.length === 0;

  if (!refs.length) {
    host.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <b>Sin referencias maestras</b>
      El sistema funciona igual — genera desde el texto de la ficha — pero una referencia sube muchísimo la
      estabilidad de la identidad entre las 20 tomas.</div>`;
    return;
  }

  const cards = await Promise.all(refs.map(async (ref) => {
    const rec = await idbGet('refs', ref.ref_id);
    const src = rec && rec.blob ? objectUrl('ref:' + ref.ref_id, rec.blob) : '';
    return `<figure class="ref-card${ref.role === 'primary_face' ? ' primary' : ''}">
      ${src ? `<img src="${src}" alt="">` : '<div class="ref-missing">?</div>'}
      <figcaption>
        <span class="role">${ref.role === 'primary_face' ? 'PRINCIPAL' : esc(ref.role)}</span>
        <span class="muted">${esc(ref.note || '')}</span>
        <span class="row">
          <button class="mini" data-ref-primary="${esc(ref.ref_id)}">Principal</button>
          <button class="mini danger" data-ref-delete="${esc(ref.ref_id)}">Borrar</button>
        </span>
      </figcaption>
    </figure>`;
  }));
  host.innerHTML = cards.join('');
}

/* --- shot gallery -------------------------------------------------------- */

const STATE_LABEL = { idle: 'pendiente', ok: 'lista', error: 'error', running: '…' };

function shotCardHtml(shot) {
  const st = shotStatusOf(shot.id);
  const rec = outputFor(shot.id);
  const stale = hasStaleOutput(shot.id);
  const label = st.message || STATE_LABEL[st.state];

  let thumbInner;
  if (st.state === 'running') thumbInner = '<span class="spinner"></span>';
  else if (rec) thumbInner = `<img src="${objectUrl('out:' + rec.key, rec.blob)}" alt="${esc(shot.label_es)}" loading="lazy" data-view="${esc(shot.id)}">`;
  else thumbInner = `<span class="num">${pad2(shot.order)}</span>`;

  return `<article class="shot state-${st.state}" data-shot="${esc(shot.id)}">
    <div class="shot-thumb">
      ${thumbInner}
      ${rec ? `<span class="corner">${pad2(shot.order)}</span>` : ''}
      ${stale ? '<span class="stale">otra revisión de identidad</span>' : ''}
    </div>
    <div class="shot-info">
      <b>${esc(shot.label_es)}</b>
      <span class="st ${st.state}" title="${esc(st.message)}">${esc(label)}</span>
    </div>
    <div class="shot-acts">
      <button class="mini" data-shot-gen="${esc(shot.id)}">${rec ? 'Regenerar' : 'Generar'}</button>
      <button class="mini" data-shot-prompt="${esc(shot.id)}">Prompt</button>
      <button class="mini" data-shot-dl="${esc(shot.id)}"${rec ? '' : ' disabled'}>↓</button>
    </div>
  </article>`;
}

/** Repaint one card in place — used during a run so the whole grid does not reflow. */
function patchShotCard(shotId) {
  const el = $(`#shot-grid .shot[data-shot="${CSS.escape(shotId)}"]`);
  const shot = shotById(shotId);
  if (!el || !shot) return;
  el.outerHTML = shotCardHtml(shot);
  updateFilterCounts();
}

function passesFilter(shot) {
  if (shotFilter === 'all') return true;
  const st = shotStatusOf(shot.id).state;
  if (shotFilter === 'ok') return st === 'ok';
  if (shotFilter === 'error') return st === 'error';
  if (shotFilter === 'pending') return st !== 'ok';
  return true;
}

function updateFilterCounts() {
  const all = shots();
  const okN = all.filter((s) => shotStatusOf(s.id).state === 'ok').length;
  const errN = all.filter((s) => shotStatusOf(s.id).state === 'error').length;
  $('#f-all').textContent = all.length;
  $('#f-ok').textContent = okN;
  $('#f-pending').textContent = all.length - okN;
  $('#f-error').textContent = errN;
  $('#tab-set-count').textContent = `${okN}/${all.length}`;

  const card = activeCard();
  if (card) {
    $('#set-summary').textContent =
      `${okN} de ${all.length} tomas generadas en la revisión de identidad ${card.identity_revision}` +
      (settings.demoMode ? ' · modo demo' : '');
  }
  $('#btn-download-all').disabled = okN === 0;
  $('#btn-download-zip').disabled = okN === 0;
}

function renderShotGrid() {
  const host = $('#shot-grid');
  if (!activeCard()) { host.innerHTML = ''; return; }

  const groupsMeta = (DATA.shotSuite && (DATA.shotSuite.groups_es || DATA.shotSuite.groups)) || {};
  const visible = shots().filter(passesFilter);

  if (!visible.length) {
    host.innerHTML = '<div class="empty-state"><b>Nada que mostrar con este filtro</b>Cambia el filtro de arriba.</div>';
    return;
  }

  const byGroup = new Map();
  for (const s of visible) {
    if (!byGroup.has(s.group)) byGroup.set(s.group, []);
    byGroup.get(s.group).push(s);
  }

  host.innerHTML = [...byGroup.entries()].map(([g, list]) => `
    <section class="shot-group">
      <header>
        <h3>${esc(g.replace(/^([A-E])_/, '$1 · ').replace(/_/g, ' '))}</h3>
        <p>${esc(groupsMeta[g] || '')}</p>
      </header>
      <div class="shots">${list.map(shotCardHtml).join('')}</div>
    </section>`).join('');
}

async function renderSetTab() {
  await refreshOutputIndex();
  renderShotGrid();
  updateFilterCounts();
}

function renderRunControls() {
  $('#btn-run-all').disabled = runState.running;
  $('#btn-run-missing').disabled = runState.running;
  $('#btn-stop').disabled = !runState.running;
}

function renderSettings() {
  $('#api-key').value = settings.apiKey;
  $('#base-url').value = settings.baseUrl;
  $('#model').value = settings.model;
  $('#size').value = settings.size;
  $('#quality').value = settings.quality;
  $('#input-fidelity').value = settings.inputFidelity;
  $('#output-format').value = settings.outputFormat;
  $('#concurrency').value = String(settings.concurrency);
  $('#remember-key').checked = settings.rememberKey;
  $('#demo-mode').checked = settings.demoMode;
  $('#fidelity-field').style.display = supportsInputFidelity(settings.model) ? '' : 'none';
  $('#demo-badge').hidden = !settings.demoMode;

  const badge = $('#conn-badge');
  if (settings.demoMode) { badge.textContent = 'Demo'; badge.dataset.state = 'off'; }
  else if (settings.apiKey) { badge.textContent = 'Clave cargada'; badge.dataset.state = 'on'; }
  else { badge.textContent = 'Sin conectar'; badge.dataset.state = 'off'; }
}

async function renderAll() {
  await renderSidebar();
  await renderSetTab();
  await renderFichaVisual();
  renderCardForm();
  await renderReferences();
  renderRunControls();
  updateProgress();
}

/* ---------------------------------------------------------------- actions -- */

let viewerList = [];
let viewerIndex = 0;

function showModal(title, bodyHtml, { viewer = false } = {}) {
  $('#modal-title').textContent = title;
  $('#modal-body').innerHTML = bodyHtml;
  $('#viewer-prev').hidden = !viewer;
  $('#viewer-next').hidden = !viewer;
  $('#modal').classList.add('open');
}
function hideModal() { $('#modal').classList.remove('open'); }

function openViewer(shotId) {
  viewerList = shots().filter((s) => outputFor(s.id));
  viewerIndex = Math.max(0, viewerList.findIndex((s) => s.id === shotId));
  paintViewer();
}
function paintViewer() {
  const shot = viewerList[viewerIndex];
  if (!shot) return;
  const rec = outputFor(shot.id);
  showModal(`${pad2(shot.order)} — ${shot.label_es}`, `
    <img class="preview" src="${objectUrl('out:' + rec.key, rec.blob)}" alt="">
    <p class="viewer-meta">${esc(rec.filename)} · ${esc(rec.model)}${rec.demo ? ' · marcador de posición' : ''}
      &nbsp;·&nbsp; ${viewerIndex + 1}/${viewerList.length}</p>`, { viewer: true });
}
function stepViewer(delta) {
  if (!viewerList.length) return;
  viewerIndex = (viewerIndex + delta + viewerList.length) % viewerList.length;
  paintViewer();
}

async function handleDownloadAll(asZip) {
  const card = activeCard();
  const mine = shots().map((s) => outputFor(s.id)).filter(Boolean).sort((a, b) => a.order - b.order);
  if (!mine.length) { toast('Todavía no hay imágenes que descargar.', 'warn'); return; }

  if (asZip) {
    const manifest = {
      avatar: card.id, name: card.name,
      identity_revision: card.identity_revision,
      generated_at: nowIso(),
      shot_suite: DATA.shotSuite.id,
      demo: mine.some((r) => r.demo),
      files: mine.map((r) => ({
        filename: r.filename, shot_id: r.shotId, order: r.order,
        model: r.model, demo: !!r.demo, prompt: r.prompt,
      })),
      card,
    };
    const files = mine.map((r) => ({ name: r.filename, blob: r.blob }));
    files.push({ name: 'manifest.json', blob: new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' }) });
    const zip = await makeZip(files);
    downloadBlob(zip, `${card.id}_r${card.identity_revision}_identity-pack-20.zip`);
    toast(`ZIP con ${mine.length} archivos individuales + manifest.`, 'ok');
    return;
  }

  // Separate downloads, staggered so the browser does not drop them.
  for (const rec of mine) {
    downloadBlob(rec.blob, rec.filename);
    await new Promise((r) => setTimeout(r, 350));
  }
  toast(`${mine.length} archivos descargados por separado.`, 'ok');
}

function exportPromptPack() {
  const card = activeCard();
  const hasRefs = (card.master_references || []).length > 0;
  const pack = {
    avatar: card.id, name: card.name,
    identity_revision: card.identity_revision,
    shot_suite: DATA.shotSuite.id,
    exported_at: nowIso(),
    note: 'One prompt per output file. Never render these as a grid or collage.',
    card,
    prompts: shots().map((s) => ({
      order: s.order, shot_id: s.id,
      filename: outputFilename(card, s, card.identity_revision, settings.outputFormat),
      label_es: s.label_es, group: s.group, aspect: s.aspect,
      prompt: buildPrompt(card, s, { hasReferences: hasRefs }),
    })),
  };
  downloadBlob(new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' }),
    `${card.id}_r${card.identity_revision}_prompts.json`);
  toast('Prompt pack exportado. Sirve para Higgsfield o cualquier otro backend.', 'ok');
}

/** Standalone HTML of the visual ficha — opens in a new tab; print to PDF from there. */
function exportFichaVisual() {
  const card = activeCard();
  if (!card) return;
  const sheet = $('#ficha-visual').innerHTML;
  const styles = [...document.styleSheets]
    .map((s) => { try { return [...s.cssRules].map((r) => r.cssText).join('\n'); } catch { return ''; } })
    .join('\n');
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<title>Ficha — ${esc(card.name)}</title>
<style>${styles}
body{margin:0;padding:26px;background:#f2f4f8}
.ficha{max-width:1180px;margin:0 auto}
@media print{body{padding:0}}
</style></head><body>${sheet}</body></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  toast('Ficha visual abierta en otra pestaña — imprime a PDF desde ahí.', 'ok');
}

async function addReferenceFiles(files) {
  const card = activeCard();
  const images = files.filter((f) => f.type.startsWith('image/'));
  if (!card || !images.length) return;

  for (const file of images) {
    const refId = `${card.id}-ref-${Date.now()}-${Math.floor(Math.random() * 1e4)}`;
    await idbPut('refs', { key: refId, blob: file, name: file.name, added_at: nowIso() });
    card.master_references = card.master_references || [];
    const isFirst = card.master_references.length === 0;
    card.master_references.push({
      ref_id: refId,
      role: isFirst ? 'primary_face' : 'secondary_face',
      source: 'uploaded',
      uri: 'idb:' + refId,
      note: file.name,
    });
  }
  card.identity_anchors.master_reference_ids = card.master_references.map((r) => r.ref_id);
  registry.avatars[card.id] = card;
  saveRegistry();
  await renderReferences();
  await renderFichaVisual();
  await renderSidebar();
  toast(`${images.length} referencia(s) maestra(s) añadida(s).`, 'ok');
}

/* ------------------------------------------------------------------- wire -- */

function wire() {
  /* tabs + mobile nav */
  $$('.tab').forEach((t) => t.addEventListener('click', () => switchTab(t.dataset.tab)));
  const closeNav = () => { $('#sidebar').classList.remove('is-open'); $('#scrim').classList.remove('is-open'); };
  $('#btn-menu').addEventListener('click', () => {
    $('#sidebar').classList.toggle('is-open');
    $('#scrim').classList.toggle('is-open');
  });
  $('#scrim').addEventListener('click', closeNav);

  /* settings */
  const bind = (sel, key, transform = (v) => v) => {
    $(sel).addEventListener('change', (e) => {
      settings[key] = transform(e.target.type === 'checkbox' ? e.target.checked : e.target.value);
      saveSettings();
      renderSettings();
      updateFilterCounts();
    });
  };
  bind('#api-key', 'apiKey');
  bind('#base-url', 'baseUrl');
  bind('#model', 'model');
  bind('#size', 'size');
  bind('#quality', 'quality');
  bind('#input-fidelity', 'inputFidelity');
  bind('#output-format', 'outputFormat');
  bind('#concurrency', 'concurrency', Number);
  bind('#remember-key', 'rememberKey');
  bind('#demo-mode', 'demoMode');

  $('#btn-test').addEventListener('click', async () => {
    if (!settings.apiKey) { toast('Introduce una API key primero.', 'bad'); return; }
    const btn = $('#btn-test');
    btn.disabled = true; btn.textContent = 'Probando…';
    try {
      const res = await fetch(settings.baseUrl.replace(/\/+$/, '') + '/models', {
        headers: { Authorization: 'Bearer ' + settings.apiKey },
      });
      if (!res.ok) throw await parseError(res);
      toast('Conexión correcta con la API.', 'ok');
    } catch (err) {
      toast('Fallo de conexión: ' + (err.message || err), 'bad');
    } finally {
      btn.disabled = false; btn.textContent = 'Probar conexión';
    }
  });

  $('#btn-forget-key').addEventListener('click', () => {
    settings.apiKey = '';
    saveSettings();
    renderSettings();
    toast('API key borrada de este navegador.', 'ok');
  });

  /* avatar lifecycle */
  $('#avatar-list').addEventListener('click', async (e) => {
    const row = e.target.closest('[data-avatar]');
    if (!row) return;
    registry.activeId = row.dataset.avatar;
    saveRegistry();
    runState.statuses.clear();
    closeNav();
    await renderAll();
  });

  $('#btn-new-avatar').addEventListener('click', async () => {
    const name = prompt('Nombre del nuevo avatar:');
    if (!name || !name.trim()) return;
    const card = blankCard(name.trim());
    card.id = uniqueId(card.id);
    card.identity_anchors.identity_token = card.id.toUpperCase() + '-v1';
    card.history.push({ at: nowIso(), revision: 1, identity_revision: 1, change: 'Avatar creado.', identity_touched: true });
    registry.avatars[card.id] = card;
    registry.activeId = card.id;
    saveRegistry();
    runState.statuses.clear();
    switchTab('ficha');
    await renderAll();
    toast('Avatar creado. Desbloquea la identidad, rellénala y guarda.', 'ok');
  });

  $('#btn-import-open').addEventListener('click', () => $('#import-file').click());
  $('#import-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const card = JSON.parse(await file.text());
      if (!card.id || !card.identity_lock) throw new Error('El archivo no parece una ficha de avatar.');
      if (registry.avatars[card.id] && !confirm(`Ya existe «${card.id}». ¿Sobrescribir?`)) return;
      registry.avatars[card.id] = card;
      registry.activeId = card.id;
      saveRegistry();
      await renderAll();
      toast('Ficha importada.', 'ok');
    } catch (err) {
      toast('No se pudo importar: ' + err.message, 'bad');
    }
    e.target.value = '';
  });

  $('#btn-duplicate').addEventListener('click', async () => {
    const src = activeCard();
    if (!src) return;
    const copy = structuredClone(src);
    copy.id = uniqueId(src.id + '-copy');
    copy.name = src.name + ' (copia)';
    copy.created_at = copy.updated_at = nowIso();
    copy.revision = 1;
    copy.identity_revision = 1;
    copy.master_references = [];
    copy.identity_anchors = {
      ...copy.identity_anchors, master_reference_ids: [],
      higgsfield_soul_id: null, higgsfield_element_id: null,
    };
    copy.history = [{ at: nowIso(), revision: 1, identity_revision: 1, change: `Duplicado de ${src.id}.`, identity_touched: true }];
    registry.avatars[copy.id] = copy;
    registry.activeId = copy.id;
    saveRegistry();
    await renderAll();
    toast('Avatar duplicado. Las referencias maestras no se copian.', 'ok');
  });

  $('#btn-delete').addEventListener('click', async () => {
    const card = activeCard();
    if (!card) return;
    if (!confirm(`¿Borrar el avatar «${card.name}» y todas sus imágenes locales? Esto no se puede deshacer.`)) return;
    for (const rec of await idbAll('outputs')) if (rec.avatarId === card.id) await idbDelete('outputs', rec.key);
    for (const ref of card.master_references || []) await idbDelete('refs', ref.ref_id);
    delete registry.avatars[card.id];
    registry.activeId = Object.keys(registry.avatars)[0] || null;
    saveRegistry();
    await renderAll();
    toast('Avatar borrado.', 'ok');
  });

  $('#btn-export').addEventListener('click', () => {
    const card = activeCard();
    if (!card) return;
    downloadBlob(new Blob([JSON.stringify(card, null, 2)], { type: 'application/json' }), `${card.id}.json`);
  });

  $('#btn-export-ficha').addEventListener('click', exportFichaVisual);

  /* the two distinct save paths */
  $('#identity-unlocked').addEventListener('change', (e) => {
    const block = $('#identity-block');
    if (block) block.disabled = !e.target.checked;
  });

  $('#btn-save-card').addEventListener('click', async () => {
    const { card, identityTouched } = collectForm();
    if (identityTouched) {
      toast('Has tocado campos de identidad. Usa «Guardar cambio de identidad».', 'warn');
      return;
    }
    commitCard(card, { identityTouched: false, change: 'Ficha actualizada sin tocar la identidad (persona, estilo, realismo).' });
    await renderFichaVisual();
    renderCardForm();
    await renderSidebar();
    toast('Ficha actualizada. La identidad y las tomas ya generadas siguen siendo válidas.', 'ok');
  });

  $('#btn-save-identity').addEventListener('click', async () => {
    const { card, identityTouched } = collectForm();
    if (!identityTouched) { toast('No hay cambios de identidad que guardar.', 'warn'); return; }
    const reason = prompt('¿Qué cambia en la identidad? (queda en el historial)');
    if (reason === null) return;
    if (!confirm('Esto crea una nueva revisión de identidad. Las tomas anteriores quedarán marcadas como de otra revisión. ¿Continuar?')) return;
    commitCard(card, { identityTouched: true, change: reason || 'Identidad editada.' });
    runState.statuses.clear();
    await renderAll();
    toast(`Nueva revisión de identidad: ${card.identity_revision}. Regenera el set para volver a tener 20 tomas coherentes.`, 'ok');
  });

  $('#btn-rebuild-prompt').addEventListener('click', () => {
    const { card } = collectForm();
    card.base_prompt = renderBasePrompt(card);
    registry.avatars[card.id] = card;
    saveRegistry();
    renderCardForm();
    toast('Prompt base reconstruido desde la ficha.', 'ok');
  });

  /* references */
  $('#btn-ref-browse').addEventListener('click', (e) => { e.stopPropagation(); $('#ref-file').click(); });
  $('#ref-file').addEventListener('change', async (e) => {
    await addReferenceFiles([...e.target.files]);
    e.target.value = '';
  });

  const dz = $('#ref-drop');
  dz.addEventListener('click', (e) => { if (!e.target.closest('button')) $('#ref-file').click(); });
  ['dragenter', 'dragover'].forEach((ev) => dz.addEventListener(ev, (e) => {
    e.preventDefault();
    dz.classList.add('is-over');
  }));
  ['dragleave', 'drop'].forEach((ev) => dz.addEventListener(ev, (e) => {
    e.preventDefault();
    dz.classList.remove('is-over');
  }));
  dz.addEventListener('drop', async (e) => {
    await addReferenceFiles([...(e.dataTransfer ? e.dataTransfer.files : [])]);
  });

  $('#refs-list').addEventListener('click', async (e) => {
    const card = activeCard();
    const makePrimary = e.target.dataset.refPrimary;
    const del = e.target.dataset.refDelete;
    if (makePrimary) {
      for (const r of card.master_references) {
        r.role = r.ref_id === makePrimary ? 'primary_face' : (r.role === 'primary_face' ? 'secondary_face' : r.role);
      }
      saveRegistry();
    } else if (del) {
      await idbDelete('refs', del);
      card.master_references = card.master_references.filter((r) => r.ref_id !== del);
      card.identity_anchors.master_reference_ids = card.master_references.map((r) => r.ref_id);
      saveRegistry();
    } else {
      return;
    }
    await renderReferences();
    await renderFichaVisual();
    await renderSidebar();
  });

  $('#btn-promote-shot').addEventListener('click', async () => {
    const card = activeCard();
    const anchor = outputFor('closeup_front_neutral');
    if (!anchor) { toast('Genera primero la toma 01 (primer plano frontal) para poder promoverla.', 'warn'); return; }
    const refId = `${card.id}-ref-anchor-${Date.now()}`;
    await idbPut('refs', { key: refId, blob: anchor.blob, name: anchor.filename, added_at: nowIso() });
    for (const r of card.master_references) if (r.role === 'primary_face') r.role = 'secondary_face';
    card.master_references.unshift({
      ref_id: refId, role: 'primary_face', source: 'generated', uri: 'idb:' + refId,
      shot_id: anchor.shotId, note: 'Promovida desde la toma 01 de la revisión ' + card.identity_revision,
    });
    card.identity_anchors.master_reference_ids = card.master_references.map((r) => r.ref_id);
    saveRegistry();
    await renderReferences();
    await renderFichaVisual();
    await renderSidebar();
    switchTab('refs');
    toast('Toma 01 promovida a referencia maestra. Regenera el resto para máxima coherencia.', 'ok');
  });

  /* run controls */
  $('#btn-run-all').addEventListener('click', async () => {
    const n = shots().length;
    if (!confirm(`Regenerar las ${n} tomas. Cada una es una llamada y sobrescribe la versión anterior de esta revisión de identidad. ¿Continuar?`)) return;
    await runShots(shots(), { extra: $('#extra-direction').value });
  });

  $('#btn-run-missing').addEventListener('click', async () => {
    const missing = shots().filter((s) => !outputFor(s.id));
    if (!missing.length) { toast('Las 20 tomas ya están generadas en esta revisión.', 'ok'); return; }
    await runShots(missing, { extra: $('#extra-direction').value });
  });

  $('#btn-stop').addEventListener('click', () => { if (runState.abort) runState.abort.abort(); });

  $('#shot-filters').addEventListener('click', (e) => {
    const chip = e.target.closest('[data-filter]');
    if (!chip) return;
    shotFilter = chip.dataset.filter;
    $$('#shot-filters .chip').forEach((c) => c.classList.toggle('is-active', c === chip));
    renderShotGrid();
  });

  $('#shot-grid').addEventListener('click', async (e) => {
    const card = activeCard();
    const view = e.target.dataset.view;
    const gen = e.target.dataset.shotGen;
    const pr = e.target.dataset.shotPrompt;
    const dl = e.target.dataset.shotDl;

    if (view) { openViewer(view); return; }
    if (gen) {
      const shot = shotById(gen);
      if (shot) await runShots([shot], { extra: $('#extra-direction').value });
      return;
    }
    if (pr) {
      const shot = shotById(pr);
      const hasRefs = (card.master_references || []).length > 0;
      showModal(`${pad2(shot.order)} — ${shot.label_es}`,
        `<p class="muted">${esc(shot.purpose_es || shot.purpose)}</p>
         <pre class="prompt-view">${esc(buildPrompt(card, shot, { hasReferences: hasRefs, extra: $('#extra-direction').value }))}</pre>`);
      return;
    }
    if (dl) {
      const rec = outputFor(dl);
      if (rec) downloadBlob(rec.blob, rec.filename);
    }
  });

  $('#btn-download-all').addEventListener('click', () => handleDownloadAll(false));
  $('#btn-download-zip').addEventListener('click', () => handleDownloadAll(true));
  $('#btn-export-prompts').addEventListener('click', exportPromptPack);

  /* modal */
  $('#modal-close').addEventListener('click', hideModal);
  $('#viewer-prev').addEventListener('click', () => stepViewer(-1));
  $('#viewer-next').addEventListener('click', () => stepViewer(1));
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') hideModal(); });
  document.addEventListener('keydown', (e) => {
    if (!$('#modal').classList.contains('open')) return;
    if (e.key === 'Escape') hideModal();
    if (!$('#viewer-next').hidden) {
      if (e.key === 'ArrowRight') stepViewer(1);
      if (e.key === 'ArrowLeft') stepViewer(-1);
    }
  });
}

/* ------------------------------------------------------------------ boot -- */

async function boot() {
  await loadData();
  loadSettings();
  loadRegistry();
  renderSettings();
  wire();
  await renderAll();

  if (!shots().length) toast('No se pudo cargar el shot suite.', 'bad');
  if (location.protocol === 'file:') $('#file-warning').hidden = false;
}

document.addEventListener('DOMContentLoaded', boot);
