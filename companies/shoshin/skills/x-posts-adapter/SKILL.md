---
name: x-posts-adapter
description: Adapter for ingesting curated X/Twitter posts from the tweet-curator Postgres database into a niche's knowledge base. Used when a niche profile declares knowledge_sources.x-posts.enabled true.
---

## Purpose

Adapter for ingesting curated X/Twitter posts from the tweet-curator Postgres database (homelab) into a niche's knowledge base. Used when a niche profile declares `knowledge_sources.x-posts.enabled: true`.

## Input Schema

The niche-profile YAML declares `knowledge_sources.x-posts.selector` with these subkeys:

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| `author_username_in` | `string[]` | yes | Filter by author username. Only tweets from these usernames are selected. |
| `author_id_in` | `string[]` | no | Filter by author ID. Optional alternative to username filtering. |
| `tweet_text_regex` | `string` | no | Regex filter on tweet text. Applied as a PostgreSQL `~` match. |
| `hashtags_any` | `string[]` | no | Match any of these hashtags. Uses `&&` (overlap) against `hashtags TEXT[]` column. |
| `min_engagement` | `object` | no | Minimum engagement thresholds (see sub-fields below). |
| `min_engagement.like_count` | `number` | no | Minimum like count. |
| `min_engagement.view_count` | `number` | no | Minimum view count. |
| `min_engagement.reply_count` | `number` | no | Minimum reply count. |
| `min_engagement.retweet_count` | `number` | no | Minimum retweet count. |
| `min_engagement.bookmark_count` | `number` | no | Minimum bookmark count. |
| `exclude_replies_to_nonfollowed` | `boolean` | no | When true, exclude replies to accounts the curator does not follow. |
| `lookback_days` | `integer` | yes | How many days back to look from the current date. Applied against `post_created_at`. |

Example selector in a niche profile:

```yaml
knowledge_sources:
  x-posts:
    enabled: true
    selector:
      author_username_in: ["naval", "paulg", "sama"]
      hashtags_any: ["startups", "ai"]
      min_engagement:
        like_count: 50
        view_count: 5000
      lookback_days: 30
```

## Source

`tweet-curator-pg.x_bookmarks` table (see `/home/vdm/git/trigger/src/lib/x-schema.sql` for the 36-column spec). Access via `CURATOR_DATABASE_URL` env var (READ-ONLY recommended). The x_bookmarks table has columns including: `tweet_id`, `tweet_text`, `author_username`, `author_id`, `lang`, `like_count`, `view_count`, `reply_count`, `retweet_count`, `quote_count`, `bookmark_count`, `hashtags TEXT[]`, `user_mentions TEXT[]`, `expanded_urls TEXT[]`, `post_created_at`, `quoted_tweet_id`, `still_bookmarked`, `scraped_at`, `last_seen_at`.

## Output

One markdown file per selected row under `.evidence/knowledge/<niche-slug>/x-posts/YYYY-MM-DD-<tweet_id>.md`, conforming to `[[knowledge-base]]` frontmatter contract.

## Frontmatter Mapping

Mapping from `x_bookmarks` columns to `[[knowledge-base]]` frontmatter fields:

```yaml
source_type: x-posts
source_identifier: <tweet_id>
source_url: https://x.com/<author_username>/status/<tweet_id>
published_at: <post_created_at>
captured_at: <scraped_at>
engagement_signals:
  like_count: <like_count>
  view_count: <view_count>
  reply_count: <reply_count>
  retweet_count: <retweet_count>
  quote_count: <quote_count>
  bookmark_count: <bookmark_count>
tags: <hashtags + user_mentions>
provenance:
  adapter: x-posts
  adapter_version: 0.1.0
  fetch_job_id: <uuid>
extracted_hooks: []    # populated by intelligence-seed skill
extracted_quotes: []   # populated by intelligence-seed skill
```

## Body Content

`tweet_text` (verbatim for learning purposes), followed by `> Source: <url>`, followed by reference to quoted tweet if `quoted_tweet_id` is non-null.

Example body:

```markdown
The best founders I know read more books than tweets.

> Source: https://x.com/naval/status/1234567890

> Quotes: https://x.com/paulg/status/9876543210
```

## Script Contract

Stub at `assets/scripts/fetch-x-posts.ts`. Reads `DATABASE_URL` (shoshin-kb, write role for active niche) and `CURATOR_DATABASE_URL` (tweet-curator-pg, read-only). Args: `--project-slug <slug>` and `--niche-slug <slug>`. Reads the niche-profile's selector, applies as SQL WHERE, INSERTs into `<niche_schema>.knowledge_items` inside the project's KB DB, then invokes `kb-to-markdown.ts --project-slug <slug> --niche-slug <slug> --source-type x-posts`.

## Safety Rules

- READ-ONLY on tweet-curator. NEVER modify `x_bookmarks`.
- Dedupe by `source_identifier` (tweet_id) UNIQUE constraint.
- Respect `lookback_days`. Never fetch beyond the configured window.
- No raw media blobs in body (reference `x_media.lo_oid` numbers only if needed).
- Agents never hold DB credentials. Only scripts in `assets/scripts/` touch the database.

## Teaching Note

This adapter shows the pattern. To add another source type (youtube, rss, reddit), copy this skill and its script stub and swap the source-specific fields. The `[[knowledge-base]]` frontmatter contract stays the same across all adapters; only `source_type`, `source_identifier`, and `engagement_signals` fields change per adapter.
