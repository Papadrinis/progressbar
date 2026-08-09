# The avatar registry

Schema: `avatar-generator/schema/avatar-card.schema.json`.
Cards: `avatar-generator/avatars/<id>.json`.
The browser tool keeps the same objects in `localStorage['aag.registry.v1']`, with images in
IndexedDB — export a card to get a portable file back.

## What a card is for

One question decides whether a card is good: **in eight months, on a backend that does not exist
yet, can someone regenerate this exact person from this file alone?**

That is why the card carries the physical description, the derived prompt, the realism choices,
the environments, and the pointers to whatever identity handles each backend issued. Cards
outlive backends.

## Structure

```
id, name, revision, identity_revision   who this is, and which version
identity_lock  ←── the immutable core; changing it makes a new person
persona            profession, business, location, context  (non-visual)
style              wardrobe slots, palette, backdrop, environments
realism            default preset + per-group overrides
identity_anchors   identity_token, seed, soul_id, element_id, reference ids
master_references  the canonical images
base_prompt        DERIVED from identity_lock — never hand-written
shot_suite         which suite this avatar generates against
generation_defaults  model, size, quality, format
history            append-only audit trail
```

## The two revision counters

This is the part that makes "update the card without losing identity" a real guarantee rather
than a hope.

- **`revision`** bumps on every save.
- **`identity_revision`** bumps *only* when `identity_lock` changes.

Two images carrying the same `identity_revision` are guaranteed to have been generated from the
same physical description. Output filenames embed it (`daniela_r1_08_...`), so a training set
can never silently mix two revisions of a person.

### The update protocol

```
User wants a change
   │
   ├── outfit, room, profession, lighting, tone, environments
   │      → card update. revision++. identity_revision unchanged.
   │        The existing 20 images stay valid. Regenerate only what you want.
   │
   └── face, hair, age, skin tone, build, marks
          → identity change. revision++ AND identity_revision++.
            The existing 20 belong to the previous person. Say so, then regenerate.
```

Both front-ends enforce this. The browser tool keeps the identity fieldset disabled behind an
explicit unlock toggle and refuses to save identity edits through the ordinary save button. The
CLI rebuilds `base_prompt` from `identity_lock` on every run and warns when a stale hand-edited
`base_prompt` disagrees with the lock.

**Before bumping `identity_revision`, tell the user what it costs**: the existing pack belongs
to the old revision, a Soul ID trained on it is now trained on someone else, and a full
regeneration is needed for a coherent set. Many requests that sound like identity changes are
not — "put her in a different outfit" is a card update.

## Writing identity_lock well

The whole system rests on this block. Specificity is the entire game.

| Field | Weak | Strong |
|---|---|---|
| `apparent_age` | "30 years old" | "30 — faint expression lines already set at the outer eye and between the brows" |
| `skin.tone` | "medium skin" | "warm light-brown, evenly tanned, golden-olive undertone, Fitzpatrick IV" |
| `hair.texture` | "wavy hair" | "type 2B wavy, medium density, slight natural frizz at the crown" |
| `distinguishing_marks` | "has a mole" | "a small dark mole roughly 1 cm below the outer corner of her RIGHT eye" |
| `face.nose` | "nice nose" | "straight medium-width bridge, slightly rounded tip, narrow nostrils" |

**`distinguishing_marks` is the highest-value field in the card.** Two or three specific,
*side-stated*, locatable marks give you a verification test: open twenty frames, check the mole
is below the right eye in all twenty. Without them, "is this the same person?" is a judgement
call, and judgement calls drift.

**`must_not` is written iteratively.** You cannot predict every way a model will drift. Generate,
look at what went wrong, write the rule, regenerate. A mature card has six to ten of these.

**`distinct_from`** exists for the common case where a concept starts from a real photo but the
avatar must not resemble that person. State it explicitly; it is rendered into every prompt.

## identity_anchors — what each backend gives you

| Anchor | Backend | Notes |
|---|---|---|
| `identity_token` | all | A stable string like `DANIELA-RESTREPO-30-CO-v1`, prefixed to every prompt. Cheap and surprisingly effective as a naming anchor. |
| `seed` | some | **The OpenAI Images API does not expose a seed.** Leave it null there and rely on master references. Do not promise seed-level reproducibility on a backend that has no seed. |
| `master_reference_ids` | all | The real identity spine. |
| `higgsfield_soul_id` | Higgsfield | Trained identity. `soul_2` / `soul_cinematic` only, one per generation. |
| `higgsfield_element_id` | Higgsfield | Instant, no training. Embed as `<<<element_id>>>`. |
| `openai_file_ids` | OpenAI | Pre-uploaded references, to skip re-sending bytes per call. |

Pick one spine per avatar and stay on it. Mixing a Soul ID and an Element across a set produces
two subtly different faces.

## Naming

`id` is a slug, set once, and never changes — it appears in every filename ever generated for
this avatar. `name` is a display string and can change freely. Renaming the display name is a
card update, not an identity change.
