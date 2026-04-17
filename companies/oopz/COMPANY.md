---
name: Oopz
description: "Agent company that operates multiple specialist projects. First active project is Shoshin (multi-niche short-form social media content engine). Teams (Discovery, Production, Operations) live at company level and serve any Oopz project. Projects declare their niche relations via a niches: list in frontmatter."
slug: oopz
schema: agentcompanies/v1
version: 0.1.0
license: MIT
authors:
  - name: Oopz Founder
goals:
  - Ship platform-native short-form content for every active niche, every week, via the Shoshin project
  - Maintain strict compliance for third-party content about regulated topics (crypto, finance)
  - Compound knowledge per-niche: every performance signal refines hooks-library and the niche-profile skills
  - Scale horizontally: add niches to existing projects without refactoring agents; add new projects without duplicating the team layer
tags:
  - multi-project
  - multi-niche
  - social-media
  - content-ops
  - short-form
---

## Overview

Oopz is a Paperclip agent company designed for a portfolio of specialist projects. Its first project is Shoshin, a content engine that produces platform-native short-form content across multiple social networks. Future projects can be added without disrupting Shoshin's operations. The three company-level teams (Discovery, Production, Operations) serve any Oopz project, providing shared infrastructure and expertise across the entire company.

## Hierarchy

Oopz operates across three tiers. At the top is Oopz itself, the company (this file). Below that are projects, which live under `projects/` in the repository. Today, Shoshin is the active project at `projects/shoshin/`. Niches are relations declared by projects through a `niches:` list in their PROJECT.md frontmatter (see `projects/shoshin/PROJECT.md` for Shoshin's niche declarations). Teams (Discovery, Production, Operations) are company-level resources that contribute to any Oopz project, ensuring consistency and knowledge sharing across the portfolio.

## Shoshin Project

Shoshin means "beginner's mind" (初心 in Japanese), reflecting the observation that month one of any agent system is humbling. Shoshin's mission is to take one idea and produce platform-native short-form content across X, TikTok, Instagram, and Threads for every niche in its `niches:` list. The project's day-one niche is World Mobile, a DePIN telecom platform, approached from a third-party creator posture. As Shoshin matures, additional niches will be added to its portfolio, each with its own hooks-library and niche-profile skill.
