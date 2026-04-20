---
name: knowledge-query
description: Query the compiled wiki for a niche and file the answer as a new query page. Owned by Librarian. Consumed by Researcher, Writer, Strategist, Analyst.
---

## Purpose

Query the compiled wiki at `.evidence/wiki/<niche>/` for a natural-language question, return a cited answer, and file it back as a new page under `.evidence/wiki/<niche>/queries/`. One niche per query run.

Owned by [[librarian]]. Consumers (Researcher, Writer, Strategist, Analyst) delegate to Librarian and do not load this skill directly. Every question asked gets filed back as a new page. The wiki gets richer over time. This is the compounding mechanism.

## Scope Discipline (CRITICAL)

This skill NEVER cross-pollinates across niches. It reads ONLY `.evidence/wiki/<niche-slug>/` and writes ONLY `.evidence/wiki/<niche-slug>/queries/` for the niche it is run on.

Rules:
- Input path must match the niche slug passed as argument
- Output path must match the same niche slug
- Validate niche slug against the project's niches list before starting
- Validate that ALL paths read and written have the niche slug as their prefix
- If a path validation fails, abort the query and return an error
- NEVER cross-niche. No exceptions. No "just for comparison" reads
- Never read a wiki page from another niche

This is the core safety invariant. A query run for `world-mobile` must never touch `defi-lending` files, even if the question references entities from another niche.

## Inputs

- **Niche slug** (required): the niche to query (e.g. `world-mobile`)
- **Query string** (required): natural-language question (e.g. "What is World Mobile's token utility?")
- **Implicit read access**: all files under `.evidence/wiki/<niche-slug>/` (concepts, entities, topics, index, existing queries)
- No DB access
- No network calls
- No API keys

## Outputs

A single new file: `.evidence/wiki/<niche>/queries/<YYYY-MM-DD>-<kebab-slug>.md`

The file contains the query-page frontmatter and a structured answer body. See sections below for the full spec.

## Query-page Frontmatter

Every query page starts with this YAML frontmatter:

```yaml
schema_version: 1
niche_slug: <slug>
page_type: query
page_slug: <kebab-case-slug>
explored: false
confidence: uncertain|low|medium|high
query: "<original natural-language question>"
queried_by: <agent-slug or "human">
queried_at: <ISO-8601>
cited_pages:
  - path: .evidence/wiki/<niche>/<type>/<slug>.md
    excerpt: <short quote from that page>
cross_links:
  - to: <target wiki page slug>
    kind: concept|entity|topic|query
```

Field notes:
- `explored` is a human-only field. Always set to `false` on creation. Never auto-flip
- `confidence` reflects the lowest confidence of any cited page used in the answer
- `query` stores the original question verbatim
- `queried_by` is the agent slug that triggered the query (e.g. `researcher`, `writer`) or `"human"`
- `cited_pages` lists every wiki page the answer draws from, with a short excerpt
- `cross_links` is populated from wikilinks used in the answer body

## Body Structure

Every query page body follows this structure in order:

**(a) TLDR**

2-3 sentences. No wikilinks. No markdown formatting. Plain prose answer to the question.

**(b) Full Answer**

Detailed answer with inline `[[wikilinks]]` to cited wiki pages within the same niche. Claims must be grounded in cited pages. If the wiki has no source for a claim, say "not in the wiki" rather than fabricate.

**(c) Unreviewed Sources (conditional)**

Include this section only if any cited page has `explored: false`. Use this exact phrasing:

> "This answer relies on unreviewed wiki pages: [[page1]], [[page2]]. Treat with reduced confidence."

If all cited pages have `explored: true`, omit this section entirely.

**(d) Sources**

A readable list of the frontmatter `cited_pages` entries. Format:

```
- [[page-slug]] (concepts/page-slug.md): "short excerpt"
```

**(e) Open Gaps**

What the wiki does not yet cover that would improve this answer. If nothing is missing, write: "No gaps identified; the wiki covers this question adequately."

## Citation Policy

ALL claims in the answer body must cite at least one wiki page. If the wiki has no source for a claim, say "not in the wiki" rather than fabricate or infer from training data. Fabrication is a hard failure.

Confidence for the query page is set to the lowest confidence of any cited page:
- If any cited page is `uncertain`, the query page is `uncertain`
- If the lowest is `low`, the query page is `low`
- And so on up to `high`

If no wiki pages exist for the niche yet, return: "Wiki not yet compiled for this niche. Run [[knowledge-compiler]] first."

## Unreviewed-source Annotation

If any cited page has `explored: false`, the answer MUST include the "Unreviewed Sources" section (see Body Structure above) with this exact phrase: "Treat with reduced confidence."

This is the soft-flag policy. It does not block the answer. It surfaces the epistemic risk to the consumer. The Librarian never auto-flips `explored` flags. Only humans flip them.

## Filed-back Behavior

Every query creates a new file. No query is answered without filing.

**Naming**: `YYYY-MM-DD-<kebab-slug>.md` where the slug is the first 5-8 words of the query, kebab-cased. Examples:
- "What is World Mobile's token utility?" -> `2026-04-20-what-is-world-mobile-token-utility.md`
- "Who are World Mobile's main competitors?" -> `2026-04-20-who-are-world-mobile-main-competitors.md`

**Collision handling**: if the filename already exists, append `-v2`, `-v3`, etc. Never overwrite an existing query file.

**Write path**: always `.evidence/wiki/<niche-slug>/queries/`. Never write outside this directory.

## Owned By

[[librarian]] agent. Consumers (Researcher, Writer, Strategist, Analyst) delegate to Librarian. They do not load this skill directly. The Librarian is the only agent with write access to `.evidence/wiki/`.

## Invariant

Query pages are append-only. Once filed, a query page is never modified or deleted by any agent. [[knowledge-compiler]] never touches `queries/`. The compiler regenerates concepts, entities, topics, and index only. Overwriting a query file would destroy filed-back answers that compound the knowledge loop.

## Cross-niche Prohibition

If the niche slug passed as argument does not match the project's niches list, fail immediately with: "Unknown niche: <slug>. Aborting." Do not attempt a partial query.

If the query string references entities from another niche, answer only from the target niche's wiki. Do not read cross-niche files. Note the limitation in the Open Gaps section.

NEVER cross-niche. No exceptions.
