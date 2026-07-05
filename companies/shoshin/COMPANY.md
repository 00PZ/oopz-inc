---
name: Shoshin
description: "Short-form social media content engine. Third-party independent creator for World Mobile (DePIN telecom). Platform-native content for X, TikTok, Instagram, and Threads."
slug: shoshin
schema: agentcompanies/v1
version: 0.3.0
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

Shoshin means "beginner's mind" (初心). Short-form social media content engine. One idea becomes platform-native posts for X, TikTok, Instagram, and Threads, for every niche in the `niches:` list, every week. Day-1 niche: World Mobile (DePIN telecom, third-party creator posture).

2 agents. 1 editorial team. Routines do the waking.

## Hierarchy

```
Human Operator (CEO)
  └── Content Manager  ($30/mo, reportsTo: null)
        └── Content Writer  ($20/mo, reportsTo: content-manager)
```

Content Manager owns the full loop: signal to brief to gate to queue to Friday brief to CEO. Content Writer produces drafts only. Human approves every post before it goes live.

## Routines

| Routine | Schedule | Assignee |
|---|---|---|
| `trend-scan` | 06:00 daily | Content Manager |
| `weekly-sprint` | Mon 10:00 | Content Manager |
| `friday-brief` | Fri 16:00 | Content Manager |

## Knowledge Layer

gbrain MCP — in-cluster HTTP MCP server at `gbrain-jarvis-company.gbrain.svc.cluster.local:3131`. Agents query with natural-language questions. No local database. No index maintenance. Agents read only; humans and Jarvis write.

## Active Niches

Each slug in `niches:` MUST have a corresponding `skills/<slug>-niche-profile/SKILL.md`. Day-1 niche: `world-mobile` (see `[[world-mobile-niche-profile]]`).

## Compliance Posture

Shoshin operates as a third-party independent creator. Not affiliated with any niche subject (e.g. World Mobile Group Ltd.).

- Never auto-publish. Human gate is mandatory for crypto/finance content.
- Not-financial-advice boilerplate on every regulated post.
- No price predictions or buy/sell signals.
- FTC, FCA, MiCA disclosure templates per platform.
- Content Manager runs a 10-item compliance checklist on every regulated-topic draft.

## Add-a-Niche

1. Create `skills/<niche>-niche-profile/SKILL.md` with `knowledge_sources:` block
2. Append slug to `COMPANY.md:niches` (this file)
3. Seed gbrain with niche knowledge (pages under the relevant slug prefix)

Agents need no changes. Niches are additive.
