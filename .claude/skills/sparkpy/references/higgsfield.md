# SparkPy · parámetros de Higgsfield que funcionan (V7–V10)

Todos los generadores reciben `params`. Las referencias van en `medias: [{value, role}]`, donde
`value` es un **job id** de una generación previa (nunca una URL). Si un rol o parámetro es rechazado,
consulta `models_explore` para ese modelo y ajusta; anota aquí el cambio.

## Voz — text2speech_v2 / ElevenLabs

```json
{
  "model": "text2speech_v2",
  "variant": "elevenlabs",
  "voice_type": "preset",
  "voice_id": "43173c95-3ec8-446a-a162-6504332c578b",
  "prompt": "Con Planpi, cada venta queda registrada en el momento."
}
```

| Voz | voice_id | Uso |
|---|---|---|
| **Xavier** | `43173c95-3ec8-446a-a162-6504332c578b` | Narrador de todos los anuncios |
| Andre | `f1e8226e-2248-4d5f-b43c-0a79e9949dbf` | Segunda voz (proveedor, cliente al teléfono) |

- Un clip por bloque, con `generate_audio_batch` (índice = orden del bloque).
- La marca se escribe **"Planpi"** en el texto de la voz; "planpi punto io" para la web.
- Números en palabras ("ocho de la noche", "diez minutos") para que los lea bien.
- La composición acelera la voz a 1,08× (`velocidadVoz`) sin cambiar el tono.
- La URL del resultado va a `fuentes` del JSON; `npm run sparkpy -- descargar <ad>` la baja.

## Casting — gpt_image_2_5

```json
{
  "model": "gpt_image_2_5",
  "quality": "high",
  "resolution": "2k",
  "aspect_ratio": "9:16",
  "count": 2,
  "prompt": "<plantilla>"
}
```

Plantilla de prompt (documental, nada de publicidad brillante):

> Fotografía documental vertical, luz natural, cámara de celular de gama media. Retrato de
> <persona: edad, rasgos colombianos comunes, ropa de trabajo sencilla y limpia>, dueño/a de
> <negocio> en un barrio de <ciudad>, Colombia. Local pequeño, humilde pero cuidado: paredes pintadas,
> ordenado, limpio, nada lujoso ni deteriorado. Expresión natural, sin posar. Sin texto, sin logos,
> sin pantallas legibles.

Guarda el job id del casting aprobado: es la identidad del personaje.

## Fotogramas — gpt_image_2_5 con referencia

Mismos parámetros, `count: 1`, uno por toma con `generate_image_batch`, y el casting como referencia:

```json
{"medias": [{"value": "<job casting aprobado>", "role": "image_references"}]}
```

Prompt: la misma persona + acción concreta del bloque + encuadre (plano medio / detalle de manos /
de espaldas al monitor). Siempre: "el monitor se ve de espaldas" o "la pantalla del celular no se
lee". Para una toma de noche en casa, mismo personaje, sala sencilla y cálida.

## Tomas — seedance_2_5

```json
{
  "model": "seedance_2_5",
  "mode": "omni_reference",
  "duration": 5,
  "resolution": "1080p",
  "aspect_ratio": "9:16",
  "generate_audio": false,
  "declined_preset_id": "24bae836-2c4a-48e0-89b6-49fcc0b21612",
  "medias": [
    {"value": "<job fotograma aprobado>", "role": "start_image"},
    {"value": "<job casting aprobado>", "role": "image_references"}
  ],
  "prompt": "<movimiento simple y lento de la persona y la cámara; sin cortes>"
}
```

- **60 créditos por toma.** Una toma por bloque; reutiliza la del computador entre versiones.
- `declined_preset_id` es obligatorio: sin él Higgsfield sugiere el preset "IN THE DARK" y no envía el job.
- Pasar el casting como `image_references` ayuda a mantener la cara.
- Prompt de movimiento: una acción, cámara casi quieta o push-in suave. Nada de hablar a cámara (no hay
  sincronía de labios) ni de manos escribiendo en pantallas.
- Espera con `jobs_wait` (≤12 por grupo). Si al cabo de un par de esperas siguen corriendo, programa un
  check-in con `send_later` (~10 min) en vez de sondear sin parar.
- **Deriva de identidad**: si la cara cambia, no regeneres (ya pasó dos veces seguidas en V8). Usa el
  fotograma aprobado `.png` como `toma`: SparkPy le aplica push-in lento.

## Referencias de jobs aprobados

| Anuncio | Casting | Notas |
|---|---|---|
| V7 barbería | `760e6f4c-05b4-4fa1-965b-1979bc0b0d16` | 6 tomas, ~377 créditos |
| V8 mascotas | `315180e5-7ca1-4c3b-bbfc-e9e4f3ec165e` | toma 4 con fotograma (deriva de cara) |

## Hablando a cámara (sincronía de labios)

**Receta que funciona (V11, 2026-09-28):** dos pasos por toma.

1. `veo3_1` · `variant: "veo-3-1-preview"` · `quality: "high"` · `duration` 4–8 · `aspect_ratio: "9:16"`,
   fotograma aprobado como `start_image`, `declined_preset_id` del preset «IN THE DARK». Prompt: la frase
   exacta entre comillas en español colombiano, **«calm confidence, slight friendly smile, natural relaxed
   face, subtle expressions, no frowning, no exaggerated gestures»**. **40 créditos** (4 s).
2. `sync_so` (Sync Lipsync 3) · `sync_mode: "silence"` · `medias`: el job de Veo como `input_video` y el
   job de la voz aprobada como `input_audio`. **14,4 créditos** (4 s). Deja la voz aprobada en el video.

Total ≈ **54 créditos por toma a cámara** (6 s: Veo ~60 + Sync ~22). Primero una sola toma de prueba y aprobación.

**Ojo con la sincronía en el montaje:** Sync entrega la voz **retrasada entre 160 y 450 ms** (distinto en
cada toma) y los labios siguen a esa voz retrasada. No uses el mp3 original: extrae el audio de cada toma
de Sync, recórtalo al final de la frase, aplícale el tratamiento que toque y úsalo como `voz` del bloque
con `entrada: 0` y `velocidadVoz: 1`. Verifica con la envolvente del audio que el desfase final quede
< 45 ms (V11 quedó en 40 ms).

**Estilo UGC que funciona:** Julián sostiene un mini micrófono inalámbrico cerca de la barbilla (se pide en
el fotograma y en el prompt de Veo: «the microphone stays near his chin»). La voz lleva tratamiento de
micrófono real: pasa-altos 110 Hz, pasa-bajos 9,5 kHz, compresión 3:1, sala corta y ambiente muy bajo
(ver `receta` de `public/ads/v11-julian.json`). V11 completo: ~283 créditos.

**No usar `wan2_7` para hablar a cámara:** con `audio_references` exagera gestos (ceño fruncido, boca muy
abierta). Descartado por el usuario («horrible»). Tampoco pedir «energía» en el prompt de video: la
energía va en la voz; al video se le pide naturalidad.

Precios consultados con `get_cost`:

| Modelo | Uso | Créditos |
|---|---|---|
| veo3_1 preview high, 4 s | Video base natural | 40 |
| sync_so, 4 s | Labios a un audio dado | 14,4 |
| seedance_2_5 omni 1080p, 4 s / 5 s | Movimiento general | 48 / 60 |
| wan3_0_prime 1080p, 4 s | Alternativa sin probar | 24 |
| wan2_7 1080p, 4 s | **Descartado para labios** | 10 |
| Voz ElevenLabs (text2speech_v2) | Por clip | 0,3 |

Reglas para no gastar de más:
- Tomas de apoyo sin labios (voz en off con interfaz encima): el fotograma aprobado con push-in en
  Remotion (0 créditos). Solo si hace falta movimiento real, Seedance 720p.
- Fotogramas: `count` 1; casting: 2 opciones; regenerar solo lo rechazado.
- La energía de la voz se consigue con el texto (exclamaciones, frases cortas): el motor no tiene control
  de estilo. El CTA reutiliza `public/voz/cta.mp3`.
- Revisa los cuadros de la toma base (Veo) **antes** de pagar Sync.
