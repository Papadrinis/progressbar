// Zonas protegidas de SparkPy por formato. Fuente: .claude/skills/sparkpy/references/meta-creativos.md
// (directiva «META ADS CREATIVE PRODUCTION RULES — 4:5 AND 9:16», 2026-10-14). Márgenes internos y
// conservadores: todo lo esencial (texto, subtítulos, precio, logo, CTA, ojos y boca del que habla, el
// detalle del producto) va dentro de la caja con sus BORDES completos, no solo su centro.
export type Formato = '9:16' | '4:5';

export type Zona = {
  formato: Formato;
  ancho: number;
  alto: number;
  // Caja protegida (px desde arriba a la izquierda).
  arriba: number;
  abajo: number;
  izq: number;
  der: number;
  // Subtítulos: panel anclado por abajo en `base`; tamaño de letra.
  subtitulo: {base: number; tamano: number};
  // Franja para stickers cortos y notificaciones, arriba de la caja.
  franjaAlta: number;
  // Encuadre por defecto de la toma (object-position vertical, %).
  encuadre: number;
};

export const ZONAS: Record<Formato, Zona> = {
  // Reels / Stories, 1080×1920: x 8–85 %, y 18–60 %.
  '9:16': {formato: '9:16', ancho: 1080, alto: 1920, arriba: 346, abajo: 1152, izq: 87, der: 918, subtitulo: {base: 1146, tamano: 52}, franjaAlta: 400, encuadre: 50},
  // Feed, 1080×1350: 6 % por lado.
  '4:5': {formato: '4:5', ancho: 1080, alto: 1350, arriba: 81, abajo: 1269, izq: 65, der: 1015, subtitulo: {base: 1255, tamano: 50}, franjaAlta: 150, encuadre: 30},
};

export const zonaDe = (f: Formato | undefined): Zona => ZONAS[f ?? '9:16'];

// Mueve un elemento (centro cx, cy; tamaño w × h) para que entre completo en la caja.
export const encajar = (z: Zona, cx: number, cy: number, w: number, h: number) => ({
  x: Math.min(Math.max(cx, z.izq + w / 2), z.der - w / 2),
  y: Math.min(Math.max(cy, z.arriba + h / 2), z.abajo - h / 2),
});

// Tamaño aproximado de un sticker (misma geometría que Sticker en v6/kit: padding 0,18/0,36 em).
export const medidaSticker = (texto: string, tamano: number) => ({w: [...texto].length * tamano * 0.58 + tamano * 0.72, h: tamano * 1.5});
