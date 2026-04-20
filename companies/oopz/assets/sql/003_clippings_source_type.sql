-- Oopz Knowledge Base - Migration 003: Clippings Source Type
-- Apply with: psql $DATABASE_URL -f 003_clippings_source_type.sql
-- Idempotent: safe to re-run (ON CONFLICT DO NOTHING).
-- Registers the 'clippings' source type for Obsidian Web Clipper intake.
-- The fetch-clippings.ts script inserts rows using this source_type.
-- See: companies/oopz/skills/clippings-adapter/SKILL.md for the full contract.

INSERT INTO public.source_types (name, description, adapter_skill_slug)
VALUES (
  'clippings',
  'Obsidian Web Clipper clippings from raw/clippings/',
  'clippings-adapter'
)
ON CONFLICT (name) DO NOTHING;

-- Record this migration
INSERT INTO public.schema_migrations (version)
VALUES ('003_clippings_source_type')
ON CONFLICT (version) DO NOTHING;
