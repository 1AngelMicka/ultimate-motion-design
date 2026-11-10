# Canvas 2D and generative: p5.js, PixiJS, two.js, paper.js, canvas-sketch

Immediate-mode drawing for particles, generative patterns, data art, hand-drawn looks and many-object scenes. Pick canvas when SVG/DOM would need thousands of nodes or when the look is procedural; draw every frame as a pure function of `t` and a seed.

## Use when / avoid when

| Library | Pick when | Licence |
| --- | --- | --- |
| p5.js | Quick generative sketches, noise fields, creative-coding idioms | LGPL-2.1 (fine to load as a library; changes to p5 itself stay LGPL) |
| PixiJS | GPU 2D with sprites, filters (`pixi-filters`), many objects and particles | MIT |
| two.js | Vector scene graph that renders to SVG, canvas or WebGL with one API | MIT |
| paper.js | Path geometry: boolean ops, offsets, smoothing, hit tests | MIT (GitHub shows NOASSERTION) |
| canvas-sketch | Print/video-oriented sketches with fixed dimensions, duration, fps and frame export | MIT |

Avoid canvas for text-heavy layouts (no accessibility, no selection) and for UI that must be crawlable; avoid it for a handful of shapes where SVG is simpler ([svg.md](svg.md)).

## Setup

- `npm i p5` (2.x; p5 2 dropped `preload()` in favour of `async setup()` with `await loadImage(...)`), `npm i pixi.js` (8.x), `npm i two.js` (0.8.x), `npm i paper` (0.17.x).
- canvas-sketch: `npm i canvas-sketch canvas-sketch-util`, CLI `npm i -g canvas-sketch-cli` (bin `canvas-sketch`).
- Seeded randomness: `canvas-sketch-util/random` (`random.setSeed("brief-01")`, `random.value()`, `random.noise2D(x, y, freq, amp)`), p5 `randomSeed(n)` / `noiseSeed(n)`, or a small PRNG (mulberry32) for other libraries.

## Core patterns

**1. Pure function of time.** State at frame N is computed from `t`, never accumulated from previous frames. For simulations (particles with velocity), re-simulate from 0 with fixed steps or precompute all frames once.

```js
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = mulberry32(42);
const dots = Array.from({ length: 400 }, () => ({ x: rnd(), y: rnd(), phase: rnd() * Math.PI * 2 }));
function draw(ctx, t, w, h) {
  ctx.clearRect(0, 0, w, h);
  for (const d of dots) {
    const r = 2 + 1.5 * Math.sin(t * 1.2 + d.phase);
    ctx.beginPath(); ctx.arc(d.x * w, d.y * h, r, 0, Math.PI * 2); ctx.fill();
  }
}
```

**2. p5 in instance mode, no free loop.**

```js
new p5((p) => {
  p.setup = () => { p.createCanvas(1920, 1080); p.randomSeed(7); p.noiseSeed(7); p.noLoop(); };
  p.draw = () => { const t = window.__t ?? 0; p.background(12); /* draw from t */ };
  window.umdRender = (t) => { window.__t = t; p.redraw(); };
});
```

**3. PixiJS without the ticker.**

```js
import { Application, Graphics } from "pixi.js";
const app = new Application();
await app.init({ width: 1920, height: 1080, background: "#0b1020", antialias: true, autoStart: false });
document.body.appendChild(app.canvas);
window.umdRender = (t) => { updateScene(t); app.render(); };
```

**4. two.js**: `const two = new Two({ width: 1920, height: 1080, type: Two.Types.canvas, autostart: false }).appendTo(el);` set properties from `t`, then `two.update()`.

**5. paper.js for geometry**: `paper.setup(canvas)`; build paths, use `path.smooth()`, `unite/subtract/intersect`, `getPointAt(offset)` for objects travelling along a path; after changes call `paper.view.update()` instead of relying on `onFrame`.

**6. canvas-sketch for fixed-duration loops.**

```js
const canvasSketch = require("canvas-sketch");
const settings = { dimensions: [1920, 1080], animate: true, duration: 6, fps: 30 };
canvasSketch(() => ({ context, width, height, playhead }) => {
  // playhead goes 0 → 1 over `duration`: perfect loops with Math.sin(playhead * Math.PI * 2)
}, settings);
```

**7. Visual quality**: draw at device resolution (canvas size × DPR or 2× then downscale), round line caps, avoid pure-white particles on pure black (harsh), add subtle grain over gradients, limit palette to the brief.

## Rendering to video with umd

- Any library above: stop its loop and expose `window.umdRender = (t) => …` plus `window.umdDuration`; `umd capture sketch.html --out out/gen.mp4 --fps 30`. Capture virtualises rAF and seeds `Math.random` anyway, but explicit rendering avoids double-stepping.
- canvas-sketch standalone: `canvas-sketch sketch.js --output=out --stream` streams frames to MP4 through FFmpeg (`--stream=gif` for GIF); or `Ctrl+Shift+S` in the browser to export a PNG sequence. Then `umd analyze`.
- Check a few frames with `umd still sketch.html --at 0,2,4` before full captures.

## Pitfalls

| Breaks | Fix |
| --- | --- |
| Accumulated state (`x += vx`) with real deltas | Derive from `t`, or fixed-step re-simulation |
| Unseeded `random()`/`noise()` outside capture | `randomSeed`/`noiseSeed`, canvas-sketch-util `setSeed`, PRNG |
| Blurry canvas | Set canvas pixel size to output size (not CSS size); account for DPR |
| p5 1.x code (`preload`) on p5 2 | `async setup()` with `await loadImage()` (or the `p5.js-compatibility` add-on) |
| `@pixi/particle-emitter` with Pixi 8 | It only supports Pixi 6–7: write particles from `t` or pin Pixi 7 |
| Pixi ticker still running during capture | `autoStart: false`, call `app.render()` yourself |
| Thousands of draw calls per frame on the web | Batch (Pixi), offscreen caching, cap particle count on mobile |
| Flicker from per-frame random colours | Colour from seed per element, not per frame (SAF) |

## Checks

- **REN**: two captures identical; no aliasing on the contact sheet.
- **LIF**: generative backgrounds keep slow motion through the last frame.
- **ART**: palette from the brief; stills validated before full renders.
- **LIC**: p5 LGPL noted if p5 is modified; seeds and sources in `assets.lock.json`.

## Sources

- https://github.com/processing/p5.js · https://github.com/pixijs/pixijs (`src/app/Application.ts`) · https://github.com/jonobr1/two.js · https://github.com/paperjs/paper.js
- https://github.com/mattdesl/canvas-sketch (`docs/exporting-artwork.md`) · https://github.com/mattdesl/canvas-sketch-util
- research_notes/…/3d_shaders_generative.md
