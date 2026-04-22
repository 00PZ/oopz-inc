# oopz-inc

Portfolio git repo for Paperclip agent companies.

`oopz-inc` is the name of this git repository. It's not a Paperclip entity, org, or company. It's just where the company packages live.

---

## What's In Here

| Directory | Purpose |
|-----------|---------|
| `agents/` | Reusable agent definitions. Source AGENTS.md files copied into company packages during scaffold. |
| `companies/` | Paperclip company packages. Each subdirectory is a standalone company that can be imported into Paperclip. |
| `skills/` | Reusable skills library. Source skills that can be copied into company packages or used as references. |
| `teams/` | Reusable team definitions. Source TEAM.md files copied into company packages during scaffold. |

---

## Current Companies

### `shoshin/`

Multi-niche short-form social media content engine. 9 agents across 3 teams. Day-1 niche: World Mobile (DePIN telecom). Produces platform-native content for X, TikTok, Instagram, and Threads.

See [`companies/shoshin/README.md`](companies/shoshin/README.md) for full details.

---

## Skills Library

The `skills/` directory is a source library, not a Paperclip runtime directory. Skills here are templates and references. To use them, copy the relevant skill into a company package.

Current skills:

- `company-creator` - Scaffold a new Paperclip company package from scratch
- `knowledge-base-setup` - Bootstrap a company's knowledge base structure

See [`skills/README.md`](skills/README.md) for details on each skill.

---

## Importing a Company into Paperclip

Each company package lives at its own path within this repo. Use the `?path=` parameter to point Paperclip at the right subdirectory.

```bash
paperclipai company import --from github:YOUR_ORG/oopz-inc?path=companies/shoshin
```

Replace `YOUR_ORG` with your GitHub org or username, and `shoshin` with the company slug you want to import.

The general format:

```
github:YOUR_ORG/oopz-inc?path=companies/<slug>
```

---

## Adding a New Company

Use the `skills/company-creator/` skill as a guide. The rough steps:

1. Copy `companies/shoshin/` as a starting pattern
2. Rename all slugs and identifiers to match your new company name
3. Swap out the niche profile, agent names, and content strategy

The `company-creator` skill walks through each step in detail.
