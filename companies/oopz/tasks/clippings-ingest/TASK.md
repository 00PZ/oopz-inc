---
name: Clippings Ingest
slug: clippings-ingest
assignee: librarian
project: shoshin
---

Daily clippings intake at 07:00 Europe/Amsterdam. Librarian ingests Obsidian Web Clipper markdown drops from `raw/clippings/` into the knowledge base.

## Workflow

1. Iterate niches in `projects/shoshin/PROJECT.md:niches` (today: world-mobile only).
2. For each niche, run `bun assets/scripts/fetch-clippings.ts --project-slug shoshin --niche-slug <niche>` to pull clippings from `raw/clippings/` into `shoshin-kb.<niche_schema>.knowledge_items`.
3. After fetch succeeds, run `bun assets/scripts/kb-to-markdown.ts --project-slug shoshin --niche-slug <niche>` to project DB rows into `.evidence/knowledge/<niche>/clippings/*.md`.
4. Librarian monitors the run. If any clipping is skipped (niche mismatch), log a warning to `.evidence/task-logs/clippings-ingest/<date>.log` for the next morning-brief.
5. Do NOT trigger wiki-compile here. Wiki compilation runs nightly at 02:00 on a separate cadence (nightly-wiki-compile task).

## Rules

- Do not cross-niche: clippings tagged for world-mobile stay in world-mobile schema.
- Do not auto-trigger wiki-compile: separate task, separate schedule.
- Fail fast if niche not in project.niches.
- On script error, log to `.evidence/task-logs/clippings-ingest/<date>.log` and surface at next morning-brief.
