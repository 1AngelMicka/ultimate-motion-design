# Recipe — Scrollytelling

A story told as the reader scrolls: a sticky visual changes state at each text step, or a pinned scene scrubs with scroll. The reader controls the pace; motion follows scroll, never fights it. Route: [../routes/web-page.md](../routes/web-page.md).

## Use when / avoid when

- Use for data journalism, annual reports, product stories, case studies, long-form explainers.
- Avoid for content people scan or search (docs, pricing), and never hijack scroll speed or direction.

## Setup

| Need | Tool | Licence |
| --- | --- | --- |
| Step triggers (enter/exit a text step) | `scrollama` (3.x, IntersectionObserver) | MIT |
| Scrubbed timelines, pinning, snapping | GSAP ScrollTrigger (+ Flip for layout changes) | GSAP Standard (free, not OSI) |
| Simple scroll-linked effects, no JS | CSS scroll-driven animations: `animation-timeline: view()` / `scroll()`, `animation-range` | native |
| Smooth scroll | `lenis` (synced to the GSAP ticker) | MIT |
| 3D synced to DOM | `14islands/r3f-scroll-rig` | MIT |

Engine details: [../engines/scroll.md](../engines/scroll.md), [../engines/gsap.md](../engines/gsap.md), [../engines/css-waapi.md](../engines/css-waapi.md). Study (MIT): `codrops/ScrollBasedLayoutAnimations`, `codrops/OnScrollColumnsRows`, `codrops/ScrollTextMotion`. ⚠️ `basementstudio/scrollytelling` has no standard licence and is inactive. CSS scroll timelines are not in every browser: feature-detect with `@supports (animation-timeline: view())`; the `flackr/scroll-timeline` polyfill is inactive.

## Core patterns

**1. Sticky graphic + steps** (the reliable default): text steps scroll normally in one column; a `position: sticky` graphic in the other column changes state when a step crosses the middle of the viewport.

```js
import scrollama from "scrollama";
const scroller = scrollama();
scroller.setup({ step: ".step", offset: 0.5 })
  .onStepEnter(({ index, direction }) => graphic.goTo(index, direction));
```

`graphic.goTo` runs a short (300–600 ms) state transition; going back must reverse cleanly.

**2. Scrub only what reads as continuous** (a path drawing, a camera move through a scene, a number growing). Scrubbed pins last 1–2 viewport heights, rarely more.

```js
gsap.timeline({ scrollTrigger: { trigger: ".chapter", start: "top top", end: "+=150%", pin: true, scrub: 0.5 } })
    .to(".route", { strokeDashoffset: 0 });
```

**3. Mobile layout is a different design**: graphic on top (sticky, ~50–60 vh), steps overlay below with a solid background; test touch momentum.

**4. Reduced motion**: steps still change the graphic, but instantly (no scrub, no parallax); pinned sections become normal flow.

**5. Every step has a text anchor**: the reader never scrolls through more than one viewport without new text or a visible state change.

### Story structure

| Part | Steps | Intent |
| --- | --- | --- |
| Opening | 1–2 | Full-bleed visual + title; first scroll cue |
| Chapters | 3–6 steps each | One idea per step; graphic state per step |
| Turning point | 1 scrubbed pin | The memorable moment |
| Close | 1–2 | Summary state of the graphic, sources, CTA |

### Shot list template (one row per step)

```
| step | text (≤ 40 words) | graphic state | transition (ms) | scrub? | mobile variant | reduced-motion state |
| 07 | "By 2020 the river had moved 2 km." | map: 2020 course highlighted | 500 ease-in-out | no | map top, text card below | instant swap |
```

### Durations

| Element | Value |
| --- | --- |
| Step state transition | 300–600 ms |
| Scrub smoothing (`scrub`) | 0.3–1 s |
| Pinned section length | 100–200 % of viewport height |
| Step spacing | ~70–100 vh between step anchors |

### Do / don't

- Do keep native scroll speed; Lenis smoothing stays subtle.
- Do make the story readable with JS disabled (all steps and a static graphic per chapter).
- Don't pin more than one section per screen of text; don't nest pins.
- Don't snap aggressively; snapping is opt-in for slideshow-like chapters only.

## Rendering to video with umd

Not needed. For a trailer of the piece, script a scroll at fixed speed with Playwright and capture it, or rebuild key states as an HTML video ([../routes/html-video.md](../routes/html-video.md)).

## Pitfalls

| Breaks | Fix |
| --- | --- |
| ScrollTrigger positions wrong after images or fonts load | `ScrollTrigger.refresh()` after load; fixed media dimensions |
| Fast scroll skips step states | Make `goTo` idempotent and jump to the target state |
| Pin causes layout jump (CLS) | `pinSpacing` handled by ScrollTrigger; reserve height |
| Scroll-jacking feel | No custom wheel handling, no velocity changes |
| Jank on mobile | Transform/opacity only; fewer simultaneous scrubs |

## Checks

- **WEB**: no scroll-jacking, reduced motion honoured, `umd webperf` smooth frames, CLS ≤ 0.1.
- **NAR**: one idea per step; the story holds in the static version.
- **TXT**: step text readable over the graphic (solid card on mobile).
- **MOT**: transitions reverse cleanly when scrolling up.

## Sources

- https://github.com/russellsamora/scrollama · https://gsap.com/docs/v3/Plugins/ScrollTrigger/ · https://github.com/darkroomengineering/lenis · https://github.com/14islands/r3f-scroll-rig
- https://github.com/codrops/ScrollBasedLayoutAnimations · https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline
