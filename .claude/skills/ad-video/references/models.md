# Model Router and API Notes

Model ids verified against `models_explore` at time of writing. If a call rejects an id, re-check
with `models_explore(action='list')` or `models_explore(action='recommend', query=…)` rather than
guessing a name.

## Image models — avatars and keyframes

| Model | Use for | Key params | Refs |
|---|---|---|---|
| `gpt_image_2` | Avatars when the user says "generate with ChatGPT/GPT"; any frame with typography | `resolution` 1k/2k/4k, `quality` low/medium/high | Elements ✅ |
| `soul_2` | Photoreal humans — UGC, portrait, fashion, testimonial | `quality` 1.5k/2k, `soul_id` | 1 image max, role `image`. Elements ❌ |
| `soul_cinematic` | Cinema-grade character stills, concept art | `quality`, `soul_id` | Elements ❌ |
| `nano_banana_2` | Fast, versatile, high quality; good default keyframe model | `resolution` 1k/2k/4k | Elements ✅ |
| `nano_banana_pro` | Maximum detail, 4K, text and diagrams | `resolution` 1k/2k/4k | Elements ✅ |
| `seedream_v4_5` | Stylized looks, transformations, up to 4K | `quality` basic/high | Elements ✅ |
| `seedream_v5_pro` | Instruction-based editing, visual reasoning, 2K | `resolution` 1k/1.5k/2k | — |
| `cinematic_studio_2_5` | Cinematic stills up to 4K | `resolution` | Elements ✅ |
| `marketing_studio_image` | One-click product ad images | `resolution` | — |
| `ms_image` (say "DTC Ads") | Brand-kit-aware DTC ad images | **`style_id` REQUIRED**, `brand_kit_id`, `product_ids` (≤4), `batch_size` | — |
| `flux_2` | Precise prompt adherence, stylized | `variant` pro/flex/max, `resolution` | — |
| `grok_image` | Expressive, high-contrast | `resolution`, `mode` std/quality | — |
| `openai_hazel` | Best text rendering, logos, editing | `quality` | — |
| `z_image` | Throwaway drafts, cheap and fast | — | — |

`ms_image` has no default `style_id`. Call `show_marketing_studio(type='image_style')`, show the
options, let the user choose. Calling without it errors.

## Video models — shot rendering

| Model | Use for | Duration | Roles | Notes |
|---|---|---|---|---|
| `seedance_2_0` | **Default for avatar ads.** Identity consistency, reference-driven, native audio | 4–15s | `start_image`, `end_image`, `image_references`, `video_references`, `audio_references` | `resolution` up to 4k (needs `mode:'std'`), `genre` hint, `generate_audio`. Elements ✅ |
| `kling3_0` | Multi-shot continuity, audio sync, motion transfer | 3–15s | `start_image`, `end_image` | `mode` std/pro/4k, `sound` on/off. Ratios 16:9, 9:16, 1:1 only. Elements ✅ |
| `kling3_0_turbo` | Cheap fast iteration, single start frame | 3–15s | `start_image` | `resolution` 720p/1080p |
| `marketing_studio_video` | Product/brand ad in one call, TikTok-ready | 12–15s | `avatars`, `image`/`start_image`/`end_image` | `avatar_ids` (≤1), `product_ids`, `mode` (preset slug), `hook_id`/`setting_id`, `ad_reference_id` |
| `grok_video_v15` | Cinematic single-frame animation with audio direction | 2–15s | `start_image` | `resolution` 480p/720p only |
| `gemini_omni` | Reference-driven with native audio | 4–10s | `image_references`, `video_references` | 720p, 16:9 / 9:16 |
| `seedance_2_0_mini` | Budget draft pass, same reference model as Seedance | 4–15s | same as `seedance_2_0` | 480p/720p only |
| `veo3_1_lite` | Cheap batch clips | 4/6/8s | `start_image`, `end_image` | `generate_audio` defaults **false** |
| `higgsfield_preset` | A named cinematic preset move | — | — | Requires `preset_id` from `presets_show` |

### Router logic

```
Product entity or brand kit fetched, and user wants a finished 12–15s ad fast
    → marketing_studio_video  (pass avatar_ids + product_ids, aspect_ratio explicit)

Avatar identity must survive across every shot          → seedance_2_0
Shots must chain with matched motion / tight lip sync   → kling3_0
Drafting, or the user is cost-sensitive                 → kling3_0_turbo, seedance_2_0_mini
One hero frame, cinematic, native audio                 → grok_video_v15
Style card names a model and none of the above binds    → the style card's model
```

Preflight the first shot with `get_cost: true` and report the projected run cost before
committing the whole storyboard.

## Identity: three spines

**1. Elements (default).** `show_reference_elements(action='create', category='character',
medias=[{id, url, type:'image_job'|'media_input'}])` → embed `<<<element_id>>>` in prompt text.
Multiple elements per prompt (avatar + product + environment). Works with `nano_banana_2`,
`nano_banana_flash`, `gpt_image_2`, `seedream_v4_5`, `seedream_v5_lite`, `cinematic_studio_2_5`,
`seedance_2_0`, `kling3_0`. Instant.

> **Elements do NOT work with `soul_2` or `soul_cinematic`.** Several style cards name those as
> their image model (`ugc-raw`, `docu-testimonial`, `luxe-minimal`). When a style names a Soul
> model *and* the avatar is locked as an Element, you cannot use both — pick one:
> - keep the Element and render keyframes with an Elements-compatible model
>   (`nano_banana_2` for photoreal, `cinematic_studio_2_5` for the cinematic cards), or
> - drop the Element and use the Soul spine, passing the avatar as `soul_id`, or as the single
>   `image`-role reference `soul_2` accepts.
>
> Verified: a run using `ugc-raw` with an Element had to swap `soul_2` → `nano_banana_2`.

**2. Soul (trained).** `show_characters(action='train', name, images[5–20])`, ~10 min. Usable
**only** with `soul_2` and `soul_cinematic`, **one soul per generation**. Highest identity
fidelity for one recurring person. Multi-character shots cannot use Soul.

**3. Marketing Studio avatar.** `show_marketing_studio(action='list', type='avatar')` — presets
plus custom. The UUID goes in `avatar_ids` on `marketing_studio_video`. Simplest path when the
whole ad is one `marketing_studio_video` call.

Pick one spine per campaign and stay on it.

## Media handling

- `medias[].value` accepts a **media id** or a **job id**. An https URL fails — run
  `media_import_url` first and pass the returned `media_id`.
- Local files: `media_upload_widget`. Remote MCP tools cannot read chat attachments — never ask
  the user to attach a local file to the conversation.
- A completed generation's job id can be fed directly as an input to the next generation. This is
  how a keyframe becomes a `start_image` without any upload step.
- `job_display` takes exactly one job id per call.
- Verified: passing a bare image job id as `start_image` works with no upload and no
  `media_import_url` step — the backend resolves it to the underlying image.
- The returned job's `model` field may differ from the id you sent: requesting `nano_banana_2`
  comes back as `nano_banana_flash`, and `gpt_image_2` reports an internal codename in
  `params.model`. This is backend naming, not a silent substitution of a different model —
  do not "correct" the id you send based on what comes back.
- Generated asset URLs are on a CDN that some sandboxes block outbound. If you cannot fetch a
  result to inspect it, say so and hand the user the URL rather than guessing at the content.

## Cost and credits

- `get_cost: true` returns the price without submitting. Use it before any multi-shot run.
- `balance` / `show_plans_and_credits` for the account state.
- `use_unlim` defaults false. Pass true **only** when the user explicitly asks to spend their
  free-trial/unlimited generations, per request — never carry it forward, never infer it. A
  rejected unlim request is never silently charged; if it returns a `recovery_tool`, call it.
- `count` is capped to 1 whenever `use_unlim` is true.

## Post-production

| Need | Tool |
|---|---|
| 2K/4K master | `upscale_video` |
| Second aspect ratio from an existing cut | `reframe` |
| Music bed / SFX | `generate_audio` |
| Consistent brand voice | `create_voice`, `list_voices`, `voice_change` |
| Another language | `dubbing` |
| Hook strength, retention risk | `virality_predictor` |
| Publish | `tiktok_prepare_publish` → `tiktok_publish` |

Offer these; do not run them automatically.
