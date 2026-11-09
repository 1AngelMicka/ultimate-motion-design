# GSAP

Timeline-based JavaScript animation for DOM, SVG, canvas and any object. All plugins (SplitText, ScrollTrigger, Flip, MorphSVG, CustomEase…) are free, including commercial use. The default engine for HTML video captured by `umd capture` and for choreographed web pages.

## Use when / avoid when

| Use when | Avoid when |
| --- | --- |
| Choreography with overlaps, labels and staggers (promo, launch, kinetic type) | One hover or enter transition → CSS ([css-waapi.md](css-waapi.md)) |
| Seekable video timelines (`tl.seek(t)`) | React state/layout animations → Motion ([motion.md](motion.md)) |
| Scroll scenes (ScrollTrigger), layout morphs (Flip), shape morphs (MorphSVG) | A plugin that must be OSI-licensed: GSAP is not |
| Text split into lines/words/chars (SplitText) | |

## Setup

- `npm i gsap` (3.15.x in Nov 2026). React: `npm i @gsap/react` (2.1.x, `useGSAP`). For HTML video, copy `node_modules/gsap/dist/*.min.js` into `vendor/`: no CDN at render time.
- Licence: GreenSock "Standard no-charge" licence (gsap.com/standard-license): free for commercial use since Webflow's acquisition, but **not OSI** and it restricts use in tools that compete with Webflow's visual builders. Fine for client videos and sites; read it before bundling GSAP inside a product that itself builds animations.
- Register plugins once: `gsap.registerPlugin(SplitText, ScrollTrigger, Flip, MorphSVGPlugin, CustomEase)`, imported from `gsap/SplitText`, `gsap/ScrollTrigger`, `gsap/Flip`, `gsap/MorphSVGPlugin`, `gsap/CustomEase`.
- Official agent skills: `npx skills add https://github.com/greensock/gsap-skills` (MIT); in Claude Code `/plugin marketplace add greensock/gsap-skills`.

## Core patterns

**1. One master timeline, labels per beat, positions instead of delays.**

```js
const tl = gsap.timeline({ paused: true, defaults: { duration: 0.6, ease: "power3.out" } });
tl.addLabel("hook", 0)
  .from(".hero", { yPercent: 12, opacity: 0 }, "hook")
  .from(".sub", { y: 24, opacity: 0 }, "hook+=0.15")   // overlap: secondary follows
  .addLabel("proof", 2.4)
  .from(".stat", { scale: 0.9, opacity: 0, stagger: { each: 0.06, from: "start" } }, "proof");
```

Durations and eases come from motion tokens; `defaults` keeps them in one place. `"<"` / `">"` position the next tween at the start / end of the previous one.

**2. Stagger with intent**: `stagger: { each: 0.04, from: "center" | "edges" | "random" }`. With `from: "random"`, the order changes between renders unless the page RNG is seeded (`umd capture` seeds `Math.random`; elsewhere avoid it).

**3. SplitText (3.13+ API)**: `SplitText.create(".title", { type: "lines,words", mask: "lines", autoSplit: true, onSplit: (s) => tl.from(s.lines, { yPercent: 100, stagger: 0.08 }, "hook") })`. `mask: "lines"` gives clean line reveals; `autoSplit` re-splits on font load and resize. Wait for `document.fonts.ready` before splitting in a capture.

**4. Flip for layout changes**: `const state = Flip.getState(".card"); /* change classes or DOM */ Flip.from(state, { duration: 0.7, ease: "power2.inOut", absolute: true });`. Animates transforms only, so no layout thrash.

**5. MorphSVG**: `tl.to("#blob", { morphSVG: "#blob-target", duration: 1 })`; for awkward shapes set `morphSVG: { shape: "#b", type: "rotational" }`. Clean paths with svgo first ([svg.md](svg.md)).

**6. CustomEase** for brand curves: `CustomEase.create("brand", "0.2, 0, 0, 1")` (cubic-bezier values or SVG path data), then `ease: "brand"`.

**7. React**: `useGSAP(() => { gsap.from(".box", { y: 40 }); }, { scope: container })` from `@gsap/react` reverts tweens and ScrollTriggers on unmount; wrap event-handler animations in `contextSafe`.

**8. Reduced motion and breakpoints** with `gsap.matchMedia()`:

```js
const mm = gsap.matchMedia();
mm.add({ full: "(prefers-reduced-motion: no-preference)", reduced: "(prefers-reduced-motion: reduce)" }, (ctx) => {
  const { reduced } = ctx.conditions;
  gsap.from(".hero", { y: reduced ? 0 : 40, opacity: 0, duration: reduced ? 0.2 : 0.8 });
});
```

ScrollTrigger and scroll pages: [scroll.md](scroll.md).

## Rendering to video with umd

Build the whole piece as one paused timeline and hand `umd capture` the clock:

```html
<script src="./vendor/gsap.min.js"></script>
<script src="./vendor/SplitText.min.js"></script>
<script>
  gsap.registerPlugin(SplitText);
  const tl = gsap.timeline({ paused: true });
  document.fonts.ready.then(() => {
    /* build tweens here */
    window.umdDuration = tl.duration();
    window.umdRender = (t) => tl.seek(t); // callbacks suppressed by default
  });
</script>
```

`umd capture index.html --out out/film.mp4 --fps 30` calls `umdRender(t)` each frame. Without `umdRender`, GSAP still advances on capture's virtual time, but an explicit seek is more robust (no lag smoothing, random access for `umd still`). Validate looks first: `umd still index.html --at 0.5,2.4,6`. In Remotion, use `useGsapTimeline` from `@remotion/gsap`; in HyperFrames, register to `window.__timelines`.

## Pitfalls

| Breaks | Fix |
| --- | --- |
| `repeat: -1` or `yoyo` loops in a video timeline | Finite repeats; `umdDuration` must be finite |
| `from()` tweens re-recorded after seeking back | Prefer `fromTo()` in seekable timelines, or build once before any seek |
| Animating `top/left/width/height` | `x/y/xPercent/scale` (transform) and `opacity` only (MOT, WEB) |
| SplitText before fonts load → wrong line breaks | Split inside `document.fonts.ready` or use `autoSplit` + `onSplit` |
| Every element on `power2.out` 0.5 s, same stagger everywhere | Tokens per intent (enter, exit, emphasis); vary between beats |
| Callbacks (`onComplete`) used to start other animations | Put everything on the timeline; callbacks don't fire reliably under seek |
| `gsap.ticker.lagSmoothing` hiding dropped frames on the web | Measure with `umd webperf`; in capture it does not matter when you seek |

## Checks

- **MOT**: eases and durations from tokens (`umd lint`), one focal motion per beat, transform/opacity only.
- **REN**: two captures identical (`umd compare`).
- **WEB**: `gsap.matchMedia()` reduced-motion branch; `umd webperf <url>` shows no dropped frames or CLS.
- **LIC**: Standard licence recorded; not mixed into a no-code animation product.

## Sources

- https://github.com/greensock/GSAP (README, licence link) · https://gsap.com/docs/v3/
- https://github.com/greensock/gsap-skills · https://github.com/greensock/react
- https://www.remotion.dev/docs/gsap/use-gsap-timeline
- research_notes/…/web_animation.md
