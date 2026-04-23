---
name: tdd-workflow
description: Disciplined RED -> GREEN -> REFACTOR -> REVIEW -> SHIP loop for test-driven implementation work. Stack-agnostic process for any language or framework.
---

## Purpose

This skill defines the test-driven development loop used across all engineering work. It covers the full cycle from a failing test to a shipped feature, including the review gate that sits between implementation and release.

Use this skill whenever a senior developer picks up a story from the software architect. It applies to new features, bug fixes, and non-trivial refactors alike.

## Scope Discipline

This skill covers the TDD loop only. It does not cover:

- Story writing or acceptance criteria (that's the software architect's domain)
- Release mechanics beyond the handoff point (see release-checklist)
- Code review criteria (see code-review-checklist)

If a task doesn't have a written spec or story, stop. Go back to the software architect before writing any test.

## The Loop

Each feature or fix moves through five phases in order. Do not skip phases. Do not batch multiple features through the loop at once.

### RED

Write a failing test that captures the intended behaviour described in the spec. The test must:

- Fail for the right reason (not a syntax error or missing import)
- Assert the specific outcome the spec requires
- Be readable as documentation of the intended behaviour

Run the test suite and confirm the new test fails. If it passes without any implementation, the test is wrong. Fix it before continuing.

### GREEN

Write the minimal code that makes the failing test pass. Minimal means:

- No extra logic beyond what the test requires
- No speculative handling for cases not yet tested
- No premature abstractions

Run the full test suite. All tests must pass, including pre-existing ones. If existing tests break, fix the regression before moving on.

### REFACTOR

Clean the implementation without changing its behaviour. The test suite must stay green throughout. Refactor targets:

- Duplication introduced during GREEN
- Names that don't reflect intent
- Functions or modules that grew too large
- Dead code paths

Run the test suite after each refactor step, not just at the end. Small, verified steps prevent silent regressions.

If the refactor reveals a design problem that requires changing the public interface, pause. Discuss with the software architect before proceeding. Interface changes may require a new RED-GREEN cycle.

### REVIEW

Invoke the code-review-checklist skill. Work through every item. Address all blockers before moving to SHIP.

Non-blocking findings (style, minor naming) may be noted and deferred, but must be logged. Blockers must be resolved in the current cycle. Do not carry blocking issues forward.

If the review uncovers a design flaw that requires rework, return to RED with a corrected test. Do not patch over design problems in place.

### SHIP

Hand off to the release process via the release-checklist skill. At this point:

- All tests pass
- The review is complete with no open blockers
- Any architectural decision records (ADRs) affected by this change are updated
- Evidence for this cycle is saved (see the Evidence section below)

The senior developer's responsibility ends at handoff. The devops engineer and technical writer take it from here.

## Entry Criteria

Before starting the RED phase, confirm all of the following:

- A written spec or story exists, produced by the software architect
- The spec includes clear acceptance criteria (what "done" looks like)
- The scope is bounded to a single feature or fix (not a bundle)
- The relevant test suite runs cleanly on the current branch

If any criterion is missing, do not start. Return the work item to the software architect with a note on what's needed.

## Exit Criteria

The loop is complete when all of the following are true:

- The full test suite passes with no skipped or pending tests
- The diff has been reviewed via code-review-checklist with no open blockers
- Any ADR that this change affects has been updated or a new one created
- Evidence for the cycle is saved to `.evidence/tdd/<date>-<feature>/`
- The release-checklist handoff is initiated

## Anti-Patterns

Avoid these. They undermine the discipline the loop is designed to enforce.

**Writing tests after the fact.** Tests written after implementation tend to confirm what the code does, not what it should do. They miss edge cases and provide false confidence. Always write the test first.

**Writing a RED test that doesn't fail.** A test that passes before any implementation is not a RED test. It's a green test with no signal. If your test passes immediately, it's either testing the wrong thing or the behaviour already exists. Investigate before continuing.

**Skipping REFACTOR.** GREEN code is often messy by design. Skipping REFACTOR accumulates debt that compounds across cycles. The test suite exists precisely to make refactoring safe. Use it.

**Batching features before REVIEW.** Completing multiple RED-GREEN cycles before invoking the review gate makes reviews harder and regressions more likely. Each feature gets its own REVIEW before SHIP.

**Treating REVIEW as a formality.** The review gate exists to catch problems before they reach production. If you're rubber-stamping it, you're skipping it.

## Evidence

Save a log for each RED-GREEN cycle to:

```
.evidence/tdd/<date>-<feature>/
```

One subfolder per cycle. Each subfolder should contain:

- `spec.md`: the acceptance criteria this cycle addressed
- `test-output-red.txt`: test runner output showing the failing test
- `test-output-green.txt`: test runner output showing all tests passing
- `review-notes.md`: findings from the code-review-checklist pass

The date format is `YYYY-MM-DD`. The feature slug should match the story or ticket identifier where one exists.

Evidence is not optional. It creates an audit trail that the software architect and code reviewer can reference, and it makes post-mortems tractable when something goes wrong in production.
