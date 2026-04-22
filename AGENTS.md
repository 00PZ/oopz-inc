# AGENTS.md - oopz-inc

`oopz-inc` is a portfolio git repo for Paperclip agent companies. It is NOT a Paperclip entity itself, just where company packages live. Working directory for all agent coding tasks is the repo root.

---

## Directory Map

| Path | Purpose |
|------|---------|
| `agents/` | Source agent library. 9 AGENTS.md files. Copy into company packages at scaffold time. |
| `teams/` | Source team library. 3 TEAM.md files. Copy into company packages at scaffold time. |
| `skills/` | Source skills library. Copy into company packages. NOT a Paperclip runtime dir. |
| `companies/` | Paperclip company packages. Each subdirectory is a standalone importable company. |
| `.sisyphus/` | AI agent work state (plans, notepads, evidence). Do not modify manually. |

---

## Library vs Runtime Pattern

`agents/`, `teams/`, and `skills/` are source libraries. Content gets COPIED into each company package at scaffold time. Companies may customize their copy. Do NOT symlink.

---

## Agents Library

9 agents total, split into two groups:

**Generic (copy verbatim, zero brand references):**
- `strategist`, `researcher`, `librarian`, `writer`, `editor`

**Parameterized (have generic defaults, use templates for brand-specific versions):**
- `chief-of-staff`, `scout`, `scheduler`, `analyst`

Templates live at `skills/company-creator/templates/*.AGENTS.md.tmpl` using `${VAR}` envsubst syntax.

To regenerate a brand-specific agent from a template:
```bash
VAR=value envsubst < template.tmpl | sed '/^<!--/,/^-->/d' > output.md
```

---

## Adding a New Company

Follow `skills/company-creator/` phase by phase. Phase 1 scaffold reference: `skills/company-creator/references/phase-1-scaffold.md`.

---

## Key Conventions

- No em-dashes in any file (use commas, periods, or parentheses instead)
- Generic agents must have zero brand references (shoshin, oopz, world.mobile, tiktok, crypto)
- `bun test` runs in `companies/shoshin/assets/scripts/` - expected: 26 pass, 0 fail
- Commit style: conventional commits (`refactor:`, `feat:`, `fix:`, etc.)

---

## Do NOT

- Modify `.sisyphus/plans/*.md` (plan files are orchestrator-managed, read-only)
- Push to remote without explicit user instruction
- Add em-dashes to any file
