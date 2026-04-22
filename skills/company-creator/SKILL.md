---
name: company-creator
description: >
  Create a new brand company in the oopz-inc portfolio following Shoshin's patterns:
  Postgres knowledge base with niche-scoped schemas, qmd hybrid search, intelligence-seed
  compounding ritual, third-party-creator compliance posture, and Paperclip Routines
  scheduling. Use when adding a new brand alongside Shoshin in this repo. Not a generic
  Paperclip company creator; opinionated for the oopz-inc stack.
---

# Company Creator

Orchestration playbook for creating a new peer brand in oopz-inc.

This skill guides you through scaffolding a new brand company that follows Shoshin's patterns. It assumes Shoshin as the canonical reference implementation and Paperclip as the runtime.

> Forked and adapted from [paperclipai/companies/skills/company-creator](https://github.com/paperclipai/companies/tree/main/skills/company-creator) (MIT). Customized for the oopz-inc portfolio stack (Postgres KB, qmd hybrid search, intelligence-seed compounding, Paperclip Routines).

## Purpose

Use this skill when:

- Adding a new brand alongside Shoshin (e.g. "arrow" for long-form research, "hawk" for B2B content)
- Each brand gets its own standalone Paperclip company package in `companies/`
- NOT for creating a generic Paperclip company. This is opinionated for oopz-inc's Postgres-KB + qmd + intelligence-seed stack.

## Scope Discipline

**What this skill DOES**: guides scaffold + KB + qmd + intelligence-seed setup across 7 phases.

**What this skill DOES NOT**: generate agents or skills from scratch. Those are copy-adapted from `companies/shoshin/`. The phase docs tell you exactly which files to copy and what to rename.

## Two Modes

Inherited from upstream, kept because it's useful framing. We added a third mode that's the primary path for oopz-inc:

- **From scratch**: design the company from concept. Use when the new brand has no prior art in this repo.
- **From external repo**: analyze an existing repo and scaffold a company around it. Use when wrapping an existing codebase or skills collection.
- **From shoshin-pattern** (primary for oopz-inc): clone shoshin, rename slugs, swap niche profile, add to oopz-inc. This is the recommended starting point for new oopz-inc brands. Shoshin's 9-agent graph, 3-team structure, and data pipeline are proven. Copy them, don't reinvent them.

## Orchestration Overview

7 phases, each documented in a reference file under `references/`. Proceed through them in order. Each phase produces concrete filesystem or DB changes.

**Phase 1: Scaffold** -- create the directory structure, COMPANY.md, AGENTS.md, .paperclip.yaml, and .gitignore. This is the skeleton. Nothing runs yet.

**Phase 2: Knowledge Base** -- create the Postgres DB, run the public schema migration, set environment variables. This is the data foundation. Agents never touch it directly.

**Phase 3: Adapters** -- set up data intake scripts (x-posts, web-article, clippings stubs) and their corresponding skill stubs. Scripts hold credentials; agents never do.

**Phase 4: qmd** -- configure hybrid search, set up the qmd collection config, bind the qmd MCP server in .paperclip.yaml. Librarian uses this for discovery before synthesis.

**Phase 5: First Niche** -- create the niche-profile skill, add the niche SQL schema, bootstrap the knowledge directory structure. This is where the brand gets its first subject-matter focus.

**Phase 6: Intelligence Seed** -- wire the intelligence-seed task and set up the Friday compounding ritual. This is what makes the system get smarter over time.

**Phase 7: Paperclip Import** -- validate routines format, import the company into Paperclip, verify routines appear in the dashboard. The company is live after this phase.

## Phase Manifest

| Phase | Reference | Produces |
|-------|-----------|----------|
| 1 - Scaffold | `[[company-creator/references/phase-1-scaffold]]` | `companies/<brand>/` directory structure, COMPANY.md, AGENTS.md, .paperclip.yaml |
| 2 - Knowledge Base | `[[company-creator/references/phase-2-knowledge-base]]` | Postgres DB, public schema, 001_init.sql applied |
| 3 - Adapters | `[[company-creator/references/phase-3-adapters]]` | Adapter scripts in `assets/scripts/`, stub SKILL.md per adapter |
| 4 - qmd | `[[company-creator/references/phase-4-qmd]]` | `.qmd/qmd.yml`, qmd MCP in `.paperclip.yaml`, sync script |
| 5 - First Niche | `[[company-creator/references/phase-5-first-niche]]` | Niche schema in DB, niche-profile SKILL.md, evidence dir |
| 6 - Intelligence Seed | `[[company-creator/references/phase-6-intelligence-seed]]` | intelligence-seed task wired, Friday ritual ready |
| 7 - Paperclip Import | `[[company-creator/references/phase-7-paperclip-import]]` | Company live in Paperclip, routines firing |

## Decision Points

Answer these before starting Phase 1. They shape every naming decision downstream.

1. **Brand name?** Becomes the company slug, directory name, and DB name (e.g. `arrow` -> `companies/arrow/`, `arrow-kb`).
2. **Initial niches?** List of slug(s) for `COMPANY.md:niches` (e.g. `defi-lending`, `world-mobile`). At least one required.
3. **Platforms?** X, TikTok, Instagram, Threads. Affects adapter stubs and agent playbooks. Shoshin targets all four; a new brand can start with fewer.
4. **Compliance posture?** Third-party independent creator is the default. It requires a mandatory human gate before publishing and not-financial-advice boilerplate on regulated-topic content. Note any deviations.
5. **Workflow pattern?** Pipeline is Shoshin's pattern (`Scout -> Strategist -> Researcher -> Writer -> Editor -> Scheduler -> Analyst`). Hub-and-spoke and On-demand are also supported. Pick before designing the agent graph.

## Prerequisites Checklist

Before starting Phase 1, confirm all of these:

- [ ] Postgres installed and reachable locally
- [ ] Bun installed (`bun --version`)
- [ ] qmd installed (`qmd --version`)
- [ ] Paperclip CLI available (`paperclipai --version`)
- [ ] GitHub access to oopz-inc repo (needed for the import URL in Phase 7)

## Success Criteria

The new company passes when all of these hold:

- `yq '.slug' companies/<brand>/COMPANY.md` returns `<brand>`
- `yq '.niches | .[]' companies/<brand>/COMPANY.md` returns at least 1 niche
- `bun test companies/<brand>/assets/scripts/` passes
- `paperclipai company import --from github:ORG/oopz-inc?path=companies/<brand>` succeeds
- Routines appear in the Paperclip dashboard

## Owned By

Human-invoked. Not an agent task. This skill is loaded by a human (or Claude) when creating a new brand, not by any automated routine.
