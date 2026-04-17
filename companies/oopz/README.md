# Oopz

A Paperclip agent company that runs specialist projects. First project: **Shoshin** (multi-niche short-form social media content engine). First niche in Shoshin: World Mobile.

---

## The Hierarchy (Read This First)

Oopz operates on three tiers:

```
Oopz (company)
  └── Shoshin (project)
        └── world-mobile (niche)
```

- **Oopz** is the company. Defined in `COMPANY.md`. It owns the 8 agents, 3 teams, company-level tasks, and all shared skills. Future projects are siblings of Shoshin under `projects/`.
- **Shoshin** is a project inside Oopz. Defined in `projects/shoshin/PROJECT.md`. It declares which niches it operates on via frontmatter:

  ```yaml
  niches:
    - world-mobile
  ```

- **World Mobile** is a niche. A niche is NOT its own PROJECT.md. A niche is a combination of: (1) a `skills/<slug>-niche-profile/SKILL.md` file, (2) a schema in the project's DB, and (3) a `.evidence/knowledge/<niche-slug>/` directory. Niches are declared as relations in a project's `niches:` list.

Key distinction: `COMPANY.md` is the company. `PROJECT.md` is the project. The niche is a skill + DB schema + knowledge-base directory, not a separate structural entity. Teams (Discovery, Production, Operations) live at the company level and serve any Oopz project.

---

## Why "Oopz" and What's "Shoshin"?

**Oopz** is the company name.

**Shoshin** (初心, "beginner's mind" in Japanese) is the content-engine project. The name reflects a deliberate posture: month one of any agent-driven content system is humbling. As Eric Osiu observed about his OpenClaw marketing team, "month 1 was terrible" before the skill graph started compounding. Shoshin embraces that. Start with beginner's mind, measure everything, iterate weekly, let the data compound the skills. No illusions about instant quality.

---

## What is a Paperclip Company? (First-Time User Primer)

A Paperclip company is a structured collection of AI agents, organized by the [Agent Companies Specification](https://agentcompanies.io/specification). The key files:

| File | Purpose |
|------|---------|
| `COMPANY.md` | Company identity, goals, metadata. The root document. |
| `agents/<slug>/AGENTS.md` | One per agent. Defines role, skills, `reportsTo` chain. |
| `teams/<slug>/TEAM.md` | Groups agents into functional teams with a manager. |
| `projects/<slug>/PROJECT.md` | A project the company operates. Has its own tasks and `niches:` list. |
| `tasks/<slug>/TASK.md` | Scheduled or triggered work. Company-level or project-scoped. |
| `skills/<slug>/SKILL.md` | Reusable knowledge modules agents load at runtime. |
| `.paperclip.yaml` | Runtime configuration (env overrides, adapter settings). |

**The graph rule**: exactly one agent has `reportsTo: null` (the CEO / graph root). Every other agent has a `reportsTo` pointing to another agent's slug. This creates a directed acyclic graph that Paperclip uses for delegation and escalation.

A Paperclip company can contain multiple projects under `projects/`. Each project has its own tasks and frontmatter (including the `niches:` relation list that Oopz uses). Today, Oopz has one project (Shoshin). Adding a second project means adding `projects/<new-slug>/PROJECT.md` with its own niches, tasks, and scope. The 8 agents and 3 teams serve all projects.

---

## How Shoshin Works (The Workflow)

```
Scout ──► Strategist ──► Researcher ──► Writer ──► Editor ──► Scheduler ──► [HUMAN APPROVES] ──► Analyst
  ▲                                                                                                  │
  └──────────────────────── skill updates (hooks-library, niche-profile) ◄───────────────────────────┘
```

1. **Scout** scans platforms twice daily (06:00 and 18:00 Europe/Amsterdam) for trend signals across all Shoshin niches.
2. **Strategist** converts trend signals into a weekly content queue. Every Monday, iterates over the niches in `projects/shoshin/PROJECT.md` and selects 3-5 topics per niche.
3. **Researcher** builds a factual dossier for each topic, drawing primarily from `.evidence/knowledge/<niche-slug>/`.
4. **Writer** produces platform-native drafts (rethinking, not reformatting) for X, TikTok, Instagram, and Threads.
5. **Editor** gates every draft for voice, compliance, hook quality, and platform-nativeness.
6. **Scheduler** queues approved drafts with proposed publish times. **Never auto-publishes.**
7. **Human** reviews the queue and approves or rejects each post. This gate is non-negotiable for crypto-adjacent content.
8. **Analyst** measures performance weekly, proposes concrete diffs to `hooks-library` and niche-profile skills. Human approves before applying.

The loop compounds: Analyst insights refine skills, which improve future content.

---

## Data Architecture (The Per-Project Single Brain)

```
                  EXTERNAL SOURCES                    SHOSHIN-KB (Postgres)
              ┌─────────────────────┐              ┌──────────────────────┐
              │  tweet-curator-pg   │──┐           │  public schema       │
              │  (CURATOR_DB_URL)   │  │  fetch    │    niches            │
              └─────────────────────┘  ├──scripts──►    source_types      │
              ┌─────────────────────┐  │           │    schema_migrations │
              │  Web (RSS, blogs)   │──┘           │                      │
              └─────────────────────┘              │  world_mobile schema │
                                                   │    knowledge_items   │
                                                   └──────────┬───────────┘
                                                              │
                                                   kb-to-markdown.ts
                                                              │
                                                              ▼
                                                   .evidence/knowledge/
                                                     world-mobile/
                                                       x-posts/
                                                       web-article/
                                                              │
                                                              ▼
                                                        AGENTS READ
                                                       (markdown only)
```

**Why agents never hold DB credentials**: isolation. Scripts in `assets/scripts/` are the only code that touches the database. They run outside Paperclip (user shell, cron, Trigger.dev). Scripts write to the project DB, then project markdown via `kb-to-markdown.ts`. Agents consume `.evidence/knowledge/<niche-slug>/` and never see a connection string.

`shoshin-kb` is the Shoshin project's database. Future Oopz projects get their own DBs (e.g. `oracle-kb`, `arrow-kb`). Each DB uses schema-per-niche isolation.

---

## DB Strategy Summary

Full details in `references/db-strategy.md`.

Model: per-project DB, schema-per-niche within it, `public` schema for cross-cutting tables (`niches`, `source_types`, `schema_migrations`). SQL templates live in `assets/sql/`.

| Project | DB Name | Active Niches / Schemas |
|---------|---------|------------------------|
| Shoshin | `shoshin-kb` | `world_mobile` |
| (future) | `<project-slug>-kb` | per project's `niches:` list |

Naming: niche slug `world-mobile` maps to Postgres schema `world_mobile` (hyphens become underscores). Role naming: `<project>_<niche>_rw` (e.g. `shoshin_world_mobile_rw`). Agents have no DB role at all.

Migration protocol: numbered files in `assets/sql/` applied via `psql -f`. `001_init.sql` creates cross-cutting tables. `002_niche_template.sql.tmpl` is applied once per niche with `envsubst`.

---

## Adapter Catalog

| Adapter Slug | Status | What It Ingests | Required Env | SKILL Slug | Script Path |
|-------------|--------|-----------------|-------------|------------|-------------|
| `x-posts` | Day 1, wired | Curated X/Twitter posts from tweet-curator-pg | `DATABASE_URL`, `CURATOR_DATABASE_URL` | `x-posts-adapter` | `assets/scripts/fetch-x-posts.ts` |
| `web-article` | Day 1, wired | Blog posts, news via RSS/scrape | `DATABASE_URL` | `web-article-adapter` | `assets/scripts/fetch-web-article.ts` |
| `youtube-transcripts` | Future | YouTube video transcripts | TBD | TBD | TBD |
| `manual-notes` | Future | Hand-written notes, observations | TBD | TBD | TBD |
| `rss` | Future | Generic RSS feed items | TBD | TBD | TBD |
| `reddit` | Future | Reddit posts and comments | TBD | TBD | TBD |

**Adding a new adapter**: copy an existing adapter skill (e.g. `x-posts-adapter`) and its script stub. Swap the source-specific fields. The `knowledge-base` frontmatter contract stays the same across all adapters; only `source_type`, `source_identifier`, and `engagement_signals` keys change per adapter. Register the new source type in `public.source_types`.

---

## Org Chart

| Slug | Name | Title | Reports To | Team | Core Skills | DB Access? |
|------|------|-------|-----------|------|-------------|-----------|
| `chief-of-staff` | Chief of Staff | Chief of Staff (CEO) | `null` (graph root) | (all) | compliance-rules, brand-voice-system, content-calendar | NO |
| `strategist` | Strategist | Content Strategist & Discovery Team Lead | chief-of-staff | Discovery | repurpose-engine, audience-profiles, content-calendar, brand-voice-system | NO |
| `scout` | Scout | Trend Intelligence Specialist | strategist | Discovery | content-calendar | NO |
| `researcher` | Researcher | Topic Research Specialist | strategist | Discovery | compliance-rules | NO |
| `writer` | Writer | Platform-Native Content Writer | editor | Production | x-playbook, tiktok-playbook, instagram-playbook, threads-playbook, hooks-library, repurpose-engine, brand-voice-system, compliance-rules | NO |
| `editor` | Editor | Content Editor & Production Team Lead | chief-of-staff | Production | brand-voice-system, compliance-rules, hooks-library, x-playbook, tiktok-playbook, instagram-playbook, threads-playbook | NO |
| `scheduler` | Scheduler | Content Scheduler & Operations Team Lead | chief-of-staff | Operations | content-calendar, content-types | NO |
| `analyst` | Analyst | Performance Analyst | scheduler | Operations | hooks-library, content-types, audience-profiles, compliance-rules, brand-voice-system | NO |

Chief of Staff is the Oopz-level CEO. It oversees all projects (today Shoshin, tomorrow any new project). It is not Shoshin-specific.

All agents are credential-free. They read markdown from `.evidence/` directories. No agent holds a database connection string or API secret.

---

## Skills Inventory

### Content Engine Skills (Custom)

| Skill Slug | Purpose |
|-----------|---------|
| `brand-voice-system` | Universal voice framework (7 axes, 1-10 scale). Niche profiles override. |
| `audience-profiles` | Two segments: depin-natives, connectivity-curious. Niche profiles extend. |
| `hooks-library` | 20+ hook patterns by psychological trigger. Iterated weekly via Analyst. |
| `content-calendar` | Per-platform cadence caps, weekly rhythm, best-time-to-post windows. |
| `content-types` | Enumerated content types with platform fit matrix. |
| `repurpose-engine` | 1-idea-to-4-platforms chain. Rethink, never reformat. |
| `compliance-rules` | Mandatory compliance checklist for regulated topics (crypto, finance, DePIN). |
| `world-mobile-niche-profile` | Niche overlay for World Mobile: identity, audience, compliance, knowledge sources. |

### Platform Playbooks (Externally Referenced)

| Skill Slug | Upstream Repo | Commit SHA |
|-----------|--------------|------------|
| `x-playbook` | [msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents) | `783f6a72bfd7f3135700ac273c619d92821b419a` |
| `tiktok-playbook` | [msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents) | `783f6a72bfd7f3135700ac273c619d92821b419a` |
| `instagram-playbook` | [msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents) | `783f6a72bfd7f3135700ac273c619d92821b419a` |
| `threads-playbook` | (no external source) | N/A |

### Data-Layer Skills

| Skill Slug | Purpose |
|-----------|---------|
| `knowledge-base` | Foundational contract: normalized markdown format, Zod frontmatter schema, file-path convention. All adapters output to this spec; all agents read from it. |
| `x-posts-adapter` | Ingests curated X/Twitter posts from tweet-curator-pg into a niche's knowledge base. |
| `web-article-adapter` | Ingests blog posts, news articles, long-form web content into a niche's knowledge base. |
| `intelligence-seed` | Source-agnostic templates for mining a niche's knowledge base. Produces proposed diffs for hooks, voice, audience, baselines. Never cross-pollinates across niches. |

---

## Starter Tasks

| Task Name | Scope | Assignee | Cadence | Iterates Over Niches? |
|-----------|-------|----------|---------|----------------------|
| `morning-brief` | Company | chief-of-staff | Daily 08:00 | No (covers all projects) |
| `trend-scan` (morning) | Company | scout | Daily 06:00 | Yes (Shoshin niches) |
| `trend-scan-evening` | Company | scout | Daily 18:00 | Yes (Shoshin niches) |
| `weekly-analyst-review` | Company | analyst | Friday 16:00 | Yes (all niches, all projects) |
| `weekly-content-sprint` | Project (Shoshin) | strategist | Monday 10:00 | Yes (Shoshin niches) |
| `intelligence-seed` | Project (Shoshin) | analyst | Friday 17:30 | Yes (Shoshin niches) |

All times are Europe/Amsterdam.

---

## Project Model (How to Add a New Project to Oopz)

Adding a new project (a sibling of Shoshin) under Oopz:

**(a)** Create `projects/<new-project>/PROJECT.md` with its own slug, description, owner, and `niches:` list. Example:

```yaml
---
name: Arrow
slug: arrow
description: Long-form research reports.
owner: strategist
niches:
  - defi-lending
---
```

**(b)** Create project-scoped tasks under `projects/<new-project>/tasks/`. Each task references the project via `project: <slug>` in frontmatter.

**(c)** If the new project needs its own knowledge base: create a `<new-project>-kb` Postgres DB, run `assets/sql/001_init.sql` against it, then apply `002_niche_template.sql.tmpl` per niche in its `niches:` list.

**(d)** The existing 8 agents and 3 company-level teams automatically become available to the new project. No agent or team changes needed.

**(e)** Decide: does this project share any niches with Shoshin? If yes, add matching slugs to both projects' `niches:` lists. Each project still has its own DB; shared niches mean both projects have a schema for that niche in their respective DBs.

---

## Niche Model (How to Add a New Niche to Shoshin)

Adding a new niche (e.g. `defi-lending`) to the Shoshin project:

**(a)** **SQL**: Apply `assets/sql/002_niche_template.sql.tmpl` with the new niche variables against `shoshin-kb`:

```bash
NICHE_SLUG=defi-lending NICHE_SCHEMA=defi_lending \
  envsubst < assets/sql/002_niche_template.sql.tmpl | psql shoshin-kb
```

**(b)** **Skill**: Create `skills/defi-lending-niche-profile/SKILL.md` copied from `world-mobile-niche-profile`. Update: niche identity, audience segments, compliance posture, topic allow/deny lists, and `knowledge_sources:` selectors (author lists, RSS feeds, keyword filters).

**(c)** **Project**: Append the new niche slug to `projects/shoshin/PROJECT.md`'s `niches:` list:

```yaml
niches:
  - world-mobile
  - defi-lending
```

**(d)** **Knowledge base**: Run the adapter scripts for the new niche:

```bash
bun assets/scripts/fetch-x-posts.ts --project-slug shoshin --niche-slug defi-lending
bun assets/scripts/fetch-web-article.ts --project-slug shoshin --niche-slug defi-lending
bun assets/scripts/kb-to-markdown.ts --project-slug shoshin --niche-slug defi-lending
```

**(e)** **Seed**: Run the intelligence-seed task out-of-schedule against the new niche to bootstrap hooks, voice calibration, audience patterns, and engagement baselines.

**(f)** **Done.** The 8 agents, 3 company-level teams, platform skills, engine skills, and compliance rules all work unchanged. The next Monday's `weekly-content-sprint` picks up the new niche automatically because Strategist iterates over `project.niches`.

Niches are ADDITIVE, not structural. Agents and teams never change when you add a niche.

---

## Compliance Posture

Shoshin operates as a **third-party independent creator** for the World Mobile niche. Not affiliated with World Mobile Group Ltd. All content must make this posture unambiguous.

Key rules from `compliance-rules`:

- Use `$WMTX` (user-confirmed current ticker, never `$WMT`)
- Never auto-publish. Always run the Editor gate, then the human-in-the-loop gate
- Not-financial-advice boilerplate on every crypto/finance post
- No price predictions or buy/sell signals
- Never impersonate World Mobile Group
- FTC, FCA, and MiCA disclosure templates per platform

The Editor runs a 10-item checklist on every regulated-topic draft before it can reach Scheduler.

---

## Getting Started

### Import the company

```bash
paperclipai company import --from /home/vdm/git/oopz-inc/companies/oopz/
```

### Pre-first-post checklist

1. **Create the Postgres DB**:

   ```bash
   createdb shoshin-kb
   ```

2. **Run the init migration**:

   ```bash
   psql shoshin-kb -f assets/sql/001_init.sql
   ```

3. **Apply the niche template for world-mobile**:

   ```bash
   NICHE_SLUG=world-mobile NICHE_SCHEMA=world_mobile \
     envsubst < assets/sql/002_niche_template.sql.tmpl | psql shoshin-kb
   ```

4. **Configure script environment variables**:
   - `DATABASE_URL` pointing to `shoshin-kb` (write role for the active niche)
   - `CURATOR_DATABASE_URL` pointing to `tweet-curator-pg` (read-only)

5. **Run the adapter scripts**:

   ```bash
   bun assets/scripts/fetch-x-posts.ts --project-slug shoshin --niche-slug world-mobile
   bun assets/scripts/fetch-web-article.ts --project-slug shoshin --niche-slug world-mobile
   bun assets/scripts/kb-to-markdown.ts --project-slug shoshin --niche-slug world-mobile
   ```

6. **Run intelligence-seed once** for world-mobile: trigger the `intelligence-seed` task out-of-schedule to bootstrap hooks, voice, audience, and baselines from the freshly populated knowledge base.

7. **Refine skills**: review the proposed diffs from the seed run. Update `world-mobile-niche-profile` and `hooks-library` with confirmed insights. These two skills compound weekly, so the seed run gives them their initial signal.

---

## Iterate-Weekly Ritual

The weekly compounding loop (Ronin's skill-graph principle + Ericosiu's observation that agent systems improve with iteration):

| Time (Friday) | What | Who |
|--------------|------|-----|
| 16:00 | `weekly-analyst-review` (company-wide): top/bottom posts, hook patterns, audience heatmap | Analyst |
| 17:30 | `intelligence-seed` refresh (Shoshin, iterates over all Shoshin niches): proposed diffs for hooks, voice, audience, baselines | Analyst |
| After seed | Analyst proposes concrete skill-file diffs | Analyst, then human |
| Human review | Human approves or rejects proposed diffs | Human |
| Apply | Approved diffs applied to hooks-library, niche-profile skills | Human |

This is how the system compounds. Week 1 content is raw. Week 4 content reflects 3 rounds of data-driven skill refinement. The graph gets smarter because the skills get better, not because the agents change.

---

## Citations and Credits

- Architecture inspired by: [Ronin's skill graph content engine](https://x.com/DeRonin_/status/2042604279077237170) and [Eric Osiu's OpenClaw marketing team](https://x.com/ericosiu/status/2043083581824827584)
- External skills: [msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents) @ commit `783f6a72bfd7f3135700ac273c619d92821b419a`
- Spec: [Agent Companies Specification](https://agentcompanies.io/specification)
- Runtime: [Paperclip](https://github.com/paperclipai/paperclip)

---

## License

MIT. See `LICENSE`.

---

## Out of Scope (Day 1)

The following are noted for roadmap but not built yet:

- Long-form platforms (LinkedIn, YouTube, Newsletter)
- Automated publishing (human-in-the-loop is intentional, not a limitation)
- Multiple Shoshin niches (the architecture supports it; only world-mobile is active Day 1)
- Additional Oopz projects (siblings to Shoshin under `projects/`)
- Account warm-up infrastructure
- `youtube-transcripts`, `manual-notes`, `rss`, `reddit` adapters
- Automated knowledge-base ingestion schedule (manual/scripted for v0.1)
