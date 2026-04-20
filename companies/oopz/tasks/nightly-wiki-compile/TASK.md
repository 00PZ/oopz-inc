---
name: Nightly Wiki Compile
slug: nightly-wiki-compile
assignee: librarian
project: shoshin
schedule:
  timezone: Europe/Amsterdam
  startsAt: 2026-04-20T02:00:00+02:00
  recurrence:
    frequency: daily
    interval: 1
    time:
      hour: 2
      minute: 0
---

Nightly wiki compilation at 02:00 Europe/Amsterdam. Librarian compiles per-niche wikis from normalized knowledge items before the 06:00 trend-scan and 07:00 clippings-ingest tasks.

## Workflow

For each project in `companies/oopz/projects/*/PROJECT.md`:
1. Read the project's `niches:` list
2. For each niche in that list:
   a. Invoke [[knowledge-compiler]] scoped to that niche
   b. Read from `.evidence/knowledge/<niche>/`
   c. Write compiled wiki to `.evidence/wiki/<niche>/`
   d. Preserve `explored` and `pinned` human-writable fields on recompile (never overwrite them)
   e. Skip pages marked `pinned: true`
   f. On completion per niche, emit a compile summary to `.evidence/task-logs/nightly-wiki-compile/<date>.log`

## Constraints

- One compile run per (project, niche). Never combine inputs across niches.
- Never cross-niche. Each niche is an isolated knowledge boundary.
- Per-niche failure does not halt the loop. Log and continue.
- Never write to `skills/` or `.evidence/knowledge/` or `.evidence/analysis/`
- Never flip `explored` flags
- Never overwrite `explored` or `pinned` fields during recompile
- Do not run wiki-lint here (separate Friday task)

## Output

Compile summary per niche logged to `.evidence/task-logs/nightly-wiki-compile/<date>.log`:
- Niche slug
- Pages compiled
- Pages skipped (pinned)
- Errors (if any)
- Timestamp
