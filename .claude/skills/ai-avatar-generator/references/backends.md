# Backends

Two paths are wired up. Pick one per avatar and stay on it — mixing spines across a set produces
two subtly different faces.

---

## OpenAI Images API — the default for the 20-shot pack

Used by both `avatar-generator/index.html` and `cli/generate-set.mjs`.

### Endpoints

| Situation | Endpoint | Content type |
|---|---|---|
| No master reference | `POST /v1/images/generations` | JSON |
| One or more master references | `POST /v1/images/edits` | `multipart/form-data` |

The edits endpoint accepts up to **16 reference images** for GPT Image models. Both front-ends
switch automatically as soon as a reference exists.

### Models

| Model | Notes |
|---|---|
| `gpt-image-1.5` | Default. Does **not** accept `input_fidelity` — it behaves as `high` and rejects the parameter if sent. |
| `gpt-image-1` | Accepts `input_fidelity: high \| low`. Use `high` for faces. |
| `gpt-image-1-mini` | Cheap iteration pass. |
| `chatgpt-image-latest` | Tracks the ChatGPT image model. |

### Parameters

| Param | Values |
|---|---|
| `size` | `1024x1024`, `1024x1536` (portrait — the default for this suite), `1536x1024`, `auto` |
| `quality` | `low`, `medium`, `high`, `auto` |
| `n` | 1 per call here — one shot, one file |
| `output_format` | `png`, `jpeg`, `webp` |
| `input_fidelity` | `high`, `low` — **`gpt-image-1` only** |

GPT Image models return base64 in `data[0].b64_json`, not a URL. Both front-ends handle either.

### Gotchas that will actually bite

- **No seed parameter.** Reproducibility comes from the master reference plus the identity block,
  not from a number. Do not tell the user otherwise.
- **Identity across many generations is a documented weak point** of GPT Image — OpenAI says the
  model may struggle to keep recurring characters visually consistent. This is precisely why
  Stage 2 (bootstrap a master reference before generating the other nineteen) is not optional.
- **Rate limits.** Concurrency 2 is a safe default; both front-ends retry 429/5xx with
  exponential backoff, four attempts.
- **Browser keys.** The web tool stores the key in `localStorage` and sends it only to the
  configured base URL. Tell the user to use a project-scoped key. For anything shared or
  production, put a proxy in front and point the base URL at it.

---

## Higgsfield MCP — the path when the output is video

Better route when the pack feeds avatar video, because the identity spine and the video model
live in the same system.

### Three identity spines — pick one

**1. Reference Element (default; instant, no training).**

```
show_reference_elements(action='create', category='character', name='<avatar-name>',
                        medias=[{ id: '<image job_id>', url: '<result url>', type: 'image_job' }])
```

Store the returned `element_id` in `identity_anchors.higgsfield_element_id` and embed
`<<<element_id>>>` in every later prompt — the backend injects the real image. Works with
`nano_banana_2`, `nano_banana_flash`, `gpt_image_2`, `seedream_v4_5`, `seedream_v5_lite`,
`cinematic_studio_2_5` for images and `seedance_2_0`, `kling3_0` for video.

**2. Soul ID (trained; the strongest identity).**

```
show_characters(action='train', name='<avatar-name>', images=[...20 files...])
```

Training runs a few minutes. **This is what the 20-shot pack is designed to feed.** Constraints:
usable only with `soul_2` and `soul_cinematic`, **one soul per generation**, so multi-character
scenes cannot use it. Store the `soul_id` in `identity_anchors.higgsfield_soul_id`.

**3. Marketing Studio avatar.** `show_marketing_studio(action='list', type='avatar')` — the UUID
goes in `avatar_ids` on `marketing_studio_video`. Simplest when the whole deliverable is one
`marketing_studio_video` call.

### Image models for the pack

| Model | Use for | Params | Elements |
|---|---|---|---|
| `soul_2` | Photoreal humans — the best faces on the platform | `quality` 1.5k/2k, `soul_id` | ❌ (1 image max) |
| `gpt_image_2` | When the user says "generate it with ChatGPT/GPT" | `resolution` 1k/2k/4k, `quality` low/med/high | ✅ |
| `nano_banana_pro` | Maximum detail, 4K | `resolution` 1k/2k/4k | ✅ |
| `nano_banana_2` | Fast, versatile default | `resolution` 1k/2k/4k | ✅ |
| `seedream_v4_5` | Stylised looks, up to 4K | `quality` basic/high | ✅ |
| `soul_cinematic` | Cinema-grade character stills | `quality`, `soul_id` | ❌ |

**Route for this suite:** `soul_2` once a Soul ID exists, otherwise `gpt_image_2` or
`nano_banana_pro` with an Element. Note the trade-off — `soul_2` gives the best faces but does
not accept Elements, so before a Soul ID exists you are on the Element path by necessity.

### Running the twenty

Submit twenty **separate** jobs with `generate_image_batch`, then `jobs_wait`, then one
`show_generation_by_ids`. Never one job with `count: 20` — that returns twenty variations of a
single prompt, not the twenty different shots.

- Preflight with `get_cost: true` and report the projected cost before committing.
- Never pass `use_unlim: true` unless the user explicitly asks to spend their free/unlimited
  generations. Never infer it to save them credits.
- `medias[].value` takes a media id or a job id — an https URL fails. Run `media_import_url`
  first for a web image, `media_upload_widget` for a local file. Remote MCP tools cannot read
  chat attachments.
- A completed generation's job id feeds straight into the next call as an input, which is how
  shot 01 becomes the reference for shots 02–20 with no upload step.

### Post-production

| Need | Tool |
|---|---|
| 2K/4K masters of the pack | `upscale_image` |
| Cutouts for compositing | `remove_background` |
| A different aspect ratio | `reframe` |
| Extend the frame | `outpaint_image` |

Offer these; do not run them automatically.

---

## Adding another backend

The contract is small. Everything above the API call is backend-independent:

1. `lib/prompt.js` composes the prompt from card + shot + realism — reuse it unchanged.
2. The backend needs one function: `(prompt, referenceImages) → image bytes`.
3. Write each result to its own file using `outputFilename(card, shot, revision, ext)`.
4. Record whatever identity handle the backend issues in `identity_anchors`.

`cli/generate-set.mjs` is about 60 lines of backend-specific code inside a much larger amount of
backend-independent scaffolding; a new backend is a copy of `callApi` and nothing else.
