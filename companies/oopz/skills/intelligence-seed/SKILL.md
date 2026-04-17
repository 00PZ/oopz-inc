---
name: intelligence-seed
description: Source-agnostic templates for mining a niche's knowledge base to bootstrap and refresh hooks, voice calibration, audience patterns, and engagement baselines. NEVER cross-pollinates across niches.
---

## Purpose

Source-agnostic templates for mining a niche's knowledge base (`.evidence/knowledge/<niche-slug>/`) to bootstrap and refresh: top hooks, voice-calibration samples, audience patterns, engagement baselines.

The intelligence seed runs over collected, normalized knowledge-base files and extracts repeatable patterns. It does not generate content. It produces proposed diffs that a human reviews before anything touches skill files.

## Input

A niche slug (plus implicitly the niche profile and all knowledge-base files for that niche). The ONLY input directory is `.evidence/knowledge/<niche-slug>/`. NEVER read from another niche's directory.

The agent receives:
- The niche slug (e.g. `world-mobile`)
- The niche profile from `niches/<niche-slug>/profile.yaml`
- All files under `.evidence/knowledge/<niche-slug>/` (x-posts, web-articles, engagement data)

No other directories are valid inputs. Cross-niche reads are a hard violation.

## Output

Four proposed-diff markdown files under `.evidence/analysis/<niche-slug>/YYYY-MM-DD/` (human approves before applying to skill files):

- `proposed-hooks.md`: top 20 hook patterns by engagement, with template and source examples
- `proposed-voice.md`: voice-calibration observations (formality, humor, technicality observed in high-engagement content)
- `proposed-audience.md`: audience-segment evidence (who engages with what)
- `engagement-baselines.md`: per-source engagement thresholds for "good" / "great" / "viral"

Each file is a proposed diff. None are applied automatically. The Analyst reviews proposed diffs, summarizes for Chief of Staff, and the human approves before any skill file is modified.

## Mining Templates

Five question templates the agent applies over the knowledge-base files:

1. "What is the opening line pattern across the top-decile-by-engagement items?"
2. "What hashtags / topics co-occur in the top quartile?"
3. "Which authors (x-posts) or publications (web-article) repeatedly appear in the top?"
4. "What claims are uncontroversial (appear in multiple sources) vs contested (disputed)?"
5. "What tone markers (first-person, data-driven, contrarian) correlate with engagement?"

Each template is applied independently. Results are cross-referenced only within the same niche's data.

## Scope Discipline (CRITICAL)

The seed NEVER cross-pollinates across niches. It reads ONLY `.evidence/knowledge/<niche-slug>/` for the niche it is run on. NEVER cross-niche: reading world-mobile data while seeding a fitness niche is a violation. Each niche's intelligence is isolated.

Rules:
- Input path must match the niche slug passed as argument
- If a file reference resolves outside `.evidence/knowledge/<niche-slug>/`, skip it and log a warning
- NEVER cross-niche. No exceptions. No "just for comparison" reads
- The agent must validate the path prefix before reading any file

## Output Delivery

Proposed diffs go to `.evidence/analysis/<niche-slug>/YYYY-MM-DD/`, NOT directly into skill files. Analyst and human gate applies. The Analyst reviews proposed diffs, summarizes for Chief of Staff, and the human approves before any skill file is modified.

Directory structure example:
```
.evidence/analysis/world-mobile/2025-04-17/
  proposed-hooks.md
  proposed-voice.md
  proposed-audience.md
  engagement-baselines.md
```

## Minimum Evidence Threshold

Only patterns with >= 3 supporting examples are reported. No speculation, only patterns with evidence.

Each pattern entry must include:
- The pattern description
- At least 3 source references (file path + relevant excerpt)
- Engagement data supporting the pattern

If fewer than 3 examples exist for a pattern, it is omitted from the output entirely.
