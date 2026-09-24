#!/usr/bin/env node
// SparkPy — herramienta de línea de comandos para los anuncios guiados por datos (public/ads/<ad>.json).
//
//   npm run sparkpy -- lista                 anuncios disponibles
//   npm run sparkpy -- descargar <ad>        baja las "fuentes" que falten (voces y tomas por URL de Higgsfield)
//   npm run sparkpy -- medir <ad>            escribe en el JSON la "duracion" de cada voz (ffprobe)
//   npm run sparkpy -- revisar <ad>          archivos, legibilidad de cada tarjeta y reglas de marca
//   npm run sparkpy -- muestras <ad>         un fotograma por bloque en out/<ad>/ para aprobar sin renderizar
//   npm run sparkpy -- render <ad>           exporta out/<ID>.mp4 (crf 23, avisa si pasa de 30 MB)
import {execFileSync, spawnSync} from 'node:child_process';
import {createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {pipeline} from 'node:stream/promises';
import {Readable} from 'node:stream';
import {fileURLToPath} from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUB = join(ROOT, 'public');
const FPS = 30;
const MAX_MB = 30;
const BROWSER = ['/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell'].find(existsSync);

const [cmd, ad, ...rest] = process.argv.slice(2);
const flags = new Set(rest);

const die = (msg) => {
  console.error(`✗ ${msg}`);
  process.exit(1);
};

const rutaAd = (name) => {
  if (!name) die('falta el nombre del anuncio (p. ej. v10-a)');
  const p = join(PUB, 'ads', `${name}.json`);
  if (!existsSync(p)) die(`no existe public/ads/${name}.json`);
  return p;
};
const leer = (name) => JSON.parse(readFileSync(rutaAd(name), 'utf8'));

// El navegador mide los mp3 unos milisegundos más cortos que ffprobe; para que la composición,
// "revisar" y las muestras usen el mismo número, la duración queda escrita en el JSON.
const medir = (name, forzar = false) => {
  const a = leer(name);
  a.cierre = a.cierre ?? {voz: 'voz/cta.mp3', cola: 50};
  let cambios = 0;
  for (const b of [...a.bloques, a.cierre]) {
    if (b.duracion && !forzar) continue;
    if (!existsSync(join(PUB, b.voz))) die(`falta public/${b.voz}: npm run sparkpy -- descargar ${name}`);
    b.duracion = Math.round(duracion(b.voz) * 1000) / 1000;
    cambios++;
  }
  if (cambios) {
    writeFileSync(rutaAd(name), JSON.stringify(a, null, 2) + '\n');
    console.log(`ok  ${cambios} duraciones escritas en public/ads/${name}.json`);
  }
  return a;
};

const remotion = (args, opts = {}) => {
  const extra = BROWSER ? [`--browser-executable=${BROWSER}`] : [];
  const r = spawnSync('npx', ['remotion', ...args, ...extra], {cwd: ROOT, stdio: 'inherit', ...opts});
  if (r.status !== 0) die(`remotion ${args[0]} falló`);
};

const duracion = (ruta) => {
  const out = execFileSync('npx', ['remotion', 'ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', join(PUB, ruta)], {cwd: ROOT, encoding: 'utf8'});
  return parseFloat(out.trim());
};

// Misma cuenta que src/ad/SparkPy.tsx (lineaDeTiempo).
const tramos = (a) => {
  const rate = a.velocidadVoz ?? 1.08;
  const cierre = a.cierre ?? {voz: 'voz/cta.mp3', cola: 50};
  const pasos = [...a.bloques.map((b) => ({id: b.id, voz: b.voz, d: b.duracion, cola: b.cola ?? 6, lead: 3, lineas: b.lineas, locucion: b.locucion, extras: b.extras ?? []})), {id: 'cierre', voz: cierre.voz, d: cierre.duracion, cola: cierre.cola ?? 50, lead: 8, lineas: [], extras: []}];
  let from = 0;
  return pasos.map((p) => {
    const d = p.d ?? duracion(p.voz);
    const vf = Math.ceil((d / rate) * FPS);
    const len = p.lead + vf + p.cola;
    const t = {...p, d, vf, from, len};
    from += len;
    return t;
  });
};

const archivos = (a) => [...a.bloques.flatMap((b) => [b.voz, b.toma]), (a.cierre ?? {voz: 'voz/cta.mp3'}).voz, a.musica === null ? null : (a.musica?.src ?? 'music/cama-112bpm.wav')].filter(Boolean);

const comandos = {
  lista() {
    for (const f of readdirSync(join(PUB, 'ads')).filter((f) => f.endsWith('.json')).sort()) {
      const a = JSON.parse(readFileSync(join(PUB, 'ads', f), 'utf8'));
      console.log(`${f.replace(/\.json$/, '').padEnd(16)} ${a.id}  ${a.titulo ?? ''}`);
    }
  },

  medir() {
    medir(ad, flags.has('--forzar'));
  },

  async descargar() {
    const a = leer(ad);
    const fuentes = a.fuentes ?? [];
    if (!fuentes.length) console.log('(el anuncio no tiene "fuentes")');
    for (const f of fuentes) {
      const dest = join(PUB, f.ruta);
      if (existsSync(dest) && !flags.has('--forzar')) {
        console.log(`=   ${f.ruta}`);
        continue;
      }
      mkdirSync(dirname(dest), {recursive: true});
      const res = await fetch(f.url);
      if (!res.ok) die(`${f.ruta}: HTTP ${res.status} en ${f.url}`);
      await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
      console.log(`ok  ${f.ruta}`);
    }
    medir(ad, flags.has('--forzar'));
  },

  revisar() {
    const problemas = [];
    const avisos = [];
    for (const r of archivos(leer(ad))) if (!existsSync(join(PUB, r))) problemas.push(`falta public/${r}`);
    if (problemas.length) {
      problemas.forEach((p) => console.log(`✗ ${p}`));
      die('faltan archivos: npm run sparkpy -- descargar ' + ad);
    }
    const a = medir(ad);
    const ts = tramos(a);
    let total = 0;
    const contar = (x) => x.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
    for (const t of ts) {
      total += t.len;
      const seg = t.len / FPS;
      const palabras = contar(t.lineas.join(' '));
      // Subtítulo que va con la voz: se lee al ritmo de la voz; basta con que no traiga palabras de más.
      // Texto que NO se dice (sin locución o con palabras de más): regla de tarjeta, (palabras ÷ 3) + 1 s.
      const dichas = t.locucion ? contar(t.locucion) : 0;
      const sincronizado = t.locucion && palabras <= dichas + 2;
      const minimo = palabras / 3 + 1;
      const ok = t.lineas.length === 0 || sincronizado || seg >= minimo;
      console.log(`${ok ? '✓' : '✗'} ${t.id.padEnd(8)} ${seg.toFixed(2).padStart(5)} s  voz ${t.d.toFixed(2)} s  ${palabras ? `${palabras} palabras${sincronizado ? ' (van con la voz)' : ` (mín. ${minimo.toFixed(1)} s)`}` : ''}`);
      if (!t.locucion && t.lineas.length) avisos.push(`${t.id}: sin "locucion"; no puedo comprobar que el subtítulo diga lo mismo que la voz`);
      if (!ok) problemas.push(`${t.id}: el texto en pantalla necesita ${minimo.toFixed(1)} s y el bloque dura ${seg.toFixed(2)} s — acorte las líneas o suba "cola"`);
      if (t.lineas.length > 4) problemas.push(`${t.id}: más de 4 líneas`);
      if (t.lineas.some((l) => l.length > 34)) avisos.push(`${t.id}: hay líneas de más de 34 caracteres; pueden partirse en pantalla`);
      if (t.lineas.some((l) => /planpi/i.test(l))) problemas.push(`${t.id}: en pantalla se escribe "PlanPy", no "Planpi"`);
      if (t.locucion && /planpy/i.test(t.locucion)) problemas.push(`${t.id}: en la locución se escribe "Planpi" (así lo pronuncia la voz)`);
      if (t.id !== 'cierre' && t.d / (a.velocidadVoz ?? 1.08) > 7) avisos.push(`${t.id}: la voz dura más de 7 s y las tomas de Seedance son de 5 s; parta el bloque o use un fotograma`);
      for (const x of t.extras) {
        if (x.tipo !== 'tarjeta') continue;
        const en = typeof x.en === 'number' ? x.en : t.lead + (t.vf * parseFloat(x.en)) / 100;
        const visible = (t.len - en) / FPS;
        const req = contar(x.filas.flat().join(' ')) / 3 + 1;
        if (visible < req * 0.6) avisos.push(`${t.id}: la tarjeta "${x.titulo}" se ve ${visible.toFixed(1)} s; con tantas filas conviene menos datos o que entre antes`);
        if (x.filas.some(([, v]) => /\$\s?\d/.test(v) && !/\$\d{1,3}(\.\d{3})*$/.test(v))) avisos.push(`${t.id}: montos en COP con punto de miles, p. ej. $89.900`);
      }
    }
    const texto = JSON.stringify(a.bloques).toLowerCase();
    if (/\bpyme\b|\bplan pro\b/.test(texto)) problemas.push('nombra PYME/Pro: el CTA va siempre con el precio más barato');
    if (/\btú\b|\btienes\b|\bpuedes\b/.test(texto)) avisos.push('¿tuteo? En Colombia el registro es "usted"');
    console.log(`\nTotal: ${(total / FPS).toFixed(1)} s (${total} frames)`);
    if (total / FPS > 30) avisos.push('pasa de 30 s');
    avisos.forEach((p) => console.log(`! ${p}`));
    problemas.forEach((p) => console.log(`✗ ${p}`));
    if (problemas.length) process.exit(1);
    console.log('✓ listo para render');
  },

  muestras() {
    const a = medir(ad);
    const ts = tramos(a);
    const dir = join(ROOT, 'out', ad);
    mkdirSync(dir, {recursive: true});
    for (const t of ts) {
      // Casi al final de la voz: el subtítulo ya está completo y los extras ya entraron.
      const frame = t.from + t.lead + Math.round(t.vf * 0.9);
      remotion(['still', 'src/index.ts', 'SPARKPY', join(dir, `${t.id}.png`), `--frame=${frame}`, `--props=${JSON.stringify({ad})}`, '--log=error']);
      console.log(`ok  out/${ad}/${t.id}.png  (frame ${frame})`);
    }
  },

  render() {
    const a = medir(ad);
    const out = join('out', `${a.id}.mp4`);
    remotion(['render', 'src/index.ts', 'SPARKPY', out, `--props=${JSON.stringify({ad})}`, '--crf=23']);
    const mb = statSync(join(ROOT, out)).size / 1e6;
    console.log(`\n${out}  ${mb.toFixed(1)} MB`);
    if (mb > MAX_MB) console.log(`! pasa de ${MAX_MB} MB: vuelva a renderizar con más compresión (edite --crf a 26–28)`);
  },
};

if (!comandos[cmd]) {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 10).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
  process.exit(cmd ? 1 : 0);
}
await comandos[cmd]();
