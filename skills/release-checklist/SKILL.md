---
name: release-checklist
description: Pre-release gate covering tests, documentation, deployment steps, and rollback plan. Stack-agnostic process suitable for any deployment target.
---

## Purpose

This skill guards against three failure modes: shipping untested changes, shipping undocumented changes, and shipping changes you can't undo.

Every release, no matter how small, passes through this gate before anything touches a production environment. The gate is not bureaucracy. It's the minimum set of checks that prevents a bad day from becoming a bad week.

Use this skill when preparing any versioned release: a patch fix, a minor feature, or a breaking major change.

## Pre-Release Gate

All five checks must pass before release proceeds. If any check fails, stop and resolve it first.

### 1. Tests green on the target branch

Run the full test suite against the branch you intend to release. No skipped tests. No known failures marked as "acceptable." If a test is failing and you believe it's wrong, fix or delete the test with a clear commit message explaining why.

Confirm:
- Unit tests pass
- Integration tests pass (if applicable)
- No test suite was bypassed or silenced to make the run green

### 2. Changelog or release notes updated

Every release gets a human-readable entry. The entry lives in the project's changelog file (or equivalent release notes document) and describes what changed, not how it changed internally.

Format per entry:
- Version number and release date
- What was added, changed, or removed (user-facing language)
- Any known limitations or caveats

If nothing changed from the user's point of view (internal refactor only), note that explicitly. "No user-facing changes" is a valid entry.

### 3. Public API or schema changes documented

If this release changes any public interface (API endpoints, data schemas, configuration contracts, event formats), those changes must be documented before release.

Confirm:
- Breaking changes are clearly marked
- Migration path is described for any breaking change
- Deprecations include a timeline for removal
- New fields or endpoints are described with types and examples

If there are no interface changes, mark this check as N/A and move on.

### 4. Deployment steps written, each reversible

Write out the deployment procedure as a numbered list. Each step must be reversible on its own. If a step cannot be reversed (for example, a destructive data migration), it must be explicitly flagged and approved before proceeding.

Each step should include:
- What action is taken
- How to verify it succeeded
- How to reverse it if it fails

Do not rely on memory or tribal knowledge. If the person deploying is new to the system, these steps should be enough to get them through safely.

### 5. Rollback plan documented

A rollback plan is not the same as reversible deployment steps. The rollback plan answers: "If we deploy and something goes wrong in production, what do we do?"

The plan must include:
- The trigger condition (what signals that a rollback is needed)
- The recovery sequence (abstract commands, not tool-specific invocations)
- The expected recovery time
- Who is responsible for executing it

Example recovery sequence format (fill in your actual commands):

```
1. Revert the deployment to the previous version: <revert command>
2. Confirm the previous version is serving traffic: <health check command>
3. Notify the team: <notification step>
4. Open a post-mortem issue: <issue tracker step>
```

Keep the rollback plan in the release record, not in someone's head.

## Release Types

Releases follow semantic versioning: `MAJOR.MINOR.PATCH`.

**Patch** (`x.y.Z`): Bug fixes and internal corrections with no interface changes. All five gate checks apply. Deployment is typically low-risk. Rollback window: 24 hours minimum.

**Minor** (`x.Y.0`): New functionality added in a backward-compatible way. All five gate checks apply. Interface documentation check is mandatory (check 3). Rollback window: 48 hours minimum.

**Major** (`X.0.0`): Breaking changes. All five gate checks apply with heightened scrutiny. Breaking changes must be communicated to affected parties before release, not after. Rollback window: 72 hours minimum, or until all dependent systems confirm compatibility.

When in doubt about which type applies, choose the higher one. Downgrading a release type after the fact is harder than upgrading it before.

## Sign-Off

Two people sign off on every release:

**Owner**: The person responsible for this release. They confirm all five gate checks are complete and accurate. They accept responsibility if something goes wrong.

**Reviewer**: A second person who independently verifies the gate is passed. They are not rubber-stamping. If they have doubts, they raise them before sign-off, not after.

Sign-off format (record in the release document):

```
Owner: <name> - confirmed gate passed - <date>
Reviewer: <name> - independently verified - <date>
```

No release proceeds without both signatures. If the reviewer is unavailable, wait or escalate. Do not self-review.

## Post-Release

After deploying, the work is not done.

**Monitor for a defined window.** The window length depends on release type: 24 hours for patch, 48 for minor, 72 for major. During this window, someone is responsible for watching key health signals (error rates, latency, queue depth, whatever is relevant to your system). Define who that person is before deploying.

**Write a brief retro if anything went wrong.** "Anything went wrong" means: a rollback was triggered, an unexpected error appeared, a step in the deployment procedure failed, or the monitoring window surfaced a surprise. The retro does not need to be long. It needs to answer:

1. What happened?
2. Why did the gate not catch it?
3. What changes to the gate or process would prevent recurrence?

Retros go in the release record, not in a separate document. Keep the context together.

If the release went smoothly, note that too. "No issues observed during monitoring window" is a valid and useful record.

## Evidence

Save a release record at `.evidence/releases/<version>.md` for every release.

The record must include:
- Version number and release date
- Link or reference to the changelog entry
- Gate check results (pass / N/A for each of the five checks)
- Deployment steps used (copy from the pre-release gate)
- Rollback plan (copy from the pre-release gate)
- Sign-off block (owner and reviewer, with dates)
- Post-release monitoring notes
- Retro (if applicable)

Keep records indefinitely. They are the audit trail for your release history and the raw material for improving your process over time.
