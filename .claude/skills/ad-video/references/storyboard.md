# Storyboard Construction

The storyboard is the contract between the brief and the render. It is cheap to change here and
expensive to change after Stage 5.

## Beat structures

Pick by duration. Beats are fixed; shot counts flex with the style's pacing number.

**8 seconds — 3 shots.** Hook (2s) → Value (4s) → CTA (2s).
One idea only. No setup, no problem statement. Open on the most arresting frame you have.

**15 seconds — 4–6 shots.** Hook (2s) → Problem (3s) → Product (4s) → Proof (3s) → CTA (3s).
The workhorse. Problem and Proof can merge if the style is fast-paced.

**30 seconds — 6–8 shots.** Hook (2s) → Problem (4s) → Turn (4s) → Demo (7s) → Proof (5s) →
Payoff (5s) → CTA (3s).
Only duration with room for a story arc. Earn it or use 15s.

### Beat definitions

- **Hook** — a visual interrupt, not a greeting. It must be legible with sound off. Never open
  on a logo.
- **Problem** — the viewer's friction, shown rather than narrated.
- **Turn** — the moment the product enters and the frame's energy changes.
- **Product / Demo** — the product doing its actual job, in use, in hand, in context.
- **Proof** — a result, a number, a reaction, a before/after. Concrete.
- **Payoff** — the emotional state after the problem is gone.
- **CTA** — one instruction, one brand mark. Spoken *and* supered.

## Shot card schema

Hold one of these per shot behind the approval table.

```yaml
id: S3
beat: product
duration: 4              # seconds; must sum to the target duration
shot_size: medium close-up   # ECU | CU | MCU | medium | wide | establishing
camera: slow push-in on a 50mm
subject: avatar + product
action: she turns the bottle label to camera and half-smiles
dialogue: "Two weeks. That's it."      # empty for silent shots
on_screen_text: "2 WEEKS"              # empty if none
audio: native dialogue, room tone      # or: music only / SFX / silent
continuity: matches S2 wardrobe and kitchen; light stays from camera-left
keyframe_prompt: >
  <<<ELEMENT_ID>>> medium close-up, turning a bottle label toward the lens,
  half-smile, kitchen window light from camera-left, 50mm, [STYLE DNA]
video_prompt: >
  <<<ELEMENT_ID>>> slowly pushes in as she turns the label to camera and says
  "Two weeks. That's it." Subtle natural head movement, no cut. [STYLE DNA]
model: seedance_2_0
```

## Prompt grammar

**Keyframe prompt** — a still. Order matters:

```
<<<element>>> → shot size → subject action (frozen) → environment → lighting → lens → style DNA
```

Describe a single frozen instant. "Walking toward the door" is a video instruction; "mid-stride,
weight on the front foot, hand reaching for the handle" is a keyframe.

**Video prompt** — motion from that frame:

```
<<<element>>> → what moves → camera move → spoken line (verbatim, in quotes) → duration feel → style DNA
```

Rules that prevent most bad renders:

- One camera move per shot. Two is a cut, and a cut inside a shot is drift.
- Put dialogue in quotes, verbatim. Paraphrase produces mismatched lip movement.
- Never re-describe the avatar's face, age, or hair in prompts after Stage 1. The element
  reference carries identity; prose descriptions fight it.
- Name what stays fixed across a cut in `continuity` — wardrobe, light direction, location — and
  repeat those words in both shots' prompts.
- Say what should *not* move ("background static, only her hand moves") when the model gets busy.

## Dialogue budget

**~2.5 spoken words per second.** Hard budget:

| Duration | Max VO words |
|---|---|
| 8s | ~20 |
| 15s | ~35 |
| 30s | ~70 |

Count the words before presenting the storyboard. Over budget means the read speeds up and the
ad sounds panicked. Cut copy, do not cut the pauses.

## On-screen text

- Maximum 4 words per card. It is read in peripheral vision.
- Keep it out of the bottom 15% and top 12% of a 9:16 frame — platform UI covers both.
- If the text must be pixel-crisp, render that keyframe with `gpt_image_2`, `nano_banana_pro`,
  or `openai_hazel`, which handle typography best. Otherwise plan to super it in the edit
  rather than baking it in.

## The approval table

Present exactly this, then stop:

| # | Beat | Sec | Shot | Camera | Action | VO / dialogue | On-screen text |
|---|------|-----|------|--------|--------|---------------|----------------|
| S1 | hook | 2 | ECU | snap zoom out | … | "…" | … |

Below the table give three lines: total duration, total VO word count against budget, and the
models the run will use. Then ask for approval or edits.

## Continuity checklist before rendering

- [ ] Durations sum to the target
- [ ] VO word count within budget
- [ ] Every shot names the same avatar element id
- [ ] Wardrobe and location changes are intentional, not accidental
- [ ] Light direction consistent within each location
- [ ] Exactly one CTA, at the end, spoken and supered
- [ ] Hook works with the sound off
