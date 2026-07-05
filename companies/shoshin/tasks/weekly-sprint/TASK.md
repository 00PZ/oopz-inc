---
name: Weekly Sprint
slug: weekly-sprint
assignee: content-manager
schedule: "0 10 * * 1"
timezone: Europe/Amsterdam
---

Every Monday 10:00 Europe/Amsterdam. Content Manager runs the weekly content planning cycle.

## Workflow

1. Read trend files from `.evidence/trends/` (last 7 days).
2. Query gbrain MCP for each active niche in `COMPANY.md:niches` to surface relevant knowledge, recent developments, and content gaps.
3. Select 3-5 topics per niche. For each topic produce a brief:
   - topic name
   - niche slug
   - audience segment (from `audience-profiles` skill — no ad-hoc segments)
   - primary platform (X is default Day-1)
   - assigned angle
   - 3-5 key facts or claims from gbrain to anchor the draft
   - any compliance flags to carry forward
4. Save queue to `.evidence/strategy/YYYY-WW-queue.md`.
5. For each topic, write a brief file to `.evidence/drafts/YYYY-MM-DD-<topic>/brief.md`.
6. Content Writer picks up briefs and produces drafts. Content Manager gates all drafts by Wednesday.

## Done Condition

All briefs written, Content Writer has been assigned, approved drafts queued for human review by Wednesday.

## Rules

- Never auto-publish. Human approves every post before it goes live.
- Never exceed 5 topics per niche per week.
- Briefs must be concrete enough that Writer does not need to ask clarifying questions.
- If gbrain has no coverage on a topic, note the gap in the brief rather than fabricating facts.
