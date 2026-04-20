---
name: Nightly qmd Reindex
slug: nightly-qmd-reindex
assignee: librarian
project: shoshin
schedule:
  timezone: Europe/Amsterdam
  startsAt: 2026-04-20T02:30:00+02:00
  recurrence:
    frequency: daily
    interval: 1
    time:
      hour: 2
      minute: 30
---

Nightly qmd index refresh at 02:30 Europe/Amsterdam. Runs after [[nightly-wiki-compile]] (02:00) to ensure the search index reflects newly compiled wiki pages within hours.

## Workflow

For each project in `companies/oopz/projects/*/PROJECT.md`:
1. Run `bun assets/scripts/sync-qmd-collections.ts --project-slug <slug>`
2. Script internally iterates niches, invokes `qmd collection add/update/context/embed` as needed
3. Emit per-project summary to `.evidence/task-logs/nightly-qmd-reindex/<date>.log`

## Constraints

- One sync run per project. Never combine inputs across projects.
- Per-project failure does not halt the loop. Log and continue.
- Never write to `skills/` or `.evidence/knowledge/` or `.evidence/analysis/`
- Never flip `explored` flags
- qmd is read-only from Librarian's perspective; this task only updates the search index

## Output

Per-project summary logged to `.evidence/task-logs/nightly-qmd-reindex/<date>.log`:
- Project slug
- Niches synced
- Collections added/updated
- Errors (if any)
- Timestamp
