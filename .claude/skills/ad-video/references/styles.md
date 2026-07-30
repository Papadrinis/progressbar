# Style Catalog

14 ad styles. Each fixes the image model, the video model, the prompt DNA appended to every
shot, and the audio treatment. Present the summary table first; load a full card only for the
style the user picks.

## Summary — show this table at Stage 2

| id | Vibe | Best for |
|---|---|---|
| `jingle-pop` | Sung hook, candy colors, bouncing rhythm | FMCG, snacks, apps, kids, anything that needs to lodge in your head |
| `cinematic-prestige` | Anamorphic, filmic grain, slow push-ins | Autos, fragrance, finance, watches, brand films |
| `toon-3d` | Soft-shaded 3D animation, big eyes, warm bounce light | Family brands, insurance, telco, mascots |
| `hyperreal` | Macro product photography that moves | Cosmetics, beverages, tech, food |
| `ugc-raw` | Handheld selfie, imperfect, phone-camera honest | DTC, TikTok Shop, supplements, apps |
| `docu-testimonial` | Interview framing, natural light, real speech | Services, healthcare, B2B, trust-building |
| `kinetic-hype` | Whip pans, hard cuts on beat, high contrast | Sportswear, energy drinks, gaming, events |
| `luxe-minimal` | Negative space, one light, glacial movement | Fashion, jewelry, skincare, premium tiers |
| `anime-cel` | Cel shading, speed lines, expressive reactions | Gaming, streetwear, youth culture, Japan-facing |
| `retro-vhs` | 90s tape artifacts, hard zooms, infomercial energy | Nostalgia plays, ironic DTC, music, throwback drops |
| `stop-motion` | Handmade felt/clay/paper, tactile imperfection | Artisanal food, sustainability, craft, gifting |
| `neon-cyber` | Rain-slick neon, volumetric haze, chrome | Crypto, fintech, gaming rigs, nightlife |
| `asmr-satisfy` | Extreme macro, slow textures, sound-forward | Skincare, cleaning, food, stationery, candles |
| `meme-chaos` | Trend-native, jump cuts, caption-driven absurdity | Gen-Z apps, merch, low-budget high-velocity |

Recommend one in a sentence; let the user override. If they name a look not in this list, pick
the nearest card and adapt its prompt DNA rather than improvising from nothing.

---

## Full cards

Every card gives: **image model** for keyframes, **video model** for shots, **DNA** to append to
every prompt, **audio**, **pacing** (shots per 15s), and **negatives** to avoid.

### `jingle-pop` — Jingle Pop
- Image: `nano_banana_2` · Video: `kling3_0` (audio sync matters here more than anywhere)
- DNA: `saturated candy palette, bright even key light, playful bouncy staging, glossy surfaces, confetti-clean background, cheerful exaggerated expression, commercial pop aesthetic`
- Audio: sung hook, 4–8 words, repeated at open and close. Generate the bed with
  `generate_audio` first, then keep video native audio for the sung line only.
- Pacing: 5–6 shots / 15s. Cut on the beat.
- Negatives: muted colors, moody shadows, handheld shake.

### `cinematic-prestige` — Cinematic Prestige
- Image: `cinematic_studio_2_5` · Video: `seedance_2_0` (`genre: 'drama'` or `'epic'`)
- DNA: `anamorphic 2.39 framing, shallow depth of field, motivated practical lighting, subtle film grain, deep shadows with retained detail, slow deliberate camera, muted cinematic color grade`
- Audio: sparse. Score plus one voiceover line at the end. Silence is the point.
- Pacing: 3–4 shots / 15s. Long holds.
- Negatives: fast cuts, on-screen text spam, flat lighting.

### `toon-3d` — Toon 3D
- Image: `seedream_v4_5` · Video: `kling3_0`
- DNA: `stylized 3D animation, soft subsurface shading, expressive oversized eyes, rounded appealing character design, warm bounce light, shallow toy-like depth, family-friendly animated feature look`
- Audio: warm narrator or character voice, light orchestral bed.
- Pacing: 4–5 shots / 15s.
- Negatives: photorealism, uncanny skin texture. **Describe the look; never name a studio or
  franchise in the prompt.**

### `hyperreal` — Hyperreal Product
- Image: `marketing_studio_image` (or `ms_image` with a brand kit) · Video: `seedance_2_0` at
  `resolution: '1080p'` or `'4k'`
- DNA: `hyperreal macro product photography, crisp specular highlights, controlled studio lighting, condensation and texture detail, seamless gradient backdrop, commercial tabletop realism, razor-sharp focus on product`
- Audio: designed SFX over music. No dialogue except the CTA.
- Pacing: 5 shots / 15s — approach, detail, action, result, end card.
- Negatives: plastic CGI sheen, floating unsupported objects.

### `ugc-raw` — UGC Raw
- Image: `soul_2` · Video: `seedance_2_0`
- DNA: `shot on a phone front camera, natural window light, slightly imperfect handheld framing, real skin texture, lived-in home background, casual everyday wardrobe, unpolished authentic look`
- Audio: native dialogue, room tone kept. No music under the hook.
- Pacing: 4 shots / 15s. Hook must land in the first 1.5 seconds.
- Negatives: studio lighting, color grading, tripod stillness, retouched skin.

### `docu-testimonial` — Docu-Testimonial
- Image: `soul_2` · Video: `seedance_2_0` (`genre: 'drama'`)
- DNA: `documentary interview framing, subject slightly off-center looking just off-lens, soft natural key from a window, shallow depth with a real environment behind, honest unretouched face, 50mm perspective`
- Audio: native speech, quiet ambience, music only under B-roll.
- Pacing: 3 shots of interview + 2 cutaways / 15s.
- Negatives: direct-to-lens address, jokes, hard sell language.

### `kinetic-hype` — Kinetic Hype
- Image: `grok_image` · Video: `kling3_0` (or `kling3_0_turbo` for cheap iterations)
- DNA: `high-contrast dynamic sports commercial look, hard rim light, motion blur streaks, low wide-angle hero framing, sweat and texture detail, punchy saturated grade, explosive energy`
- Audio: percussive track, hits on cuts, shouted single-word tags.
- Pacing: 7–8 shots / 15s. Nothing holds longer than 2s.
- Negatives: static framing, pastel palettes, calm.

### `luxe-minimal` — Luxe Minimal
- Image: `soul_cinematic` · Video: `seedance_2_0`
- DNA: `luxury editorial minimalism, vast negative space, single soft directional light, restrained monochrome or sand palette, glacial camera drift, immaculate surfaces, high-fashion composure`
- Audio: ambient tone or a single piano figure. One line of copy, spoken or supered.
- Pacing: 3 shots / 15s. Very long holds.
- Negatives: clutter, saturated color, fast motion, exclamation marks.

### `anime-cel` — Anime Cel
- Image: `seedream_v4_5` · Video: `kling3_0`
- DNA: `cel-shaded anime illustration, clean linework, flat shadow shapes, dramatic speed lines, expressive stylized reaction, vivid sky gradient background, 2D animation aesthetic`
- Audio: energetic synth or city-pop bed, punchy VO.
- Pacing: 5–6 shots / 15s, including one held reaction frame.
- Negatives: 3D rendering, photoreal skin. **Never name a studio or existing series.**

### `retro-vhs` — Retro VHS
- Image: `flux_2` · Video: `kling3_0_turbo`
- DNA: `1990s VHS tape look, chromatic tracking artifacts, scanlines and slight tape warble, hard optical zooms, oversaturated broadcast color, period-accurate wardrobe and set dressing, late-night infomercial energy`
- Audio: compressed announcer voice, period synth sting.
- Pacing: 6 shots / 15s with deliberate rough cuts.
- Negatives: 4K clarity, modern devices, clean audio.

### `stop-motion` — Stop-Motion Craft
- Image: `nano_banana_2` · Video: `kling3_0`
- DNA: `handmade stop-motion look, felt and clay and cut-paper materials, visible fingerprints and fiber texture, miniature practical set, warm tungsten key, slight frame-to-frame jitter, tactile crafted charm`
- Audio: foley-forward, ukulele or music-box bed, warm narrator.
- Pacing: 4–5 shots / 15s.
- Negatives: smooth interpolation, digital gloss, photoreal humans.

### `neon-cyber` — Neon Cyber
- Image: `cinematic_studio_2_5` · Video: `seedance_2_0` (`genre: 'action'`)
- DNA: `rain-slick neon cyberpunk night, magenta and cyan practicals, volumetric haze, chrome and glass reflections, low-angle wide lens, holographic UI accents, high-contrast blue-shifted grade`
- Audio: driving synthwave, filtered VO, riser into the CTA.
- Pacing: 5–6 shots / 15s.
- Negatives: daylight, warm neutrals, rural settings.

### `asmr-satisfy` — ASMR Satisfying
- Image: `nano_banana_pro` (needs the detail headroom) · Video: `seedance_2_0`,
  `generate_audio: true` — the sound *is* the ad
- DNA: `extreme macro texture study, ultra-shallow focus, slow deliberate motion, soft diffused light, tactile surface detail — cream, foam, powder, fabric weave, clean pastel surroundings`
- Audio: native only. No music. Crinkle, tap, pour, scrape.
- Pacing: 4 shots / 15s, each one continuous.
- Negatives: speech, music, fast cuts, wide shots.

### `meme-chaos` — Meme Chaos
- Image: `gpt_image_2` (reliable caption text) · Video: `kling3_0_turbo`
- DNA: `native social video look, deadpan absurd framing, hard zoom punch-ins, phone-shot lighting, bold caption bar across the frame, deliberately unpolished, internet-native comedic timing`
- Audio: trending-style bed (`tiktok_music_trending` for real references), dry delivery.
- Pacing: 6–8 shots / 15s. Every cut is a punchline.
- Negatives: polish, corporate voiceover, aspirational imagery.

---

## Applying a style

1. Append the DNA string to **every** keyframe prompt, after the shot-specific content.
2. Use the card's image model for all keyframes in the run — never mix models mid-storyboard.
   **Exception:** `ugc-raw`, `docu-testimonial`, and `luxe-minimal` name Soul models, which
   cannot read Element references. If the avatar is locked as an Element, swap those cards to
   `nano_banana_2` (photoreal) or `cinematic_studio_2_5` (cinematic) for the whole run. See the
   identity-spine note in `models.md`.
3. Use the card's video model unless the router in `models.md` overrides it for a hard
   requirement (identity lock, 12–15s marketing format, product entity).
4. Let the pacing number set the shot count for the chosen duration.
5. Fold the negatives into the prompt as explicit "no …" clauses when the model drifts.
