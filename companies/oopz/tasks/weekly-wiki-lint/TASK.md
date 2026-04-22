---
name: Weekly Wiki Lint
slug: weekly-wiki-lint
assignee: librarian
project: shoshin
---

Every Friday 15:30 Europe/Amsterdam. Librarian lints per-niche wikis for contradictions, orphaned pages, duplicate concepts, missing counter-arguments, data gaps, and broken cross-links. Produces quality reports that feed the 16:00 weekly-analyst-review on the same day.

## Workflow

For each (project, niche) pair in the Shoshin project:

1. Invoke [[knowledge-lint]] scoped to that niche wiki (`.evidence/wiki/<niche>/`)
2. Lint checks:
   - Contradictions: concepts with conflicting claims across pages
   - Orphans: pages with no inbound wikilinks
   - Duplicates: near-identical concept or entity pages
   - Missing counter-arguments: concept/topic pages without counter_arguments field
   - Missing data-gaps: concept/topic pages without data_gaps field
   - Broken cross-links: wikilinks pointing to non-existent pages
   - Unexplored pages: explored: false pages that have been in the wiki for 7+ days
3. Write consolidated lint report to `.evidence/wiki/<niche>/_lint/<YYYY-MM-DD>.md`
4. After all niches complete, produce a summary index at `.evidence/wiki/_lint-summary/<YYYY-MM-DD>.md`

## Output Format

Each niche lint report (`.evidence/wiki/<niche>/_lint/<YYYY-MM-DD>.md`):

```markdown
---
date: <YYYY-MM-DD>
niche: <niche-slug>
lint_run_at: <ISO-8601 timestamp>
---

## Summary
- Contradictions: N
- Orphans: N
- Duplicates: N
- Missing counter-arguments: N
- Missing data-gaps: N
- Broken cross-links: N
- Unexplored (7+ days): N

## Contradictions
[list with page references]

## Orphans
[list with page references]

## Duplicates
[list with page references]

## Missing Counter-Arguments
[list with page references]

## Missing Data-Gaps
[list with page references]

## Broken Cross-Links
[list with page references]

## Unexplored (7+ days)
[list with page references]
```

## Rules

- **No auto-fix**: Report findings only. Never modify wiki pages.
- **Never modify wiki**: Lint is read-only. All changes require human review.
- **Never cross-niche**: Each niche is isolated. Do not compare across niches.
- **Timing**: Runs at 15:30 Friday. Analyst review consumes lint report at 16:00 Friday.

## Handoff

After lint completes, the Analyst (16:00 task) reads the lint reports and incorporates findings into the weekly-analyst-review. Analyst may propose diffs to niche profiles or hooks-library based on lint insights. Human approves before applying.
