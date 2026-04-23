# Skills Library

This directory is a **source library** of reusable skills for the oopz-inc portfolio.

Skills here are maintained in one place and copied into company packages when needed. This is NOT a Paperclip runtime directory. Paperclip loads skills from within each company's `companies/<brand>/skills/` directory, not from here.

## Library vs Runtime

| Location | Purpose |
|---|---|
| `skills/<name>/` | Source of truth. Edit here. |
| `companies/<brand>/skills/<name>/` | Runtime copy. Paperclip reads this. |

The split exists because each brand may need a customized version of a skill. Copying gives you that freedom without tangling the source.

The same library-vs-runtime pattern applies to `agents/` and `teams/` at repo root. Generic AGENTS.md and TEAM.md files live there as source; they are copied (and optionally parameterized via templates) into each company package during scaffold.

## Usage Pattern

To use a skill in a company:

1. Copy the skill directory into the company package:
   ```
   cp -r skills/<skill-name>/ companies/<brand>/skills/<skill-name>/
   ```
2. Customize for the brand: update references, add brand-specific examples, adjust tone.
3. Paperclip will pick it up from the company's `skills/` directory on next import.

Symlinks work too if your workflow supports them, but copying is safer for portability.

## Current Skills

### `company-creator/`

Orchestration playbook for creating a new brand company in oopz-inc. Covers 7 phases:

1. Scaffold the company directory structure
2. Set up the knowledge base
3. Build adapters
4. Configure QMD
5. Define the first niche
6. Seed intelligence
7. Import into Paperclip

### `knowledge-base-setup/`

Focused guide for setting up the Postgres knowledge base layer. Covers schema-per-niche design, adapter patterns, and markdown projection for the librarian agent.

### `tdd-workflow/`

Disciplined RED, GREEN, REFACTOR, REVIEW, SHIP loop for test-driven implementation work. Stack-agnostic process for any language or framework.

### `code-review-checklist/`

Pragmatic code review methodology. Triages diff feedback into blocker, suggestion, and nit priorities. Stack-agnostic, review any language.

### `release-checklist/`

Pre-release gate covering tests, documentation, deployment steps, and rollback plan. Stack-agnostic process suitable for any deployment target.

## Skill Conventions

Each skill is a directory containing at least one file:

- `SKILL.md` (required): The skill instructions. Must start with YAML frontmatter.
  ```yaml
  ---
  name: skill-name
  description: One sentence describing what this skill does.
  ---
  ```
- `references/` (optional): Supporting documents, specs, or examples.
- `templates/` (optional): Reusable file templates the skill references.

Keep skills focused. One skill, one concern. If a skill grows beyond a single clear purpose, split it.
