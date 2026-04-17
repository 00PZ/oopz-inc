# Database Strategy -- Oopz Knowledge Base

## Model Summary

**Per-project databases** -- each Oopz project has its own Postgres DB. Today: `shoshin-kb` (for the Shoshin project). Future Oopz projects would get `<project-slug>-kb` (e.g. `oracle-kb`). Inside each project DB: one schema per niche plus `public` for cross-cutting tables. Separate from `tweet-curator-pg` (a SOURCE, not an Oopz asset).

## Why Per-Project DBs

The per-project model gives blast-radius isolation, independent scaling, clean handoff if a project is spun out. If multiple projects need to share a niche's knowledge: replicate the `<niche>` schema across their DBs (use logical replication or a scheduled dump), or use `postgres_fdw` to reference cross-project. Default: no sharing.

## Naming Conventions

- Niche slug `world-mobile` maps to schema `world_mobile` (hyphens become underscores; Postgres identifier-safe)
- Role naming: `<project_slug>_<niche_schema>_rw` (e.g. `shoshin_world_mobile_rw`) -- project-prefixed to avoid collisions if projects share a cluster
- DB naming: `<project-slug>-kb` (e.g. `shoshin-kb`, `oracle-kb`)

## Cross-Cutting Tables (public schema)

### public.niches
| Column | Type | Description |
|--------|------|-------------|
| slug | TEXT PK | Niche identifier (e.g. `world-mobile`) |
| schema_name | TEXT NOT NULL UNIQUE | Postgres schema name (e.g. `world_mobile`) |
| name | TEXT NOT NULL | Human-readable name |
| status | TEXT NOT NULL DEFAULT 'active' | active/inactive |
| compliance_posture | TEXT NOT NULL | e.g. `third-party-creator` |
| created_at | TIMESTAMPTZ | Creation timestamp |

### public.source_types
| Column | Type | Description |
|--------|------|-------------|
| name | TEXT PK | Source type slug (e.g. `x-posts`) |
| description | TEXT | Human-readable description |
| adapter_skill_slug | TEXT | Corresponding adapter skill slug |

### public.schema_migrations
| Column | Type | Description |
|--------|------|-------------|
| version | TEXT PK | Migration version string |
| applied_at | TIMESTAMPTZ | When migration was applied |

## Per-Niche Template (<niche_schema> schema)

### <niche_schema>.knowledge_items
| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL PK | Auto-increment primary key |
| source_type | TEXT NOT NULL | Adapter type (x-posts, web-article) |
| source_identifier | TEXT NOT NULL | Unique ID within source (tweet_id, canonical URL) |
| source_url | TEXT | URL to original source |
| niche_slug | TEXT NOT NULL | Niche identifier |
| captured_at | TIMESTAMPTZ NOT NULL | When fetched |
| published_at | TIMESTAMPTZ | When original content was published |
| engagement_signals | JSONB NOT NULL DEFAULT '{}' | Platform-specific metrics |
| extracted_hooks | JSONB NOT NULL DEFAULT '[]' | Hook patterns (populated by intelligence-seed) |
| extracted_quotes | JSONB NOT NULL DEFAULT '[]' | Notable quotes |
| tags | TEXT[] NOT NULL DEFAULT '{}' | Hashtags, keywords, topics |
| provenance | JSONB NOT NULL | Adapter metadata |
| content_hash | TEXT | SHA-256 of body content |
| body_text | TEXT | Extracted/summarized content |
| md_projected_at | TIMESTAMPTZ | When kb-to-markdown last projected this row |
| created_at | TIMESTAMPTZ NOT NULL DEFAULT NOW() | Row creation timestamp |

**Indexes:**
- `(source_type, captured_at DESC)` for time-ordered queries per source
- GIN on `tags` for tag-based filtering
- UNIQUE `(source_type, source_identifier)` for deduplication

## Role Matrix

| Role | Permissions | Used By |
|------|-------------|---------|
| `<project>_<niche>_rw` | SELECT, INSERT, UPDATE on `<niche>.*` | Fetch scripts (write path) |
| `<project>_<niche>_ro` | SELECT on `<niche>.*` | Read scripts, kb-to-markdown |
| `<project>_<niche>_admin` | ALL on `<niche>.*` | Migration scripts only |
| (none) | No DB role | **Agents** -- agents are credential-free |

**Agents have no DB role at all.** They read `.evidence/knowledge/<niche-slug>/` markdown files. Scripts are the only code that touches the DB.

## Migration Protocol

Use numbered files in `assets/sql/` (001_init.sql, 002_niche_template.sql.tmpl, 003_..., etc.). Apply via `psql -f`. Record applied migrations in `public.schema_migrations` (shipped in 001_init).

Apply order:
1. `001_init.sql` -- creates public schema, cross-cutting tables, seeds source_types
2. `002_niche_template.sql.tmpl` -- apply once per niche (substitute template vars with envsubst)

## Isolation Guarantees

Schema-level GRANT ensures a credential scoped to `world_mobile` cannot SELECT from `fitness`. Blast radius = one niche per compromised credential.

## Backup / DR Notes

- `pg_dump -n <schema>` per niche for niche-level backups
- Full cluster dump for disaster recovery
- `pg_dump -t public.*` for cross-cutting tables

## Relationship to tweet-curator-pg

External read-only source. Optional connection via `postgres_fdw` for live joins, or (preferred) via scripts that copy normalized rows into `<niche>.knowledge_items`. Never treat tweet-curator as part of shoshin-kb.

The `CURATOR_DATABASE_URL` env var points to tweet-curator-pg. The `DATABASE_URL` env var points to the project's KB DB (e.g. shoshin-kb). These are always separate connections.
