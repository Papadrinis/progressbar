# The 20-Shot Identity Pack

Canonical data: `avatar-generator/presets/shot-suite-20.json`. This file explains the reasoning
so you can adapt the suite rather than copy it blindly.

## Why twenty, and why these twenty

Twenty is not a round number picked for looks. It is the documented **minimum** for a Higgsfield
Soul ID training set, and Higgsfield's own guidance names three quality conditions that a
compliant set must satisfy:

- varied angles, so the model learns a face rather than a pose
- varied expressions, so it learns a face rather than a look
- at least one full-height frame, so body proportions are anchored

plus three things to avoid: occlusions (sunglasses, masks, hands over the face), heavy shadows
or cropped faces, and extreme angles that hide features.

Most hand-rolled twenty-image sets fail on the same three counts: every frame is a front-facing
close-up, every mouth is closed, and there is no full-height frame. This suite is built so that
each of the five blocks covers one axis the others cannot.

| Block | Shots | Axis covered |
|---|---|---|
| A identity core | 01–06 | Head yaw: 0°, ±35°, ±90°. Expression floor and ceiling. |
| B expression / speech | 07–09 | Gaze off-axis, open mouth, hands in frame |
| C body & proportions | 10–15 | 360° body turnaround at full height |
| D pose & context | 16–17 | Seated and standing body language |
| E work & lifestyle | 18–20 | Real environments, real light, face always clear |

## Block A — identity core (01–06)

Six frames with **every variable frozen except head yaw and expression**: same lighting, same
wardrobe, same background, same lens. This is the block the identity actually gets learned from.
Vary anything else here and you dilute the signal.

| # | Shot | Locks |
|---|---|---|
| 01 | close-up, front, neutral | The anchor. Every other frame is judged against it. |
| 02 | close-up, 3/4 left, soft smile | The most-used angle in avatar video |
| 03 | close-up, 3/4 right, neutral | Faces are asymmetric — one side is not enough |
| 04 | profile left | Nose bridge, chin projection, jaw angle, ear |
| 05 | profile right | Completes the yaw sweep |
| 06 | close-up, front, broad smile | Tooth shape and smile-line geometry |

**Why both 3/4s and both profiles.** Given one side, the model averages the face into something
symmetric that matches neither side. This is the same failure as `perfectly symmetrical face` in
the negative list, arriving through the dataset instead of through the prompt.

## Block B — expression and speech (07–09)

| # | Shot | Locks |
|---|---|---|
| 07 | medium, gaze off camera | Non-eye-contact. Without it the avatar stares, unbroken. |
| 08 | medium, mid-speech | **The frame most datasets forget** |
| 09 | medium, hands in frame | Hand size, hand-to-face skin tone continuity, nails |

**Shot 08 is the one to fight for.** Train a lip-sync model on twenty closed mouths and it has
never seen this person's teeth, inner lip or open-jaw shape. It invents them, and the result is
the rubbery pasted-on mouth that makes an avatar video read as fake within two seconds. One
mid-vowel frame fixes it.

**Shot 09 matters for the same structural reason.** The moment an avatar gestures, hands enter
frame. If none of the references contain hands, they get invented — wrong size, wrong tone,
sometimes wrong count.

## Block C — body and proportions (10–15)

Six full-height frames at 0°, ±40°, ±90° and 180°. Shot camera height at chest level: a camera
at eye level pointed down at a standing figure foreshortens the legs, and the model learns the
distortion as the person's proportions.

| # | Shot | Locks |
|---|---|---|
| 10 | full body, front, standing | Height, build, limb proportion. **Mandatory.** |
| 11–12 | full body, 3/4 left and right | Shoulder depth, hip line |
| 13–14 | full body, side left and right | Silhouette depth, posture, how hair sits |
| 15 | full body, back | Back of head, hair fall, shoulder width |

**Shot 15 is not optional if any camera move orbits the avatar.** Without a back view the model
guesses, and hair length from behind is the guess it gets wrong most often.

## Block D — pose and context (16–17)

| # | Shot | Locks |
|---|---|---|
| 16 | seated, 3/4, medium-long | Seated proportions |
| 17 | standing, relaxed, in environment | Natural contrapposto, not the passive stance of 10 |

**Shot 16 earns its slot** because interview and testimonial video is shot seated. A dataset of
only standing frames renders a seated avatar with a broken hip-to-knee relationship.

## Block E — work and lifestyle (18–20)

The only block where light and wardrobe vary. Hard constraint on all three: **nothing crosses
the jawline** — not hands, not tools, not product, not another person.

| # | Shot | Locks |
|---|---|---|
| 18 | consulting with a client | Social context. Second person turned away or cropped. |
| 19 | hands on the craft | Downward gaze without occlusion |
| 20 | off duty, window light | Skin under genuinely different light |

**Shot 20 does more than it looks like it does.** Nineteen frames under one controlled setup
teach the model that this person is always lit that way; drop them into a new scene and they
composite like a cutout. One frame under different light teaches how the skin tone actually
behaves, which is what lets the avatar be relit convincingly.

## Adapting the suite

Swapping shots is fine. Losing an axis is not. Before removing anything, check what block it
belongs to and whether the block still covers its axis.

**Safe to swap** — the E block. Three lifestyle shots are a floor, not a ceiling; replace them
with whatever situations the avatar actually appears in.

**Safe to add** — more expression frames (surprise, laughing, concentrating), a second wardrobe
in the C block, seasonal or hair-up variants.

**Never remove**: shot 01 (the anchor), shot 10 (the only mandatory full-height), shot 15 (the
only back view), shot 08 (the only open mouth). Removing any of these takes out an axis nothing
else in the suite covers.

**Going past twenty.** Diminishing returns start around 30–40 near-duplicate frames; more
*varied* frames keep helping. If the user wants more, add axes — different hair styling,
different light, seasonal wardrobe — not more of the same close-up.

## Filenames

`<avatar-id>_r<identity-revision>_<NN>_<shot-id>.png`, e.g.
`daniela_r1_08_medium_midspeech.png`.

The identity revision in the filename is load-bearing: it is what stops frames from two
different identity revisions being uploaded to a training run as if they were the same person.
