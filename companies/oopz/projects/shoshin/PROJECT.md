---
name: Shoshin
slug: shoshin
description: |
  Multi-niche short-form social media content engine. One of Oopz's active projects.
  Operates on a list of niches, producing platform-native content for each on a weekly
  rhythm via the Discovery, Production, and Operations team pipeline. Day-1 niche: World Mobile.
owner: strategist
niches:
  - world-mobile
tags:
  - project
  - content-engine
  - multi-niche
  - short-form
---

## What Shoshin Is

The content-engine project inside Oopz. Takes topics, produces platform-native posts for each niche in its `niches:` list, across the 4 Day-1 platforms (X, TikTok, Instagram, Threads). Shoshin is one of Oopz's projects, the company (Oopz) may run other projects in the future.

## Relationship to Oopz

Shoshin is the first project Oopz runs. It consumes the company-level teams (Discovery, Production, Operations) and reports up to the Chief of Staff. Future Oopz projects may share these teams or operate independently, that is an organizational decision, not a Shoshin concern.

## Active Niches

Niches are declared via the `niches:` frontmatter list (not duplicated in body). Each niche slug in the list MUST correspond to: (1) a `skills/<slug>-niche-profile/SKILL.md` file, (2) a `<niche>` schema in `shoshin-kb`, and (3) a `.evidence/knowledge/<niche>/` directory. Day-1 niche: `world-mobile` (see `[[world-mobile-niche-profile]]`).

## Skill Bindings

Inherited by all tasks under this project: `[[world-mobile-niche-profile]]`, `[[compliance-rules]]`, `[[brand-voice-system]]`, `[[audience-profiles]]`, `[[hooks-library]]`, `[[repurpose-engine]]`, `[[content-calendar]]`, `[[content-types]]`, `[[x-playbook]]`, `[[tiktok-playbook]]`, `[[instagram-playbook]]`, `[[threads-playbook]]`, `[[knowledge-base]]`, `[[x-posts-adapter]]`, `[[web-article-adapter]]`, `[[intelligence-seed]]`, `[[clippings-adapter]]`, `[[knowledge-compiler]]`, `[[knowledge-query]]`, `[[knowledge-lint]]`, `[[ai-tells]]`.

## Data Scope

Shoshin's knowledge base lives in the `shoshin-kb` Postgres DB (schema per niche). Future non-Shoshin Oopz projects will have their own DBs (e.g. `oracle-kb`, `arrow-kb`). See `references/db-strategy.md` for the full data architecture.

## Deliverables Per Sprint

Weekly content sprint: drafts in `.evidence/drafts/<niche>/` to approved to scheduler queue to human publishes to Analyst reviews.

## Success Metrics

Per-niche per-platform engagement benchmarks (vs pre-sprint baseline), compliance violation count (target: 0), knowledge-base freshness (target: intelligence-seed refreshed every Friday).

## Add-a-Niche Walkthrough (Short Version)

Full walkthrough in README. Quick steps: (1) SQL migration to add `<niche>` schema in `shoshin-kb`, (2) create `skills/<niche>-niche-profile/SKILL.md` with `knowledge_sources:` block, (3) append slug to this PROJECT.md's `niches:` list, (4) run adapter scripts for the new niche, (5) run intelligence-seed task. Agents need no changes.
