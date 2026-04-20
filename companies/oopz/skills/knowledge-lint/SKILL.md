---
name: knowledge-lint
description: Periodic quality sweep of .evidence/wiki/<niche>/. Detects contradictions, orphans, stale pages, broken links, missing required sections. Reports only. Never auto-fixes. Owned by Librarian.
---

## Purpose

Sweep `.evidence/wiki/<niche>/` for quality issues and produce a structured report. One niche per lint run.

Owned by [[librarian]]. The lint report feeds the Analyst's Friday review (see [[weekly-wiki-lint]]). This skill is pure reporting: it reads, detects, and writes a findings file. It never modifies wiki pages. Human or a dedicated follow-up task applies any fixes.

## Scope Discipline

The linter NEVER cross-pollinates across niches. It reads ONLY `.evidence/wiki/<niche-slug>/` and `.evidence/knowledge/<niche-slug>/` for the niche it is run on.

Rules:
- Input path must match the niche slug passed as argument
- Validate niche slug against the project's niches list before starting
- Validate that ALL paths read have the niche slug as their prefix
- If a path validation fails, skip + log warning + continue with next file
- NEVER cross-niche. No exceptions. No "just for comparison" reads
- Never read a file from another niche

This mirrors the invariant in [[knowledge-compiler]]. A lint run for `world-mobile` must never touch `defi-lending` files.

## Inputs

- **Niche slug** (required): the niche to lint (e.g. `world-mobile`)
- **Implicit read access**: all files under `.evidence/wiki/<niche-slug>/` (all subdirs)
- **Implicit read access**: all files under `.evidence/knowledge/<niche-slug>/` (to validate source citations)
- No DB access
- No network calls
- No API keys

## Lint Checks

Ten checks, each producing findings with severity `info`, `warn`, or `error`.

### 1. Broken Cross-links
Wikilink targets that don't exist as pages in `.evidence/wiki/<niche-slug>/`. A link `[[some-slug]]` is broken if no file with that slug exists under concepts, entities, or topics.

Severity: `error`

### 2. Unidirectional Cross-links
Page A links to page B, but B's `cross_links` frontmatter does not reference A. Some are valid (new pages pending next compile), so this is a report, not an error. Flags pages where the gap is older than 2 compile cycles.

Severity: `warn`

### 3. Orphan Pages
Concept, entity, or topic pages with zero inbound wikilinks from other wiki pages. An orphan is unreachable from the index via cross-links. Orphans may indicate a page that should be merged, renamed, or deleted.

Severity: `warn`

### 4. Duplicate Concepts
Pages with similar slugs (edit distance <= 2) or identical TLDRs (first body line). Flags candidate pairs for human review. Does not auto-merge.

Severity: `warn`

### 5. Stale Pages
Concept, entity, or topic pages where `compiled_at` is older than 30 days AND no new `.evidence/knowledge/<niche-slug>/` files have appeared since that compile date. Stale pages may reflect outdated synthesis.

Severity: `info`

### 6. Unreviewed Backlog
Count of pages with `explored: false` per category (concepts, entities, topics). High counts signal the human review queue is growing faster than it is being cleared.

Severity: `info`

### 7. Missing Counter-arguments or Data Gaps
Concept and topic pages that violate the mandatory-section rule from [[knowledge-compiler]]: no `counter_arguments` frontmatter field AND no "No counter-arguments found" sentence in the body. Same check for `data_gaps`. Entity pages are exempt.

Severity: `error`

### 8. Contradictions
Pages with opposing claims detected via heuristic keyword matching (e.g. "X is Y" vs "X is not Y" across two pages). Full LLM-based contradiction detection is roadmap. Current check is shallow but catches obvious conflicts.

Severity: `warn`

### 9. Static-flag Violations
Checks git log for commits that modified `static: true` skill files where the commit author matches bot patterns (e.g. author email contains `[bot]`, `noreply`, or matches known CI service patterns). Human-only edits are expected on static files. A non-human commit modifying a `static: true` file is a policy violation.

Heuristic: `git log --follow --format="%ae %s" -- <file>` filtered for bot-pattern authors.

Severity: `error`

### 10. Broken Source Citations
Wiki pages cite `.evidence/knowledge/<niche-slug>/` files in their `sources` frontmatter field. This check verifies each cited path still exists on disk. A missing source file means the wiki page's evidence trail is broken.

Severity: `error`

## Output

Markdown report written to `.evidence/wiki/<niche>/_lint/<YYYY-MM-DD>.md`.

The underscore prefix keeps lint reports separate from content pages and excluded from wiki cross-link traversal.

Report structure:

```markdown
---
lint_date: <ISO-8601>
niche_slug: <slug>
checks_run: 10
findings_total: <n>
findings_by_severity:
  error: <n>
  warn: <n>
  info: <n>
---

## Summary

<one-paragraph overview>

## Errors

### Broken Cross-links
- `concepts/foo.md` links to `[[bar]]` (target not found)

### Missing Counter-arguments or Data Gaps
- `topics/baz.md` (no counter_arguments field and no exemption sentence)

### Static-flag Violations
- `skills/brand-voice-system/SKILL.md` modified by `github-actions[bot]` in commit abc1234

### Broken Source Citations
- `concepts/qux.md` cites `.evidence/knowledge/world-mobile/x-posts/2026-01-01-tweet-abc.md` (file not found)

## Warnings

### Unidirectional Cross-links
...

### Orphan Pages
...

### Duplicate Concepts
...

### Contradictions
...

## Info

### Stale Pages
...

### Unreviewed Backlog
- concepts: 12 unreviewed
- entities: 4 unreviewed
- topics: 7 unreviewed
```

## Integration

The lint report at `.evidence/wiki/<niche>/_lint/<YYYY-MM-DD>.md` is consumed by the Analyst at `weekly-analyst-review` 16:00 Europe/Amsterdam every Friday. The Analyst reads the report as part of the Friday review cycle and surfaces actionable findings in the weekly intelligence summary.

The Librarian writes the report. The Analyst reads it. Neither modifies wiki pages based on it.

## No Auto-fix Rule

The linter is a read-only diagnostic tool. It NEVER modifies wiki pages, frontmatter, or any file under `.evidence/wiki/<niche>/` except writing the lint report itself to `_lint/`.

No auto-fix. No auto-merge of duplicates. No auto-deletion of orphans. No auto-correction of broken links.

Human or a dedicated follow-up task applies fixes after reviewing the report. This preserves the human-gate discipline: the lint report is input to human judgment, not a trigger for automated mutation.

## Cadence

Weekly, every Friday at 15:30 Europe/Amsterdam, via [[weekly-wiki-lint]] task. The task loops over all active niches. Per-niche failure does not halt the loop: log the error and continue.

The report must be written before 16:00 so the Analyst's `weekly-analyst-review` task can consume it.

## Owned By

[[librarian]] agent. The Librarian is the only agent with write access to `.evidence/wiki/`. All other agents read the lint report but do not produce it.
