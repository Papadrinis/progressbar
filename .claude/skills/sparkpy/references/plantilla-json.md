# SparkPy · formato de `public/ads/<ad>.json`

Una sola composición Remotion (`SPARKPY`, en `src/ad/SparkPy.tsx`) lee el JSON indicado en la prop
`ad` y lo monta. El esquema (zod) está en `src/ad/schema.ts`: si el JSON tiene un error, la composición
falla con la ruta exacta del campo. Ejemplos completos: `public/ads/v10-a.json`, `public/ads/v10-e.json`.

## Estructura

```jsonc
{
  "id": "PLANPY_CO_VIDA_ROPA_V10_A",       // nombre del MP4; MAYÚSCULAS_Y_GUIONES_BAJOS
  "titulo": "V10-A · El cuaderno no le contesta",
  "velocidadVoz": 1.08,                     // opcional (1.08 por defecto)
  "musica": {"src": "music/cama-112bpm.wav", "volumen": 0.28, "bajo": 0.1},  // opcional; null = sin música
  "bloques": [ /* uno por frase de voz, en orden */ ],
  "cierre": {"voz": "voz/cta.mp3", "locucion": "Pruébelo quince días gratis, en planpi punto io.", "cola": 50},
  "fuentes": [ /* de dónde sale cada archivo */ ],
  "receta": { /* libre: job ids, prompts, créditos */ }
}
```

`musica.volumen` es el nivel sin voz; `musica.bajo`, mientras habla la voz (ducking). La música
termina con un fade de 24 frames. Pistas disponibles: `music/cama-112bpm.wav` (sobria),
`music/alegre-124bpm.wav` (juguetona).

### Bloque

```jsonc
{
  "id": "h",                               // h, p, a, s1, s2… (nombre de la muestra)
  "voz": "voz/v10/a-h.mp3",                // ruta en public/
  "locucion": "Una clienta pregunta si…",  // texto exacto enviado a la voz (con «Planpi»)
  "duracion": 5.878,                       // la escribe `sparkpy medir`/`descargar` (ffprobe); no editar a mano
  "toma": "v10/shot1.mp4",                 // .mp4 = toma; .png/.jpg = fotograma con push-in lento
  "lineas": ["Una clienta pregunta si le", "queda la blusa en talla M…"],  // subtítulo, máx. 4 líneas
  "claves": ["talla", "cuaderno"],         // palabras en píldora verde (coincidencia por inclusión)
  "cola": 8,                               // frames tras la voz (6 por defecto); 12–16 en el último bloque
  "volumenVoz": 1,                         // opcional (p. ej. 0.85 para una voz al teléfono)
  "extras": [ /* stickers, tarjetas, efectos */ ]
}
```

Duración de un bloque = 3 frames de entrada + voz (÷ velocidadVoz) + cola. El primer bloque entra con
destello e impacto; los demás con barrido alternando dirección y whoosh.

### Momento (`en`)

- Número → frames desde el inicio del bloque (`4` = casi al empezar).
- `"35%"` → en ese punto de la locución. Prefiérelo para que el extra caiga con la palabra aunque
  cambie la voz.

## Extras

Coordenadas en píxeles del cuadro 1080×1920 (centro del sticker). El subtítulo ocupa ~120–450 de alto;
la zona útil para extras es y = 1000–1700.

### `sticker`
```json
{"tipo": "sticker", "en": "35%", "texto": "¿Talla M? 🤔", "x": 760, "y": 1500, "giro": 6, "tamano": 66,
 "fondo": "#ffd400", "color": "#141414", "sfx": "boing", "volumenSfx": 0.4}
```
Colores habituales: amarillo `#ffd400` (duda), rojo `#ff4d4d` con texto `#fff` (problema), blanco
(neutro), verde de marca `#3DB55C` con texto `#fff` (solución).

### `tarjeta` — interfaz de PlanPy (datos de ejemplo)
```json
{"tipo": "tarjeta", "en": 22, "formato": "computador", "titulo": "Blusa verde de lino", "seccion": "Inventario",
 "filas": [["Talla S", "2 unid."], ["Talla M", "3 unid."]], "resaltar": 1}
```
- `formato`: `computador` (ventana de navegador con menú lateral, abajo) o `celular` (teléfono que sube).
- `menu`: opcional; por defecto `Ventas, Inventario, Clientes, Caja, Reportes`. `seccion` se marca activa.
- `filas`: 1–5 pares `[etiqueta, valor]`; `resaltar` = índice de la fila destacada.
- `listo`: botón final tipo "Caja cerrada ✓" (solo celular).
- Sonido automático (whoosh, pops o ping, ding); `"sonido": false` para quitarlo.
- Timing habitual: `en: 22` en computador, `en: 8` en celular.

### `llamada` — llamada entrante sobre el celular de la toma
```json
{"tipo": "llamada", "nombre": "Don Jairo · Lácteos", "hora": "9:07 p. m.", "icono": "🚚"}
```
Entra en el frame 4 y vibra 4 veces (`"vibrar": false` para silenciarla).

### `emoji`
```json
{"tipo": "emoji", "en": "50%", "texto": "💸", "x": 540, "y": 1300, "tamano": 140, "giro": 0}
```

### `sfx`
```json
{"tipo": "sfx", "en": 4, "nombre": "scribble", "volumen": 0.35}
```
Efectos en `public/sfx/`: bark, boing, cash, click, ding, dryer, flick, impact, notif, ping, pop,
riser, scratch, scribble, shake, splash, tick, typing, vibrate, whoosh (síntesis propia,
`npm run sonido` los regenera).

## Fuentes

```json
{"ruta": "voz/v11/a-h.mp3", "url": "https://…/hf_2026…mp3", "job": "<job id>", "nota": "Xavier"}
```
`npm run sparkpy -- descargar <ad>` baja las que falten (`--forzar` para todas) y mide las voces.
Con fuentes completas, el anuncio se puede reconstruir en un checkout limpio.

## Agregar un extra nuevo

1. Nuevo objeto en `extra` (discriminated union) en `src/ad/schema.ts`.
2. Nuevo `case` en `ExtraEl` de `src/ad/SparkPy.tsx` (componentes reutilizables en `src/v6/kit.tsx`).
3. `npm run typecheck`, documentarlo aquí.
