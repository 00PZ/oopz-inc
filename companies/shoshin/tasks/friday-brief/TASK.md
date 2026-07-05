---
name: Friday Brief
slug: friday-brief
assignee: content-manager
schedule: "0 16 * * 5"
timezone: Europe/Amsterdam
---

Every Friday 16:00 Europe/Amsterdam. Content Manager compiles and delivers the weekly brief to the human operator.

## Workflow

1. Read platform analytics from `.evidence/metrics/` (human-pasted data for v0.1).
2. Read wiki lint report from `.evidence/wiki/<niche>/_lint/<today>.md` (produced by weekly-wiki-lint at 15:30).
3. Read approved and rejected draft logs from `.evidence/approved/` and `.evidence/rejected/`.
4. Produce weekly brief covering:
   - **What shipped**: posts that went live this week, per platform
   - **What worked**: top-3 posts by engagement, with the hook pattern that fired
   - **What did not**: bottom-3 posts, with a one-line hypothesis on why
   - **Next week**: 2-3 topic angles to prioritize based on this week's signals
   - **Proposed skill diffs**: concrete line-level changes to `hooks-library` and/or `world-mobile-niche-profile` — only what the data supports
5. Save brief to `.evidence/analysis/YYYY-WW-brief.md`.
6. Present proposed skill diffs to human for approval. Never apply diffs directly.

## Done Condition

Brief written to `.evidence/analysis/`. Human notified. Proposed diffs presented for review.

## Rules

- Proposed skill diffs only. Never mutate skill files directly.
- If no analytics are available in `.evidence/metrics/`, note it and deliver the structural brief without performance data.
- Keep the brief scannable: bullet points, not prose paragraphs.
