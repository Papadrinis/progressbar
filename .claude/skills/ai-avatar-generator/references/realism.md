# Realism — defeating the AI look

Canonical data: `avatar-generator/presets/realism.json`.

## The core principle

**Write positive photographic instruction, not negation.**

Instruction-following image models handle "matte skin with visible pores and faint uneven
pigmentation" far better than "no plastic skin". A negative term names a concept and then asks
the model to suppress it; a positive term describes what to render instead. The negative list
still exists in the presets — it catches the residue — but it is the backstop, not the strategy.

## The four blocks

Every generated prompt carries four blocks that together decide whether the frame reads as a
photograph. Omit any one and the AI look comes back through that gap.

### 1. Capture

Body, shutter, ISO, processing. **The lens and aperture come from the shot, not the preset** —
the preset says so explicitly, because a preset that also names a lens will contradict the shot's
framing spec and the model will split the difference.

ISO matters more than it looks like it should: `ISO 100, clean` renders a suspiciously noiseless
image, and noiselessness is one of the strongest tells. `ISO 400–800` with grain retained reads
as real.

### 2. Light

One dominant source, stated size, stated direction, stated falloff, plus what is *not* there
("no hair light, no rim"). Multi-light setups with no named key are how you get the
evenly-illuminated, shadowless, sourceless look.

The strongest single realism lever in the whole system is **naming the modifier and its
distance**. "One 120cm octabox at 45° camera-left, slightly above eye level, one white bounce
card camera-right for a two-thirds-stop lift" produces a physically coherent image. "Soft
professional lighting" produces an AI image.

### 3. Grade

Neutral. State the white balance in Kelvin. Explicitly rule out the teal-and-orange split tone,
HDR local contrast, and the clarity/structure slider — these three are the visual signature of
"AI image" more than anything about the face.

For warm skin tones, add the note that lives in Daniela's card: let the warmth come from the
skin, not from the white balance. The default failure for Fitzpatrick IV–VI is an over-warmed
orange render.

### 4. Texture

Pores, fine lines, vellus hair, uneven pigmentation, retained sensor grain. This is the block
that most often gets overridden by the model's own aesthetic prior — if generations come back
poreless, raise the quality tier before rewriting the prompt.

## The suppression block

Appended to every prompt, on top of the preset. Nine lines covering skin, symmetry, hair,
colour, light, optics, grade discipline, retouch discipline, and output medium. Two deserve
explanation:

**Symmetry.** *"Natural facial asymmetry preserved — the two sides of the face are not mirrored,
one eyelid sits marginally lower, the smile pulls slightly further on one side."* Real faces are
asymmetric. Generated faces default to symmetric, and symmetry is the tell people register as
"uncanny" without being able to name it. Reinforce it in the card too: give the avatar one
concrete asymmetry, such as a brow that sits two millimetres higher.

**Retouch discipline.** *"Unretouched straight-out-of-camera, no frequency-separation smoothing,
no eye or teeth whitening, no face slimming, no beauty filter."* Models trained heavily on
commercial photography have retouching baked in. Naming the specific retouching *techniques*
works better than naming the result.

## The six presets

| id | Use for | Character |
|---|---|---|
| `studio_softbox_neutral` | Identity core (A, B) | One octabox + bounce, neutral 5500K. The controlled default. |
| `window_daylight_soft` | Seated, lifestyle (D) | North window only, no fill. The most forgiving. |
| `documentary_available` | Work, lifestyle (E) | ISO 800, mixed colour temperature left uncorrected. |
| `editorial_clean` | Full-height (C) | Two diffusion panels, even floor-to-head coverage. |
| `golden_hour_restrained` | One or two frames, at most | Warm low sun. Use sparingly. |
| `smartphone_ugc` | Social/UGC end use | Phone camera; **overrides the shot's lens**. |

**On `golden_hour_restrained`.** Warm low sun is the fastest route back to the AI look, because
it is over-represented in training data and models push it too far. If used, keep it to one
frame in the pack and let the warmth stay in the light rather than the grade.

**On `smartphone_ugc`.** The only preset that overrides the shot's lens, and it says so in its
own text. Worth choosing when the avatar's output is social content — a set that all looks like
it came off a Canon will not composite convincingly into a phone-shot feed.

## Why the identity block freezes its lighting

Group A uses one preset across all six frames, deliberately. The identity model needs to learn
*the face*, and every variable that moves alongside the face is a variable it may bind the
identity to instead. Freeze light, wardrobe, background and lens; move only yaw and expression.
Variation belongs in blocks C, D and E, after the identity signal is already established.

## Realism failures and what actually fixes them

| Symptom | Real cause | Fix |
|---|---|---|
| Plastic, poreless skin | Quality tier too low, or the model's prior winning | Raise `quality` to `high` first; only then touch the prompt |
| Everyone looks 22 | `apparent_age` states a number, not evidence | Describe the visible evidence of age; add a `must_not` age floor |
| Face too symmetric | No asymmetry in the card | Add a concrete asymmetry to `identity_lock` |
| Orange, over-warm skin | Grade warmed on top of already-warm light | Neutral white balance; add the warm-tone note |
| Looks like a stock photo | Studio preset on every single shot | Move blocks D and E to available-light presets |
| Face changes between shots | Prose re-description per shot, or no master reference | Promote a master reference; never re-describe in prose |
| Glassy, over-blurred background | Bokeh named as a style rather than a consequence | Let the stated aperture and subject distance do it |
