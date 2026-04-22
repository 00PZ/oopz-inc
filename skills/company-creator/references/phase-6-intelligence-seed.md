# Phase 6: Wire the Intelligence Seed Routine

The `intelligence-seed` routine is the compounding loop. Every Friday at 17:30,
the Analyst agent runs the `[[intelligence-seed]]` skill over the compiled wiki
for each niche. It produces proposed skill diffs that a human reviews and applies.
Week over week, the skills get better. The agents don't change; the instructions do.

Replace `<brand>` with your company slug.

---

## 1. Create the task directory

```bash
mkdir -p companies/<brand>/tasks/intelligence-seed
```

## 2. Create TASK.md

```bash
cat > companies/<brand>/tasks/intelligence-seed/TASK.md << 'EOF'
# intelligence-seed

Run the intelligence-seed skill for every active niche.

For each niche in COMPANY.md:niches:
1. Load the [[intelligence-seed]] skill.
2. Read .evidence/wiki/<niche>/ (compiled wiki pages).
3. Read .evidence/analysis/<niche>/ (prior proposed diffs, if any).
4. Produce proposed diffs for skills that show clear improvement signals.
5. Write each proposed diff to .evidence/analysis/<niche>/YYYY-MM-DD/proposed-<skill-slug>.md.
6. Do not apply diffs. Human reviews and applies.

Output: one proposed-*.md file per skill that warrants a change.
If no changes are warranted, write a brief summary explaining why.
EOF
```

The TASK.md body is the Analyst's instruction set. The schedule lives in
`.paperclip.yaml:routines`, not in this file.

## 3. Wire the routine in .paperclip.yaml

Open `companies/<brand>/.paperclip.yaml` and add the `intelligence-seed` entry
to the `routines` block:

```yaml
routines:
  intelligence-seed:
    triggers:
      - kind: schedule
        cronExpression: "30 17 * * 5"
        timezone: Europe/Amsterdam
```

The routine slug (`intelligence-seed`) must match the task directory name exactly.
Paperclip's importer reads the slug to link the routine to the TASK.md body.

## 4. Create the analysis output directory

```bash
mkdir -p companies/<brand>/.evidence/analysis/<slug>
```

This directory is gitignored (see Phase 1). Proposed diffs land here. Humans
review them, then apply the ones they approve by editing the relevant skill files
and committing.

## 5. Understand the maturation timeline

The intelligence-seed loop compounds over weeks, not days.

**Week 1**: Analyst has thin data. Proposed diffs are tentative. Expect broad
observations rather than precise skill edits. Apply conservatively.

**Week 2**: Two rounds of content have run. Analyst can compare what performed
vs. what didn't. Diffs become more targeted (specific hook patterns, voice
adjustments per platform).

**Week 3**: Three rounds in. Hooks-library and niche-profile diffs are grounded
in real engagement data. Apply with more confidence.

**Week 4**: The system has a baseline. Diffs at this point reflect genuine
signal. The skills are materially better than Day 1.

The loop: clip during the week, adapters ingest, Librarian compiles wiki,
Analyst reads wiki, proposes diffs, human applies, agents read better skills,
content improves, repeat.

## 6. Verify the routine slug

Before importing in Phase 7, confirm the slug in `.paperclip.yaml` matches the
task directory name:

```bash
ls companies/<brand>/tasks/
# should include: intelligence-seed

grep 'intelligence-seed' companies/<brand>/.paperclip.yaml
# should show the routines entry
```

Phase 6 complete. Intelligence seed is wired. Move to Phase 7 to import into Paperclip.
