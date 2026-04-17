---
name: content-types
description: Enumerated content types with definitions and platform fit matrix.
---

# Content Types

Canonical list of content types used across the content pipeline. Each type has a definition, format constraints, and platform fit. Writers and the repurpose engine reference this to ensure format consistency.

## Type Matrix

| Type                 | Definition                                          | Best Platforms            |
|----------------------|-----------------------------------------------------|---------------------------|
| thread               | Multi-post narrative (3-20 posts)                   | X                         |
| carousel             | Multi-slide visual story (3-10 slides)              | Instagram                 |
| reel/short           | Short vertical video (15-90s)                       | TikTok, Instagram         |
| hot-take             | Single strong opinion, 1-3 sentences                | Threads, X                |
| hook-only bait       | Pure hook, no resolution, drives replies             | X, Threads                |
| case-study           | Story-format deep dive on one example               | TikTok, X thread          |
| listicle             | Numbered list of insights                           | X thread, Instagram carousel |
| behind-the-scenes    | Process/workflow transparency                       | TikTok, Instagram stories |
| community question   | Open question to audience                           | Threads, X                |
| contrarian argument  | Structured argument against mainstream view          | X thread, Threads         |
| weekly recap         | Summary of week's key signals                       | X, Instagram stories      |
| data visualization   | Chart/infographic with insight                      | Instagram carousel, X     |

## Type Details

### thread
- Length: 3-20 posts, each under 280 characters.
- Structure: Hook post, body posts (evidence/narrative), closer post with CTA.
- Best for: Deep dives, explainers, arguments.

### carousel
- Slides: 3-10, each with a single clear point.
- Structure: Cover slide (hook), body slides, final slide (CTA or summary).
- Best for: Visual explainers, step-by-step guides, comparisons.

### reel/short
- Duration: 15-90 seconds.
- Structure: Verbal hook in first 3 seconds, body, payoff or CTA.
- Best for: Emotional stories, quick explainers, trend participation.

### hot-take
- Length: 1-3 sentences max.
- Structure: Bold claim, optional one-line justification.
- Best for: Sparking debate, testing angles, engagement bait.

### hook-only bait
- Length: 1 sentence.
- Structure: Hook with no resolution. The replies ARE the content.
- Best for: Engagement farming, community temperature checks.

### case-study
- Length: Medium (thread-length or 60-90s video).
- Structure: Setup (problem), subject (who/what), outcome, lesson.
- Best for: Proof points, credibility building, narrative depth.

### listicle
- Items: 3-10 numbered points.
- Structure: Hook, numbered items, closer.
- Best for: Scannable value, shareability, saves.

### behind-the-scenes
- Length: Short to medium.
- Structure: Show the process, narrate decisions, be transparent.
- Best for: Trust building, humanizing the brand, community bonding.

### community question
- Length: 1-2 sentences.
- Structure: Open-ended question, optional context.
- Best for: Engagement, audience research, building reply culture.

### contrarian argument
- Length: Thread-length or long post.
- Structure: State the mainstream view, challenge it, provide evidence, conclude.
- Best for: Thought leadership, differentiation, algorithm boost (controversy signals).

### weekly recap
- Length: Thread or story series.
- Structure: Top 3-5 signals/events of the week, brief commentary on each.
- Best for: Consistency, authority building, catch-up content for passive followers.

### data visualization
- Format: Chart, graph, or infographic with one clear insight.
- Structure: Visual + caption explaining the "so what."
- Best for: Credibility, shareability, save-worthy content.

## Usage Notes

- Writers select a content type before drafting. The type determines format constraints.
- The repurpose engine maps one topic to multiple types across platforms (see `[[repurpose-engine]]`).
- Analyst tracks performance by content type to identify what works per platform.
