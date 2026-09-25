---
name: sausage-dog
description: Make dachshund (sausage dog) marketing content using this repo's brand knowledge base. Use for any sausage dog video, post, caption or ad, or when the user invokes /sausage-dog. Loads brand/ and runs the ad-video pipeline with it.
---

# Sausage dog content

A thin wrapper: it loads the brand knowledge base, then hands off to the `ad-video` skill.
Never load the `planpy-*` skills while using this one.

## 1. Load the brand

Read these before anything else:

| File | Use it for |
|---|---|
| `brand/voice.md` | The dog's personality, the sausage metaphor, how he talks |
| `brand/pillars.md` | Which topic the piece covers |
| `brand/formats.md` | Format recipe and hook rules |
| `brand/visual-style.md` | Style choice (ad-video Stage 2) and prompt DNA |
| `brand/audience.md` | Audience field at intake |
| `brand/claims.md` | Checking every line of copy before it ships |
| `brand/platforms.md` | Platform, aspect and duration defaults |
| `brand/dogs/*.md` | The dog(s) in the piece and their locked IDs |

If a file still says `TODO`, ask the user for that detail instead of inventing it.

## 2. Start from a brief

Use the brief in `content/briefs/` the user names. If there isn't one, create it from
`content/briefs/_template.md` with what the user said, and show it before moving on.

Write the script together with the user before any generation. Check it has a hook in the
first line, one real tip, and a sausage metaphor.

**Swiping inspiration:** when the user shares a video, image or post to swipe, log it in
`content/swipes/` from the template, keep its structure and pacing, and rewrite everything else
in the dog's voice. The `swipe-ad` skill handles the teardown; this skill supplies the character.

## 3. Run ad-video

Follow `.claude/skills/ad-video/SKILL.md` with these overrides:

- **Stage 0:** fill intake from the brief and brand files; ask only for what's missing.
- **Stage 1:** if the dog has IDs in `brand/dogs/<name>.md`, reuse them and skip casting.
  If it's a new dog, lock it as ad-video describes, then write the IDs into a new
  `brand/dogs/<name>.md` from `_template.md`.
- **Stage 2:** pick the style that matches `brand/visual-style.md`.
- **Before Stage 5:** check all copy against `brand/claims.md`.

## 4. Log it

Add the generation IDs to the brief. When the user says it's posted, add a line to
`content/published.md`.
