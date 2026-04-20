---
name: clippings-adapter
description: Intake contract for Obsidian Web Clipper markdown drops. Reads raw/clippings/*.md, routes by niche tag, inserts into knowledge_items, moves processed files to audit trail.
---

## Purpose

Intake pipeline for Obsidian Web Clipper markdown drops. Reads files from `raw/clippings/`, routes each clipping to the correct niche schema based on a `niche` frontmatter tag, and inserts a row into `<niche>.knowledge_items`. Conforms to the `[[knowledge-base]]` output contract.

This adapter is human-curated by design. A human clips a page in Obsidian, the file lands in `raw/clippings/`, and the adapter normalizes it into the knowledge base on the next ingest run.

## Input Config

Intake directory: `companies/oopz/raw/clippings/*.md`

Obsidian Web Clipper writes YAML frontmatter to each clipped file. Expected fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | yes | Canonical URL of the clipped page |
| `title` | string | no | Page title. Falls back to filename if absent. |
| `description` | string | no | Meta description or excerpt |
| `niche` | string | yes | Niche slug for routing (e.g. `world-mobile`). Must match a registered niche. |
| `created_at` | ISO-8601 string | no | When the clip was saved. Used as `published_at` if present. |
| `tags` | string[] | no | Additional topic labels. The `niche` value is stripped from this list before storage. |

Example Obsidian Web Clipper frontmatter:

```yaml
---
url: "https://worldmobile.io/blog/connecting-the-unconnected"
title: "Connecting the Unconnected"
description: "How World Mobile is bridging the digital divide in Africa."
niche: world-mobile
created_at: "2026-04-20T09:15:00Z"
tags:
  - world-mobile
  - connectivity
  - africa
  - earthnode
---
```

## Niche Routing

Each clipping MUST contain a `niche: <slug>` field in its frontmatter. The slug must match a niche registered in the project's niches list (e.g. `world-mobile`).

Routing rules:

- If `niche` is missing: skip the file, log a warning, leave in place for manual correction.
- If `niche` is present but not a valid registered slug: skip the file, log a warning, leave in place.
- Multiple niche tags per clipping are not supported. Route to the first valid niche slug found, or skip if none is valid.
- Valid clippings are routed to `<niche_schema>.knowledge_items` in the project's KB database.

## Output Frontmatter

Fields produced in the `knowledge_items` row and projected into the markdown file:

| Knowledge-base field | Clippings value |
|----------------------|-----------------|
| `schema_version` | `1` |
| `niche_slug` | From `niche` frontmatter field |
| `source_type` | `clippings` |
| `source_url` | `url` frontmatter field |
| `source_identifier` | SHA-256 of file body content, first 16 hex chars |
| `captured_at` | `now()` at ingest time (ISO-8601 UTC) |
| `published_at` | `created_at` frontmatter if present, otherwise omitted |
| `engagement_signals` | `{}` (see Engagement Signals section) |
| `tags` | `tags` frontmatter minus the niche tag |
| `provenance` | `{ adapter: clippings, adapter_version: "0.1.0" }` |
| `extracted_hooks` | `[]` (populated later by intelligence-seed) |
| `extracted_quotes` | `[]` (populated later by intelligence-seed) |
| `content_hash` | SHA-256 of file body content |

The file body (everything after frontmatter) is stored as-is, prefixed with `> Source: <url>`.

## Engagement Signals

```yaml
engagement_signals: {}
```

Clippings emit an empty object. Rationale: clippings are human-curated bookmarks, not platform content. There are no view counts, likes, or reposts to capture. The value of a clipping is the human judgment that selected it, not any platform metric. Do not invent metrics.

This matches the `web-article` adapter's approach. Both differ from `x-posts`, which captures real platform engagement data from tweet-curator-pg.

## Processing Behavior

On successful INSERT into `<niche_schema>.knowledge_items`:

1. Move the file from `raw/clippings/<file>.md` to `raw/clippings/processed/<YYYY-MM-DD>-<orig-filename>.md`.
2. The `processed/` directory is the audit trail. Files there are tracked by git (via `.gitkeep`).

On INSERT failure (DB error, Zod validation failure, duplicate key):

- Leave the file in `raw/clippings/` for retry at the next run.
- Log the error with the filename and reason.
- Do not move the file.

On routing skip (missing or invalid niche):

- Leave the file in `raw/clippings/`.
- Log a warning with the filename and the missing/invalid niche value.
- Do not move the file.

## Script Path

`assets/scripts/fetch-clippings.ts`

Invocation:

```bash
bun assets/scripts/fetch-clippings.ts --project-slug <slug>
```

The script reads all `*.md` files in `raw/clippings/`, parses frontmatter, routes by niche, validates against the Zod schema, INSERTs into the correct niche schema, then moves processed files to `raw/clippings/processed/`. Implementation details are in T10.

## Contract

Output conforms to the `[[knowledge-base]]` schema. All rows must pass Zod validation before INSERT. The canonical Zod schema is in `skills/knowledge-base/schema.ts` and is imported by `fetch-clippings.ts`.

Deduplication is by `source_identifier` (content hash prefix). The UNIQUE constraint on `(source_type, source_identifier)` in `<niche_schema>.knowledge_items` prevents double-ingestion if the same file is processed twice.

## Example

Minimal Obsidian Web Clipper frontmatter this adapter can process:

```yaml
---
url: "https://worldmobile.io/blog/earthnode-economics"
niche: world-mobile
---
```

With this input, the adapter produces:

- `source_type: clippings`
- `source_url: https://worldmobile.io/blog/earthnode-economics`
- `source_identifier: <sha256-first-16-chars>`
- `engagement_signals: {}`
- `tags: []`
- `published_at`: omitted (no `created_at` in frontmatter)

## Out of Scope

- Manual engagement metrics. Clippings have none. Do not add placeholder values.
- Multiple niche tags per clipping. Route to the first valid niche or skip.
- Platform-specific metadata (share counts, comment counts, author follower counts).
- Implementation details of `fetch-clippings.ts` (covered in T10).
- Content transformation or summarization (body is stored verbatim from the clipped file).
