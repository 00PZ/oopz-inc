---
name: qmd-search
description: Hybrid BM25 + vector + LLM re-ranking search over a niche's compiled wiki. Used by Librarian for discovery before knowledge-query synthesis. Local-only, no API keys, per-niche scope enforced.
---

## Purpose

Contract for invoking qmd hybrid search against a niche's compiled wiki. Used by Librarian to discover relevant pages before synthesis. Local-only: qmd runs its own GGUF models with no external API calls and no API keys required.

Owned by [[librarian]]. This skill sits between the wiki (compiled by [[knowledge-compiler]]) and the synthesis step (filed back by [[knowledge-query]]). When Librarian receives a question, it calls qmd to discover the most relevant wiki pages, then synthesizes a cited answer from those pages.

For CLI reference, see https://github.com/tobi/qmd.

## Scope Discipline (CRITICAL)

Every qmd invocation MUST include `--collection <niche-slug>` or `-c <niche-slug>`. The collection flag binds the search to a single niche's index. Cross-niche queries are FORBIDDEN.

Rules:
- Pass `-c <niche-slug>` on every single call, no exceptions
- Validate the niche slug against the project's niches list before invoking qmd
- NEVER cross-niche. No exceptions. No "just for comparison" queries
- If the niche slug is unknown, abort and return an error before calling qmd
- Never pass a niche slug that differs from the question's target niche

This mirrors the scope discipline in [[knowledge-compiler]] exactly. A qmd call for `world-mobile` must never touch `defi-lending` index data, even if the question references entities from another niche.

## Invocation Patterns

All examples assume `<niche>` is a valid niche slug (e.g. `world-mobile`).

**Discovery before synthesis** (primary use case):

```bash
qmd query "<natural-language question>" -c <niche> --files --min-score 0.3 -n 15
```

Returns the top 15 wiki pages most relevant to the question, filtered to score >= 0.3. Use `--files` to get file paths for direct reading. Librarian reads the returned files and synthesizes a cited answer.

**Exact document lookup** (when you know the page path):

```bash
qmd get <path-to-wiki-page> -c <niche>
```

Retrieves a single wiki page by path. Use when you already know which page you need (e.g. from a cross-link or prior query result).

**Batch retrieval** (fetch multiple pages at once):

```bash
qmd multi-get "<glob>" -c <niche> --max-bytes 20480
```

Retrieves all pages matching the glob pattern, capped at 20480 bytes total. Useful for loading an entire subdirectory (e.g. `concepts/*.md`) before synthesis.

**Status check** (verify index health before querying):

```bash
qmd status
```

Returns index status per collection: document count, last indexed timestamp, embedding model in use. Run this if query results seem stale or empty.

## Required Invocation Options

| Option | Required | Default | Notes |
|--------|----------|---------|-------|
| `-c <niche>` | MANDATORY | none | Every call. No exceptions. |
| `--min-score 0.3` | Recommended | varies | Default discovery threshold. Lower for broad recall, raise for precision. |
| `--json` or `--files` | Recommended | human-readable | Use `--json` for structured parsing, `--files` for path lists. |
| `-n <num>` | Optional | 10 | Limit result count. Reasonable range: 5-20. |

Never call `qmd query` without `-c <niche>`. The flag is not optional even if qmd has a default collection configured: always pass it explicitly to prevent accidental cross-niche reads.

## Result Interpretation

qmd returns a relevance score per result. Interpret scores as follows:

| Score range | Interpretation | Action |
|-------------|----------------|--------|
| 0.8 - 1.0 | Highly relevant | Include in synthesis, cite directly |
| 0.5 - 0.8 | Moderately relevant | Include with normal confidence |
| 0.2 - 0.5 | Somewhat relevant | Include if no better results exist; note lower confidence |
| below 0.2 | Likely noise | Ignore. Filter via `--min-score 0.3` to exclude automatically |

If all results score below 0.3, the wiki likely has no coverage for this question. Librarian should note the gap in the filed-back query page's "Open Gaps" section and fall back to reading `index.md` directly.

Scores do NOT reflect wiki page confidence (the `confidence` frontmatter field). A high qmd score means the page is topically relevant to the query. A high wiki confidence means the page's claims are well-sourced. Both matter independently.

## Integration with knowledge-query

qmd is the discovery layer that feeds [[knowledge-query]]. The 3-step flow:

1. **Discovery step**: Librarian calls `qmd query "<question>" -c <niche> --files --min-score 0.3 -n 15`. qmd returns a ranked list of wiki page paths.

2. **Synthesis step**: Librarian reads the top-K returned files (typically top 5-10 by score). It synthesizes a cited answer grounded in those pages. Claims not found in the returned pages are marked "not in the wiki."

3. **Filed-back step**: Librarian writes the answer to `.evidence/wiki/<niche>/queries/` as a new query page (per [[knowledge-query]] spec). This step is UNCHANGED from pre-qmd behavior. qmd only changes how Librarian discovers which pages to read; the filing contract stays the same.

The filed-back query page's `cited_pages` frontmatter lists the wiki pages that qmd surfaced and Librarian used. This creates a traceable chain: question -> qmd results -> cited pages -> filed answer.

## MCP vs CLI

Two invocation paths are supported. Both MUST pass `-c <niche>` and respect scope discipline.

**Preferred: qmd MCP server** (when available in Paperclip session):

qmd can run as an MCP server. When configured in `.paperclip.yaml` under `mcpServers`, Librarian calls qmd tools directly via the Paperclip MCP client without shelling out. The MCP interface exposes the same operations (`query`, `get`, `multi-get`, `status`) as structured tool calls. Check `.paperclip.yaml` for the `qmd` MCP server entry to confirm availability.

**Fallback: qmd CLI via Bash tool**:

If the MCP server is not configured or unavailable, shell out to the `qmd` binary via the Bash tool. Always pass `--json` for structured output parsing:

```bash
qmd query "<question>" -c <niche> --json --min-score 0.3 -n 15
```

Parse the JSON response to extract file paths and scores. The JSON schema is documented at https://github.com/tobi/qmd.

Both paths are functionally equivalent. The MCP path is preferred because it avoids subprocess overhead and gives structured tool results directly. The CLI fallback is always available as a safety net.

## No Auto-flip of Explored Flag

qmd scores do NOT upgrade `explored: false` to `true` on any wiki page. This rule is absolute.

Scores inform Librarian's confidence in the filed-back answer (via the query page's `confidence` field), but they have no effect on the `explored` flag of the source wiki pages. The `explored` flag is a human-only field. Only a human can flip it from `false` to `true`.

Never auto-flip. No exceptions. This mirrors the rule in [[knowledge-compiler]] and [[knowledge-query]].

## Owned By

[[librarian]] agent only. This skill is loaded by Librarian only.

Other agents (Researcher, Writer, Strategist, Analyst) do NOT invoke qmd directly. They delegate to Librarian, which handles discovery and synthesis. The separation is intentional: qmd scope discipline and result interpretation are Librarian's responsibility, not the caller's.

If a non-Librarian agent needs wiki knowledge, it asks Librarian. Librarian uses this skill internally. The caller never sees qmd directly.

## Cadence Dependency

qmd's index must be fresh for results to reflect the current wiki state. The index is rebuilt nightly by [[nightly-qmd-reindex]], which runs after [[nightly-wiki-compile]] completes (wiki compile at 02:00, qmd reindex immediately after).

**First-ever run (index not yet initialized)**: qmd returns zero results because no index exists yet. Librarian's fallback in this case: read `index.md` directly from `.evidence/wiki/<niche>/` to get a list of all compiled pages, then read the most relevant ones manually. Log the fallback in the filed-back query page's "Open Gaps" section.

**Stale index**: if `qmd status` shows a last-indexed timestamp older than 48 hours, treat results with reduced confidence. Note the staleness in the filed-back answer.

**Index rebuild is not Librarian's job**: Librarian reads the index, it does not write it. [[nightly-qmd-reindex]] owns the rebuild. Librarian never calls `qmd index` or any write operation.

## Out of Scope for v1

The following are explicitly deferred and not part of this skill's contract:

- **No indexing of `.evidence/knowledge/` raw items**: qmd indexes only the compiled wiki at `.evidence/wiki/<niche>/`. Raw knowledge items (x-posts, web-articles, clippings) are not indexed. Agents read raw items directly if needed.

- **No per-source-type filtering inside qmd**: filtering by source type (e.g. "only search concept pages") is not supported via qmd query flags. Filter at index time via ignore patterns in `qmd.yml`, or post-filter the returned file paths by directory prefix.

- **No embedding custom models**: qmd uses its default GGUF embedding model. The `QMD_EMBED_MODEL` environment variable can be set later to switch models for multilingual niches, but this is not configured in v1. Do not set it without testing recall quality on the target niche first.
