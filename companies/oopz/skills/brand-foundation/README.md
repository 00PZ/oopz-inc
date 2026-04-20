# Brand Foundation (BF)

This directory is a **container**, not a loadable skill. It documents the Brand Foundation posture: what BF is, which skills belong to it, and the rules that govern them.

Do not add a `SKILL.md` here. Paperclip would treat it as a loadable skill, which is wrong. BF is a concept, not a task.

---

## Purpose

Brand Foundation is the static anchor that keeps output sounding like you even when agents do the work. It defines the invariants: voice, compliance, niche identity, and the patterns that mark content as AI-generated slop. Every content-producing agent reads BF skills before producing anything. None of them write to BF.

The KBL (Knowledge Base Layer) is dynamic. It grows, compiles, and evolves every day. BF is the opposite. It changes only when a human decides it should change, and only via a git commit. That separation is intentional. Dynamic knowledge should not drift into static identity.

---

## Members

| Skill | What it defines |
|-------|----------------|
| [[brand-voice-system]] | 7 voice axes with defaults and per-platform DNA shifts |
| [[compliance-rules]] | Crypto/finance/DePIN compliance checklist, disclosure templates |
| [[world-mobile-niche-profile]] | Niche-specific voice overrides, audience, knowledge sources |
| [[ai-tells]] | Banned AI-slop patterns. Editor loads this to scan every draft. |

All four carry `static: true` and `editable_by: human` in their frontmatter. That's the machine-readable contract.

---

## Contract Rules

**Agents READ. Agents never write.**

No agent has write access to `skills/`. The write boundary table in `companies/oopz/README.md` makes this explicit. BF skills are read-only from the agent graph's perspective.

**Only human commits modify BF.**

If the Analyst identifies a pattern worth encoding (a new compliance edge case, a voice drift, a new AI-tell), it proposes a diff via `intelligence-seed`. The human reviews, approves, and applies the commit. The agent never touches the file directly.

**`static: true` + `editable_by: human` are required on every BF skill.**

These frontmatter flags are how Paperclip and tooling identify BF members. If a skill is missing either flag, it is not a BF skill regardless of where it lives.

**[[ai-tells]] is part of the BF family but loads separately.**

It carries the same `static: true` + `editable_by: human` flags. The difference: it's a targeted scan tool. The Editor loads it specifically to check drafts for AI-slop patterns. Other agents don't need it. Keeping it separate avoids bloating every agent's context with a pattern list they don't use.

**Niche profiles are BF members.**

[[world-mobile-niche-profile]] overrides [[brand-voice-system]] for the World Mobile niche. When a niche profile exists, it wins. When it doesn't exist, the Writer escalates to Chief of Staff rather than guessing.

---

## Add a New BF Skill

1. Create the skill directory under `companies/oopz/skills/<skill-name>/`.
2. Write a `SKILL.md` with the content.
3. Add these two frontmatter fields:

```yaml
static: true
editable_by: human
```

4. Add a row to the Members table above with a wikilink and a one-line description.
5. Commit. That's it.

Do not add the skill to any agent's `load_skills` list unless it has a specific load context (like [[ai-tells]] and the Editor). BF skills that apply universally are loaded by convention, not by explicit agent config.

If the new skill is a niche profile, follow the niche-profile naming convention: `<niche-slug>-niche-profile`. See `companies/oopz/README.md` for the full "How to Add a Niche" walkthrough.
