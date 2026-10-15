import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {BRAND_GREEN, SANS} from '../brand';
import {EMOJI} from '../v6/kit';
import {Zona} from './zonas';

// Subtítulos de SparkPy según la directiva de Meta: frases cortas sincronizadas de 1–2 líneas, sobre un
// panel discreto, con el panel entero dentro de la zona protegida. Los cortes de línea se recalculan por
// ancho (no se usan los cortes del JSON), así sirven para cualquier formato e idioma.
const partir = (texto: string, maxChars: number) => {
  const lineas: string[] = [];
  let actual = '';
  for (const w of texto.split(/\s+/).filter(Boolean)) {
    if (actual && (actual + ' ' + w).length > maxChars) {
      lineas.push(actual);
      actual = w;
    } else actual = actual ? actual + ' ' + w : w;
  }
  if (actual) lineas.push(actual);
  return lineas;
};

export const Subtitulos: React.FC<{texto: string; claves: string[]; start: number; voFrames: number; zona: Zona; base?: number; tope?: number}> = ({texto, claves, start, voFrames, zona, base, tope}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const size = zona.subtitulo.tamano;
  const padX = 26;
  const ancho = zona.der - zona.izq;
  const maxChars = Math.floor((ancho - padX * 2) / (size * 0.56));
  // Páginas equilibradas de hasta 2 líneas: se reparte el texto en partes de largo parecido (sin colas
  // sueltas de una palabra) y cada parte se corta en 1–2 líneas.
  const palabrasTodas = texto.split(/\s+/).filter(Boolean);
  const nPag = Math.max(1, Math.ceil(partir(texto, maxChars).length / 2));
  const meta = texto.length / nPag;
  const partes: string[][] = [[]];
  let largo = 0;
  palabrasTodas.forEach((w, i) => {
    const restantes = palabrasTodas.length - i;
    if (largo >= meta && partes.length < nPag && restantes >= 2) {
      partes.push([]);
      largo = 0;
    }
    partes[partes.length - 1].push(w);
    largo += w.length + 1;
  });
  const paginas: string[][] = partes.map((p) => {
    const t = p.join(' ');
    if (t.length <= maxChars) return [t];
    // Corte en dos líneas lo más parejas posible.
    let mejor = 1;
    let dif = Infinity;
    for (let k = 1; k < p.length; k++) {
      const a = p.slice(0, k).join(' ').length;
      const b = p.slice(k).join(' ').length;
      if (a <= maxChars && b <= maxChars && Math.abs(a - b) < dif) {
        dif = Math.abs(a - b);
        mejor = k;
      }
    }
    return [p.slice(0, mejor).join(' '), p.slice(mejor).join(' ')];
  });
  const pesos = paginas.map((p) => p.join(' ').length + 4);
  const total = pesos.reduce((a, b) => a + b, 0);
  let acc = 0;
  const tramos = pesos.map((p) => {
    const a = start + (acc / total) * voFrames;
    acc += p;
    return {a, b: start + (acc / total) * voFrames};
  });
  const k = tramos.findIndex((t, i) => frame < t.b || i === tramos.length - 1);
  if (frame < start || k < 0) return null;
  const pag = paginas[k];
  const {a, b} = tramos[k];
  const palabras = pag.flatMap((l, li) => l.split(' ').map((w) => ({w, li})));
  const pw = palabras.map(({w}) => w.length + 2);
  const pt = pw.reduce((x, y) => x + y, 0);
  let pa = 0;
  const inicios = pw.map((w) => {
    const s = a + (pa / pt) * (b - a) * 0.9;
    pa += w;
    return s;
  });
  const esClave = (w: string) => claves.some((c) => w.toLowerCase().replace(/[¿?¡!,.:]/g, '').includes(c));
  const entra = spring({frame: frame - a, fps, config: {damping: 14, stiffness: 220}, durationInFrames: 8});
  return (
    <div style={{position: 'absolute', left: zona.izq, width: ancho, ...(tope !== undefined ? {top: tope} : {bottom: zona.alto - (base ?? zona.subtitulo.base)}), display: 'flex', justifyContent: 'center'}}>
      <div style={{background: 'rgba(12,12,14,0.62)', borderRadius: 24, padding: `14px ${padX}px 16px`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontFamily: `${SANS}, ${EMOJI}`, fontWeight: 800, fontSize: size, lineHeight: 1.12, letterSpacing: -1, opacity: Math.min(1, entra * 1.5), transform: `translateY(${(1 - entra) * 12}px)`}}>
        {pag.map((_, li) => (
          <div key={li} style={{display: 'flex', flexWrap: 'nowrap', justifyContent: 'center', gap: `0 ${size * 0.22}px`, whiteSpace: 'nowrap'}}>
            {palabras.map((p, i) => {
              if (p.li !== li) return null;
              const clave = esClave(p.w);
              return (
                <span key={i} style={{color: frame >= inicios[i] ? (clave ? '#0f1a0b' : '#fff') : 'rgba(255,255,255,0.45)', background: clave && frame >= inicios[i] ? BRAND_GREEN : 'transparent', padding: clave ? `0 ${size * 0.14}px` : 0, borderRadius: size * 0.16}}>
                  {p.w}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
