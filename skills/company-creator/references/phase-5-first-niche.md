# Phase 5: Add the First Niche

A niche is the knowledge boundary for one topic domain. Each niche gets its own
Postgres schema, one knowledge directory, one wiki, and one qmd collection.
Adding a niche is additive: agents and teams never change.

Replace `<brand>` with your company slug, `<slug>` with the niche slug
(lowercase, hyphenated, e.g. `world-mobile`), and `<schema>` with the
Postgres schema name (underscored, e.g. `world_mobile`).

---

## 1. Create the niche schema in Postgres

```bash
niche_slug=<slug> niche_schema=<schema> project_slug=<brand> \
  niche_name="<Name>" compliance_posture="<posture>" \
  envsubst < assets/sql/002_niche_template.sql.tmpl | psql <brand>-kb
```

This creates:
- Schema `<schema>` with a `knowledge_items` table
- Unique constraint on `(source_type, source_identifier)` for dedup
- A read-write role `<brand>_<schema>_rw` (scripts use this; agents don't)

Verify:

```bash
psql <brand>-kb -c "\dt <schema>.*"
```

Expected:

```
           List of relations
  Schema   |      Name       | Type  |  Owner
-----------+-----------------+-------+---------
 <schema>  | knowledge_items | table | <owner>
```

## 2. Register the niche in the DB

```bash
psql "$DATABASE_URL" << SQL
INSERT INTO public.niches (slug, schema_name)
VALUES ('<slug>', '<schema>')
ON CONFLICT (slug) DO NOTHING;
SQL
```

## 3. Create the niche profile skill

```bash
mkdir -p companies/<brand>/skills/<slug>-niche-profile
```

Create `companies/<brand>/skills/<slug>-niche-profile/SKILL.md` with:

```markdown
---
static: true
editable_by: human
---

# <Slug> Niche Profile

## Identity
<!-- Who is this niche about? What's the topic domain? -->

## Audience
<!-- Who reads this content? What do they care about? -->

## Voice overrides
<!-- Any brand-voice-system axes that shift for this niche? -->

## Compliance notes
<!-- Any regulated topics, disclosure requirements, or banned claims? -->

## Knowledge sources
<!-- Which adapters feed this niche? Which accounts, feeds, or URLs? -->
```

Fill in every section before running adapters. The Researcher and Writer agents
load this skill before producing content for the niche.

## 4. Append the niche to COMPANY.md

Open `companies/<brand>/COMPANY.md` and add the slug to the `niches` list:

```yaml
niches:
  - <slug>
```

## 5. Add the qmd collection

Open `companies/<brand>/.qmd/qmd.yml` and add a collection block:

```yaml
collections:
  <slug>:
    path: companies/<brand>/.evidence/wiki/<slug>
    pattern: "**/*.md"
    ignore:
      - "_lint/**"
    context: "<One-sentence description of the niche for search context.>"
```

Or run the sync script to generate it automatically:

```bash
bun assets/scripts/sync-qmd-collections.ts --company-slug <brand>
```

## 6. Create the knowledge directory

```bash
mkdir -p companies/<brand>/.evidence/knowledge/<slug>/x-posts
mkdir -p companies/<brand>/.evidence/knowledge/<slug>/web-article
mkdir -p companies/<brand>/.evidence/knowledge/<slug>/clippings
```

This directory is gitignored (see Phase 1). It's the landing zone for
`kb-to-markdown.ts` output.

## 7. Run the adapters for the first time

```bash
bun companies/<brand>/assets/scripts/fetch-x-posts.ts \
  --company-slug <brand> --niche-slug <slug>

bun companies/<brand>/assets/scripts/fetch-web-article.ts \
  --company-slug <brand> --niche-slug <slug>

bun companies/<brand>/assets/scripts/kb-to-markdown.ts \
  --company-slug <brand> --niche-slug <slug>
```

Confirm files appeared:

```bash
ls companies/<brand>/.evidence/knowledge/<slug>/x-posts/ | head -5
```

Phase 5 complete. First niche is live. Move to Phase 6 to wire intelligence-seed.
