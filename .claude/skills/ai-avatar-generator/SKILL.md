---
name: ai-avatar-generator
description: Define, save and regenerate a persistent photorealistic avatar (a named persona with a locked visual identity), and produce its 20-image identity pack — twenty individual files, never a collage — for use as a Higgsfield Soul ID training set or an avatar-video dataset. Use when the user asks to create an AI avatar or persona, build a character with a consistent face across images, generate a 20-shot avatar pack, make a character/model sheet dataset, train a Soul ID, or regenerate an existing avatar they saved earlier.
---

# AI Avatar Generator

Turns a described person into a **persistent, regenerable identity** plus a **20-image pack**
that is good enough to train an avatar model on.

```
0 INTAKE → 1 CARD (lock identity) → 2 MASTER REF → 3 REALISM → 4 THE 20 → 5 QC → 6 HANDOFF
                   ↑                                                          │
                   └────────── update without losing identity ────────────────┘
```

**Four hard rules:**

1. **The card is the identity, not the prompt.** Never re-describe the person in free prose
   per shot. Every prompt renders the same `identity_lock` block verbatim. Prose re-description
   between shots is the single biggest cause of face drift.
2. **Twenty files, twenty generations.** Never ask a model for a grid, contact sheet, character
   sheet or turnaround-in-one-image and then crop it. Cropped tiles are low resolution and
   share one lighting setup, which is exactly what a training set must not be.
3. **A master reference beats any amount of prose.** As soon as one frame of the person is
   approved, promote it to master reference and generate everything else against it.
4. **Editing the card is not the same as editing the identity.** Context, wardrobe, environment
   and realism can change freely. Touching `identity_lock` creates a new identity revision and
   invalidates the existing pack — say so before doing it.

Reference files — read the one you need, when you need it:

| File | Read it when |
|---|---|
| `references/shot-suite.md` | Stage 4 — the 20 shots, why each exists, and how to swap one |
| `references/realism.md` | Stage 3 — the anti-AI-look grammar and the six presets |
| `references/registry.md` | Stages 1 and 6 — card schema, revisions, the update protocol |
| `references/backends.md` | Stages 2 and 4 — OpenAI Images API, Higgsfield MCP routing, Soul ID |

The repo ships a working implementation at `avatar-generator/`. Prefer it over improvising:

- `avatar-generator/index.html` — browser tool, bring-your-own OpenAI key, plus a demo mode
  that walks the whole flow with placeholder frames and no key
- `avatar-generator/cli/generate-set.mjs` — batch runner, writes 20 separate files
- `avatar-generator/presets/shot-suite-20.json` + `presets/realism.json` — canonical data
- `avatar-generator/avatars/*.json` — the saved cards
- `avatar-generator/lib/prompt.js` — the shared prompt composer both front-ends use

---

## Stage 0 — Intake

Collect these. Do not re-ask anything the user's first message already answered.

| Field | Default if unstated |
|---|---|
| Name | ask (blocking) |
| Apparent age | ask (blocking) |
| Heritage / how the features read | ask (blocking) |
| Profession, business, location | infer from context, state the inference |
| Wardrobe and personal style | derive from the profession |
| Where they get photographed | derive from the profession |
| Language | the user's |
| Distinct-from constraint | none |

Only name, age and heritage block. Everything else you infer, state in one line, and let the
user correct at the card gate.

**If the user supplies a photo**, ask one question that decides everything downstream:
*is this person the avatar, or just the mood?*

- **The avatar** → the photo becomes master reference #1 and the card is written to describe
  what is actually in it.
- **The mood** → set `identity_lock.distinct_from` explicitly and use the photo only for
  lighting, wardrobe and tone. Say plainly in your reply that the generated person will not
  look like the photo.

Remote MCP tools cannot read chat attachments. For Higgsfield, call `media_upload_widget`.
For the browser tool, the user drops the file into the Referencias maestras panel.

---

## Stage 1 — Write the card and lock the identity

Read `references/registry.md` for the schema. Fill `identity_lock` with real specificity — the
difference between an avatar that survives twenty generations and one that does not is entirely
in this block.

The three fields that carry the most weight:

- **`distinguishing_marks`** — two or three specific, locatable marks (a mole 1 cm below the
  outer corner of the *right* eye; a freckle cluster on the *left* cheekbone; a small scar
  through an eyebrow). These are how you and the model both verify identity across a set.
  Vague marks are worthless; state the side and the position.
- **`must_not`** — the traits the model keeps re-adding that would make this a different person.
  Write these after you see the first generations fail, then regenerate.
- **`apparent_age`** — describe the *evidence* of the age, not the number. "Faint expression
  lines already set at the outer eye" beats "30 years old", which models routinely render as 22.

Then derive `base_prompt` from `identity_lock` — never hand-write it. Both front-ends rebuild it
automatically; if you are composing by hand, mirror `renderBasePrompt` in `lib/prompt.js`.

Save the card to `avatar-generator/avatars/<id>.json` and report back in one line: name, id,
identity revision, and whether a master reference exists yet.

---

## Stage 2 — Master reference

Identity from prose alone drifts. Identity from prose plus one reference image mostly does not.

**If the user gave a photo of the avatar** → it is master reference #1. Done.

**Otherwise, bootstrap one.** Generate shot 01 (`closeup_front_neutral`) alone, two to four
variants. Show them. The user picks one. Promote it to master reference #1, then generate the
other nineteen against it. This costs one extra generation and is the highest-leverage step in
the whole pipeline — never skip it to save a call.

Once a reference exists the OpenAI path switches from `/images/generations` to `/images/edits`,
and the Higgsfield path gets a reference Element. See `references/backends.md`.

---

## Stage 3 — Realism preset

Read `references/realism.md`. Pick a default preset for the identity block and let the group
overrides handle the rest. The defaults in the shipped cards are a good starting point:

| Group | Preset | Why |
|---|---|---|
| A identity core | `studio_softbox_neutral` | Frozen variables — only yaw and expression move |
| B expression | `studio_softbox_neutral` | Same, so the mouth range is comparable |
| C body | `editorial_clean` | Even full-figure coverage, clean silhouette |
| D pose | `window_daylight_soft` | Natural, forgiving |
| E work/lifestyle | `documentary_available` | Real rooms, real mixed light |

State the choice in one sentence and move on. This is not a gate.

---

## Stage 4 — Generate the twenty

Read `references/shot-suite.md` once, then run.

```bash
export OPENAI_API_KEY=sk-...
node avatar-generator/cli/generate-set.mjs \
  --avatar avatar-generator/avatars/daniela.json \
  --ref    avatar-generator/refs/daniela/master.png
```

Always run `--dry-run` first on a new or edited card. It writes all twenty prompts and the
manifest, calls nothing, and spends nothing — read two or three prompts before committing.

On Higgsfield, submit them as twenty separate `generate_image` jobs via `generate_image_batch`,
never one job with `count: 20` of the same prompt. Routing and parameters are in
`references/backends.md`.

Report cost before a full run when the backend can tell you (`get_cost: true` on Higgsfield).

---

## Stage 5 — QC

Check every frame against the anchor (shot 01), in this order — the list is ordered by how
often each one actually fails:

1. **Marks present and on the correct side.** Mirrored marks are the most common failure and
   the easiest to miss. Check every frame, not a sample.
2. **Age holding.** Models drift young across a set. If any frame reads under the stated age,
   the whole set is compromised — strengthen `must_not` and regenerate.
3. **Skin texture surviving.** Pores visible at 100%. If frames come back poreless, the
   realism block lost against the model's default aesthetic; raise `quality` and regenerate.
4. **One person, one frame.** No collage, no grid, no second face, no text.
5. **Face unoccluded in E-group shots.** Hands, tools and props below the jawline.
6. **Proportions consistent** between the full-height frames.

Regenerate individual failures with the per-shot control rather than re-running all twenty.
Two or three retries on the hardest shots is normal and much cheaper than a full re-run.

---

## Stage 6 — Handoff

What the user actually does with the pack:

| Goal | Path |
|---|---|
| **Train a Higgsfield Soul ID** | Upload all 20. Soul ID wants 20+ varied photos of one person and this suite is built to its spec. Store the returned `soul_id` in `identity_anchors`. |
| **Reference Element** (no training wait) | Create a `character` Element from shot 01, store `element_id`, embed `<<<element_id>>>` in later prompts. |
| **Avatar video** | Shots 01/02/08 are the strongest drivers — front, three-quarter, mid-speech. |
| **Another tool entirely** | Export the prompt pack JSON; it carries all 20 prompts plus the full card. |

Then remind the user the card is the asset: with `avatars/<id>.json` plus one master reference
they can regenerate this exact person on any backend, indefinitely.

---

## The five controls

Everything the user can ask for maps to one of these. Both front-ends expose all five.

| Control | What it does |
|---|---|
| **Create new avatar** | New card, new id, identity revision 1. Stage 0 → 2. |
| **Use existing avatar** | Load `avatars/<id>.json`. Never rewrite `identity_lock` on load. |
| **Regenerate the set of 20** | Re-run all shots at the current identity revision. Overwrites. |
| **Generate one specific shot** | Single shot by number or id. Use for QC failures and for one-off angles. |
| **Update the card without losing identity** | Edit persona / style / realism / environments only. Bumps `revision`, leaves `identity_revision` and the existing pack valid. |

The fifth is the one to get right. Before touching `identity_lock`, tell the user plainly:
this creates a new identity revision, the existing twenty images belong to the old one, and a
regeneration is needed for a coherent set. If they only want a different outfit or a different
room, that is a card update, not an identity change — do it the cheap way.
