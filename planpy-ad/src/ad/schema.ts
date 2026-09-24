import {z} from 'zod';

// SparkPy — esquema de un anuncio guiado por datos: public/ads/<id>.json.
// Documentación completa: .claude/skills/sparkpy/references/plantilla-json.md

// Momento dentro del bloque: número = frames desde el inicio del bloque;
// "35%" = en ese punto de la locución del bloque (se ajusta solo si cambia la voz).
export const momento = z.union([z.number().min(0), z.string().regex(/^\d+(\.\d+)?%$/, 'use frames (número) o un porcentaje como "35%"')]);

const sfx = z.object({
  tipo: z.literal('sfx'),
  en: momento,
  nombre: z.string(),
  volumen: z.number().min(0).max(1).optional(),
});

const sticker = z.object({
  tipo: z.literal('sticker'),
  en: momento,
  texto: z.string(),
  x: z.number(),
  y: z.number(),
  giro: z.number().optional(),
  tamano: z.number().optional(),
  fondo: z.string().optional(),
  color: z.string().optional(),
  sfx: z.string().optional(),
  volumenSfx: z.number().min(0).max(1).optional(),
});

const emoji = z.object({
  tipo: z.literal('emoji'),
  en: momento,
  texto: z.string(),
  x: z.number(),
  y: z.number(),
  tamano: z.number().optional(),
  giro: z.number().optional(),
});

const tarjeta = z.object({
  tipo: z.literal('tarjeta'),
  en: momento,
  formato: z.enum(['computador', 'celular']),
  titulo: z.string(),
  seccion: z.string(),
  menu: z.array(z.string()).optional(),
  filas: z.array(z.tuple([z.string(), z.string()])).min(1).max(5),
  resaltar: z.number().int().min(0).optional(),
  listo: z.string().optional(),
  sonido: z.boolean().optional(),
});

const llamada = z.object({
  tipo: z.literal('llamada'),
  en: momento.optional(),
  nombre: z.string(),
  hora: z.string().optional(),
  icono: z.string().optional(),
  vibrar: z.boolean().optional(),
});

export const extra = z.discriminatedUnion('tipo', [sfx, sticker, emoji, tarjeta, llamada]);

export const bloque = z.object({
  id: z.string(),
  voz: z.string(),
  // Texto exacto que se mandó a la voz (con «Planpi»). Receta reproducible y chequeo de subtítulos.
  locucion: z.string().optional(),
  volumenVoz: z.number().min(0).max(1).optional(),
  // Ruta en public/. .mp4 = toma animada; .png/.jpg = fotograma aprobado con push-in lento.
  toma: z.string(),
  lineas: z.array(z.string()).min(1).max(4),
  claves: z.array(z.string()).default([]),
  cola: z.number().int().min(0).optional(),
  // Duración de la voz en segundos. Si falta, se mide del archivo al cargar la composición.
  duracion: z.number().positive().optional(),
  extras: z.array(extra).default([]),
});

export const fuente = z.object({
  ruta: z.string(),
  url: z.string().url(),
  job: z.string().optional(),
  nota: z.string().optional(),
});

export const anuncio = z.object({
  id: z.string().regex(/^[A-Z0-9_]+$/, 'id en MAYÚSCULAS_CON_GUIONES_BAJOS, p. ej. PLANPY_CO_VIDA_ROPA_V10_A'),
  titulo: z.string().optional(),
  velocidadVoz: z.number().min(0.8).max(1.3).default(1.08),
  musica: z
    .object({
      src: z.string(),
      volumen: z.number().min(0).max(1).default(0.28),
      bajo: z.number().min(0).max(1).default(0.1),
    })
    .nullable()
    .default({src: 'music/cama-112bpm.wav', volumen: 0.28, bajo: 0.1}),
  bloques: z.array(bloque).min(1),
  cierre: z.object({voz: z.string(), locucion: z.string().optional(), cola: z.number().int().min(0).default(50), duracion: z.number().positive().optional()}).default({voz: 'voz/cta.mp3', cola: 50}),
  // Receta reproducible: de dónde sale cada archivo (job de Higgsfield + URL de descarga).
  fuentes: z.array(fuente).default([]),
  receta: z.record(z.string(), z.unknown()).optional(),
});

export type Anuncio = z.infer<typeof anuncio>;
export type Bloque = z.infer<typeof bloque>;
export type Extra = z.infer<typeof extra>;
export type Momento = z.infer<typeof momento>;
