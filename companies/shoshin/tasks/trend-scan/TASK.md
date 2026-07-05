---
name: Trend Scan
slug: trend-scan
assignee: content-manager
schedule: "0 6 * * *"
timezone: Europe/Amsterdam
---

Daily trend scan at 06:00 Europe/Amsterdam. Content Manager scans X and other platforms for signals that align with Shoshin's active niches.

## Workflow

1. Query gbrain MCP for recent World Mobile developments, community activity, and any new signals in the niche.
2. Scan the X accounts listed in `world-mobile-niche-profile` (official accounts + community operators).
3. Identify 2-3 strong signals worth tracking: breaking news, narrative shifts, community reactions, on-chain events.
4. Write a brief trend file to `.evidence/trends/YYYY-MM-DD.md` covering:
   - signal title
   - source (URL or account)
   - why it matters for Shoshin content
   - suggested angle if any

## Rules

- One file per day. Append if run multiple times on the same day, do not overwrite.
- Stay in niche. World Mobile only.
- No drafting content here. Trend files feed weekly-sprint on Monday.
- If no signals found, write a minimal file noting the absence. Never skip the file.

## Done Condition

`.evidence/trends/YYYY-MM-DD.md` written with at least a summary entry (even if empty day).
