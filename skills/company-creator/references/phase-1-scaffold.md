# Phase 1: Scaffold the Company Package

Create the directory structure and config files for a new Paperclip company.
Replace `<brand>` with your company slug (lowercase, hyphenated, e.g. `acme`).

---

## 1. Create the top-level directory

```bash
mkdir -p companies/<brand>
```

## 2. Create COMPANY.md

Copy from the template and fill in your brand identity:

```bash
cp skills/company-creator/templates/COMPANY.md.tmpl companies/<brand>/COMPANY.md
```

Open `companies/<brand>/COMPANY.md` and replace every `{{placeholder}}` field:
- `name`: human-readable company name
- `slug`: matches the directory name
- `description`: one sentence, what the company does
- `niches`: start with an empty list `[]`; you'll add the first niche in Phase 5
- `tags`: optional labels for Paperclip UI filtering

See `[[company-creator/templates/COMPANY.md.tmpl]]` for the full schema.

## 3. Create AGENTS.md

```bash
touch companies/<brand>/AGENTS.md
```

Add a brief description of the agent graph you plan to build. This file is
read by Paperclip's importer to surface agent context. You can flesh it out
after Phase 1; a stub is fine for now.

## 4. Create .paperclip.yaml

```bash
cat > companies/<brand>/.paperclip.yaml << 'EOF'
schema: paperclip/v1

mcp_servers:
  qmd:
    command: qmd
    args: [mcp]

routines: {}
EOF
```

The `routines` block starts empty. You'll wire routines in Phase 6 once tasks
exist. The `mcp_servers.qmd` entry is always present; qmd won't be functional
until Phase 4 but the key can live here from day one.

## 5. Create teams/ structure

```bash
mkdir -p companies/<brand>/teams/discovery
mkdir -p companies/<brand>/teams/production
mkdir -p companies/<brand>/teams/operations
```

Add a `TEAM.md` stub in each:

```bash
for team in discovery production operations; do
  echo "# ${team^} Team" > companies/<brand>/teams/${team}/TEAM.md
done
```

## 6. Copy agents from repo-root library

The repo root has a shared `agents/` library with all 9 agent definitions. Copy the whole tree into the company package:

```bash
cp -r agents/ companies/<brand>/agents/
```

Four agents are parameterized and need brand-specific content generated from templates. Set your brand variables, then run `envsubst` to overwrite the generic copies:

```bash
export BRAND_NAME=<brand>
export BRAND_DESCRIPTION="<one-line description>"
export PLATFORMS="<platform list, e.g. X, TikTok, Instagram, and Threads>"
export NICHES_DESCRIPTION="<how to reference active niches>"
export COMPLIANCE_POSTURE="<risk statement>"
export COMPLIANCE_GUARDRAIL="<the specific guardrail>"
export NICHE_PROFILE_FILENAME="<niche>-niche-profile.md"

envsubst < skills/company-creator/templates/chief-of-staff.AGENTS.md.tmpl > companies/<brand>/agents/chief-of-staff/AGENTS.md
envsubst < skills/company-creator/templates/scout.AGENTS.md.tmpl > companies/<brand>/agents/scout/AGENTS.md
envsubst < skills/company-creator/templates/scheduler.AGENTS.md.tmpl > companies/<brand>/agents/scheduler/AGENTS.md
envsubst < skills/company-creator/templates/analyst.AGENTS.md.tmpl > companies/<brand>/agents/analyst/AGENTS.md
```

The remaining 5 agents (strategist, researcher, librarian, writer, editor) are generic and can be used as-is from the copy.

## 7. Copy teams from repo-root library

The repo root also has a shared `teams/` library with the 3 team definitions. Copy them in:

```bash
cp -r teams/ companies/<brand>/teams/
```

The generic team files say "serves the company". To make them brand-specific, optionally replace that phrase:

```bash
for team in discovery production operations; do
  sed -i 's/serves the company/serves the <brand> company/g' companies/<brand>/teams/${team}/TEAM.md
done
```

## 8. Create .gitignore

```bash
cat > companies/<brand>/.gitignore << 'EOF'
# Raw intake (Obsidian clips, unprocessed drops)
raw/clippings/
!raw/clippings/processed/

# Knowledge items (high-volume, regenerable from DB)
.evidence/knowledge/

# Intelligence-seed proposed diffs (human reviews before applying)
.evidence/analysis/

# qmd index lives in ~/.cache/qmd/, not in the repo
.qmd/index/
EOF
```

The `.evidence/wiki/` directory is git-tracked so humans can review and flip
`explored` flags. Everything else under `.evidence/` is regenerable.

## 9. Verify structure

```bash
find companies/<brand> -type f | sort
```

Also check agent and team file counts:

```bash
ls companies/<brand>/agents/*/AGENTS.md | wc -l   # Expected: 9
ls companies/<brand>/teams/*/TEAM.md | wc -l       # Expected: 3
```

Expected output from `find` (at minimum):

```
companies/<brand>/.gitignore
companies/<brand>/.paperclip.yaml
companies/<brand>/AGENTS.md
companies/<brand>/COMPANY.md
companies/<brand>/agents/analyst/AGENTS.md
companies/<brand>/agents/chief-of-staff/AGENTS.md
companies/<brand>/agents/editor/AGENTS.md
companies/<brand>/agents/librarian/AGENTS.md
companies/<brand>/agents/researcher/AGENTS.md
companies/<brand>/agents/scheduler/AGENTS.md
companies/<brand>/agents/scout/AGENTS.md
companies/<brand>/agents/strategist/AGENTS.md
companies/<brand>/agents/writer/AGENTS.md
companies/<brand>/teams/discovery/TEAM.md
companies/<brand>/teams/operations/TEAM.md
companies/<brand>/teams/production/TEAM.md
```

Phase 1 complete. Move to Phase 2 to set up the knowledge base.
