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

`cierre.pantalla` (opcional) cambia los textos del cierre: `{"titulo", "oferta", "nota", "pie", "boton"}`.
Lo que falte sale como el cierre de marca; `""` oculta esa línea; `oferta` admite saltos de línea (`\n`).
Úsalo solo cuando el guion aprobado traiga `cta_editado: true`, p. ej.
`{"oferta": "Sin tarjeta durante\nla prueba.", "nota": ""}`.

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
  "texto": {"tamano": 58},                 // opcional: letra más chica si son 4 líneas largas (por defecto 62)
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
{"tipo": "sticker", "en": "35%", "texto": "¿Talla M? 🤔", "x": 760, "y": 380, "giro": 6, "tamano": 66,
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
{"tipo": "emoji", "en": "50%", "texto": "💸", "x": 820, "y": 640, "tamano": 140, "giro": 0}
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


## Formato y zonas protegidas (obligatorio)

`"formato": "9:16"` (Reels/Stories, 1080×1920, por defecto) o `"4:5"` (Feed, 1080×1350). Si el brief pide los
dos, se hacen dos JSON con las mismas tomas (`v18-a.json` y `v18-a-45.json`). Reglas completas en
`meta-creativos.md`; los números viven en `src/ad/zonas.ts`.

| Elemento | 9:16 (x 87–918, y 346–1152) | 4:5 (x 65–1015, y 81–1269) |
|---|---|---|
| Subtítulos | automáticos: 1–2 líneas sobre panel, franja 52–60 % (y ~994–1146) | automáticos, abajo de la zona |
| Stickers | `"y": 420` (franja alta), `"x"` según el lado libre; tamaño ≤ 56 | `"y": 170` |
| Tarjeta celular | notificación ancha arriba de la zona (automática) | igual |
| Tarjeta computador | ancho de la zona, tapa la cara: solo en tomas de apoyo | igual |
| Cierre | centrado dentro de la zona (automático) | igual |
| Encuadre de la toma | `"encuadre": 50` (% vertical) | por defecto 30: sube la cara al recortar |

`cara` y `layout` los escribe `scripts/maquetar.py` (no se editan a mano): detecta la cara en cada toma y
ubica subtítulos, tarjetas y stickers sin taparla. La `"x"`/`"y"` de un sticker es solo una preferencia
(lado); si choca con la cara, se mueve o se omite con aviso.

Stickers y emojis se comprueban por sus bordes completos: si no entran, el render los mete y `revisar` avisa.
`texto.top` ya no se usa (los subtítulos se ubican solos). `muestras` dibuja en rojo lo que queda fuera de la
zona (solo en la revisión, nunca en el render).

## Green screen (persona en miniatura sobre su propio video) — desde V18-B

Para hooks tipo «reacción»: la persona habla en miniatura (recortada) y atrás va un video o una foto que
muestra lo que dice. Cada fondo tiene que acompañar la frase (si cambia la idea, se parte el bloque).

1. Toma con voz de la persona sobre **verde croma liso** (Seedance 2.5, fotograma sobre #00B140, plano de la
   cintura para arriba, cabeza completa en cuadro).
2. `python3 scripts/croma.py public/vN/verde.mp4 public/vN/verde.webm` → WebM con transparencia. Se guarda
   también el .mp4 con verde: maquetar lo usa para ubicar la cara.
3. En el bloque:

```json
"toma": "vN/fondo.mp4",
"velocidadToma": 0.56,
"verde": {"miniatura": "vN/verde.webm", "deteccion": "vN/verde.mp4", "x": 10, "y": 740, "ancho": 480,
          "desde": 0, "fondo": {"escala": 1.25, "x": 135, "y": 0}}
```

- `x/y/ancho`: miniatura abajo a la izquierda con la boca dentro de la zona (y ≈ 1000–1100 en 9:16); la
  parte de abajo se funde sola.
- `desde`: segundo de la toma verde en que arranca el bloque (una toma larga sirve para varios bloques).
- `fondo`: agranda y corre la toma de atrás para que su cara quede arriba a la derecha sin franjas negras
  (con `escala` s, `x` tiene que estar entre ±540·(s−1)).
- `velocidadToma`: cámara lenta para estirar una toma corta de fondo.
- maquetar detecta las dos caras y, si no hay franja ancha libre, pone los subtítulos en un panel angosto
  (`layout.subtitulo.x0/x1`, de 1 o 2 líneas) que nunca se sale de su ancho.
