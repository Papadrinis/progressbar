---
name: ad-video
description: Produce a finished ad video from an avatar, a style, and a one-line brief, using the Higgsfield MCP. Runs the pipeline avatar (pick or generate) → style → storyboard → keyframes → video. Use when the user asks for an ad, commercial, promo, brand spot, product video, or campaign creative, or invokes /ad-video.
---

# Ad Video Generator

A five-stage pipeline that turns `avatar + style + brief` into a finished ad. Every stage
produces an artifact the user approves before the next stage spends credits.

```
0 INTAKE  →  1 AVATAR  →  2 STYLE  →  3 STORYBOARD  →  4 KEYFRAMES  →  5 VIDEO  →  6 DELIVER
             (lock ID)     (lock look)  (approve)       (approve)      (route)
```

**Three hard rules:**

1. **Never skip an approval gate.** Stages 3 and 4 end with a stop-and-confirm. Video is the
   expensive step; it runs only on an approved storyboard and approved keyframes.
2. **Identity is locked once, at Stage 1, and reused by ID everywhere after.** Never re-describe
   the avatar in prose across shots — that is how faces drift between shots.
3. **Never pass `use_unlim: true`** unless the user explicitly asks to spend their free/unlimited
   generations. Never infer it to save them credits.

Reference files — read the one you need, when you need it:

| File | Read it when |
|---|---|
| `references/styles.md` | Stage 2 — the 14 style categories and their full creative + model spec |
| `references/storyboard.md` | Stage 3 — beat structures, shot-card schema, prompt grammar |
| `references/models.md` | Stages 1, 4, 5 — model router, parameters, and API gotchas |

---

## Stage 0 — Intake

Collect these. If the user's first message already answers a field, do not re-ask it.

| Field | Notes | Default if unstated |
|---|---|---|
| Product / brand | What is being sold. A URL is ideal — see below. | ask (blocking) |
| Audience | Who it targets | infer from product, state the inference |
| Core message | The one thing the viewer must remember | ask (blocking) |
| Platform | TikTok / Reels / Shorts / YouTube / CTV / web | TikTok-Reels |
| Aspect | `9:16`, `16:9`, `1:1` | `9:16` |
| Duration | 8s / 15s / 30s | 15s |
| Language | Dialogue and on-screen text | user's language |
| CTA | Final line / end card | derive from the brief |

Only "product" and "core message" are blocking. Infer the rest, state your inferences in one
line, and move on — the user corrects you at the storyboard gate anyway.

**If the user gives a product URL**, call `show_marketing_studio(action='fetch', url=…)` first.
Use `type='product'` for a specific item, `type='webproduct'` for a site/app/SaaS as a whole.
This yields a product entity whose id feeds `product_ids` later, plus real product imagery.
Optionally also fetch a brand kit: `show_marketing_studio(action='fetch', type='brand_kit',
scrap_url=…)` — it folds logo, palette, fonts, and tone into `ms_image` generations.

---

## Stage 1 — Avatar (lock the identity)

The avatar is the face of the ad. Offer the user four paths and let them pick:

**A. Pick from the Marketing Studio library** — `show_marketing_studio(action='list',
type='avatar')`. Returns preset avatars plus any the user saved. Fastest path; the returned
UUID drops straight into `avatar_ids` on `marketing_studio_video`.

**B. Generate a new one** (the default when the user has no avatar in mind).
Choose the model by intent — full table in `references/models.md`:

- `gpt_image_2` — the ChatGPT-family image model. Strong prompt adherence and clean text;
  the default when the user asks for "generate it with ChatGPT/GPT".
- `soul_2` — photoreal UGC / portrait / fashion. The best-looking human faces.
- `nano_banana_pro` — when the avatar frame must carry crisp text or 4K detail.
- `seedream_v4_5` / `cinematic_studio_2_5` — stylized or cinema-grade looks.

Write the avatar prompt as a **casting brief**, not a scene: age range, build, hair, wardrobe,
skin/lighting quality, expression, plain or contextual background, framing (chest-up for a
talking-head ad). Generate 2–4 options with `count`, show them, let the user choose one.

**C. Upload their own face/photo.** Call `media_upload_widget` immediately — do not ask for a
chat attachment, remote MCP tools cannot read those. For a web image, use `media_import_url`.

**D. Train a reusable Soul** — `show_characters(action='train')`, 5–20 photos, ~10 minutes.
Offer this only if the user wants a recurring brand face across many campaigns. Note the
constraint: a trained `soul_id` works **only** with `soul_2` and `soul_cinematic`, one per
generation.

### Then lock it — this is the step that keeps the face consistent

Once an avatar image is chosen, immediately create a reference Element:

```
show_reference_elements(action='create', category='character', name='<avatar-name>',
                        medias=[{ id: '<image job_id>', url: '<result url>', type: 'image_job' }])
```

Save the returned `element_id`. From here on, every keyframe and video prompt refers to the
avatar as `<<<element_id>>>` embedded in the prompt text — the backend injects the real image.
Elements work with `nano_banana_2`, `nano_banana_flash`, `gpt_image_2`, `seedream_v4_5`,
`seedream_v5_lite`, `cinematic_studio_2_5` for images and `seedance_2_0`, `kling3_0` for video,
which covers the whole pipeline. Multiple elements can appear in one prompt — create one for
the product too if the product must stay pixel-consistent.

If the user chose the Soul path (D) instead, the spine is `soul_id` on `soul_2` images, and
those images then drive video as `start_image`.

Report the locked identity back in one line: name, path used, and the id you will reuse.

---

## Stage 2 — Style

Read `references/styles.md` and present the catalog as a compact table — id, one-line vibe, and
best-for. Recommend one based on the brief (say which and why in a single sentence) and let the
user override.

The 14 categories:

`jingle-pop` · `cinematic-prestige` · `toon-3d` · `hyperreal` · `ugc-raw` · `docu-testimonial` ·
`kinetic-hype` · `luxe-minimal` · `anime-cel` · `retro-vhs` · `stop-motion` · `neon-cyber` ·
`asmr-satisfy` · `meme-chaos`

The chosen style fixes four things for the rest of the run: the image model, the video model,
the prompt DNA appended to every shot, and the audio treatment. Do not let later stages drift
from it.

---

## Stage 3 — Storyboard (approval gate)

Read `references/storyboard.md`. Build the shot list from the brief using the beat structure for
the chosen duration, then render it as a markdown table for approval:

| # | Beat | Sec | Shot | Camera | Action | VO / dialogue | On-screen text |
|---|------|-----|------|--------|--------|---------------|----------------|

Behind the table, hold a full shot card per shot (schema in the reference) carrying the
`keyframe_prompt` and `video_prompt` you will actually send.

**Stop here.** Ask for approval, offer to adjust any shot. Do not generate images yet.

While drafting, keep the total dialogue inside the duration: roughly **2.5 spoken words per
second**. A 15s ad holds ~35 words of voiceover, not 80.

---

## Stage 4 — Keyframes (approval gate)

Generate one keyframe per shot with the style's image model. Each prompt is:

```
<<<avatar_element_id>>> + shot action + framing + camera + lighting + [style prompt DNA]
```

Rules:
- Same model and same aspect ratio for every shot in a run. Mixing models across shots is the
  second-biggest source of visual drift after unlocked identity.
- Preflight with `get_cost: true` on the first call and tell the user the run cost before
  committing the full set.
- Generate all shots, then display them in order with `job_display` (one call per job id).

**Stop here.** Ask for approval. Offer per-shot regeneration — regenerate only the rejected
shots, never the whole set.

---

## Stage 5 — Video (model routing)

Read the router in `references/models.md`. The decision in short:

| Situation | Model |
|---|---|
| Avatar must stay recognizably itself, shot to shot | `seedance_2_0` |
| Multi-shot continuity, motion transfer, tight audio sync | `kling3_0` |
| Product ad from a fetched product/brand — one-click, 12–15s | `marketing_studio_video` |
| Fast, cheap iteration on a single start frame | `kling3_0_turbo` |
| Cinematic single-frame animation with native audio | `grok_video_v15` |
| Budget batch / draft pass | `seedance_2_0_mini`, `veo3_1_lite` |

Then, per shot:

- Pass the shot's keyframe as `medias: [{ role: 'start_image', value: '<image job_id>' }]`.
  The value is a **job id or media id — never an https URL**.
- Where the next shot must continue the previous, pass the following keyframe as `end_image`.
- Carry the `<<<element_id>>>` in the video prompt too, on models that support Elements.
- Set `aspect_ratio` explicitly. `marketing_studio_video` defaults to landscape — pass `9:16`
  yourself for TikTok/Reels.
- Audio: enable native audio on the beat that carries dialogue; silence the rest and lay one
  track under the whole ad instead (`generate_audio` for music, `create_voice`/`list_voices`
  for a consistent brand voice).
- Respect duration limits: `seedance_2_0` 4–15s, `kling3_0` 3–15s, `gemini_omni` 4–10s,
  `marketing_studio_video` 12–15s.

Submit shots in parallel where the model allows, then display each result.

---

## Stage 6 — Deliver

- Show every clip with `job_display`.
- Offer, do not auto-run: `upscale_video` (2K/4K master), `reframe` (derive 9:16 from 16:9 or
  vice versa for a second platform), `virality_predictor` (hook strength and retention risk).
- If the user wants to publish: `tiktok_prepare_publish` → `tiktok_publish`.
- Close with the reusable ids — avatar element id, style id, product id, storyboard — so the
  next campaign starts at Stage 3 instead of Stage 0.

---

## When to hand off instead

Higgsfield ships its own opinionated workflows. If the brief is a *pure* case of one of these
and the user has no storyboard ambitions, say so and offer the handoff — those flows are tuned
end-to-end for their format:

- Plain talking-head creator review → `get_workflow_instructions('ugc-flow')`
- Product-only, no creator on camera → `ugc-product-flow`
- Ad built from a website/app URL where the page appears on screen → `ugc-saas-flow`
- Unboxing / try-on / tutorial → `ugc-unboxing-flow` / `ugc-try-on-flow` / `ugc-tutorial-flow`
- Faceless narrated explainer → `faceless-channel-video`

Use *this* skill when the user wants avatar control, a style choice, and an explicit storyboard
they can edit before anything renders.

## Gotchas that will bite

- `medias[].value` takes a media id or job id. Passing an https URL fails — import it with
  `media_import_url` first.
- Local files: `media_upload_widget`, always. Never ask for a chat attachment.
- `ms_image` requires a `style_id`; list them with `show_marketing_studio(type='image_style')`
  and let the user pick. It has no default and errors without one.
- `soul_2` accepts at most **one** reference image (role `image`), and one `soul_id` per
  generation. Two characters in one shot means Elements, not Soul.
- `marketing_studio_video` uses `product_ids` and `avatar_ids` — plural arrays, max 1 avatar.
  `hook_id`/`setting_id` are mutually exclusive with `ad_reference_id`.
- If any tool returns a `recovery_tool`, call it immediately. Do not explain first.
