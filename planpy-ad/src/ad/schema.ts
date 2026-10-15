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
  // Green screen: la toma de arriba es la «pantalla» de atrás y encima va la persona recortada (WebM con
  // transparencia hecho con scripts/croma.py). x, y = esquina superior izquierda y ancho en px del lienzo;
  // desde = segundo de la toma recortada en que arranca este bloque. «deteccion» es la toma con el verde
  // (maquetar la usa para ubicar la cara de la miniatura).
  verde: z
    .object({
      miniatura: z.string(),
      deteccion: z.string().optional(),
      x: z.number(),
      y: z.number(),
      ancho: z.number().positive(),
      desde: z.number().min(0).default(0),
      // La toma de atrás se agranda (desde el centro) y se corre en px para dejar lugar a la miniatura.
      fondo: z.object({escala: z.number().min(1).default(1), x: z.number().default(0), y: z.number().default(0)}).optional(),
    })
    .optional(),
  lineas: z.array(z.string()).min(1).max(4),
  claves: z.array(z.string()).default([]),
  // (Obsoleto: los subtítulos se ubican solos en la zona protegida del formato; se ignora.)
  texto: z.object({tamano: z.number().positive().optional(), top: z.number().min(0).optional()}).optional(),
  // Encuadre vertical de la toma (object-position y, 0–100 %) si al recortar a otro formato la cara queda fuera.
  encuadre: z.number().min(0).max(100).optional(),
  // Escritos por scripts/maquetar.py: caja de la cara en el lienzo y ubicación de cada elemento sin taparla.
  cara: z.object({x0: z.number(), y0: z.number(), x1: z.number(), y1: z.number()}).optional(),
  obstaculos: z.array(z.object({tipo: z.string(), x0: z.number(), y0: z.number(), x1: z.number(), y1: z.number()})).optional(),
  // true si la persona habla a cámara en este bloque (por defecto: entrada 0, labios sincronizados).
  a_camara: z.boolean().optional(),
  // A mano: lo que no se puede tapar y el detector no ve (el detalle del producto en una demo), en px del lienzo.
  proteger: z.array(z.object({x0: z.number(), y0: z.number(), x1: z.number(), y1: z.number(), nota: z.string().optional()})).optional(),
  layout: z
    .object({
      subtitulo: z.object({base: z.number().optional(), tope: z.number().optional(), lineas: z.union([z.literal(1), z.literal(2)]).optional(), x0: z.number().optional(), x1: z.number().optional()}),
      extras: z.array(z.object({x: z.number().optional(), y: z.number().optional(), compacta: z.boolean().optional(), inserto: z.boolean().optional(), omitido: z.string().optional()})),
      avisos: z.array(z.string()).default([]),
    })
    .optional(),
  cola: z.number().int().min(0).optional(),
  // Frames antes de que arranque la voz (3 por defecto). 0 en tomas con labios sincronizados.
  entrada: z.number().int().min(0).optional(),
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
  // Formato del anuncio: 9:16 (Reels/Stories, 1080×1920) o 4:5 (Feed, 1080×1350). Ver meta-creativos.md.
  formato: z.enum(['9:16', '4:5']).default('9:16'),
  bloques: z.array(bloque).min(1),
  cierre: z.object({
    voz: z.string(),
    locucion: z.string().optional(),
    cola: z.number().int().min(0).default(50),
    duracion: z.number().positive().optional(),
    // Textos en pantalla; si faltan, sale el cierre de marca. "" oculta la línea.
    pantalla: z.object({titulo: z.string().optional(), oferta: z.string().optional(), nota: z.string().optional(), pie: z.string().optional(), boton: z.string().optional()}).optional(),
  }).default({voz: 'voz/cta.mp3', cola: 50}),
  // Receta reproducible: de dónde sale cada archivo (job de Higgsfield + URL de descarga).
  fuentes: z.array(fuente).default([]),
  receta: z.record(z.string(), z.unknown()).optional(),
});

export type Anuncio = z.infer<typeof anuncio>;
export type Bloque = z.infer<typeof bloque>;
export type Extra = z.infer<typeof extra>;
export type Momento = z.infer<typeof momento>;
