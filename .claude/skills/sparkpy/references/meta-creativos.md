# META ADS CREATIVE PRODUCTION RULES — 4:5 AND 9:16

> Directiva del dueño de marca (2026-10-14). Reemplaza la versión anterior de «zonas seguras» de SparkPy.
> Es la fuente de verdad: si algo de SKILL.md, `reglas.md` o `plantilla-json.md` choca con esto, gana esto.
> Cómo la aplica SparkPy (código y validación) está al final, en «Implementación en SparkPy».

Apply these rules to every generated Meta advertising creative, including UGC, talking-head videos, product demonstrations, apparel try-ons, statics, testimonials, listicles, app demonstrations, and motion graphics.

Preserve the requested creative concept, product, audience, and approved copy. Adapt the composition to the intended placement without weakening the selling message.

These instructions govern the integration's planning, generation, editing, and validation workflow. Compile the relevant visual instructions into each Higgsfield request rather than sending this entire directive to every model.

## 1. ASPECT RATIO AND PLACEMENT

Use the aspect ratio requested in the creative brief.

- 4:5: Compose for Feed using a 1080 × 1350 reference canvas.
- 9:16: Compose for Reels/Stories using a 1080 × 1920 reference canvas.

These are reference dimensions for layout. Use supported model settings for generation and render to the final requested dimensions.

When both ratios are requested, create two deliberately adapted compositions. Reuse source media where appropriate, but reposition text, captions, the subject, and the product for each ratio.

Never stretch an image or video. Never assume that resizing or automatically cropping a finished creative preserves its safe zones.

## 2. PROTECTED CONTENT AREAS

Use the following conservative INTERNAL production margins. They are not universal official Meta safe-zone specifications or a guarantee against every possible interface overlay.

All percentages refer to the full FINAL canvas. Coordinates start at the top-left.

4:5 FEED — keep all essential content inside:
- Left boundary: 6% of canvas width.
- Right boundary: 94% of canvas width.
- Top boundary: 6% of canvas height.
- Bottom boundary: 94% of canvas height.

At 1080 × 1350: x = 65–1015; y = 81–1269.

9:16 REELS/STORIES — keep all essential content inside:
- Left boundary: 8% of canvas width.
- Right boundary: 85% of canvas width.
- Top boundary: 18% of canvas height.
- Bottom boundary: 60% of canvas height.

At 1080 × 1920: x = 87–918; y = 346–1152.

For 9:16, position the main selling action above and slightly left of the geometric center. Do not place important content in the bottom 40%, top 18%, far-right 15%, or far-left 8%.

The full visible bounds of each essential element must fit—not just its center point. Include text panels, price symbols, important arrowheads, and animation movement.

Do not apply the large vertical-format exclusions to the 4:5 Feed composition.

## 3. FULL-FRAME SCENE, PROTECTED SELLING CONTENT

Fill the entire canvas naturally with the image or video.

Safe zones do NOT mean blank borders, empty bands, letterboxing, or shrinking the entire person into a small central rectangle.

Essential content includes:
- Headlines, offers, prices, currency, CTAs, and material conditions.
- Captions and required disclosures.
- Logos needed for recognition.
- The speaker's eyes and mouth.
- The product's identifying features.
- The specific feature or action being demonstrated.

Nonessential background, lower body, peripheral props, and incidental movements may extend outside the protected area.

For apparel, protect the feature being discussed: cup, strap, waistband, closure, fabric, or fit detail. The entire body does not need to fit inside the protected area.

When a full-body view makes the product detail too small, use a separate close-up rather than shrinking everything.

Never render safe-zone guides or labels into the finished creative.

## 4. COMPOSITION BY CREATIVE TYPE

UGC / TALKING HEAD: Use believable phone-camera framing, realistic proportions, natural skin texture, and conversational delivery. Keep the eyes and mouth unobstructed and inside the protected area throughout speech. Leave movement tolerance around the face.

PRODUCT DEMONSTRATION / TRY-ON: Keep the relevant product feature and meaningful hand interaction protected while that feature is being explained. Preserve the supplied product's construction, color, material, proportions, and identifying details.

STATIC: Use a clear hierarchy: one dominant hook, an identifiable product, and the approved offer or supporting message. Prefer short headlines. Reflow or simplify the composition before reducing text size.

TESTIMONIAL: Use only approved, substantiated quotes, ratings, and customer information. Do not present a generated person as a verified customer without appropriate substantiation and review.

LISTICLE / COLLAGE / COMPARISON: The entire composition shares one safe zone. Individual panels do not each receive a separate full-screen safe area. Reduce simultaneous information rather than making labels microscopic.

APP / WEBSITE DEMONSTRATION: Use supplied accurate screenshots or recordings when exact interface details matter. Keep the relevant interaction readable and protected. Do not rely on generated interface text for accuracy.

## 5. TEXT, LOGOS, AND CAPTIONS

Default to generating clean visual media and adding exact marketing text, logos, offers, and subtitles in post-production.

Reserve space for those overlays during scene generation.

Preserve approved wording, spelling, quantities, currency, and offer conditions exactly. Do not invent claims, reviews, discounts, urgency, or customer results.

Keep material qualifications readable and visually connected to their claims.

For captions:
- Use short, synchronized phrases, normally one or two lines.
- Use strong contrast and a restrained background panel when needed.
- Keep the entire caption panel inside the protected area.
- Never cover the speaker's mouth or the demonstrated product feature.
- Do not place subtitles near the bottom edge out of habit.

For 9:16, y = 52–60% can be used as a caption reservation only when it does not overlap important visual content. Otherwise, move captions elsewhere within the protected area or redesign the shot.

Do not stack the headline, face, product, benefits, logo, captions, and offer into the same small space. Sequence information across shots and remove the opening hook when no longer needed.

Check readability at actual phone size. Recalculate line breaks and bounds for every language.

## 6. VIDEO AND MOVEMENT

Safe-zone requirements apply throughout the entire clip, not just the opening frame.

Use controlled subject movement and camera motion. Avoid push-ins, pans, or reframing that move the speaking face or key product detail outside the protected area.

Leave movement tolerance inside the boundaries.

Keep essential text readable throughout its intended display interval. Check animation entrances, exits, scaling, and overshoot.

Keep the end-card offer, product, logo, and CTA inside the same protected area.

Make the central proposition understandable without sound. When speech is included, use accurate captions and synchronization.

## 7. HIGGSFIELD EXECUTION AND FINAL CHECK

Check the selected endpoint's supported ratios, resolution, duration, audio, references, and prompt-length limits.

Set the aspect ratio through a supported API parameter when available. Do not invent parameters such as "safe_zone."

Compile a concise, shot-specific generation prompt covering: subject, setting, product, action, composition, reserved overlay space, lighting, visual style, movement, and relevant exclusions.

Keep exact text coordinates, caption timings, and crop transforms in the editing/rendering layer.

For image-to-video, start from a correctly composed reference frame. Do not expect a motion prompt to repair a badly cropped input.

After generation and final rendering:
- Verify dimensions, ratio, copy, product accuracy, and readability.
- Check every essential overlay's full bounds.
- Review face and product visibility throughout movement.
- Recheck after every crop, zoom, stabilization, resize, or translation.
- Review actual placement previews with the selected CTA, primary text, captions, and other enabled overlays.

A prompt communicates intended framing; it does not guarantee precise placement.

When something fails, reposition, reflow, reframe, redesign, or regenerate. Never hide an offer condition or make essential text unreadable to force compliance.

Do not claim a check was completed when it was not. Mark unperformed placement checks as NEEDS REVIEW.

FINAL STANDARD: A natural full-frame creative, a clear selling message, protected essential content, and a deliberately adapted layout for each requested aspect ratio.

---

## Implementación en SparkPy

- **Zonas en código:** `planpy-ad/src/ad/zonas.ts` (`zonaDe(formato)`), única fuente de los números de arriba. Lo
  usan la composición, las tarjetas, los subtítulos, el cierre y `npm run sparkpy -- revisar`.
- **Formato del anuncio:** `"formato": "9:16" | "4:5"` en el JSON (por defecto 9:16). Si el brief pide los dos,
  se hacen dos JSON (`v18-a.json` y `v18-a-45.json`) con las mismas tomas y el layout de cada formato; la toma
  se recorta con `object-fit: cover`, sin estirar, y el encuadre se ajusta con `toma.encuadre` (y %) si la cara
  queda fuera.
- **Subtítulos:** frases cortas sincronizadas de 1–2 líneas sobre un panel discreto; en 9:16 van en la franja
  52–60 % (y 998–1152), en 4:5 en la franja baja de su zona. Si un bloque trae 3–4 líneas, se muestran de a 2
  sincronizadas con la voz.
- **Nada sobre la cara (2026-10-15, corrección del usuario):** la zona protegida no basta: un sticker o una
  tarjeta dentro de la zona pero sobre la cara del creador está mal. `scripts/maquetar.py` (lo corren solos
  `revisar`, `muestras` y `render`) detecta la cara en cada toma a lo largo de TODO el bloque (no un cuadro),
  guarda su caja en `bloque.cara` y ubica cada elemento en el espacio libre (`bloque.layout`):
  1. subtítulos debajo de la cara; si la toma es muy cerrada, debajo de la boca (sobre la barbilla, con aviso);
  2. tarjetas y stickers apilados entre la cara y los subtítulos, arriba de la cara, o a un costado si caben;
  3. la tarjeta celular pasa a versión compacta (2 líneas) si la completa no entra;
  4. si un elemento no entra sin tapar la cara, **se omite y se avisa**: se arregla reencuadrando la toma o
     llevándolo a otra toma, nunca tapando la cara ni achicándolo hasta volverlo ilegible.
  Las muestras de revisión dibujan la caja de la cara; ningún elemento puede cruzarla.
- **Elementos:** stickers, emojis, tarjetas y llamada se calculan por sus bordes completos (no por el centro) y
  se mantienen dentro de la zona; `revisar` lo comprueba.
- **Cierre:** el contenido del cierre se centra dentro de la zona del formato.
- **Encuadre que deja lugar:** en 9:16 el mentón no debe pasar de ~46 % del alto (y ≈ 880) y la cara no debe
  ocupar más de ~45 % del ancho, para que entren tarjeta + subtítulos debajo sin tocarla. En el prompt del
  fotograma: «medium close-up, head and shoulders, chin around the middle of the frame, space below the
  chin for captions». Los primerísimos planos dejan solo lugar para subtítulos sobre la barbilla.
- **Pruebas baratas:** para validar un layout no se renderiza ni se genera nada: `muestras` (cuadros fijos,
  0 créditos). Se renderiza solo la versión final aprobada.
- **Prompts de Higgsfield:** se compila por toma (sujeto, lugar, acción, encuadre, espacio para overlays, luz,
  movimiento, exclusiones). 9:16: «eyes and mouth in the upper-middle, slightly left of center (around 25–45 %
  of frame height); lower 40 % free of key details; controlled, minimal camera movement». 4:5: «face in the
  upper half, centered». Nunca parámetros inventados como `safe_zone`.
- **Validación:** `muestras` dibuja la zona protegida solo en las imágenes de revisión (nunca en el render).
  La vista previa real de colocación en Ads Manager no la puede hacer SparkPy: en cada entrega figura como
  **NEEDS REVIEW**.
