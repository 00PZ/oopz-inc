# Phase 7: Import into Paperclip

With the package scaffolded, the DB live, adapters wired, and routines configured,
you're ready to import the company into Paperclip. This phase validates the config,
commits the package, and runs the import command.

Replace `<brand>` with your company slug and `YOUR_ORG` with your GitHub org or username.

---

## 1. Validate .paperclip.yaml

```bash
yq '.' companies/<brand>/.paperclip.yaml
```

If `yq` exits non-zero, fix the YAML syntax before proceeding. Common issues:
- Indentation errors in the `routines` block
- Missing `schema: paperclip/v1` at the top
- Tabs instead of spaces

## 2. Verify the routines block

Confirm every routine slug matches a task directory name:

```bash
# List routine slugs from .paperclip.yaml
yq '.routines | keys | .[]' companies/<brand>/.paperclip.yaml

# List task directories
ls companies/<brand>/tasks/
```

Every slug from the YAML must appear in `tasks/`. A mismatch means Paperclip
will create a routine with no TASK.md body, and the agent will have no instructions.

## 3. Verify agents exist

```bash
ls companies/<brand>/agents/
```

Each agent directory must contain an `AGENTS.md` file. Paperclip's importer
skips directories without one.

## 4. Commit the package

```bash
git add -A
git commit -m "feat: init <brand> company"
```

Push to your remote so Paperclip can fetch it:

```bash
git push
```

## 5. Import into Paperclip

```bash
paperclipai company import --from github:YOUR_ORG/oopz-inc?path=companies/<brand>
```

The importer reads the package at `companies/<brand>/`, creates the company entity,
registers agents and teams, and wires routines from the `.paperclip.yaml:routines` block.

## 6. Verify in the Paperclip UI

After import completes, open the Paperclip UI and confirm:

1. **Company appears** in the company list with the correct name and slug.
2. **Agents appear** under the company with the correct names and team assignments.
3. **Routines are listed** with the correct cron schedules.
4. **MCP servers** show `qmd` as configured (if Paperclip surfaces this in the UI).

## 7. Troubleshooting

**Routines missing after import:**
The routine slug in `.paperclip.yaml` must match the task directory name exactly.
Check for typos:

```bash
diff \
  <(yq '.routines | keys | .[]' companies/<brand>/.paperclip.yaml | sort) \
  <(ls companies/<brand>/tasks/ | sort)
```

Any lines in the diff indicate a mismatch. Fix the slug in `.paperclip.yaml`
(or rename the task directory), commit, and re-import.

**Agents not appearing:**
Confirm each agent directory has an `AGENTS.md`:

```bash
for dir in companies/<brand>/agents/*/; do
  [ -f "${dir}AGENTS.md" ] || echo "Missing AGENTS.md: $dir"
done
```

**Import fails with auth error:**
Ensure the repo is public, or that Paperclip has a GitHub token with read access
to the repo. Check Paperclip's credential settings.

**qmd MCP not connecting:**
Verify `qmd` is installed and on `$PATH` on the machine running Paperclip:

```bash
which qmd && qmd --version
```

If qmd isn't available, switch to the HTTP transport fallback (see Phase 4).

---

Phase 7 complete. The company is live in Paperclip. Routines will fire on schedule.
The intelligence-seed loop starts compounding from the first Friday run.
