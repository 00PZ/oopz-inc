---
name: ai-tells
description: Banned AI-slop phrases, structures, and patterns. Editor scans every draft. Two or more fires = reject.
static: true
editable_by: human
---

## Purpose

This skill is a detection list. The Editor loads it before reviewing any draft. If two or more patterns fire, the draft is rejected and returned to the Writer with the specific tells flagged.

This is not a style guide. It's a filter. Every item here signals AI-generated or AI-contaminated text.

---

## Category 1: Banned Phrases

These words and phrases appear constantly in AI output. Oopz content must not contain them.

- **delve into** -- use "look at", "dig into", or just say what you're doing
- **it's important to note** -- if it's important, just say it; the meta-commentary is the tell
- **it's worth noting** -- same problem as above; cut it
- **please note that** -- sounds like a chatbot disclaimer
- **in today's fast-paced world** -- generic opener that signals nothing
- **as an AI language model** -- obvious, but still fires occasionally in lightly-edited drafts
- **I'd like to highlight** -- hedged self-announcement; just highlight the thing
- **in conclusion** -- essay-closing phrase; crypto content doesn't conclude, it lands
- **at the end of the day** -- filler; replace with the actual point
- **leverage** (as a verb meaning "use") -- "use" works; "leverage" is corporate cosplay
- **utilize** (when "use" works) -- same as above; "utilize" adds zero meaning
- **paradigm shift** (in casual content) -- acceptable in academic writing; banned in social posts
- **game-changer** -- overused to the point of meaning nothing
- **transformative** -- vague positive adjective; say what actually changed
- **cutting-edge** -- every product claims this; it signals nothing
- **innovative solution** -- two vague words stacked; describe the actual thing
- **empower** (in crypto/tech context) -- sounds like a nonprofit grant application
- **foster** (when "build" works) -- "foster community" is corporate; "build community" is human
- **seamlessly** -- nothing is seamless; this word hides friction
- **robust** -- overused filler adjective; describe the actual property
- **streamline** -- vague process verb; say what gets faster or simpler
- **unlock** (as a metaphor for enabling something) -- "unlock potential" is pure filler
- **moving forward** -- transition filler; cut it or replace with a time reference
- **circle back** -- corporate meeting-speak; banned in all content
- **touch base** -- same category as "circle back"

---

## Category 2: Banned Structures

These sentence and paragraph patterns are structural tells. They appear even when individual words pass.

- **"Not only X but also Y" as the dominant sentence cadence** -- one use is fine; two in a draft is a pattern; three is a tell
- **Hollow transition sentences** -- phrases like "This brings us to...", "With that said...", "Having established X, we can now..." add no information and exist only to connect paragraphs; cut them
- **Bullet list followed by prose restatement** -- listing three points then immediately summarizing them in a paragraph is AI padding; pick one format
- **Three consecutive sentences starting with "This"** -- "This means... This shows... This is why..." is a structural tic; vary the subject
- **Self-summarizing paragraph** -- a three-sentence paragraph where the final sentence restates the first two; AI does this to hit length targets
- **"In [decade/year], X is [adjective]..." opener** -- "In 2025, DePIN is transforming..." is a generic news-article opener; Oopz doesn't open this way
- **Numbered list of "key takeaways" at the end** -- summarizing a post's own points at the end is an essay habit; social content doesn't do this
- **Passive voice as default** -- "it has been shown that", "it is believed that"; see [[brand-voice-system]] for the active-voice rule
- **Symmetrical three-part structure everywhere** -- intro, three points, conclusion is an essay template; not every post needs this shape

---

## Category 3: Banned Punctuation and Formatting

- **Em-dashes in prose** -- the project bans em-dashes entirely; see [[brand-voice-system]] for the full rule and approved alternatives (commas, periods, parentheses)
- **Excessive stacked parentheticals** -- one parenthetical aside per sentence is fine; two or more in the same sentence (especially when nested (like this)) reads as AI hedging
- **Smart quotes in lowercase casual X posts** -- "like this" in a casual tweet looks copy-pasted from a word processor; use straight quotes or no quotes

---

## Category 4: Banned Rhetorical Moves

These are moves, not phrases. They require reading the full sentence or paragraph to catch.

- **Hedging chain** -- stacking qualifiers like "it's generally accepted that most experts tend to believe" is AI covering its uncertainty; Oopz is direct; pick a position or say you don't know
- **Over-explaining obvious concepts** -- explaining what a blockchain is to a crypto-native audience, or defining DePIN to someone reading a DePIN thread; the audience knows; skip the primer
- **Mirroring the prompt back verbatim** -- opening a post by restating the topic in the same words the brief used; "World Mobile is expanding its network" as an opener when the brief said "write about WM network expansion" is a tell
- **Faux-casual opener with formal conclusion** -- starting with "ok so here's the thing" and ending with "in summary, the implications are significant" is a tone mismatch that signals the AI switched registers mid-draft
- **Fake rhetorical question as opener** -- "Have you ever wondered why...?" or "What if I told you...?" are engagement-bait openers that feel manufactured; Oopz opens with a claim or a fact
- **Excessive hedging before a claim** -- "While it's difficult to say for certain, and there are many factors to consider, it seems possible that..." before a simple statement; just make the claim

---

## Relationship to brand-voice-system

These two skills serve different purposes.

[[brand-voice-system]] defines voice preferences: tone axes, platform shifts, what Oopz sounds like. It's prescriptive.

This skill (ai-tells) is a detection filter: it flags patterns that signal AI-generated text regardless of whether the voice is otherwise correct. It's diagnostic.

The only overlap is the em-dash rule. [[brand-voice-system]] owns that rule. This skill references it rather than duplicating it. If the em-dash rule changes, update [[brand-voice-system]] only.

---

## Editor Usage

The Editor loads this skill as part of the draft review checklist.

**Scan process**: read the draft once looking specifically for the patterns above. Mark each one that fires with the category and pattern name.

**Rejection threshold**: two or more fires = reject. Return the draft to the Writer with:
1. The specific patterns that fired (by name)
2. The exact sentence or phrase where each fired
3. No suggested rewrites (the Writer fixes it; the Editor doesn't rewrite)

**One fire**: flag it as a note but do not reject. The Writer should address it in the next revision.

**Zero fires**: proceed to the next checklist item.

This is a binary gate, not a scoring system. The threshold is low by design. One AI tell can be a coincidence. Two is a pattern.
