#!/usr/bin/env node
/**
 * Bundle the tool into one self-contained HTML file — no sibling requests, no
 * network, no build tooling. Use it to hand the tool to someone as a single
 * attachment, or to publish it somewhere with a strict content policy.
 *
 *   node cli/build-standalone.mjs                    → dist/avatar-generator.html
 *   node cli/build-standalone.mjs --fragment         → body-only, for hosts that
 *                                                      supply their own skeleton
 *   node cli/build-standalone.mjs --demo false       → ship with demo mode off
 *
 * Runs sync-presets first, so the embedded snapshot always matches presets/.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const argv = process.argv.slice(2);
const fragment = argv.includes('--fragment');
const demoIdx = argv.indexOf('--demo');
const demo = demoIdx === -1 ? true : argv[demoIdx + 1] !== 'false';
const outIdx = argv.indexOf('--out');

await import('./sync-presets.mjs');

const read = (rel) => readFile(join(root, rel), 'utf8');

const [html, css, promptJs, appJs] = await Promise.all([
  read('index.html'), read('styles.css'), read('lib/prompt.js'), read('app.js'),
]);

/* Guard against the one thing that would silently corrupt an inlined script. */
for (const [name, src] of [['styles.css', css], ['lib/prompt.js', promptJs], ['app.js', appJs]]) {
  if (/<\/script/i.test(src)) throw new Error(`${name} contains a literal </script — cannot inline safely`);
}

const title = (html.match(/<title>([^<]*)<\/title>/) || [, 'AI Avatar Generator'])[1];

/* Take everything between <body> and </body>, minus the external references. */
let body = html.slice(html.indexOf('<body>') + '<body>'.length, html.lastIndexOf('</body>'));
body = body
  .replace(/\s*<script src="lib\/prompt\.js"><\/script>/, '')
  .replace(/\s*<script src="app\.js"><\/script>/, '')
  .trim();

const defaults = JSON.stringify({ standalone: true, demoMode: demo, autoDemo: demo });

const scripts = [
  `<script>window.AAG_DEFAULTS = ${defaults};<\/script>`,
  `<script>\n${promptJs}\n<\/script>`,
  `<script>\n${appJs}\n<\/script>`,
].join('\n\n');

/* A fragment carries its own <title> and <style> inline, because the host
   supplies the skeleton and never sees a <head> from us. */
const document = fragment
  ? [`<title>${title}</title>`, `<style>\n${css}\n</style>`, body, scripts].join('\n\n') + '\n'
  : `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="Define, guarda y regenera avatares fotorrealistas consistentes. Genera un set de 20 imágenes individuales listo para entrenar un avatar de video.">
<style>
${css}
</style>
</head>
<body>
${body}

${scripts}
</body>
</html>
`;

const target = outIdx !== -1
  ? argv[outIdx + 1]
  : join(root, 'dist', fragment ? 'avatar-generator.fragment.html' : 'avatar-generator.html');

await mkdir(dirname(target), { recursive: true });
await writeFile(target, document);

console.log(`built ${target}`);
console.log(`  ${(document.length / 1024).toFixed(0)} KB · demo mode ${demo ? 'on' : 'off'} · ${fragment ? 'fragment' : 'full document'}`);
