# Route — Animated web page (no video output)

The deliverable is a live site, landing page or UI whose motion runs in the visitor's browser. Same craft as R1, different proof: frames dropped, layout shift and reduced-motion behaviour replace the render audit.

## Use when / avoid when

| Use when | Avoid when |
| --- | --- |
| Landing page, product site, portfolio, docs with motion, app UI states | The client needs an MP4 → [html-video.md](html-video.md) (a page can still be captured as a promo) |
| Scroll stories, page transitions, hero sections, micro-interactions | Motion that only decorates and slows reading: cut it |

Recipes on this route: [../recipes/hero-section.md](../recipes/hero-section.md), [../recipes/page-transitions.md](../recipes/page-transitions.md), [../recipes/scrollytelling.md](../recipes/scrollytelling.md), [../recipes/micro-interactions.md](../recipes/micro-interactions.md), [../recipes/kinetic-typography.md](../recipes/kinetic-typography.md).

## Setup

Pick the lightest engine that does the job:

| Need | Engine | Licence |
| --- | --- | --- |
| Hover, focus, simple enter/exit, scroll-linked progress | CSS transitions, `@keyframes`, scroll-driven animations, WAAPI — [../engines/css-waapi.md](../engines/css-waapi.md) | none |
| React component state, layout and presence animations | `motion` (14.x) — [../engines/motion.md](../engines/motion.md) | MIT |
| Timelines, ScrollTrigger, SplitText, Flip | `gsap` (3.15) — [../engines/gsap.md](../engines/gsap.md) | free "Standard" licence, not OSI |
| Smooth scroll | `lenis` (1.3) — [../engines/scroll.md](../engines/scroll.md) | MIT |
| Route changes | View Transitions API, `swup`, `@unseenco/taxi` — [../recipes/page-transitions.md](../recipes/page-transitions.md) | MIT / BSD-3 |
| 3D or shader hero | three.js, Paper Shaders — [../engines/threejs.md](../engines/threejs.md), [../engines/shaders.md](../engines/shaders.md) | MIT / Apache-2.0 |
| Vector loops, interactive states | Lottie (dotlottie-web), Rive — [../engines/lottie.md](../engines/lottie.md), [../engines/rive.md](../engines/rive.md) | MIT runtimes |

Animated shadcn registries (code is copied into the project with `npx shadcn@latest add <item>`; follow each registry's docs for the item URL or namespace): Cult UI (MIT), Kokonut UI (MIT), SmoothUI (MIT), itshover (Apache-2.0, animated icons), Magic UI (MIT; MCP `@magicuidesign/mcp` lets Claude search components by intent). ⚠️ Animate UI adds a Commons Clause (no resale of the library). Use registry parts as a base, then retune durations and easings to the project tokens: unmodified registry motion is a common AI tell.

## Core patterns

**1. Motion tokens in CSS variables**, read by every engine ([../craft/tokens.md](../craft/tokens.md)): `--dur-fast: 150ms; --dur-base: 240ms; --ease-out: cubic-bezier(.2,.8,.2,1)`. `umd lint` flags hard-coded values.

**2. Only `transform` and `opacity`** (and `filter`/`clip-path` sparingly). Never animate `width`, `height`, `top`, `left`, `margin`. No `transition: all`.

**3. Reduced motion is a design, not an off switch.** Replace movement with opacity or an instant state; keep feedback:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 1ms !important; animation-iteration-count: 1 !important;
    transition-duration: 1ms !important; scroll-behavior: auto !important; }
}
```

GSAP: `gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => { /* motion */ })`. Motion: `<MotionConfig reducedMotion="user">`. Lenis: do not start it when reduced motion is set.

**4. Content visible without JavaScript.** Set initial hidden states from JS (or a class added by JS), never in static CSS, so a failed script does not hide the page or delay LCP.

**5. One purpose per motion**: guide attention, show causality, confirm an action. No motion on body text paragraphs; no parallax on reading content.

**6. No scroll-jacking.** Smooth scroll keeps native speed and direction; pinned sections stay short and skippable.

### The loop

| Step | Do | Proof |
| --- | --- | --- |
| 1. Brief | Pages, goal per section, brand tokens, target devices | `BRIEF.md` |
| 2. Storyboard | Section map: one motion intent per section, trigger (load, scroll, hover), duration token | `storyboard.md`, `motion-tokens.json` |
| 3. Stills | Build the page static first; `umd still http://localhost:5173 --at 0` per breakpoint, compare to the reference | screenshots |
| 4. Build | Motion pass section by section | source |
| 5. Measure | `umd webperf http://localhost:5173` (dropped frames, CLS, reduced motion) | webperf JSON |
| 6. Critique | Record a scroll-through for review if useful (`umd capture <url> --out review.mp4`); fix janky sections | notes |
| 7. Audit | `umd lint`, `/umd:audit` (WEB, MOT, TXT, SAF) | `audit.json` |

### Cost

Cheap in tokens; time goes to cross-device testing. Budget per page: one static pass, one motion pass, one measurement pass.

## Rendering to video with umd

No render is required. Leave `"render"` out of `.motion/project.json`, or set a capture only to make a preview clip of the page.

## Pitfalls

| Breaks | Fix |
| --- | --- |
| Dropped frames on mid-range phones | Fewer simultaneous tweens, no large `backdrop-filter`, test with CPU throttling |
| CLS from entering elements | Reserve space; animate transform, not layout |
| Lenis + ScrollTrigger out of sync | Drive Lenis from the GSAP ticker as documented by Lenis ([../engines/scroll.md](../engines/scroll.md)) |
| Hover-only interactions | Mirror on focus-visible and on tap |
| Everything fades up on scroll | Vary by content type; many sections need no entrance at all |
| `will-change` on everything | Only on the element about to move, removed after |
| Flash on route change | View transition or a short cross-fade, never a white frame |

## Checks

- **WEB**: `umd webperf` (smooth frames ≥ 95 %, CLS ≤ 0.1, reduced motion honoured), no scroll-jacking.
- **MOT**: `umd lint` (tokens, transform/opacity only, no `transition: all`, no AI tells).
- **SAF**: no more than 3 flashes per second; large parallax off under reduced motion.
- **TXT**: text readable at every scroll position, contrast over animated backgrounds.
- **LIC**: registry items and fonts licensed (`umd licenses`).

## Sources

- https://github.com/motiondivision/motion · https://github.com/greensock/GSAP · https://github.com/darkroomengineering/lenis · https://github.com/swup/swup · https://github.com/craftedbygc/taxi
- https://github.com/nolly-studio/cult-ui · https://github.com/kokonut-labs/kokonutui · https://github.com/educlopez/smoothui · https://github.com/itshover/itshover · https://github.com/magicuidesign/magicui · https://github.com/magicuidesign/mcp
- research_notes/…/web_animation.md (shadcn registries, install paths)
