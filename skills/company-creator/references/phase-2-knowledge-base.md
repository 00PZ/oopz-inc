# Phase 2: Bootstrap the Knowledge Base

Set up the Postgres database that backs the company's knowledge layer.
Replace `<brand>` with your company slug. Replace `<brand>-kb` with the DB name
(convention: `<brand>-kb`, e.g. `acme-kb`).

Agents never touch this database. Scripts in `assets/scripts/` hold all DB
credentials and run outside Paperclip (user shell, Trigger.dev, cron).

See `[[knowledge-base-setup]]` for the full schema rationale.

---

## 1. Create the database

```bash
createdb <brand>-kb
```

If you need a specific owner or encoding:

```bash
createdb --owner=<db-user> --encoding=UTF8 <brand>-kb
```

## 2. Run the init migration

Copy the template into the company, then apply:

```bash
cp skills/company-creator/templates/001_init.sql.tmpl companies/<brand>/assets/sql/001_init.sql
psql <brand>-kb -f companies/<brand>/assets/sql/001_init.sql
```

This creates the `public` schema with three tables:

- `niches` - one row per niche slug (e.g. `world-mobile`)
- `source_types` - one row per adapter type (e.g. `x-posts`, `web-article`)
- `schema_migrations` - tracks which SQL files have run

Verify:

```bash
psql <brand>-kb -c "\dt public.*"
```

Expected output:

```
         List of relations
 Schema |       Name        | Type  |  Owner
--------+-------------------+-------+---------
 public | niches            | table | <owner>
 public | schema_migrations | table | <owner>
 public | source_types      | table | <owner>
```

## 3. Set environment variables

Scripts read `DATABASE_URL` at runtime. Set it in your shell profile or `.env`:

```bash
export DATABASE_URL=postgres://<db-user>:<password>@localhost:5432/<brand>-kb
```

If you're pulling from an upstream source DB (e.g. a tweet curator), also set:

```bash
export CURATOR_DATABASE_URL=postgres://<db-user>:<password>@<host>:5432/<curator-db>
```

The curator DB is read-only from this company's perspective. Never write to it.

## 4. Verify connectivity

```bash
psql "$DATABASE_URL" -c "SELECT version();"
```

## 5. Register source types

Insert the adapter types you plan to use. At minimum:

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

Add or remove rows to match the adapters you wire in Phase 3.

## 6. Confirm rows

```bash
psql "$DATABASE_URL" -c "SELECT name, description FROM public.source_types ORDER BY name;"
```

Phase 2 complete. The database is ready. Move to Phase 3 to wire the adapters.
