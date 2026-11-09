# Recipe — Explainer video

Makes one idea understood in 60–180 s: a problem the viewer recognises, a mechanism shown step by step, a takeaway. Routes: [../routes/html-video.md](../routes/html-video.md) for product and concept explainers, [../routes/explainer.md](../routes/explainer.md) for maths, code and diagrams, [../routes/director.md](../routes/director.md) for illustrated stories.

## Use when / avoid when

- Use for "how it works", SaaS explainers, educational topics, onboarding concepts, internal training.
- Avoid when the goal is excitement over understanding (→ [launch-video.md](launch-video.md)) or a click path (→ [product-demo.md](product-demo.md)).

## Setup

| Style | Route and tools |
| --- | --- |
| Flat illustration, icons, UI fragments | R1: HTML + GSAP/SVG, Iconify icons, captured with `umd capture` ([../engines/svg.md](../engines/svg.md)) |
| Maths, physics, algorithms | Manim + manim-voiceover ([../engines/manim.md](../engines/manim.md)) |
| Architecture, flows | Mermaid / D2 → animated SVG ([../engines/diagrams-code.md](../engines/diagrams-code.md)) |
| Hand-drawn / whiteboard | rough.js + rough-notation, excalidraw-animate (MIT) |
| Paper collage, painted scenes | R4 director: generated stills animated in code |

Voice first ([../audio/voice.md](../audio/voice.md)), word timestamps for sync, captions always ([../audio/captions.md](../audio/captions.md)). Inspiration (MIT): `Alisa0808/vox-director` (Vox-style pipeline, relies on a paid service), `heygen-com/hyperframes-community-skills` (Vox explainer skill), `Mng-dev-ai/explainer-video`.

## Core patterns

### Beat structure (90 s)

| Time | Beat | Intent |
| --- | --- | --- |
| 0–5 s | Hook question | "Why does X happen?" with a visual of the puzzle |
| 5–20 s | Familiar ground | The situation the viewer knows; establish visual vocabulary (one symbol per concept) |
| 20–70 s | Mechanism, 3–4 steps | Each step: new element enters, connects to the previous, voice names it |
| 70–82 s | Payoff | The whole system at once, now readable; the aha |
| 82–90 s | Takeaway / CTA | One sentence on screen, held ≥ 3 s |

Pacing: 130–160 spoken words per minute; one new visual idea every 4–8 s, a visible change every ~2 s.

### Shot list template

```
| id | start–end | voice line | concept | visual metaphor | new element | carried over | motion | on-screen text |
| e05 | 31.2–38.0 | "Each request waits in a queue." | queue | tokens in a lane | lane + 5 tokens | server icon | tokens slide in, stagger 60 ms | Queue |
```

### Motion vocabulary

- **Build-up**: the frame accumulates; nothing disappears without reason. Earlier elements dim to ~30 % instead of vanishing.
- **Connect**: lines draw from cause to effect (stroke-dashoffset, 0.4–0.8 s).
- **Transform**: one symbol morphs into the next concept (flubber, Manim `Transform`), better than a cut.
- **Zoom to detail / pull back to system**: the camera moves, the layout stays.
- **Highlight**: underline or circle (rough-notation) on the word the voice stresses.

### Durations per format

| Format | Length |
| --- | --- |
| Social explainer | 30–60 s, 9:16, captions large ([social-short.md](social-short.md)) |
| Product / SaaS explainer | 60–90 s |
| Educational | 2–6 min, chapters every ~60 s |

### Do / don't

- Do keep one metaphor per concept for the whole video.
- Do test sound-off: captions and on-screen labels must carry the idea.
- Don't show and say different things at the same time.
- Don't use stock icons in five styles; one icon set, one stroke width.

## Rendering to video with umd

Use the route's render block: capture for HTML, `manim -qh …` for Manim (see [../routes/explainer.md](../routes/explainer.md)). Mix voice and music with `umd mix … --duck 9`; check `umd captions-check subs.ass words.json`.

## Pitfalls

| Breaks | Fix |
| --- | --- |
| Visual arrives late, viewer hears before seeing | Visual lands 0–200 ms before the word that names it |
| Screen fills up and becomes unreadable | Clear or zoom at the end of each step; ≤ 5 active elements |
| Script full of "In today's world…", "Let's dive in" | Rewrite without AI phrasing ([../craft/anti-slop.md](../craft/anti-slop.md)) |
| Same layout for every step | Alternate wide system view and close detail |
| Dead air while voice pauses | Ambient motion continues; no freeze > 1 s |

## Checks

- **NAR**: hook question, mechanism, payoff; works with sound off.
- **TIM**: something new every ~2 s, no dead air > 3 s.
- **TXT / CAP**: labels readable, captions synced ≤ 100 ms.
- **AUD**: voice clear, music ducked, −14 LUFS.
- **MOT**: each motion has a teaching purpose.

## Sources

- https://github.com/Alisa0808/vox-director · https://github.com/heygen-com/hyperframes-community-skills · https://github.com/Mng-dev-ai/explainer-video
- https://github.com/rough-stuff/rough-notation · https://github.com/dai-shi/excalidraw-animate · https://github.com/veltman/flubber
- research_notes/…/explainers_quality_refs.md
