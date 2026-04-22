# Oopz

A Paperclip agent company that runs specialist projects. First project: **Shoshin** (multi-niche short-form social media content engine). First niche: World Mobile.

---

## System Overview

```
                    ┌──────────────────────────────────────────────────────┐
                    │                    OOPZ (Company)                    │
                    │                                                      │
                    │   9 agents  |  3 teams  |  16+ skills  |  6+ tasks  │
                    │                                                      │
                    │   ┌────────────────────────────────────────────┐     │
                    │   │           SHOSHIN (Project)                │     │
                    │   │                                            │     │
                    │   │   niches: [world-mobile, ...]              │     │
                    │   │   platforms: X, TikTok, Instagram, Threads │     │
                    │   │   posture: third-party independent creator │     │
                    │   └────────────────────────────────────────────┘     │
                    │                                                      │
                    │   ┌────────────────────────────────────────────┐     │
                    │   │           (FUTURE PROJECT)                 │     │
                    │   │   niches: [...]                            │     │
                    │   └────────────────────────────────────────────┘     │
                    └──────────────────────────────────────────────────────┘
```

**Three tiers**: Company owns agents/teams/skills. Projects declare niches and scope work. Niches are the knowledge boundary (one Postgres schema, one knowledge directory, one wiki per niche). Adding a niche = additive. Adding a project = additive. Neither requires agent changes.

---

## Agent Graph (Org Chart)

```
                         ┌────────────────────┐
                         │  chief-of-staff    │  reportsTo: null
                         │  (graph root/CEO)  │
                         └──┬───────┬───────┬─┘
                            │       │       │
           ┌────────────────┘       │       └─────────────────┐
           ▼                        ▼                         ▼
   ┌───────────────┐        ┌─────────────┐          ┌─────────────┐
   │  Strategist   │        │   Editor    │          │  Scheduler  │
   │  (Discovery   │        │ (Production │          │ (Operations │
   │   team lead)  │        │  team lead) │          │  team lead) │
   └─┬───┬───┬────┘        └──────┬──────┘          └──────┬──────┘
     │   │   │                     │                        │
     ▼   ▼   ▼                     ▼                        ▼
  ┌────┐┌────────┐┌─────────┐  ┌───────┐              ┌─────────┐
  │Scou││Researc-││Librarian│  │Writer │              │ Analyst │
  │  t ││  her   ││  (wiki) │  │       │              │         │
  └────┘└────────┘└─────────┘  └───────┘              └─────────┘

  DISCOVERY TEAM          PRODUCTION TEAM          OPERATIONS TEAM
  strategist              editor                   scheduler
  scout                   writer                   analyst
  researcher
  librarian
```

**Rules**: exactly one `reportsTo: null` (chief-of-staff). Every other agent points to a manager. Paperclip uses this DAG for delegation and escalation. All agents are **credential-free** (no DB access, no API keys). They read and write markdown only.

---

## Content Production Workflow

```
Scout ──► Strategist ──► Researcher ──► Writer ──► Editor ──► Scheduler ──► [HUMAN] ──► Analyst
  ▲                          │                        ▲                                     │
  │                          │ delegates              │ ai-tells                            │
  │                          ▼                        │ scan                                │
  │                     ┌──────────┐                  │                                    │
  │                     │Librarian │                  │                                    │
  │                     │(wiki     │                  │                                    │
  │                     │ query)   │                  │                                    │
  │                     └──────────┘                  │                                    │
  │                                                   │                                    │
  └────────── skill updates (hooks-library, niche-profile) ◄──────────────────────────────┘
```

1. **Scout** scans platforms 2x/day (06:00, 18:00) for trend signals across all niches.
2. **Strategist** converts signals into a weekly content queue (Monday 10:00, 3-5 topics/niche).
3. **Researcher** builds factual dossiers, delegating to Librarian for wiki-backed synthesis.
4. **Writer** produces platform-native drafts (rethinking, not reformatting) for 4 platforms.
5. **Editor** gates every draft: voice, compliance, hook quality, ai-tells scan, platform-nativeness.
6. **Scheduler** queues approved drafts. **Never auto-publishes.**
7. **Human** reviews and approves/rejects. Non-negotiable for crypto-adjacent content.
8. **Analyst** measures weekly, proposes skill diffs. Human approves before applying.

The loop compounds: Analyst insights refine skills, which improve future content.

---

## Data Flow (Source to Agent)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ EXTERNAL SOURCES (Trigger.dev scraping jobs, self-hosted)                    │
│                                                                             │
│   tweet-curator-pg          Web scraper           Obsidian Web Clipper      │
│   (X accounts for niche)    (blogs, news)         (human-curated clips)     │
│        │                         │                        │                 │
└────────┼─────────────────────────┼────────────────────────┼─────────────────┘
         │ fetch-x-posts.ts        │ fetch-web-article.ts   │ fetch-clippings.ts
         │ (reads curator DB)      │ (scrapes + markdownize)│ (parses frontmatter)
         ▼                         ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ SHOSHIN-KB (Postgres, per-project DB)                                       │
│                                                                             │
│   public schema:  niches | source_types | schema_migrations                 │
│   world_mobile schema:  knowledge_items                                     │
│       source_type: x-posts | web-article | clippings                        │
│       engagement_signals: {likes, retweets, ...}                            │
│       body_text: fair-use summary                                           │
│       content_hash: SHA-256 (dedup)                                         │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │ kb-to-markdown.ts (projects DB rows to files)
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ .evidence/knowledge/<niche>/<source-type>/*.md  (Zod-validated frontmatter) │
│                                                                             │
│   world-mobile/x-posts/2026-04-15-tweet-abc.md                              │
│   world-mobile/web-article/2026-04-15-blog-slug.md                          │
│   world-mobile/clippings/2026-04-15-clip-hash.md                            │
└──────────────────┬──────────────────────────────────────────────────────────┘
                   │ Librarian agent reads (nightly 02:00)
                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ .evidence/wiki/<niche>/  (compiled, cross-linked, validation-gated)         │
│                                                                             │
│   index.md         (master index with one-line TLDRs)                       │
│   concepts/*.md    (ideas, patterns, principles)                            │
│   entities/*.md    (people, orgs, tools, products)                          │
│   topics/*.md      (synthesized briefings)                                  │
│   queries/*.md     (filed-back Q&A, compounding loop)                       │
│   _lint/*.md       (weekly quality reports)                                 │
│                                                                             │
│   Frontmatter: explored(false/true) | confidence | counter_arguments |      │
│                data_gaps | cross_links | pinned                             │
└──────────────────┬──────────────────────────────────────────────────────────┘
                   │ qmd hybrid search (nightly index)
                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ qmd INDEX (~/.cache/qmd/oopz/)  BM25 + vector + LLM re-ranking             │
│   world-mobile collection: .evidence/wiki/world-mobile/**/*.md              │
│   Librarian queries via MCP (preferred) or CLI fallback                     │
└──────────────────┬──────────────────────────────────────────────────────────┘
                   │ qmd.query -c <niche> --min-score 0.3
                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ CONSUMER AGENTS                                                             │
│   Researcher | Writer | Strategist | Analyst (via Librarian delegation)     │
│   Scout reads .evidence/knowledge/ directly (raw items, not wiki)           │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Invariants**:
- Scripts hold DB credentials. Agents never do.
- Scripts never call LLMs. Agents do (via Paperclip model binding).
- Source DBs (tweet-curator-pg) are read-only from Oopz's perspective. One-way flow.
- `shoshin-kb` is Oopz's copy, not a cache. It has its own shape.
- The markdown projection (`.evidence/knowledge/`) is the agent contract.

---

## Knowledge Layer (KBL + BF)

```
┌─────────────── KBL: Knowledge Base Layer (DYNAMIC) ─────────────────────────┐
│                                                                              │
│  RAW          raw/clippings/*.md  (Obsidian clipper, gitignored)             │
│  NORMALIZED   shoshin-kb Postgres (schema-per-niche)                         │
│  PROJECTED    .evidence/knowledge/<niche>/<source-type>/*.md                 │
│  COMPILED     .evidence/wiki/<niche>/  (Librarian, nightly 02:00)            │
│  QUERIED      .evidence/wiki/<niche>/queries/  (filed-back, compounding)     │
│                                                                              │
│  Quality controls:                                                           │
│    - explored: false (soft flag, human flips to true)                        │
│    - confidence: uncertain | low | medium | high                             │
│    - counter_arguments: mandatory per concept/topic page                     │
│    - data_gaps: mandatory per concept/topic page                             │
│    - cross_links: bidirectional wikilinks                                    │
│    - minimum evidence: 2+ sources before a page is created                   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────── BF: Brand Foundation (STATIC, human-only) ────────────────────┐
│                                                                              │
│  skills/brand-voice-system/     (7 voice axes, per-platform shifts)          │
│  skills/compliance-rules/       (crypto/finance compliance checklist)         │
│  skills/<niche>-niche-profile/  (niche-specific voice + audience override)   │
│  skills/ai-tells/               (banned AI-slop patterns, Editor scans)      │
│                                                                              │
│  Frontmatter: static: true | editable_by: human                             │
│  Agents READ before producing. Agents NEVER write.                           │
│  Only human commits modify these files.                                      │
│  Analyst proposes diffs via intelligence-seed; human approves and applies.   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Write Boundaries

```
                      │ .evidence/ │ .evidence/ │ .evidence/ │ skills/ │ raw/    │ DB      │
                      │ knowledge/ │ analysis/  │ wiki/      │         │         │         │
──────────────────────┼────────────┼────────────┼────────────┼─────────┼─────────┼─────────┤
Scripts               │   W (via   │     -      │     -      │    -    │  R+move │  R+W    │
(assets/scripts/)     │ kb-to-md)  │            │            │         │         │         │
Librarian agent       │     R      │     -      │    R+W     │    R    │    -    │    -    │
Analyst agent         │     R      │    R+W     │     R      │    R    │    -    │    -    │
All other agents      │     R      │     R      │     R      │    R    │    -    │    -    │
Humans                │    R+W     │    R+W     │  R + flags │   R+W   │   R+W   │   R+W   │

R = read, W = write, flags = only explored/pinned fields
```

---

## Daily + Weekly Cadence

```
DAILY (Europe/Amsterdam)
━━━━━━━━━━━━━━━━━━━━━━━━
02:00   nightly-wiki-compile     Librarian    compile .evidence/wiki/ per niche
02:30   nightly-qmd-reindex      Librarian    refresh qmd search index per niche
06:00   trend-scan-morning       Scout        scan platforms for signals
07:00   clippings-ingest         Librarian    raw/clippings/ → DB → markdown
08:00   morning-brief            CoS          daily status overview
18:00   trend-scan-evening       Scout        second daily scan

MONDAY
━━━━━━
10:00   weekly-content-sprint    Strategist   3-5 topics per niche queued

FRIDAY (the compounding ritual)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
15:30   weekly-wiki-lint         Librarian    contradictions, orphans, duplicates
16:00   weekly-analyst-review    Analyst      top/bottom posts, patterns (consumes lint)
17:30   intelligence-seed        Analyst      proposed skill diffs per niche
after   human reviews + approves diffs
after   human flips explored flags on wiki pages reviewed

COMPOUNDING LOOP
━━━━━━━━━━━━━━━━
clip during day → 07:00 ingest → 02:00 compile → agents read richer wiki
      ▲                                                         │
      └── human reviews weekly lint + flips explored flags ─────┘
```

Week 1 content is raw. Week 4 reflects 3 rounds of data-driven skill refinement. The graph gets smarter because the skills get better, not because the agents change.

---

## Skill Topology

```
BRAND FOUNDATION (static: true, human-only edits)
  brand-voice-system          7 voice axes, per-platform DNA shifts
  compliance-rules            crypto/finance/DePIN compliance checklist
  world-mobile-niche-profile  niche-specific voice, audience, knowledge sources
  ai-tells                    banned AI-slop patterns (Editor scans drafts)

CONTENT ENGINE (dynamic, iterated via intelligence-seed + Analyst)
  audience-profiles           audience segments per niche
  hooks-library               20+ hook patterns by trigger, iterated weekly
  content-calendar            per-platform cadence caps, best-time-to-post
  content-types               enumerated types with platform fit matrix
  repurpose-engine            1-idea-to-4-platforms (rethink, never reformat)

PLATFORM PLAYBOOKS (externally referenced, pinned SHA)
  x-playbook                  from msitarzewski/agency-agents
  tiktok-playbook             from msitarzewski/agency-agents
  instagram-playbook          from msitarzewski/agency-agents
  threads-playbook            internal

DATA LAYER (contracts + adapters)
  knowledge-base              foundational contract (Zod schema, path convention)
  knowledge-compiler          per-niche wiki compilation contract (Librarian)
  knowledge-query             query + filed-back answer contract (Librarian)
  knowledge-lint              quality sweep contract (Librarian)
  qmd-search                  hybrid search discovery (Librarian only)
  x-posts-adapter             X/Twitter posts intake
  web-article-adapter         blog/news scrape + markdownize intake
  clippings-adapter           Obsidian Web Clipper intake
  intelligence-seed           source-agnostic mining templates (Analyst)
```

---

## Adapter Catalog

| Adapter | Status | Ingests | Script | Env |
|---------|--------|---------|--------|-----|
| `x-posts` | Active | Curated X posts from tweet-curator-pg | `fetch-x-posts.ts` | `DATABASE_URL`, `CURATOR_DATABASE_URL` |
| `web-article` | Active | Blog posts, news (scrape + markdownize) | `fetch-web-article.ts` | `DATABASE_URL` |
| `clippings` | Active | Obsidian Web Clipper markdown drops | `fetch-clippings.ts` | `DATABASE_URL` |
| `youtube-transcripts` | Roadmap | YouTube video transcripts | TBD | TBD |
| `manual-notes` | Roadmap | Hand-written notes, observations | TBD | TBD |
| `rss` | Roadmap | Generic RSS feed items | TBD | TBD |
| `reddit` | Roadmap | Reddit posts and comments | TBD | TBD |

**Adding a new adapter**: copy an existing adapter skill + script stub. Swap source-specific fields. The `knowledge-base` contract stays the same; only `source_type`, `source_identifier`, and `engagement_signals` keys change. Register in `public.source_types`.

---

## DB Strategy

```
Per-project DB, schema-per-niche isolation:

  shoshin-kb (Postgres)
    ├── public (cross-cutting)
    │     niches | source_types | schema_migrations
    └── world_mobile (niche schema)
          knowledge_items (UNIQUE on source_type + source_identifier)

  (future) arrow-kb
    ├── public
    └── defi_lending
```

Naming: niche slug `world-mobile` maps to schema `world_mobile`. Role: `shoshin_world_mobile_rw`. Agents have **no DB role**. Full details in `references/db-strategy.md`.

---

## How to Add a Niche

```bash
# 1. SQL: create schema
NICHE_SLUG=defi-lending NICHE_SCHEMA=defi_lending \
  envsubst < assets/sql/002_niche_template.sql.tmpl | psql shoshin-kb

# 2. Skill: create niche profile
cp skills/world-mobile-niche-profile skills/defi-lending-niche-profile
# edit: identity, audience, compliance, knowledge_sources

# 3. Project: append to niches list
# projects/shoshin/PROJECT.md → niches: [world-mobile, defi-lending]

# 4. Adapters: run fetch scripts for new niche
bun assets/scripts/fetch-x-posts.ts --project-slug shoshin --niche-slug defi-lending
bun assets/scripts/fetch-web-article.ts --project-slug shoshin --niche-slug defi-lending
bun assets/scripts/kb-to-markdown.ts --project-slug shoshin --niche-slug defi-lending

# 5. Seed: bootstrap hooks, voice, audience, baselines
# trigger intelligence-seed task for defi-lending

# 6. Done. Monday's weekly-content-sprint auto-discovers the new niche.
```

Niches are **additive**. Agents and teams never change when you add one.

---

## How to Add a Project

```yaml
# projects/arrow/PROJECT.md
---
name: Arrow
slug: arrow
description: Long-form research reports.
owner: strategist
niches:
  - defi-lending
---
```

Then: create `arrow-kb` Postgres DB, run init migration, apply niche template, run adapters. The 9 agents and 3 teams serve all projects automatically.

---

## Compliance Posture

Shoshin = **third-party independent creator** for World Mobile. Not affiliated with World Mobile Group Ltd.

- Use `$WMTX` (never `$WMT`)
- Never auto-publish (human gate mandatory for crypto content)
- Not-financial-advice boilerplate on every crypto/finance post
- No price predictions or buy/sell signals
- Never impersonate World Mobile Group
- FTC, FCA, MiCA disclosure templates per platform
- Editor 10-item checklist on every regulated-topic draft

---

## Getting Started

```bash
# Import the company into Paperclip
paperclipai company import --from /path/to/companies/oopz/

# Create the project DB
createdb shoshin-kb
psql shoshin-kb -f assets/sql/001_init.sql

# Add a niche
NICHE_SLUG=world-mobile NICHE_SCHEMA=world_mobile \
  envsubst < assets/sql/002_niche_template.sql.tmpl | psql shoshin-kb

# Configure env
export DATABASE_URL=postgres://...shoshin-kb
export CURATOR_DATABASE_URL=postgres://...tweet-curator-pg  # read-only

# Run adapters
bun assets/scripts/fetch-x-posts.ts --project-slug shoshin --niche-slug world-mobile
bun assets/scripts/fetch-web-article.ts --project-slug shoshin --niche-slug world-mobile
bun assets/scripts/kb-to-markdown.ts --project-slug shoshin --niche-slug world-mobile

# Seed the knowledge layer
# trigger intelligence-seed task for world-mobile

# Refine: review proposed diffs, update hooks-library + niche-profile
```

---

## File Map

```
companies/oopz/
├── COMPANY.md                    company identity, goals, tags
├── README.md                     this file
├── .paperclip.yaml               runtime config
├── .qmd/
│   └── qmd.yml                   qmd collection config (version-controlled; index at ~/.cache/qmd/)
├── .gitignore                    selective .evidence/ rules
│
├── agents/                       9 agents, one AGENTS.md each
│   ├── chief-of-staff/
│   ├── strategist/
│   ├── scout/
│   ├── researcher/
│   ├── librarian/                wiki compilation, query, lint
│   ├── writer/
│   ├── editor/
│   ├── scheduler/
│   └── analyst/
│
├── teams/                        3 functional teams
│   ├── discovery/                strategist + scout + researcher + librarian
│   ├── production/               editor + writer
│   └── operations/               scheduler + analyst
│
├── projects/
│   └── shoshin/
│       ├── PROJECT.md            niches: [world-mobile]
│       └── tasks/                project-scoped tasks
│
├── tasks/                        company-level scheduled agent tasks
│   ├── clippings-ingest/         body only; schedule in .paperclip.yaml:routines
│   ├── morning-brief/
│   ├── nightly-qmd-reindex/
│   ├── nightly-wiki-compile/
│   ├── trend-scan/               slug: trend-scan-morning
│   ├── trend-scan-evening/
│   ├── weekly-analyst-review/
│   └── weekly-wiki-lint/
│
├── skills/                       all loadable skills
│   ├── brand-foundation/         BF posture README (container, not a skill)
│   ├── brand-voice-system/       static: true
│   ├── compliance-rules/         static: true
│   ├── ai-tells/                 static: true
│   ├── world-mobile-niche-profile/  static: true
│   ├── knowledge-base/           foundational contract + schema.ts
│   ├── knowledge-compiler/       wiki compilation contract
│   ├── knowledge-query/          wiki query contract
│   ├── knowledge-lint/           wiki lint contract
│   ├── x-posts-adapter/
│   ├── web-article-adapter/
│   ├── clippings-adapter/
│   ├── intelligence-seed/
│   ├── hooks-library/
│   ├── audience-profiles/
│   ├── content-calendar/
│   ├── content-types/
│   ├── repurpose-engine/
│   ├── x-playbook/
│   ├── tiktok-playbook/
│   ├── instagram-playbook/
│   └── threads-playbook/
│
├── assets/
│   ├── scripts/                  deterministic fetch/transform (bun)
│   │   ├── fetch-x-posts.ts
│   │   ├── fetch-web-article.ts
│   │   ├── fetch-clippings.ts
│   │   ├── kb-to-markdown.ts
│   │   └── validate-kb.ts
│   └── sql/                      numbered migrations
│       ├── 001_init.sql
│       ├── 002_niche_template.sql.tmpl
│       └── 003_clippings_source_type.sql
│
├── references/
│   └── db-strategy.md
│
├── raw/                          gitignored intake (Obsidian clips land here)
│   └── clippings/
│       └── processed/            audit trail of ingested clips
│
└── .evidence/                    runtime data
    ├── knowledge/                per-niche normalized items (gitignored)
    │   └── world-mobile/
    │       ├── x-posts/
    │       ├── web-article/
    │       └── clippings/
    ├── wiki/                     compiled wiki (git-tracked for review state)
    │   └── world-mobile/
    │       ├── index.md
    │       ├── concepts/
    │       ├── entities/
    │       ├── topics/
    │       ├── queries/
    │       └── _lint/
    └── analysis/                 intelligence-seed proposed diffs (gitignored)
        └── world-mobile/
```

---

## Scheduling

Two separate scheduling concerns with no overlap:

**Paperclip Routines** handle agent execution. Ten routines are wired in `.paperclip.yaml:routines`, one per `tasks/<slug>/TASK.md`. Paperclip's importer reads the routines block at `paperclipai company import`, creates a Routine per slug with a cron trigger, and fires the assignee agent at each tick via issue creation and heartbeat wakeup. TASK.md body is the instruction set; `.paperclip.yaml` is the schedule source of truth. See the Daily + Weekly Cadence section above for the full timetable.

**Trigger.dev ingest jobs** handle data-pipeline scripts. Not yet wired. The scripts under `assets/scripts/` (fetch-x-posts, fetch-web-article, fetch-clippings, kb-to-markdown) are stubs. When implemented, they will run under Trigger.dev or cron:

```
Self-hosted Trigger.dev (existing upstream):
  tweet-curator-scraper          every 15min    → tweet-curator-pg
  web-article-scraper            every 60min    → scrape storage

Oopz ingest jobs (planned, stubs in assets/scripts/):
  oopz-fetch-x-posts             every 30min    tweet-curator-pg → shoshin-kb
  oopz-fetch-web-article         every 60min    web-scrape → shoshin-kb
  oopz-project-to-markdown       after fetches  shoshin-kb → .evidence/knowledge/
  oopz-fetch-clippings           daily 07:00    raw/clippings/ → shoshin-kb
```

Upstream scrapers own source DBs. Oopz ingest jobs pull from source DBs into `shoshin-kb`. `kb-to-markdown.ts` projects to files. Agents read files. Paperclip Routines handle agent execution. Trigger.dev (once wired) handles data-pipeline scripts. The two systems never touch the same concern.

---

## Citations and Credits

- Architecture: [Ronin's skill graph content engine](https://x.com/DeRonin_/status/2042604279077237170), [Eric Osiu's OpenClaw marketing team](https://x.com/ericosiu/status/2043083581824827584)
- Knowledge layer pattern: [Shann Holmberg's AI Knowledge Layer](https://x.com/shannholmberg/status/2044111115878326444), [LLM Wikid](https://github.com/shannhk/llm-wikid)
- External skills: [msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents) @ `783f6a72`
- Spec: [Agent Companies Specification](https://agentcompanies.io/specification)
- Runtime: [Paperclip](https://github.com/paperclipai/paperclip)

---

## License

MIT. See `LICENSE`.

---

## Known Architectural Gaps

### Knowledge filtering / signal-to-noise

Current pipeline projects **every** row from `shoshin-kb.world_mobile.knowledge_items` into markdown under `.evidence/knowledge/<niche>/<source-type>/*.md`. No quality filter between DB and markdown. No ranking before wiki compilation.

**Implication at scale**: high-volume sources (X posts from many accounts) may flood `.evidence/knowledge/` with low-signal items, bloat the repo, and pollute wiki compilation with noise. At low volume (strict author whitelist, <500 items/month), this is fine. At medium or high volume, a filter pipeline is required.

**Deferred by design**: volume and signal criteria are unknown until the pipeline runs in production. Designing a filter before seeing real data risks optimizing against the wrong metric. Placeholder plan: `.sisyphus/plans/knowledge-filtering.md` captures the open design questions (filter stage location, scoring approach, threshold, what to do with filtered-out items) for later resolution.

**Triggers to build the filter**:
- `.evidence/knowledge/<niche>/x-posts/` exceeds ~500 files
- Librarian wiki-compile produces noisy concept pages
- Agent token costs per run climb past acceptable bounds
- Analyst notices low-signal items dominating patterns

## Roadmap (not built yet)

- Long-form platforms (LinkedIn, YouTube, Newsletter)
- Automated publishing (human-in-the-loop is intentional, not a limitation)
- Multiple Shoshin niches (architecture supports it; only world-mobile active Day 1)
- Additional Oopz projects (siblings to Shoshin)
- `youtube-transcripts`, `manual-notes`, `rss`, `reddit` adapters
- **Knowledge filtering pipeline** (see Known Architectural Gaps above)
- ~~qmd/BM25 + vector retrieval~~ DONE (see .sisyphus/plans/qmd-integration.md)
- Cross-project "Oopz brain" (shared knowledge above project level)
- Obsidian per-project vault integration
- Autonomy expansion (loosen human-publish gates on low-risk content)
