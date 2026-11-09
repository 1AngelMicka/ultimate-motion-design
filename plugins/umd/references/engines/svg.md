# SVG animation

Vector shapes in the DOM: line drawing, shape morphs, logo reveals, icons, diagrams. Clean the file with svgo first, then animate with CSS/WAAPI or GSAP; flubber, MorphSVG or KUTE.js for morphs; SVG.js, Vivus or lazy-line-painter for specific jobs; pixel2motion when the logo only exists as a raster.

## Use when / avoid when

| Use when | Avoid when |
| --- | --- |
| Logo stings, icon motion, line-art reveals, diagram build-ups | Thousands of moving elements → canvas ([canvas-2d.md](canvas-2d.md)) |
| Crisp vectors at any resolution, text kept as text | Painterly, photographic or 3D looks |
| Shape morphs between two related silhouettes | Designer-authored character animation → Lottie/Rive |

## Setup

| Tool | Install | Licence / state |
| --- | --- | --- |
| svgo | `npx svgo in.svg -o out.svg` (4.x) | MIT, active |
| GSAP + MorphSVG / DrawSVG | `npm i gsap` ([gsap.md](gsap.md)) | Standard no-charge licence |
| flubber | `npm i flubber` (0.4.2) | MIT, inactive since 2022 but stable |
| KUTE.js | `npm i kute.js` (2.2.x, `svgMorph` / `svgCubicMorph` components) | MIT |
| SVG.js | `npm i @svgdotjs/svg.js` (3.2.x) | MIT (GitHub shows NOASSERTION) |
| Vivus | `npm i vivus` (0.4.6) | MIT, inactive since 2022 |
| lazy-line-painter | `npm i lazy-line-painter` (2.0.x) | MIT, inactive since 2023 |
| pixel2motion | agent skill from `nolangz/pixel2motion` (Python 3.10+, Pillow, NumPy, Playwright) | MIT |

## Core patterns

**1. svgo first, with animation-safe settings.** Default svgo merges paths, collapses groups and renames ids, which destroys animation targets.

```js
// svgo.config.mjs
export default {
  multipass: true,
  plugins: [{ name: "preset-default", params: { overrides: {
    cleanupIds: false, collapseGroups: false, mergePaths: false, convertShapeToPath: false } } }],
};
```

Keep a `viewBox`, give every animated part a semantic `id` (`#mark`, `#dot`, `#wordmark`), group parts that move together, and set `transform-box: fill-box; transform-origin: center` on parts that rotate or scale.

**2. Stroke drawing with `pathLength`** (no length measuring):

```html
<path id="sig" d="…" pathLength="1" fill="none" stroke="currentColor" stroke-width="3"
      style="stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw 1.4s cubic-bezier(.65,0,.35,1) .2s both" />
<style>@keyframes draw { to { stroke-dashoffset: 0; } }</style>
```

Stagger several paths with `animation-delay`; fade the fill in after the stroke completes for a "drawn then filled" logo. GSAP equivalent: `gsap.fromTo("#sig", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.4 })` with the same `pathLength="1"`.

**3. Morphing.**

- GSAP MorphSVG: `tl.to("#shapeA", { morphSVG: "#shapeB", duration: 0.8, ease: "power2.inOut" })`. Best default.
- flubber (no GSAP): `const interp = flubber.interpolate(dA, dB, { maxSegmentLength: 4 }); el.setAttribute("d", interp(p));` where `p` ∈ [0, 1]. Also `toCircle`, `separate`, `combine` for one-to-many morphs.
- KUTE.js: `KUTE.fromTo("#a", { path: "#a" }, { path: "#b" }, { duration: 800 }).start()` with the svgMorph component.
Morph shapes of similar complexity and orientation; otherwise morph through an intermediate (circle) or crossfade.

**4. SVG.js for generated SVG** (charts, diagrams built from data): `const draw = SVG().addTo("#stage").size(1920, 1080); draw.rect(200, 120).radius(16).fill("#6cf").animate(600).move(300, 200);`. Its `Timeline` (`el.timeline()`) supports `pause()` and `time(ms)` for seeking.

**5. Vivus / lazy-line-painter** for quick line-art reveals: `new Vivus("logo", { type: "oneByOne", duration: 120, start: "manual" })`; seek with `vivus.setFrameProgress(p)`.

**6. Raster logo → motion with pixel2motion.** It fits a clean semantic SVG to a PNG/JPG logo (overlay evidence against the source), then authors the motion and captures QA frames. Use it when the brand supplies no vector; always ask for the official SVG first.

**7. Logo sting structure**: anticipation (0.1–0.2 s), build (mark, then wordmark, overlapping), settle with a small overshoot, hold ≥ 1 s with slight ambient motion. Total 2–4 s.

## Rendering to video with umd

- CSS/WAAPI-animated SVG is paused and seeked by `umd capture` automatically.
- GSAP: paused timeline + `window.umdRender = (t) => tl.seek(t)`.
- flubber/Vivus: compute from `t` in `window.umdRender` (`interp(clamp(t / dur))`, `vivus.setFrameProgress(...)`).
- SMIL (`<animate>`, used by excalidraw-animate and some exports) is not CSS/WAAPI: seek it with `svg.pauseAnimations(); svg.setCurrentTime(t)` in `umdRender`.
- Logo on transparent background for editors: `umd capture logo.html --out logo.mov --transparent --format mov`.

## Pitfalls

| Breaks | Fix |
| --- | --- |
| svgo merged the paths you wanted to animate separately | Overrides above; re-export from the source file |
| Rotation around the wrong point | `transform-box: fill-box; transform-origin: center` (or GSAP `svgOrigin`/`transformOrigin`) |
| Morph twists or self-intersects | Same point count/orientation, MorphSVG `type: "rotational"`, or flubber `maxSegmentLength` smaller |
| Stroke drawing shows dash gaps on thick strokes | `stroke-linecap` consistent; dasharray slightly above 1 (`1.01`) |
| Text converted to outlines in a template the client edits | Keep live `<text>` with local font when copy changes |
| Filters (`feTurbulence`, blur) on large SVGs in capture | Slow and soft: limit area, or rasterise that layer |
| Vectorised raster logo slightly off-brand | Compare overlay against the source; ask for the official vector |

## Checks

- **ART**: logo matches the brand source (overlay evidence for pixel2motion), safe areas respected.
- **MOT**: easing per part, overlap between mark and wordmark, one focal move at a time.
- **REN**: sharp edges at 1080p/4K, two captures identical.
- **LIC**: logo and icon sources in `assets.lock.json`.

## Sources

- https://github.com/svg/svgo (`plugins/preset-default.js`) · https://github.com/veltman/flubber · https://github.com/thednp/kute.js
- https://github.com/svgdotjs/svg.js (`src/animation/Timeline.js`) · https://github.com/maxwellito/vivus · https://github.com/merri-ment/lazy-line-painter
- https://github.com/nolangz/pixel2motion · https://gsap.com/docs/v3/Plugins/MorphSVGPlugin/
- Catalogue §04; research_notes/…/web_animation.md
