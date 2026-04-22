---
name: knowledge-base
description: Foundational contract for all niche knowledge bases. Defines the normalized markdown format, Zod frontmatter schema, and file-path convention. Every source adapter must output files conforming to this schema; every agent that reads niche intelligence relies on it.
---

## Purpose

Defines the normalized markdown format for all niche knowledge bases. Every source adapter must output files conforming to this schema; every agent that reads niche intelligence relies on it. The canonical Zod schema is in `schema.ts` (sibling file) and is imported by all scripts in `assets/scripts/`.

## Directory Layout

```
.evidence/knowledge/<niche-slug>/<source-type>/<YYYY-MM-DD>-<slug>.md
```

One file per knowledge item. `<niche-slug>` is the niche identifier (e.g. `world-mobile`). `<source-type>` is the adapter type (e.g. `x-posts`, `web-article`). `<slug>` is a unique identifier for the item (e.g. tweet_id, canonical URL slug).

## Frontmatter Fields

Every knowledge item file starts with YAML frontmatter containing these fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `schema_version` | number | yes | Schema version (currently 1) |
| `niche_slug` | string | yes | Niche identifier (e.g. `world-mobile`) |
| `source_type` | enum | yes | Adapter type: `x-posts` or `web-article` |
| `source_url` | string | optional | URL to original source |
| `source_identifier` | string | yes | Unique ID within source (tweet_id, canonical URL) |
| `captured_at` | ISO-8601 string | yes | When this item was fetched |
| `published_at` | ISO-8601 string | optional | When the original content was published |
| `engagement_signals` | Record<string, number> | yes | Platform-specific engagement metrics |
| `extracted_hooks` | array | yes | Hook patterns extracted from content (populated by intelligence-seed) |
| `extracted_quotes` | string[] | yes | Notable quotes from content |
| `tags` | string[] | yes | Hashtags, keywords, topics |
| `provenance` | object | yes | Adapter metadata: `{ adapter, adapter_version, fetch_job_id? }` |
| `content_hash` | string | optional | SHA-256 of body content for deduplication |

### Field Details

**schema_version**: Always `1` for this version of the contract. Bump when breaking changes occur.

**niche_slug**: Matches the niche profile directory name. Lowercase, hyphenated (e.g. `world-mobile`, `defi-lending`).

**source_type**: One of the registered adapter types. Day 1 values: `x-posts`, `web-article`. Future: `youtube-transcripts`, `manual-notes`, `rss`, `reddit`.

**source_url**: Full URL to the original content. Optional because some sources (e.g. manual notes) may not have a URL.

**source_identifier**: Must be unique within (niche_slug, source_type). For X posts this is the tweet ID. For web articles this is the canonical URL.

**captured_at / published_at**: ISO-8601 datetime strings. `captured_at` is when the adapter fetched the item. `published_at` is when the original was published (if known).

**engagement_signals**: A flat key-value map of platform metrics. Keys are adapter-specific (e.g. `likes`, `retweets`, `replies` for X posts; `shares`, `comments` for web articles). Values are always numbers.

**extracted_hooks**: Array of hook pattern objects with `{ pattern, text, confidence }`. Populated by the intelligence-seed agent after initial ingestion. Empty array `[]` until processed.

**extracted_quotes**: Array of notable quote strings pulled from the content. Used for quote-style post generation.

**tags**: Hashtags, keywords, and topic labels. Lowercase, no `#` prefix.

**provenance**: Tracks which adapter produced the file and its version. `fetch_job_id` is optional, used when adapters run in batched jobs.

**content_hash**: SHA-256 hex digest of the body content (everything after frontmatter). Used for deduplication across fetches.

## Body Content Rules

- Body = extracted/summarized content. NEVER the raw copyrighted source (only the parts needed for hook-pattern learning, under fair-use summarization).
- First body line MUST be: `> Source: <URL>` for attribution.
- Maximum body length: 4000 characters.
- Preserve paragraph structure.
- Use plain markdown. No HTML, no embedded media.

## Adapter Contract

Every `*-adapter` skill MUST specify:

1. Input config schema (niche-profile `selector:` subkey)
2. Output frontmatter fields populated
3. Which `engagement_signals` keys it emits
4. The stub script path in `assets/scripts/`

All adapters reference `[[knowledge-base]]` as their output contract.

### Example adapter output

```yaml
---
schema_version: 1
niche_slug: world-mobile
source_type: x-posts
source_url: https://x.com/user/status/123456789
source_identifier: "123456789"
captured_at: "2025-04-17T12:00:00Z"
published_at: "2025-04-16T09:30:00Z"
engagement_signals:
  likes: 142
  retweets: 38
  replies: 12
  quotes: 5
extracted_hooks: []
extracted_quotes:
  - "Connectivity is a human right, not a luxury."
tags:
  - connectivity
  - telecom
  - decentralized
provenance:
  adapter: x-posts
  adapter_version: "0.1.0"
content_hash: "a1b2c3d4e5f6..."
---

> Source: https://x.com/user/status/123456789

Summary of the post content goes here. This is a fair-use summarization
of the original content, capturing the key message and hooks.
```

## Validation

```bash
# Validate all files for a niche
bun assets/scripts/validate-kb.ts --niche-slug world-mobile

# Quick one-liner check
for f in .evidence/knowledge/world-mobile/**/*.md; do yq eval '.schema_version' "$f" > /dev/null || echo "INVALID: $f"; done
```

## Source Types (Day 1)

- `x-posts`: X/Twitter posts from tweet-curator-pg. See `[[x-posts-adapter]]`.
- `web-article`: Web articles via RSS/scrape. See `[[web-article-adapter]]`.

Future: `youtube-transcripts`, `manual-notes`, `rss`, `reddit`.
