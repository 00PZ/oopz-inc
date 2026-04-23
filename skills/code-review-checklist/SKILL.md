---
name: code-review-checklist
description: Pragmatic code review methodology. Triages diff feedback into blocker / suggestion / nit priorities. Stack-agnostic, review any language.
---

## Purpose

This skill gives reviewers a repeatable process for turning a diff into structured, actionable feedback. It covers how to read a diff, how to classify findings, and how to write comments that authors can act on without guessing.

The goal is not to find every possible issue. It's to surface the issues that matter most, in a form that moves the work forward.

## Priority Triage

Every comment gets one of three priority markers. Use them consistently so authors know what to fix before merging and what to consider later.

### Blocker

Must be resolved before merge. These are correctness and safety issues where shipping the code as-is causes real harm.

- Security holes: injection vectors, missing auth checks, secrets in code, unsafe deserialization
- Data loss risk: destructive operations without guards, missing transactions, silent swallowed errors
- Breaking contracts: changed public API signatures, removed fields from serialized formats, violated invariants
- Race conditions: shared mutable state without synchronization, time-of-check/time-of-use bugs
- Unhandled critical errors: missing error propagation on paths that can fail, panics in hot paths

If you're unsure whether something is a blocker, ask yourself: "Would this cause an incident in production?" If yes, it's a blocker.

### Suggestion

Worth fixing in this PR or a follow-up. These are quality issues that won't cause immediate harm but will slow the team down later.

- Missing input validation on external data (user input, API responses, config values)
- Unclear naming that requires reading the implementation to understand the intent
- Missing tests for new behavior or changed behavior
- Extractable duplication that will need to be kept in sync across call sites
- Logic that's correct but fragile, where a small change nearby would break it

Suggestions are negotiable. The author may have context that changes the calculus. Say what you'd do and why, then let them decide.

### Nit

Minor polish. Fine to fix or ignore. Don't block on these.

- Style inconsistency where no linter enforces the rule
- Minor naming improvements (abbreviations, slightly ambiguous identifiers)
- Docs gaps on non-public code
- Alternative approaches that are roughly equivalent in quality

If your codebase has a linter or formatter, don't leave nits about things it already catches. That's noise.

## Comment Format

Each comment follows this structure:

```
[BLOCKER|SUGGESTION|NIT] <one-line headline>

Line: <file>:<line-range>

Why: <1-2 sentences explaining the problem and its consequence>

Change: <concrete suggested fix, either as prose or a short code snippet>
```

Example:

```
[BLOCKER] Missing auth check on admin endpoint

Line: src/handlers/admin.ts:42-55

Why: Any authenticated user can reach this handler. The role check
present on other admin routes is absent here, so a regular user
can trigger privileged operations.

Change: Add the same `requireRole('admin')` guard used on line 12
of src/handlers/settings.ts before the handler body executes.
```

Keep headlines short enough to scan in a list. The "Why" should explain consequence, not just restate the problem. The "Change" should be specific enough that the author doesn't have to guess what you mean.

## Review Flow

Work through the diff in passes. Each pass has a different focus. Don't try to catch everything in one read.

**Pass 1: Intent (top-down)**
Read the diff as a whole. What is this change trying to do? Does the implementation match the stated goal? Are there obvious missing pieces (a feature added but no tests, a config change with no docs update)? Note anything that seems off but don't write comments yet.

**Pass 2: Correctness**
Go line by line through the logic. Does each function do what its name says? Are edge cases handled? Are error paths complete? Are there off-by-one errors, wrong comparisons, or incorrect assumptions about input shape? Write blocker and suggestion comments here.

**Pass 3: Security**
Scan specifically for security issues. Look at every place external data enters the system: HTTP parameters, file paths, environment variables, database results, inter-service calls. Check for missing validation, unsafe operations, and privilege escalation paths. Write blocker comments here.

**Pass 4: Tests**
Read the tests independently. Do they cover the new behavior? Do they cover the failure cases? Are they testing the right thing, or just asserting that the code runs without error? Write suggestion comments for gaps.

**Pass 5: Synthesize**
Write the review summary. Lead with the overall assessment (approve, request changes, or needs discussion). List blockers first, then suggestions, then nits. If there are no blockers, say so explicitly so the author knows the path to merge.

Don't leave a review open-ended. Every review should end with a clear next step.

## What NOT to Review

Some things look like review feedback but aren't. Leaving these comments wastes everyone's time.

**Formatting handled by tooling.** If the project has a formatter or linter that runs in CI, don't comment on indentation, line length, trailing whitespace, or import order. The tool will catch it. If you want to add a rule, open a separate PR to update the linter config.

**Personal style preferences.** "I would have written this differently" is not a review comment unless you can explain why your approach is safer, clearer, or more maintainable. Preference without reasoning is noise.

**Bike-shed topics.** Variable names that are fine but not your favorite, folder structure debates, framework philosophy arguments. If it doesn't affect correctness, security, or maintainability in a concrete way, leave it out.

**Pre-existing issues.** If you notice a problem that predates this PR, note it separately (a comment in the code, a ticket, a follow-up PR). Don't block the current change on unrelated debt unless the PR makes it significantly worse.

## Evidence

Save each completed review as a markdown file:

```
.evidence/reviews/<date>-<pr-or-branch-slug>.md
```

Example path:

```
.evidence/reviews/2026-04-23-add-auth-middleware.md
```

The file should contain the full review text: summary, all comments with their priority markers, and the final disposition (approved, changes requested, or discussed and resolved). This creates a searchable record of what was reviewed, what was flagged, and what decisions were made.

Date format: `YYYY-MM-DD`. Branch slug: lowercase, hyphens only, no special characters.
