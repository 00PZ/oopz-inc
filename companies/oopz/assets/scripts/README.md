# Oopz KB Scripts

Adapter scripts that fetch content from external sources, store it in the project knowledge base DB, project rows to markdown, and validate the output.

## Required Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Project KB DB connection string (e.g. shoshin-kb). Write role for fetch scripts, read for projection. |
| `CURATOR_DATABASE_URL` | tweet-curator-pg connection string. READ-ONLY. Only needed by `fetch-x-posts.ts`. |

## Install

```bash
cd assets/scripts && bun install
```

## Operational Flow

1. Run `001_init.sql` to create the KB schema (see `assets/sql/`)
2. Run `002_niche_template.sql.tmpl` to bootstrap a niche
3. `bun install` in this directory
4. `bun run fetch-x-posts.ts --project-slug shoshin --niche-slug world-mobile`
5. `bun run fetch-web-article.ts --project-slug shoshin --niche-slug world-mobile`
6. `bun run kb-to-markdown.ts --project-slug shoshin --niche-slug world-mobile --source-type x-posts` (invoked automatically by fetch scripts, or run manually)
7. `bun run validate-kb.ts --niche-slug world-mobile` as a sanity check

## Scripts

| Script | Args | Purpose |
|---|---|---|
| `fetch-x-posts.ts` | `--project-slug` `--niche-slug` | Fetch curated X/Twitter posts from tweet-curator-pg into project KB |
| `fetch-web-article.ts` | `--project-slug` `--niche-slug` | Fetch web articles via RSS/scrape into project KB |
| `kb-to-markdown.ts` | `--project-slug` `--niche-slug` `--source-type` | Project KB rows to markdown files in `.evidence/knowledge/` |
| `validate-kb.ts` | `--niche-slug` | Validate markdown frontmatter against KnowledgeItemFrontmatter schema |

## Note

These are stubs. Implement the bodies before running. See the corresponding adapter SKILL.md files for the full contract:

- `skills/x-posts-adapter/SKILL.md`
- `skills/web-article-adapter/SKILL.md`
- `skills/knowledge-base/SKILL.md`
