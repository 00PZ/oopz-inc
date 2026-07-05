# Shoshin

A Paperclip agent company. Short-form social media content engine for World Mobile (DePIN telecom). Third-party independent creator posture.

---

## Architecture

```
Human Operator (CEO)
  └── Content Manager  ($30/mo, reportsTo: null)
        └── Content Writer  ($20/mo, reportsTo: content-manager)
```

2 agents. 1 editorial team. 3 routines. Heartbeat OFF on both — routines do the waking.

Knowledge layer: **gbrain MCP** (in-cluster, `gbrain-jarvis-company.gbrain.svc.cluster.local:3131`). Agents query via natural language. No local search index, no database.

---

## Routines

| Routine | Schedule | Assignee |
|---|---|---|
| `trend-scan` | 06:00 daily | Content Manager |
| `weekly-sprint` | Mon 10:00 | Content Manager |
| `friday-brief` | Fri 16:00 | Content Manager |

**Loop:** Trend scan surfaces signals → Monday sprint converts to briefs → Writer drafts → Manager gates → Human approves → Friday brief closes the loop with performance data and proposed skill diffs.

---

## Skills (14)

**Brand Foundation** (static, human-only edits):
- `brand-voice-system` — 7 voice axes, per-platform DNA shifts
- `compliance-rules` — crypto/finance/DePIN compliance checklist
- `world-mobile-niche-profile` — niche voice, audience, knowledge sources
- `ai-tells` — banned AI-slop patterns (Editor scans every draft)

**Content Engine** (iterated via Friday brief + human approval):
- `audience-profiles` — audience segments per niche
- `hooks-library` — hook patterns by trigger, iterated weekly
- `content-calendar` — per-platform cadence caps, best-time-to-post
- `content-types` — enumerated types with platform fit matrix
- `repurpose-engine` — 1-idea-to-4-platforms (rethink, never reformat)

**Platform Playbooks**:
- `x-playbook`, `tiktok-playbook`, `instagram-playbook`, `threads-playbook`

---

## Evidence Layout

```
.evidence/
  trends/         YYYY-MM-DD.md          trend-scan output
  strategy/       YYYY-WW-queue.md       weekly topic queue
  drafts/         YYYY-MM-DD-<topic>/    brief.md + per-platform drafts
  approved/       YYYY-MM-DD-<topic>-<platform>.md
  rejected/       same pattern + feedback
  queue/          proposed publish slots
  metrics/        human-pasted analytics
  analysis/       YYYY-WW-brief.md       friday brief output
```

Agents read and write `.evidence/` only. Skills are read-only. gbrain is read-only from agents' perspective.

---

## Compliance Posture

Shoshin = third-party independent creator. Not affiliated with World Mobile Group Ltd.

- Never auto-publish. Human gate mandatory for crypto/finance content.
- Not-financial-advice boilerplate on every regulated post.
- No price predictions or buy/sell signals.
- FTC, FCA, MiCA disclosure templates per platform.
- Content Manager runs a 10-item compliance checklist on every regulated-topic draft.

---

## Getting Started

```bash
# Import into Paperclip
paperclipai company import --from github:00PZ/oopz-inc?path=companies/shoshin

# Connect the repo in Paperclip UI
# Settings → Repositories → import companies/shoshin/
# Verify: 2 agents + 3 routines appear

# Connect X account via Postiz for scheduling

# Run first weekly-sprint manually to bootstrap .evidence/
```

---

## Active Niches

| Niche | Status | Profile skill |
|---|---|---|
| `world-mobile` | Active | `world-mobile-niche-profile` |

Adding a niche: create `skills/<niche>-niche-profile/SKILL.md`, append slug to `COMPANY.md:niches`. Agents and routines need no changes.

---

## References

- Runtime: [Paperclip](https://github.com/paperclipai/paperclip)
- Knowledge: [gbrain](https://github.com/garrytan/gbrain)
- Article: [Build a Content Agent in Paperclip](https://x.com/aronprins/status/2071946142170890411)
