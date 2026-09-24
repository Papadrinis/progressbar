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
