---
name: web-article-adapter
description: Adapter for ingesting blog posts, news articles, and long-form web content into a niche's knowledge base. Used when a niche profile declares knowledge_sources.web-article.enabled true.
---

## Purpose

Adapter for ingesting blog posts, news articles, and long-form web content into a niche's knowledge base. Used when a niche profile declares `knowledge_sources.web-article.enabled: true`. Conforms to the `[[knowledge-base]]` output contract.

## Input Schema

The niche profile's `knowledge_sources.web-article.selector` block contains:

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| `url_patterns` | string[] | yes | Glob patterns for URLs to match (e.g. `worldmobile.io/blog/*`, `example.com/news/**`) |
| `rss_feeds` | string[] | yes | RSS or Atom feed URLs to poll for new articles |
| `keyword_any` | string[] | no | Full-text filter: include articles containing any of these keywords |
| `refresh_cadence` | string | yes | Polling frequency: `weekly` or `daily` |
| `max_age_days` | integer | no | Maximum article age in days. Articles older than this are skipped. Defaults to 90 if omitted. |

Example niche-profile snippet:

```yaml
knowledge_sources:
  web-article:
    enabled: true
    selector:
      url_patterns:
        - "worldmobile.io/blog/*"
        - "worldmobile.io/press/*"
      rss_feeds:
        - "https://worldmobile.io/blog/rss.xml"
      keyword_any:
        - "connectivity"
        - "EarthNode"
        - "sharing economy"
      refresh_cadence: weekly
      max_age_days: 60
```

## Source

Live web via RSS feeds and/or sitemap crawl. Respect `robots.txt`. Use a permissive `User-Agent` that identifies the tool (e.g. `ShoshinKnowledgeBase/0.1.0 (+https://github.com/oopz-inc)`). Rate-limit requests to <= 1 per second per domain.

## Output

One markdown file per article under `.evidence/knowledge/<niche-slug>/web-article/YYYY-MM-DD-<slug>.md`, conforming to `[[knowledge-base]]` frontmatter contract.

The `<slug>` is derived from the article's canonical URL path, lowercased and hyphenated (e.g. `connecting-the-unconnected`). If a canonical URL is unavailable, fall back to a truncated title slug.

## Frontmatter Mapping

Maps web article metadata to `[[knowledge-base]]` frontmatter fields:

| Knowledge-base field | Web-article value |
|----------------------|-------------------|
| `schema_version` | `1` |
| `niche_slug` | From niche profile |
| `source_type` | `web-article` |
| `source_identifier` | `<canonical_url>` |
| `source_url` | `<canonical_url>` |
| `published_at` | `<article_published_at>` (from RSS `<pubDate>` or `<meta>` tag) |
| `captured_at` | `<fetch_time>` (ISO-8601 UTC) |
| `tags` | `<article_tags>` from RSS categories or extracted keywords |
| `engagement_signals` | `{}` (empty, web does not expose reliable public numbers) |
| `provenance` | `{ adapter: web-article, adapter_version: "0.1.0" }` |
| `extracted_hooks` | `[]` (populated later by intelligence-seed) |
| `extracted_quotes` | `[]` (populated later by intelligence-seed) |
| `content_hash` | SHA-256 of body content for deduplication |

## Body Content

Extracted main content via a readability-style extractor (e.g. Mozilla Readability, @extractus/article-extractor). First line: `> Source: <url>`. Truncate to <= 4000 chars; preserve paragraph structure. Use plain markdown, no HTML or embedded media.

## Script Contract

Stub at `assets/scripts/fetch-web-article.ts`. Invocation:

```bash
bun assets/scripts/fetch-web-article.ts --project-slug <slug> --niche-slug <slug>
```

Behavior:

1. Read the niche profile's `web-article.selector` config.
2. Poll each entry in `rss_feeds` for article URLs.
3. Match discovered URLs against `url_patterns`. Filter by `keyword_any` if present.
4. Skip articles older than `max_age_days`.
5. For each matching URL, fetch the page content. Parse with a readability extractor.
6. Deduplicate by canonical URL (skip if `source_identifier` already exists in DB).
7. INSERT into `<niche_schema>.knowledge_items` table.
8. Project markdown files via `kb-to-markdown.ts`.

The script never holds DB credentials directly. Connection details come from the runtime environment.

## Safety Rules

- Honor `robots.txt` (Disallow directives). Skip any URL disallowed by the site's robots.txt.
- Rate-limit to <= 1 request per second per domain.
- Fail-open on parse errors: log the error, skip the article, continue with the next.
- Never fetch content behind auth-walls or paywalls.
- Truncate body to <= 4000 chars (fair-use summarization, not full reproduction).
- Set a proper `User-Agent` header identifying the tool and providing contact info.

## Engagement Signals

This adapter emits an empty `engagement_signals: {}` object. Web articles lack standardized public engagement metrics. If a future version adds comment-count or share-count extraction, keys would follow the pattern: `comments`, `shares`.

## Deduplication

Articles are deduplicated by their canonical URL (`source_identifier`). If two RSS feeds surface the same article, only the first fetch is stored. The `content_hash` field provides a secondary dedup check for URL variations pointing to identical content.
