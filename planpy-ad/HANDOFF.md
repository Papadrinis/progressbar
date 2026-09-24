# Handoff — convertir el generador de ads de PlanPy en una herramienta de Claude Code

Este archivo resume lo aprendido en la sesión donde se hicieron V1–V10, para arrancar el nuevo chat sin perder contexto.
Rama: `claude/lucid-hawking-44c0xr` · Proyecto: `planpy-ad/`.

## Pipeline que funciona hoy (V7–V10, "realista")

1. **Guion PAS + CTA** (3–5 opciones) → el usuario elige. Colombia, usted, eje VIDA. 20–30 s.
2. **Voz**: Higgsfield `text2speech_v2`, variant `elevenlabs`, voz preset **Xavier**
   (`43173c95-3ec8-446a-a162-6504332c578b`). Un clip por bloque. En el texto de la locución la marca se
   escribe **"Planpi"** (así se pronuncia); en pantalla, "PlanPy". Voz secundaria (proveedor): Andre
   (`f1e8226e-2248-4d5f-b43c-0a79e9949dbf`).
3. **Casting**: `gpt_image_2_5` (quality high, 2k, 9:16), 2 variantes → elegir. Prompt documental.
4. **Fotogramas**: mismo modelo, `image_references` = job del casting aprobado, uno por toma.
5. **Video**: `seedance_2_5`, `mode: omni_reference`, `start_image` = fotograma, 5 s, **1080p**,
   `generate_audio: false`, `declined_preset_id: 24bae836-2c4a-48e0-89b6-49fcc0b21612`
   (si no, Higgsfield sugiere el preset "IN THE DARK" y no envía el job). 60 créditos/toma.
   Pasar también el casting como `image_references` ayuda a mantener la cara.
6. **Montaje en Remotion** (`src/v9/AdV9.tsx` es el más genérico): bloques cuya duración sale de la voz
   (voz a 1,08×), subtítulo palabra por palabra con palabras clave en píldora verde, stickers, SFX
   sintetizados (`scripts/sonido.py`), música con ducking, tarjetas de interfaz propias con
   "Datos de ejemplo", CTA `CierreDesde`.
7. Render con `--crf=23` (si no, pasa de 30 MB y no se puede enviar). Chromium:
   `/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`.

## Reglas del dueño de marca aprendidas en la sesión

- **CTA siempre con el precio más barato**: "15 días gratis · Desde $46.500 al mes con el plan anual ·
  Plan mensual: desde $62.000". Nunca nombrar PYME/Pro.
- **Computador = gestión; celular = consulta** (ver datos/agenda cómodo, desde la casa).
- **Escenarios humildes pero cuidados** (ni sucios/viejos ni lujosos). Realista, sin exagerar.
- **Texto legible**: (palabras ÷ 3) + 1 s mínimo por tarjeta; máx. 2–4 líneas cortas.
- Ritmo dinámico: la voz manda; nada de bloques con aire muerto.
- Colombia: usted; billetes colombianos estilizados (sin retratos ni textos oficiales).
- Las pantallas nunca las genera el modelo (monitor de espaldas / celular sin leer); la interfaz se
  superpone en Remotion.
- Si Seedance cambia la cara del personaje, **usar el fotograma aprobado con push-in** (`STILLS`)
  en vez de regenerar.

## Pendientes de confirmar con el producto

- ¿El inventario maneja tallas/variantes? (V10-A lo muestra)
- ¿Las ventas descuentan inventario automáticamente? (guion V10-D)
- ¿El recordatorio de citas sale solo por WhatsApp? (V6/V7/V8)

## Propuesta de herramienta

- **Skill de Claude Code** `.claude/skills/planpy-ad/` que orqueste: brief → guiones → aprobación →
  voz → casting → aprobación → fotogramas → video → montaje → render, con presupuesto de créditos
  visible y check-ins automáticos mientras Seedance trabaja.
- **Plantilla Remotion guiada por datos**: un `ads/<id>.json` por anuncio (bloques, voz, toma,
  subtítulo, palabras clave, overlays, tarjetas) en lugar de un `.tsx` por versión. Una sola
  composición lee el JSON.
- **Scripts** para descargar voces/tomas por job id y registrar cada anuncio (receta reproducible).
