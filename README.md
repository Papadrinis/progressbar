# Sausage dog content

Workspace for making dachshund marketing content (short videos, posts, captions) with Claude
and Higgsfield.

## Layout

| Path | What lives there |
|---|---|
| `brand/` | The knowledge base. Voice, visual style, audience, claims, platforms, and one file per recurring dog. Every piece of content reads from here. |
| `content/` | The work itself: `ideas.md` backlog, one brief per piece in `briefs/`, and the `published.md` log. |
| `assets/` | Small reference images only. Renders stay in Higgsfield and are referenced by ID. |
| `.claude/skills/sausage-dog/` | Skill that runs the `ad-video` pipeline with the brand files loaded. |
| `.claude/skills/ad-video/` | Generic Higgsfield ad pipeline (brand-neutral). |
| `ad-video/index.html` | Brief builder page for the ad-video pipeline. |
| `legacy/` | Old files kept for reference. |

## Making a piece of content

1. Add or pick an idea in `content/ideas.md`.
2. Copy `content/briefs/_template.md` to `content/briefs/YYYY-MM-DD-slug.md` and fill it in.
3. Ask Claude to run `/sausage-dog` on the brief.
4. When it's posted, add a line to `content/published.md`.
