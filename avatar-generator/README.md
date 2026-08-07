# AI Avatar Generator

Define an avatar once, keep it forever, and regenerate the same person on demand.

The deliverable is a **20-image identity pack**: twenty individual photorealistic files of one
person, covering every angle, framing and expression an avatar-video model needs. Twenty is the
documented minimum for a Higgsfield Soul ID training set, and the suite is laid out to satisfy
its quality rules — varied angles, varied expressions, at least one full-height frame.

Two front-ends, one shared prompt composer, so they can never drift apart:

| | |
|---|---|
| `index.html` | Browser tool. Bring your own OpenAI key. Registry, ficha editor, references, the run queue, per-shot regeneration, downloads. |
| `cli/generate-set.mjs` | Batch runner. Zero dependencies, Node 18+. Writes twenty separate files plus a manifest. |

---

## Quick start — browser

```bash
python3 -m http.server 8000     # from this directory
open http://localhost:8000/
```

Opening `index.html` straight off disk works too, but some browsers block local storage on
`file://` and nothing will persist between reloads — the tool warns you when that happens.

1. **Conexión** — paste an OpenAI API key. It is stored in this browser only and sent only to
   the base URL you configure. Use a project-scoped key.
2. **Avatares** — Daniela is preloaded. Or create a new avatar.
3. **Referencias maestras** — upload a photo of the person if you have one. Optional but it is
   the single biggest factor in identity stability.
4. **Set de 20** — *Regenerar set de 20*. Each shot lands as its own file.

No API key? The tool is still useful: fill in the ficha and hit **Exportar prompt pack** to get
all twenty prompts as JSON, ready to paste into Higgsfield, ChatGPT or anything else.

## Quick start — CLI

```bash
export OPENAI_API_KEY=sk-...

# Always dry-run a new or edited card first. Writes 20 prompts, spends nothing.
node cli/generate-set.mjs --avatar avatars/daniela.json --dry-run

# With a master reference — strongly recommended
node cli/generate-set.mjs --avatar avatars/daniela.json --ref refs/daniela/master.png

# Regenerate three shots that failed QC
node cli/generate-set.mjs --avatar avatars/daniela.json --shots 04,08,19 --overwrite
```

Output lands in `out/<avatar-id>-r<identity-revision>/`:

```
daniela_r1_01_closeup_front_neutral.png
daniela_r1_02_closeup_3q_left_soft_smile.png
...
daniela_r1_20_lifestyle_window_light.png
manifest.json          every prompt, model, and result
prompts/               one .txt per shot, for auditing
```

Run `node cli/generate-set.mjs --help` for the full flag list.

---

## Layout

```
index.html                       the browser tool
app.js                           UI, registry, IndexedDB, run queue, zip
lib/prompt.js                    shared prompt composer  ← the important file
presets/shot-suite-20.json       the 20 shots
presets/realism.json             6 realism presets + the anti-AI-look suppression block
schema/avatar-card.schema.json   the card schema
avatars/daniela.json             Daniela — the seeded avatar
cli/generate-set.mjs             batch runner
cli/sync-presets.mjs             refresh the snapshot embedded in index.html
refs/<avatar-id>/                drop master references here; the CLI finds them
out/<avatar-id>-r<rev>/          generated packs (gitignored)
```

`presets/` and `avatars/` are the source of truth. `index.html` carries an embedded snapshot so
it works offline; after editing any JSON, run `node cli/sync-presets.mjs`. When served over
http(s) the files on disk win over the snapshot anyway.

## The five controls

| Control | Effect |
|---|---|
| **Crear nuevo avatar** | New card, identity revision 1 |
| **Usar avatar existente** | Load from the registry; identity untouched |
| **Regenerar set de 20** | Re-run every shot at the current identity revision |
| **Generar una toma específica** | One shot, by number or id |
| **Actualizar ficha sin perder identidad** | Edit persona / style / realism only; the existing pack stays valid |

## Identity, and the two revision counters

`revision` bumps on every save. `identity_revision` bumps **only** when `identity_lock` changes.

Two images with the same `identity_revision` are guaranteed to come from the same physical
description, and the revision is baked into every filename — so a training set can never
silently mix two versions of a person.

Changing an outfit, a room, or a lighting preset is a card update: cheap, and your twenty images
stay valid. Changing the face, hair, age or build is an identity change: new revision, and the
existing pack now belongs to someone else. The browser tool keeps the identity block behind an
explicit unlock toggle so this cannot happen by accident.

## Realism

Six presets, plus a suppression block appended to every prompt. The approach is positive
photographic instruction rather than negation — "matte skin with visible pores and faint uneven
pigmentation" works, "no plastic skin" mostly does not. Named modifiers and distances, stated
ISO and shutter, neutral grade, retained grain, preserved facial asymmetry.

## Notes on the backend

- Reference images route the call to `/v1/images/edits`; without them it is
  `/v1/images/generations`.
- `input_fidelity` exists only on `gpt-image-1`. `gpt-image-1.5` rejects it and behaves as `high`.
- **There is no seed parameter** on the OpenAI Images API. Identity comes from the master
  reference and the identity block, not from a number.
- 429s and 5xx retry four times with exponential backoff. Concurrency defaults to 2.

## Adding an avatar by hand

Copy `avatars/daniela.json`, change `id` and `name`, rewrite `identity_lock`, reset `history`.
Validate against `schema/avatar-card.schema.json`, then `node cli/sync-presets.mjs` to pick it up
in the browser tool. Be specific in `identity_lock` — especially `distinguishing_marks`, which is
what makes "is this the same person?" a checkable fact rather than a judgement call.
