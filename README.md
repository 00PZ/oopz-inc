# oopz-inc

Portfolio git repo for Paperclip agent companies.

`oopz-inc` is the name of this git repository. It's not a Paperclip entity, org, or company. It's just where the company packages live.

---

## What's In Here

| Directory | Purpose |
|-----------|---------|
| `agents/` | Reusable agent definitions. Source AGENTS.md files copied into company packages during scaffold. |
| `companies/` | Paperclip company packages. Each subdirectory is a standalone company that can be imported into Paperclip. |
| `skills/` | Reusable engineering skills library. Source skills for copying into company packages. |
| `teams/` | Reusable team definitions. Source TEAM.md files copied into company packages during scaffold. |

---

## Current Companies

### `shoshin/`

Short-form social media content engine. 2 agents (Content Manager + Content Writer), 1 editorial team, 3 routines. Day-1 niche: World Mobile (DePIN telecom). Produces platform-native content for X, TikTok, Instagram, and Threads. Knowledge layer: gbrain MCP.

See [`companies/shoshin/README.md`](companies/shoshin/README.md) for full details.

---

## Skills Library

The `skills/` directory is a source library of engineering-focused skills — not a Paperclip runtime directory. Content companies (like Shoshin) define their own skills inside their company package. Engineering skills here are templates for software/infrastructure companies.

Current engineering skills:

- `company-creator` — Scaffold a new Paperclip company package from scratch
- `knowledge-base-setup` — Bootstrap a company's knowledge base structure
- `tdd-workflow` — RED-GREEN-REFACTOR-REVIEW-SHIP loop for test-driven implementation
- `code-review-checklist` — Diff review methodology with blocker/suggestion/nit triage
- `release-checklist` — Pre-release gate with tests, docs, deploy steps, and rollback plan
- `vite-build` — Vite dev server, production build, bundle analysis
- `github-actions-release` — GitHub Actions release workflow patterns
- `k8s-deploy` — Kubernetes deployment, rollout, and rollback patterns
- `cnpg-operations` — CloudNativePG cluster operations and day-2 management
- `tailscale-network` — Tailscale ACL design, MagicDNS, and Kubernetes integration

See [`skills/README.md`](skills/README.md) for details on each skill.

---

## Importing a Company into Paperclip

Each company package lives at its own path within this repo. Use the `?path=` parameter to point Paperclip at the right subdirectory.

```bash
paperclipai company import --from github:00PZ/oopz-inc?path=companies/shoshin
```

The general format:

```
github:00PZ/oopz-inc?path=companies/<slug>
```

---

## Adding a New Company

Use the `skills/company-creator/` skill as a guide. The rough steps:

1. Copy `companies/shoshin/` as a starting pattern
2. Rename all slugs and identifiers to match your new company name
3. Swap out the niche profile, agent names, and content strategy
4. Connect gbrain MCP if the company needs institutional memory

The `company-creator` skill walks through each step in detail.
