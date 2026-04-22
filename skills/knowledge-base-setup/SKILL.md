---
name: knowledge-base-setup
description: >
  Set up the Postgres knowledge base layer for a new oopz-inc brand: public schema creation,
  niche schema template, adapter contract, and markdown projection convention. Use when
  initializing the KB for a new brand or adding the knowledge layer to an existing company
  package. Works standalone or as Phase 2 of the company-creator workflow.
---

## Purpose

This skill covers ONLY the KB layer. No agent work, no skills generation, no routines. It establishes:

- The Postgres database and schema structure
- The adapter contract (what scripts write, what agents read)
- The markdown projection convention
- The add-a-niche procedure for the KB tier

When used with [[company-creator]]: this is Phase 2. See `[[company-creator/references/phase-2-knowledge-base]]` for the step-by-step procedure.

## Scope Discipline

KB ONLY.

Out of scope: agent work, skill files, routines, qmd setup (that's Phase 4).

If you need the full scaffold, start with [[company-creator]] and return here for Phase 2.

## Prerequisites

- Postgres installed and reachable locally
- Bun installed (for running migration scripts and adapter stubs)
- `DATABASE_URL` environment variable set to the new brand's KB connection string

## Schema Architecture

The KB uses two levels: a `public` schema for cross-cutting tables, and one schema per niche for knowledge items.

### Public schema

```sql
-- public schema: cross-cutting tables
-- Apply with: psql $DATABASE_URL -f 001_init.sql

CREATE SCHEMA IF NOT EXISTS public;

CREATE TABLE IF NOT EXISTS public.schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.niches (
  slug TEXT PRIMARY KEY,
  schema_name TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  compliance_posture TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.source_types (
  name TEXT PRIMARY KEY,
  description TEXT,
  adapter_skill_slug TEXT
);

-- Seed Day-1 source types
INSERT INTO public.source_types (name, description, adapter_skill_slug)
VALUES
  ('x-posts', 'X/Twitter posts ingested from tweet-curator', 'x-posts-adapter'),
  ('web-article', 'Web articles and blog posts via RSS/scrape', 'web-article-adapter')
ON CONFLICT (name) DO NOTHING;
```

### Per-niche schema

Each niche gets its own schema, created from a template:

```sql
-- Per-niche: created by 002_niche_template.sql.tmpl
CREATE SCHEMA IF NOT EXISTS ${NICHE_SCHEMA};

CREATE TABLE IF NOT EXISTS ${NICHE_SCHEMA}.knowledge_items (
  id BIGSERIAL PRIMARY KEY,
  source_type TEXT NOT NULL REFERENCES public.source_types(name),
  source_identifier TEXT NOT NULL,
  niche_slug TEXT NOT NULL REFERENCES public.niches(slug),
  body_text TEXT,
  content_hash TEXT,
  engagement_signals JSONB NOT NULL DEFAULT '{}',
  captured_at TIMESTAMPTZ NOT NULL,
  UNIQUE(source_type, source_identifier)
);

INSERT INTO public.schema_migrations (version)
VALUES ('002_niche_${NICHE_SLUG}')
ON CONFLICT (version) DO NOTHING;
```

`${NICHE_SCHEMA}` is the schema name: niche slug with hyphens replaced by underscores. For example, `world-mobile` becomes `world_mobile`.

## Adapter Contract

Every fetch script must follow this contract exactly. No exceptions.

**Rules:**

1. Accept `--company-slug` and `--niche-slug` CLI args
2. Read from a source (external API, DB, filesystem)
3. Write to `<brand>-kb.<niche_schema>.knowledge_items` only
4. NEVER call LLMs
5. NEVER write to `.evidence/` directly (that's `kb-to-markdown.ts`)
6. Output: a count of rows inserted/updated

**Day-1 adapters:**

| Script | Source | Writes |
|--------|--------|--------|
| `fetch-x-posts.ts` | tweet-curator-pg (read-only) | `knowledge_items` rows with `source_type = 'x-posts'` |
| `fetch-web-article.ts` | Web scrape via RSS or direct URL | `knowledge_items` rows with `source_type = 'web-article'` |
| `fetch-clippings.ts` | `raw/clippings/` (Obsidian Web Clipper drops) | `knowledge_items` rows with `source_type = 'clippings'` |

The `engagement_signals` column is a JSONB map of platform-specific metrics. Keys are adapter-specific: `likes`, `retweets`, `replies`, `quotes` for X posts; `shares`, `comments` for web articles. Values are always numbers.

## Markdown Projection Convention

After fetch scripts populate the DB, `kb-to-markdown.ts` projects rows to files:

```
.evidence/knowledge/<niche-slug>/<source-type>/<YYYY-MM-DD>-<slug>.md
```

Example:

```
.evidence/knowledge/world-mobile/x-posts/2026-04-15-tweet-abc.md
.evidence/knowledge/world-mobile/web-article/2026-04-15-blog-slug.md
.evidence/knowledge/world-mobile/clippings/2026-04-15-clip-hash.md
```

The markdown files have Zod-validated frontmatter. See the `[[knowledge-base]]` skill in your company package for the full schema definition, required fields, and body content rules.

**The file layer is the boundary between scripts and agents.** Scripts write. Agents read. Scripts never call LLMs. Agents never touch the DB.

## Add-a-Niche Procedure (KB tier only)

This covers only the DB and markdown projection steps. For the full niche setup (niche-profile skill, qmd collection, agent awareness), see `[[company-creator/references/phase-5-first-niche]]`.

1. Apply the niche SQL template:

   ```bash
   NICHE_SLUG=<slug> NICHE_SCHEMA=<schema> \
     envsubst < assets/sql/002_niche_template.sql.tmpl | psql <brand>-kb
   ```

2. Register in `public.niches`:

   ```sql
   INSERT INTO public.niches (slug, schema_name, name, compliance_posture)
   VALUES ('<slug>', '<schema>', '<Name>', '<posture>');
   ```

3. Run adapter scripts for the new niche to populate initial data:

   ```bash
   bun assets/scripts/fetch-x-posts.ts --company-slug <brand> --niche-slug <slug>
   bun assets/scripts/fetch-web-article.ts --company-slug <brand> --niche-slug <slug>
   ```

4. Project to markdown:

   ```bash
   bun assets/scripts/kb-to-markdown.ts --company-slug <brand> --niche-slug <slug>
   ```

Check `.evidence/knowledge/<slug>/` for output files. Run `validate-kb.ts` to confirm frontmatter is valid.

## Add-an-Adapter Procedure

1. Copy an existing adapter script as a stub:

   ```bash
   cp assets/scripts/fetch-x-posts.ts assets/scripts/fetch-<source>.ts
   ```

2. Swap source-specific fields: input config, `source_type` slug, `engagement_signals` keys.

3. Register in `public.source_types`:

   ```sql
   INSERT INTO public.source_types (name, description, adapter_skill_slug)
   VALUES ('<source>', '<Description>', '<source>-adapter');
   ```

Then create a corresponding `skills/<source>-adapter/SKILL.md` for the agent contract. See `[[x-posts-adapter]]` in the Shoshin company for the pattern.

## Validation

```bash
# Validate markdown frontmatter for a niche
bun assets/scripts/validate-kb.ts --niche-slug <niche>

# Quick check: confirm schema_version field is present in every file
for f in .evidence/knowledge/<niche>/**/*.md; do \
  yq eval '.schema_version' "$f" > /dev/null || echo "INVALID: $f"; \
done
```

The `validate-kb.ts` script imports the Zod schema from `skills/knowledge-base/schema.ts` and reports any files that fail validation. Fix frontmatter issues before running `kb-to-markdown.ts` again.
