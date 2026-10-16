# Nuggeting Studio

A single-page tool for planning Nugget's videos. Open `studio/index.html` in a browser (or on
GitHub Pages at `/studio/`). No install, no build.

It does the thinking and the paperwork. Generating happens in Higgsfield, either from the
Storyboard screen or through Claude.

| Screen | What you do there |
|---|---|
| Board | See every video by stage, and keep the idea backlog. |
| Write | Pick a hook from several options, fill in the tip, sausage metaphor and CTA, and write the script beats. A voice check flags greeting hooks, a missing sausage metaphor, no real tip, running over length, income promises, and back-unsafe actions. |
| Swipe | Log a reference video or image, map its beats onto Nugget's version, and copy a swipe file for `content/swipes/`. |
| Storyboard | One 9:16 frame per beat, built from the script. Approving it is the gate before any credits are spent. When the page runs as the Nuggeting Studio artifact in claude.ai, it can then generate a keyframe per shot, and after you approve the keyframes, a clip per shot. |
| Ship | Copy the brief for `content/briefs/`, then copy a `/sausage-dog` message for Claude, which runs the Higgsfield pipeline. Log generation IDs, caption and post links afterwards. |

## How it connects

- Briefs and swipe files match the templates in `content/briefs/_template.md` and
  `content/swipes/_template.md`, so they can be pasted straight into the repo.
- "Import a brief" reads a brief from `content/briefs/` back into the studio.
- Work is saved in your browser only. The repo is the source of truth; use "Copy backup of
  everything" if you want to move to another browser.
- Generation from the page works only in the claude.ai artifact, through your own Higgsfield
  connector (claude.ai asks you to allow it the first time). Every run shows the credit cost and
  your balance and waits for you to confirm. Keyframes use `nano_banana_pro` with Nugget's and
  the logo's reference elements; clips use `seedance_2_0` from each approved keyframe, with no
  audio until Nugget's voice exists. Results open as links (the artifact can't show
  Higgsfield's images inline), and their job IDs go into the brief.
- Opened anywhere else, the page doesn't call Higgsfield. Ship hands the brief to Claude with
  the `sausage-dog` skill, which reads `brand/` and uses Nugget's locked IDs.
