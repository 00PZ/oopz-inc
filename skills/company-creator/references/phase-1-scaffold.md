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

## 6. Create .gitignore

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

## 7. Verify structure

```bash
find companies/<brand> -type f | sort
```

Expected output (at minimum):

```
companies/<brand>/.gitignore
companies/<brand>/.paperclip.yaml
companies/<brand>/AGENTS.md
companies/<brand>/COMPANY.md
companies/<brand>/teams/discovery/TEAM.md
companies/<brand>/teams/operations/TEAM.md
companies/<brand>/teams/production/TEAM.md
```

Phase 1 complete. Move to Phase 2 to set up the knowledge base.
