---
name: Shoshin
description: "Multi-niche short-form social media content engine. Produces platform-native content for X, TikTok, Instagram, and Threads across multiple niches on a weekly rhythm."
slug: shoshin
schema: agentcompanies/v1
version: 0.2.0
license: MIT
authors:
  - name: Shoshin Founder
niches:
  - world-mobile
goals:
  - Ship platform-native short-form content for every active niche, every week, across X, TikTok, Instagram, and Threads
  - Maintain strict compliance for third-party content about regulated topics (crypto, finance, DePIN)
  - Compound knowledge per-niche: every performance signal refines hooks-library and the niche-profile skills
  - Scale horizontally by adding niches to COMPANY.md without changing agents
---

## What Shoshin Is

Shoshin means "beginner's mind" (初心). It is a multi-niche short-form social media content engine. One idea becomes platform-native posts for X, TikTok, Instagram, and Threads, for every niche in the `niches:` list, every week. Day-1 niche: World Mobile (DePIN telecom, third-party creator posture).

2 agents. No teams. Routines do the waking.

## Hierarchy

```
Human Operator (CEO)
  └── Content Manager  ($30/mo, reportsTo: null)
        └── Content Writer  ($20/mo, reportsTo: content-manager)
```

Content Manager owns the full loop: signal → brief → gate → queue → Friday brief to CEO. Content Writer produces drafts only. Human approves every post before it goes live.

## Routines

| Routine | Schedule | Assignee |
|---|---|---|
| `weekly-sprint` | Mon 10:00 Europe/Amsterdam | Content Manager |
| `friday-brief` | Fri 16:00 Europe/Amsterdam | Content Manager |

## Automated Tasks (no agent)

| Task | Schedule |
|---|---|
| `nightly-wiki-compile` | 02:00 nightly |
| `nightly-qmd-reindex` | 02:30 nightly |
| `clippings-ingest` | 07:00 daily |
| `trend-scan` | 06:00 daily |
| `weekly-wiki-lint` | Fri 15:30 |

## Active Niches

Each slug in `niches:` MUST correspond to: (1) a `skills/<slug>-niche-profile/SKILL.md`, (2) a `<niche>` schema in `shoshin-kb`, and (3) a `.evidence/knowledge/<niche>/` directory. Day-1 niche: `world-mobile` (see `[[world-mobile-niche-profile]]`).

## Data Scope

Knowledge base: `shoshin-kb` Postgres DB, schema per niche. Agents never hold DB credentials. Scripts project DB rows to `.evidence/knowledge/<niche>/` markdown files. Agents read files only.

## Compliance Posture

Shoshin operates as a third-party independent creator. Not affiliated with any niche subject (e.g. World Mobile Group Ltd.).

- Never auto-publish. Human gate is mandatory for crypto/finance content.
- Not-financial-advice boilerplate on every regulated post.
- No price predictions or buy/sell signals.
- FTC, FCA, MiCA disclosure templates per platform.
- Content Manager runs a 10-item compliance checklist on every regulated-topic draft.

## Add-a-Niche (Short Version)

1. SQL migration to add `<niche>` schema in `shoshin-kb`
2. Create `skills/<niche>-niche-profile/SKILL.md` with `knowledge_sources:` block
3. Append slug to `COMPANY.md:niches` list (this file)
4. Run adapter scripts for the new niche
5. Run `intelligence-seed` task (ad-hoc, new niche only)

Agents need no changes. Niches are additive.
