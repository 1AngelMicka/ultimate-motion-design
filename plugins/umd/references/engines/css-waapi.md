# CSS animations, WAAPI, View Transitions, scroll-driven animations

Native platform motion: no dependency, compositor-friendly, seekable by `umd capture`. Pick it first for hover/focus/enter states, page transitions, scroll-linked progress and simple loops; reach for GSAP or Motion only when choreography or state logic outgrows it.

## Use when / avoid when

| Use when | Avoid when |
| --- | --- |
| State transitions (hover, focus, open), enter animations, loaders | Long choreographed timelines with labels → GSAP |
| Page/route transitions (View Transitions API) | Exit animations of React components → Motion `AnimatePresence` |
| Scroll-linked progress bars, reveals, parallax without JS | Pinning, scrubbed multi-step scroll scenes → ScrollTrigger ([scroll.md](scroll.md)) |
| Springs and bounces via `linear()` | Physics that must react to velocity (drag, fling) → Motion |

## Setup

No install. Support notes (Nov 2026): `linear()` easing and `@property` are Baseline; same-document View Transitions are Baseline; cross-document View Transitions ship in Chromium and Safari; scroll-driven animations ship in Chromium and Safari 26 but not by default in Firefox. Always wrap the last two in `@supports` or treat them as progressive enhancement. Optional polyfill for scroll timelines: `flackr/scroll-timeline` (Apache-2.0, old).

## Core patterns

**1. Transitions: name the properties, never `all`.**

```css
.btn { transition: transform var(--dur-fast) var(--ease-out), background-color var(--dur-fast) linear; }
.btn:hover { transform: translateY(-2px); }
```

Durations and easings as custom properties from the motion tokens. Animate `transform`, `opacity`, `filter` (sparingly), `clip-path`; not `width/height/top/left/margin`.

**2. Keyframes with fill and finite iterations.**

```css
@keyframes rise { from { opacity: 0; translate: 0 16px; } to { opacity: 1; translate: 0 0; } }
.card { animation: rise 0.5s var(--ease-out) both; animation-delay: calc(var(--i) * 40ms); }
```

Set `--i` per item for staggers. `both` keeps start state before the delay and end state after.

**3. Springs and custom curves with `linear()`**: `--ease-spring: linear(0, 0.22 9%, 0.66 22%, 1.02 38%, 1.05 46%, 1.01 62%, 1);` (generate exact curves with Jake Archibald's linear-easing-generator). Keep overshoot small for UI.

**4. `@property` to animate custom properties** (gradients, angles, counters):

```css
@property --angle { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
.ring { background: conic-gradient(from var(--angle), #6cf, #a6f, #6cf); animation: spin 6s linear infinite; }
@keyframes spin { to { --angle: 360deg; } }
```

**5. WAAPI for JS-controlled native animations.**

```js
const a = el.animate([{ opacity: 0, transform: "scale(.96)" }, { opacity: 1, transform: "none" }],
  { duration: 400, easing: "cubic-bezier(.2,0,0,1)", fill: "both" });
a.pause(); a.currentTime = 200;        // ms, seekable
await a.finished;                       // promise
document.getAnimations();               // every CSS + WAAPI animation on the page
```

**6. View Transitions, same document**:

```js
if (!document.startViewTransition) update(); else document.startViewTransition(() => update());
```

```css
.hero-img { view-transition-name: hero; }           /* unique per page state */
::view-transition-old(root), ::view-transition-new(root) { animation-duration: 250ms; }
```

**7. View Transitions, cross-document (MPA)**: opt in on both pages with `@view-transition { navigation: auto; }`, give matching elements the same `view-transition-name`. Use `pagereveal`/`pageswap` events only for custom logic.

**8. Scroll-driven animations.**

```css
@supports (animation-timeline: view()) {
  .reveal { animation: rise linear both; animation-timeline: view(); animation-range: entry 0% cover 35%; }
  .progress { transform-origin: 0 50%; animation: grow linear both; animation-timeline: scroll(root block); }
}
@keyframes grow { from { scale: 0 1; } to { scale: 1 1; } }
```

**9. Reduced motion, always.**

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
  ::view-transition-group(*) { animation: none !important; }
}
```

Better than the blanket rule: design a reduced variant (fade instead of slide) per component.

## Rendering to video with umd

`umd capture` pauses and seeks every CSS and WAAPI animation per frame, so keyframe pages render deterministically with no extra code. Rules for capture:

- Use `@keyframes` with explicit `animation-delay` for the timeline; CSS transitions only fire on state changes, so trigger them at fixed times from `window.umdRender(t)` (toggle a class when `t` crosses a beat) or replace them with keyframes.
- Scroll-driven animations follow scroll, not time: drive scroll from time, e.g. `window.umdRender = (t) => scrollTo(0, (t / window.umdDuration) * (document.documentElement.scrollHeight - innerHeight))`.
- View Transitions are triggered by DOM updates; check them with `umd still` at the transition midpoint before relying on them in a video, or use GSAP Flip for authored video.
- Infinite loops are fine in a capture (time is bounded by `--duration` / `window.umdDuration`).

## Pitfalls

| Breaks | Fix |
| --- | --- |
| `transition: all` | List properties; `umd lint` flags it |
| Animating layout properties → jank, CLS | `transform`/`opacity`/`translate`/`scale` only (MOT, WEB) |
| Duplicate `view-transition-name` on one page | Names must be unique at capture time; set them just before the transition |
| Scroll-driven CSS in Firefox shows nothing | `@supports`, default state visible without the animation |
| `backdrop-filter`/large `blur()` animated | Animate opacity of a pre-blurred layer |
| No reduced-motion branch | `prefers-reduced-motion` media query; `umd webperf` checks it (WEB) |

## Checks

- **WEB**: `umd webperf <url>` (dropped frames, CLS, reduced-motion behaviour).
- **MOT**: `umd lint` (`transition: all`, layout-property animation, hard-coded durations/easings).
- **SAF**: no element flashes more than 3 times per second; loops slower than 3 Hz.

## Sources

- MDN: CSS animations, Web Animations API, View Transition API, scroll-driven animations, `linear()` easing, `@property`.
- https://github.com/w3c/csswg-drafts (css-easing, scroll-animations, view-transitions) · https://github.com/bramus/view-transitions-demos
- https://github.com/jakearchibald/linear-easing-generator · https://github.com/flackr/scroll-timeline
- research_notes/…/web_animation.md, explainers_quality_refs.md
