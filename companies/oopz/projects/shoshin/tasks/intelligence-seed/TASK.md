---
name: Shoshin Intelligence Seed
slug: intelligence-seed
assignee: analyst
project: shoshin
---

Every Friday 17:30 Europe/Amsterdam (after the company-wide weekly-analyst-review at 16:00). This task is SCOPED TO THE SHOSHIN PROJECT and **iterates over every niche** in `projects/shoshin/PROJECT.md`'s `niches:` list (Day 1: `[world-mobile]`). For each niche: Analyst runs the `[[intelligence-seed]]` skill over `.evidence/knowledge/<niche-slug>/`, produces proposed-* diff files, hands to Chief of Staff for human review.

**On niche creation (one-shot)**: The FIRST time a niche is added to Shoshin's `niches:` list, the human must: (1) apply the SQL template for the new `<niche>` schema in `shoshin-kb`, (2) run the adapter scripts (`fetch-x-posts.ts --project-slug shoshin --niche-slug <new-niche>`, `fetch-web-article.ts --project-slug shoshin --niche-slug <new-niche>`), (3) run THIS task out-of-schedule for the new niche only. The README's 'add a new niche to Shoshin' section captures the full procedure.

**Output (per niche)**: `.evidence/analysis/<niche-slug>/YYYY-MM-DD/proposed-{hooks,voice,audience,baselines}.md` — **NEVER mixed across niches** (cross-niche-bleed guardrail).

**Done condition**: for every niche in `project.niches`, all 4 proposed-diff files exist; Analyst has posted a consolidated summary to CoS.
