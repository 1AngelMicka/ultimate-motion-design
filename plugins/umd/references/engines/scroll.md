# Scroll animation: Lenis, ScrollTrigger, scroll-driven CSS, Scrollama

Scroll-linked motion for landing pages, product stories and data scrollytelling. Pick the lightest layer that works: CSS scroll timelines → Scrollama steps → GSAP ScrollTrigger; add Lenis only when native scroll feels wrong for the piece.

## Use when / avoid when

| Need | Pick |
| --- | --- |
| Reveal on enter, progress bar, light parallax | CSS `animation-timeline: view()` / `scroll()` ([css-waapi.md](css-waapi.md)) |
| Step-based story: text steps change a sticky graphic | Scrollama |
| Pinned sections, scrubbed timelines, horizontal scroll sections | GSAP ScrollTrigger ([gsap.md](gsap.md)) |
| Smoother wheel scrolling synced with ScrollTrigger | Lenis |
| A video deliverable | Not scroll: build a time-based timeline and capture it |

Avoid scroll animation entirely for forms, docs, dashboards and checkout flows.

## Setup

- `npm i lenis` (1.3.x, MIT) and `import "lenis/dist/lenis.css"`.
- `npm i gsap` (ScrollTrigger included, Standard licence; see [gsap.md](gsap.md)).
- `npm i scrollama` (3.2.x, MIT; IntersectionObserver, built-in ResizeObserver).
- Do not start new work on archived or frozen libraries: lax.js, skrollr (archived), smooth-scrollbar, Locomotive Scroll v4 era patterns. ScrollMagic was revived in 2026: still prefer ScrollTrigger.

## Core patterns

**1. ScrollTrigger: scrub a timeline, pin the section.**

```js
gsap.registerPlugin(ScrollTrigger);
const tl = gsap.timeline({
  scrollTrigger: { trigger: ".feature", start: "top top", end: "+=150%", scrub: 0.5, pin: true },
});
tl.from(".feature .shot", { scale: 0.85, opacity: 0 }).to(".feature .caption", { yPercent: -30 }, "<");
```

`scrub: true` ties progress to scroll exactly; a number (seconds) adds catch-up smoothing. Use `markers: true` while building only. Call `ScrollTrigger.refresh()` after images/fonts change layout.

**2. Lenis synced with ScrollTrigger** (documented pattern):

```js
import Lenis from "lenis";
const lenis = new Lenis();                       // respectReducedMotion defaults to true
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

Without GSAP: `new Lenis({ autoRaf: true })`. Nested scrollers (modals, code blocks): `data-lenis-prevent` on the element, or `allowNestedScroll: true`. Anchor links: `anchors: true`. Programmatic: `lenis.scrollTo("#pricing", { offset: -80 })`.

**3. Scrollama for step stories.**

```js
import scrollama from "scrollama";
scrollama().setup({ step: ".step", offset: 0.5, progress: true })
  .onStepEnter(({ element, index, direction }) => setChart(index))
  .onStepProgress(({ progress }) => setPartial(progress));
```

Sticky graphic (`position: sticky`) + step text column; each step changes one thing in the graphic.

**4. CSS-only reveals**: `animation-timeline: view(); animation-range: entry 0% cover 35%;` inside `@supports`, default state fully visible.

**5. Mobile and reduced motion.** Use `gsap.matchMedia()` to drop pins and long scrubs on small screens and when `prefers-reduced-motion: reduce`; Lenis disables smoothing itself under reduced motion (`respectReducedMotion: true`).

## Anti scroll-jacking rules (WEB blockers)

- The wheel/trackpad/keyboard always moves the page in the expected direction, at roughly the expected distance. Never convert scroll into a fixed-length animation the user must "wait out".
- No snapping that fights the user (`scroll-snap-type: mandatory` on long sections, full-page wheel hijack like fullPage.js-style sections).
- Pinned sections: total pin length ≤ ~1.5–2 viewport heights per idea; content must be readable when the user stops mid-scrub.
- Keep native scrollbars, `Page Down`, `Space`, `Home/End`, anchor links and browser find working (test them).
- Content never depends on scroll to become visible: no-JS and reduced-motion states show everything.
- Lenis `lerp`/`duration` subtle: smoothing must not add perceptible lag; disable it on touch unless there is a reason (`syncTouch` off by default).
- No horizontal scroll sections on mobile; stack them vertically.

## Rendering to video with umd

Scroll pages are interactive; a video needs a time source. Two options:

- **Recommended**: rebuild the sequence as a paused GSAP timeline (no ScrollTrigger) and capture it with `window.umdRender = (t) => tl.seek(t)`.
- **Demo of the real page**: drive scroll from time in `window.umdRender = (t) => { const y = ease(t / window.umdDuration) * maxScroll; window.scrollTo(0, y); ScrollTrigger.update(); }`. Do not run Lenis during capture (its smoothing follows rAF, which capture virtualises, but scripted `scrollTo` is simpler and exact). Check with `umd still` at three scroll depths.

## Pitfalls

| Breaks | Fix |
| --- | --- |
| Lenis and ScrollTrigger drift apart | The ticker sync above; `lagSmoothing(0)` |
| Pins jump after images load | `ScrollTrigger.refresh()` after load; reserve image size (no CLS) |
| Pin spacing breaks with transforms on ancestors | Pin elements whose ancestors have no `transform`; or `pinReparent` |
| Sticky Scrollama graphic jitters | Animate the graphic with transforms, not layout properties |
| Everything fades in on scroll | Only content that benefits from sequence; above-the-fold content is visible at load |
| Mobile address bar resize retriggers | `ScrollTrigger.config({ ignoreMobileResize: true })` |

## Checks

- **WEB**: no scroll-jacking (rules above), reduced-motion state shows all content, `umd webperf <url>` without dropped frames or CLS.
- **MOT**: one focal motion per scroll section; scrub easing `none` on the timeline, character added by tween eases.
- **TXT**: captions inside pinned sections readable at any scrub position.

## Sources

- https://github.com/darkroomengineering/lenis (README options, GSAP sync) · https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- https://github.com/russellsamora/scrollama · https://github.com/codrops/ScrollBasedLayoutAnimations
- research_notes/…/web_animation.md
