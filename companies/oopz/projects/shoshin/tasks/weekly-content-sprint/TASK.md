---
name: Shoshin Weekly Content Sprint
slug: weekly-content-sprint
assignee: strategist
project: shoshin
schedule:
  timezone: Europe/Amsterdam
  startsAt: 2026-04-20T10:00:00+02:00
  recurrence:
    frequency: weekly
    interval: 1
    weekdays:
      - monday
    time:
      hour: 10
      minute: 0
---

Every Monday 10:00 Europe/Amsterdam. This task runs at the Shoshin PROJECT level and **iterates over every niche** listed in `projects/shoshin/PROJECT.md`'s `niches:` frontmatter (Day 1: `[world-mobile]`; add-a-niche = append a slug there, then this task picks it up on the next Monday).

Strategist workflow: (1) read Scout's weekend trend list per niche, (2) for each niche in `project.niches`, select 3-5 topics, (3) for each topic: assign to Researcher (dossier from niche knowledge base and public sources) then Writer (drafts per platform) then Editor (QA gate) then Scheduler (human-in-the-loop queue). Closing criterion: for every niche in `project.niches`, 3-5 approved draft sets queued across the 4 platforms by Wednesday.

> **First-time Paperclip note**: the `project: shoshin` field links this task back to the PROJECT.md file. The niche loop is an EXECUTION pattern described in this body; Paperclip itself does not fan out, the Strategist agent does.
