# Phase 3: Wire the Adapters

Adapters are TypeScript scripts that pull from external sources and write
normalized rows into the company knowledge base. They run outside Paperclip
(user shell, Trigger.dev, cron). Agents never call them directly.

Replace `<brand>` with your company slug.

---

## Adapter contract

Every adapter must:

1. Accept `--company-slug <brand>` and `--niche-slug <slug>` CLI flags.
2. Write rows only to `<brand>-kb` (the company DB). No other side effects.
3. Never call an LLM. Adapters are deterministic fetch-and-normalize scripts.
4. Never write to `.evidence/`. That's `kb-to-markdown.ts`'s job.
5. Deduplicate on `(source_type, source_identifier)` using `ON CONFLICT DO NOTHING`.

## 1. Create the scripts directory

```bash
mkdir -p companies/<brand>/assets/scripts
mkdir -p companies/<brand>/assets/sql
```

## 2. Copy adapter stubs

Copy the three canonical stubs from the Shoshin reference:

```bash
cp companies/shoshin/assets/scripts/fetch-x-posts.ts \
   companies/<brand>/assets/scripts/fetch-x-posts.ts

cp companies/shoshin/assets/scripts/fetch-web-article.ts \
   companies/<brand>/assets/scripts/fetch-web-article.ts

cp companies/shoshin/assets/scripts/fetch-clippings.ts \
   companies/<brand>/assets/scripts/fetch-clippings.ts

cp companies/shoshin/assets/scripts/kb-to-markdown.ts \
   companies/<brand>/assets/scripts/kb-to-markdown.ts
```

## 3. Update slugs in each stub

Open each file and replace the hardcoded company slug with `<brand>`. The
`--company-slug` flag is the runtime override; the hardcoded default is just
a fallback for local dev.

## 4. Register source types in the DB

If you didn't do this in Phase 2, insert the source types now:

```bash
psql "$DATABASE_URL" << 'SQL'
INSERT INTO public.source_types (name)
VALUES
  ('x-posts'),
  ('web-article'),
  ('clippings')
ON CONFLICT (name) DO NOTHING;
SQL
```

Only register adapters you actually plan to run. Don't pre-register roadmap
adapters; they'll appear as orphaned rows with no data.

## 5. Smoke-test each adapter (dry-run)

```bash
bun companies/<brand>/assets/scripts/fetch-x-posts.ts \
  --company-slug <brand> --niche-slug <slug> --dry-run

bun companies/<brand>/assets/scripts/fetch-web-article.ts \
  --company-slug <brand> --niche-slug <slug> --dry-run

bun companies/<brand>/assets/scripts/fetch-clippings.ts \
  --company-slug <brand> --niche-slug <slug> --dry-run
```

Each should print a row count and exit 0 without writing to the DB.

## 6. Verify the adapter contract

After a real run, confirm rows landed correctly:

```bash
psql "$DATABASE_URL" -c "
  SELECT source_type, COUNT(*) AS rows
  FROM <niche_schema>.knowledge_items
  GROUP BY source_type
  ORDER BY source_type;
"
```

Phase 3 complete. Adapters are wired. Move to Phase 4 to configure qmd search.
