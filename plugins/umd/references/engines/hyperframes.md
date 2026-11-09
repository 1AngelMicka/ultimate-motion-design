# HyperFrames

HeyGen's HTML→video engine for agents (Apache-2.0): scenes are HTML files driven by paused GSAP timelines, rendered frame by frame by its own CLI. Pick it for multi-scene films that benefit from its `check` audits, Studio preview, captions and registry blocks.

## Use when / avoid when

| Use when | Avoid when |
| --- | --- |
| Multi-scene promo, launch, explainer or social film in HTML/CSS/GSAP | A single page or loop: plain HTML + `umd capture` is simpler |
| You want built-in lint, layout/contrast checks and keyframe snapshots | The team already writes React video components (Remotion) |
| The person will keep editing in the HyperFrames Studio / desktop app | You need a TypeScript scene graph with generators (Revideo) |
| Batch renders from variables (`render --batch rows.json`) | Fully offline with no npm access at render time (vendor the CLI first) |

## Setup

- Node.js 22+ and FFmpeg. Run the CLI as `npx hyperframes <command>` (npm `hyperframes`, 0.9.x in Nov 2026). Licence: Apache-2.0.
- New project: `npx hyperframes init <dir>`. A website as the subject: `npx hyperframes capture <url> --json`.
- Health: `npx hyperframes doctor --json` (always exits 0, gate on `.ok`); missing Chrome: `npx hyperframes browser ensure`.
- Official skills (read `/hyperframes` before writing a composition; it is the contract and it moves with versions):
  - Claude Code: `claude plugin marketplace add heygen-com/hyperframes` then `claude plugin install hyperframes@hyperframes`.
  - Any agent: `npx hyperframes skills update` installs the core set matching the CLI version (`npx skills add heygen-com/hyperframes` also works but can lag).
- Local renders are free. `cloud`, `tts` and some media commands use a HeyGen account; `npx hyperframes usage --json` reports plan usage.

## Core patterns

**1. Project shape.** `index.html` is the root composition; one scene per file in `compositions/`, everything inside `<template>`, assets under `assets/` (no leading `/`).

```html
<div id="root" data-composition-id="main" data-start="0" data-duration="12"
     data-width="1920" data-height="1080">
  <div id="intro" data-composition-id="intro" data-composition-src="compositions/intro.html"
       data-start="0" data-duration="4" data-track-index="1"></div>
</div>
```

```html
<!-- compositions/intro.html -->
<template>
  <style>#root { position: absolute; inset: 0; }</style>
  <div id="root" data-composition-id="intro" data-width="1920" data-height="1080">
    <h1 id="intro-title" class="clip" data-start="0.4" data-duration="3">Ship faster</h1>
  </div>
  <script>
    const tl = gsap.timeline({ paused: true });
    tl.fromTo("#intro-title", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, 0.4);
    window.__timelines["intro"] = tl; // register LAST, after every tween
  </script>
</template>
```

**2. Timing contract.** Every timed element has `class="clip"`, `data-start`, `data-duration` (seconds) and shows over `[start, start + duration)`. The root `data-duration` is the video length. `data-track-index` is a Studio lane only; paint order is `z-index`.

**3. Seek-safe tweens.** Place tweens at absolute seconds, use `fromTo` (not `from`: it drifts on seek-back), finite `repeat` only, never `add()` a scene timeline into the root's. Seed randomness with a small PRNG (mulberry32).

**4. Other runtimes inside a scene.**

| Runtime | How HyperFrames drives it |
| --- | --- |
| CSS `@keyframes` | Found automatically; finite iterations, `animation-fill-mode: both` |
| WAAPI | `el.animate(…, { fill: "both" })` then `pause()` |
| Lottie / dotLottie | `autoplay: false`, set `loop`, push the player to `window.__hfLottie` |
| three.js, canvas, p5 | Draw from `e.detail.time` in a `window.addEventListener("hf-seek", e => …)` listener; async GPU work via `e.detail.waitUntil(promise)` |

**5. Keep it editable.** Stable short ids, copy and brand colours as variables (`data-var-text`, `var(--id)`), content inside the 90% action-safe box, key text inside 80% title-safe.

**6. The loop.** `npx hyperframes lint` while writing → `npx hyperframes check --json` (fix every error; "0 samples" means nothing was audited) → `npx hyperframes snapshot --at 0.5,3,6` and read the PNGs in `.hyperframes/artifacts/snapshots/` → `npx hyperframes preview --background` for review → render.

## Rendering to video with umd

HyperFrames renders itself; `umd capture` does not mount `data-composition-src` scenes, so do not point it at a HyperFrames `index.html`. Declare the command in `.motion/project.json` and let `umd render` run it, then analyse:

```json
{ "render": { "command": "npx hyperframes render --quality delivery --output out/film.mp4", "output": "out/film.mp4" } }
```

| Need | Flag |
| --- | --- |
| Iterate / first real encode / final | `--quality draft` / `looks` (default, CRF 16) / `delivery` |
| Frame rate | `--fps 30` (1–240 or `30000/1001`; default root `data-fps`, else 30) |
| Transparency | `--format webm` or `--format mov`; `png-sequence` for compositing |
| One scene only | `-c compositions/intro.html -o intro.mp4` |
| Byte-identical renders | `--docker` (add `--strict` for a reproducible container run) |
| Variants from data | `--batch rows.json --output "renders/{name}.mp4"` |

Then `umd analyze out/film.mp4`, `umd frames out/film.mp4 --sheet`, and render twice + `umd compare` for determinism. The same authoring discipline (paused GSAP timeline, everything a function of time) is what `umd capture` expects from a single-file page with `window.umdRender = (t) => tl.seek(t)`: moving a scene from one engine to the other is cheap.

## Pitfalls

| Breaks | Fix |
| --- | --- |
| Host id differs from the scene's `data-composition-id` / timeline key | Same id on host, scene root and `__timelines` key (else 45 s wait per scene, static frames) |
| Timeline registered before an async build (fonts, data) | Register at the end of the async callback |
| Tweening `display`, `visibility` or `autoAlpha` on a `.clip` | Animate a child element |
| CSS `transform` on an element GSAP also transforms | Let GSAP own the transform |
| `play()`/`pause()`/seek on `<video>`/`<audio>` | Never; time the element with `data-start`, `data-has-audio="true"` to keep sound |
| Font by name that is not bundled | `@font-face` to a file in `assets/fonts/` |
| dotLottie frozen in renders | `renderConfig: { autoResize: false, freezeOnOffscreen: false }` |
| CSS filters for grain/grade on footage | `npx hyperframes media-treatment` |
| Rule in this file contradicts the CLI | The installed `/hyperframes` skill and `npx hyperframes docs compositions` win |

## Checks

- **REN**: two renders + `umd compare` equal (or `--docker`); `ffprobe` duration equals root `data-duration`; fonts local.
- **TXT / ART**: `npx hyperframes check --json` contrast and layout findings; snapshots next to the reference stills.
- **TIM / LIF**: `check` fails `sweep_static` on 3 s+ with no visible change; confirm with `umd analyze`.
- **LIC**: Apache-2.0 engine; registry blocks and media still go into `assets.lock.json`.

## Sources

- https://github.com/heygen-com/hyperframes (README, `skills/hyperframes`, `skills/hyperframes-cli`)
- https://www.npmjs.com/package/hyperframes
- Catalogue §01/§02; research_notes/…/programmatic_video.md
