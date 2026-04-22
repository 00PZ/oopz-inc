---
name: Shoshin
description: "Multi-niche short-form social media content engine. Produces platform-native content for X, TikTok, Instagram, and Threads across multiple niches on a weekly rhythm."
slug: shoshin
schema: agentcompanies/v1
version: 0.1.0
license: MIT
authors:
  - name: Shoshin Founder
niches:
  - world-mobile
goals:
  - Ship platform-native short-form content for every active niche, every week, across X, TikTok, Instagram, and Threads
  - Maintain strict compliance for third-party content about regulated topics (crypto, finance, DePIN)
  - Compound knowledge per-niche: every performance signal refines hooks-library and the niche-profile skills
  - Scale horizontally by adding niches to COMPANY.md without changing agents or teams
  - Compile per-niche wikis (Librarian) that cross-reference knowledge items with counter-arguments, data gaps, and confidence tags
tags:
  - multi-niche
  - social-media
  - content-ops
  - short-form
  - knowledge-layer
  - compliance-regulated
---

## What Shoshin Is

Shoshin means "beginner's mind" (初心). It is a multi-niche short-form social media content engine. One idea becomes platform-native posts for X, TikTok, Instagram, and Threads, for every niche in the `niches:` list, every week. Day-1 niche: World Mobile (DePIN telecom, third-party creator posture).

9 agents. 3 teams. No sub-projects.

## Hierarchy

Shoshin is the company. Teams and agents live at company level. Niches are declared in this file's `niches:` frontmatter list. Adding a niche is additive: no agent changes, no team changes.

- **Discovery team**: strategist, scout, researcher, librarian
- **Production team**: editor, writer
- **Operations team**: scheduler, analyst

## Active Niches

Each slug in `niches:` MUST correspond to: (1) a `skills/<slug>-niche-profile/SKILL.md`, (2) a `<niche>` schema in `shoshin-kb`, and (3) a `.evidence/knowledge/<niche>/` directory. Day-1 niche: `world-mobile` (see `[[world-mobile-niche-profile]]`).

## Skill Bindings

All tasks inherit: `[[world-mobile-niche-profile]]`, `[[compliance-rules]]`, `[[brand-voice-system]]`, `[[audience-profiles]]`, `[[hooks-library]]`, `[[repurpose-engine]]`, `[[content-calendar]]`, `[[content-types]]`, `[[x-playbook]]`, `[[tiktok-playbook]]`, `[[instagram-playbook]]`, `[[threads-playbook]]`, `[[knowledge-base]]`, `[[x-posts-adapter]]`, `[[web-article-adapter]]`, `[[intelligence-seed]]`, `[[clippings-adapter]]`, `[[knowledge-compiler]]`, `[[knowledge-query]]`, `[[knowledge-lint]]`, `[[ai-tells]]`.

## Data Scope

Knowledge base: `shoshin-kb` Postgres DB, schema per niche. Agents never hold DB credentials. Scripts project DB rows to `.evidence/knowledge/<niche>/` markdown files. Agents read files only.

## Compliance Posture

Shoshin operates as a third-party independent creator. Not affiliated with any niche subject (e.g. World Mobile Group Ltd.).

- Never auto-publish. Human gate is mandatory for crypto/finance content.
- Not-financial-advice boilerplate on every regulated post.
- No price predictions or buy/sell signals.
- FTC, FCA, MiCA disclosure templates per platform.
- Editor runs a 10-item compliance checklist on every regulated-topic draft.

## Success Metrics

Per-niche per-platform engagement benchmarks (vs pre-sprint baseline). Compliance violation count: target 0. Knowledge-base freshness: intelligence-seed refreshed every Friday.

## Add-a-Niche (Short Version)

1. SQL migration to add `<niche>` schema in `shoshin-kb`
2. Create `skills/<niche>-niche-profile/SKILL.md` with `knowledge_sources:` block
3. Append slug to `COMPANY.md:niches` list (this file)
4. Run adapter scripts for the new niche
5. Run intelligence-seed task

Agents need no changes. Niches are additive.
