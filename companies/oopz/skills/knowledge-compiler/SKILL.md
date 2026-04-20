---
name: knowledge-compiler
description: Per-niche wiki compilation contract. Reads .evidence/knowledge/<niche>/, writes .evidence/wiki/<niche>/. Owned by Librarian. Runs nightly at 02:00 Europe/Amsterdam.
---

## Purpose

Compile raw knowledge items from `.evidence/knowledge/<niche>/` into cross-linked, validated wiki pages at `.evidence/wiki/<niche>/`. One niche per compile run.

Owned by [[librarian]]. Consumed by all content agents via [[knowledge-query]]. The compiler is the bridge between raw normalized items (see [[knowledge-base]]) and the structured wiki that agents reason over. Think of it as a static site generator for a niche knowledge base: input is markdown files, output is structured wiki pages with bidirectional links, confidence scoring, counter-arguments, and data gaps.

## Scope Discipline (CRITICAL)

The compiler NEVER cross-pollinates across niches. It reads ONLY `.evidence/knowledge/<niche-slug>/` and writes ONLY `.evidence/wiki/<niche-slug>/` for the niche it is run on.

Rules:
- Input path must match the niche slug passed as argument
- Output path must match the same niche slug
- Validate niche slug against the project's niches list before starting
- Validate that ALL paths read and written have the niche slug as their prefix
- If a path validation fails, skip + log warning + continue with next file
- NEVER cross-niche. No exceptions. No "just for comparison" reads
- Never process a file from another niche

This is the core safety invariant. A compiler run for `world-mobile` must never touch `defi-lending` files, even if a knowledge item references entities from another niche.

## Inputs

- **Niche slug** (required): the niche to compile (e.g. `world-mobile`)
- **Implicit read access**: all files under `.evidence/knowledge/<niche-slug>/` (all subdirs)
- No DB access
- No network calls
- No API keys

The compiler reads the [[knowledge-base]] schema to understand frontmatter fields. It reads the [[intelligence-seed]] analysis outputs (`.evidence/analysis/<niche-slug>/`) as supplementary signal for confidence scoring, but never writes to that directory.

## Outputs

Four kinds of pages, all under `.evidence/wiki/<niche-slug>/`:

- **`index.md`**: master index with one-line TLDR per page, sorted by category
- **`concepts/<slug>.md`**: concept pages (ideas, patterns, principles)
- **`entities/<slug>.md`**: entity pages (people, orgs, tools, products)
- **`topics/<slug>.md`**: topic pages (broader subjects synthesized from multiple sources)

NOTE: `.evidence/wiki/<niche>/queries/` is written by [[knowledge-query]], NOT by this skill. The compiler regenerates concepts, entities, topics, and index only. It NEVER touches `queries/`.

## Wiki Page Frontmatter Contract

Every compiled wiki page starts with this YAML frontmatter:

```yaml
schema_version: 1
niche_slug: <slug>
page_type: concept|entity|topic
page_slug: <kebab-case>
explored: false
pinned: false
confidence: uncertain|low|medium|high
sources:
  - path: .evidence/knowledge/<niche>/<source-type>/<file>.md
    excerpt: <short quote>
cross_links:
  - to: <target wiki page slug>
    kind: concept|entity|topic
counter_arguments:
  - claim: <counter-claim>
    source: <path or citation>
data_gaps:
  - <gap description>
compiled_at: <ISO-8601>
compiler_version: "0.1.0"
```

Field notes:
- `explored` and `pinned` are human-only fields. Compiler sets them to `false` on first write, then preserves existing values on recompile
- `confidence` is set by the compiler per the Confidence Rule below
- `sources` lists the knowledge-base files that contributed to this page
- `cross_links` is populated by the Cross-link Rule below
- `counter_arguments` and `data_gaps` are mandatory per their respective rules

## Body Content Rules

- First body line is a TLDR (1-2 sentences, no wikilinks, no markdown formatting)
- Then numbered or structured sections covering the concept/entity/topic
- Use wikilinks `[[slug]]` for cross-references to other wiki pages within the same niche
- End with a "Sources" section listing the frontmatter sources as a readable list
- Maximum body length: 8000 characters
- Plain markdown only. No HTML, no embedded media

## Idempotency Rule

Recompiling the same inputs produces functionally equivalent outputs. Specifically:

- Human-writable fields (`explored`, `pinned`) are preserved on recompile. If a page already exists with `explored: true` or `pinned: true`, those values survive the recompile unchanged
- All other content (body, cross_links, counter_arguments, data_gaps, confidence, sources) is re-synthesized from source files on every run
- `compiled_at` updates to the current run timestamp
- Page slugs are stable: the same concept produces the same slug across runs

## Cross-link Rule

When page A references entity or concept B via a wikilink in its body, the compiler ensures B's page also references A in its `cross_links` frontmatter field. Bidirectionality is enforced on the next compile run, not atomically within a single page write. This is eventual consistency by design: a newly created page may have one-directional links until the following nightly run.

## Counter-argument Rule

EVERY concept and topic page MUST have a `counter_arguments` frontmatter field with at least one entry, OR the explicit sentence in the body's "Counter-Arguments" section:

> "No counter-arguments found across the niche's sources as of compile time."

Entity pages are exempt from this rule (entities are factual records, not claims).

## Data-gap Rule

EVERY concept and topic page MUST have a `data_gaps` frontmatter field with at least one entry, OR the explicit sentence in the body's "Data Gaps" section:

> "No data gaps identified; all frequently-referenced facets are covered by at least 2 sources."

Entity pages are exempt from this rule.

## Confidence Rule

Confidence is set per page based on source count:

| Sources citing the claim | Confidence |
|--------------------------|------------|
| >= 3 sources | `high` |
| 2 sources | `medium` |
| 1 source | `low` |
| Synthesized or inferred | `uncertain` |

Mixed-confidence facts within a page body are labeled at the claim level with inline notation (e.g. `[confidence: low]`). The page-level `confidence` field reflects the lowest confidence of any primary claim on the page.

## Minimum Evidence Threshold

A concept or entity gets a wiki page ONLY if >= 2 knowledge items reference it. Singletons (referenced by only one source) are mentioned in related pages but do NOT get their own page. This prevents noise from one-off mentions inflating the wiki.

The threshold applies at compile time. If a concept later accumulates a second source reference, it graduates to its own page on the next nightly run.

## Owned By

[[librarian]] agent. Do not load this skill directly in content-producing agents (Researcher, Writer, Strategist). Call via Librarian delegation. The Librarian is the only agent with write access to `.evidence/wiki/`.

## Output Exclusion

`.evidence/wiki/<niche>/queries/` is written by [[knowledge-query]], NOT by this skill. The compiler regenerates concepts, entities, topics, and index only. The compiler NEVER touches `queries/`. Overwriting a query file would destroy filed-back answers that compound the knowledge loop.

## Execution Cadence

Nightly at 02:00 Europe/Amsterdam via [[nightly-wiki-compile]] task. The task loops over all active niches in the project's niches list. Per-niche failure does not halt the loop: log the error, mark the niche as failed in the run summary, and continue with the next niche.

## Forbidden Actions

The compiler MUST NEVER:

- Write to `.evidence/knowledge/` (read-only for the compiler)
- Write to `skills/`
- Write to `.evidence/analysis/` (that is [[intelligence-seed]]'s territory)
- Auto-flip `explored: false` to `true` (human-only action)
- Overwrite pages with `pinned: true` (pinned pages are frozen by human intent)
- Cross-niche: read or write files outside the target niche's directories
- Call external APIs or network resources
- Access any database directly
