# Revideo and Motion Canvas

TypeScript scene graphs animated by generator functions (`yield*`). Motion Canvas is the editor-first original; Revideo (MIT fork by Midrender) adds a headless `renderVideo()` API, audio/video export and parallel rendering. Pick Revideo when you want Remotion-like code video without the Remotion licence.

## Use when / avoid when

| Use when | Avoid when |
| --- | --- |
| Explainers and diagrams where steps chain in time (`yield* a(); yield* b();`) | The piece is mostly HTML/CSS layout and typography → `umd capture` or HyperFrames |
| You need a licence-free alternative to Remotion with headless renders | The team lives in React components → Remotion |
| Vector shapes, code blocks, LaTeX, layouts with signals | Heavy DOM text effects (SplitText, CSS filters): the 2D canvas renderer does not use the DOM |
| Parameterised videos from Node (`variables`) | Pure maths explainer → Manim |

Motion Canvas renders from its browser editor (Render button); there is no maintained headless path. For agents, prefer **Revideo**. Use Motion Canvas only when the person wants its editor.

## Setup

- Revideo: `npm init @revideo@latest`. Packages `@revideo/core`, `@revideo/2d`, `@revideo/renderer`, `@revideo/ffmpeg`, `@revideo/vite-plugin`, `@revideo/ui` (0.11.0 in Nov 2026; last push July 2026). Licence MIT.
- Telemetry: Revideo counts renders via PostHog; set `DISABLE_TELEMETRY=true` in the render environment.
- Motion Canvas: `npm init @motion-canvas@latest` (`@motion-canvas/core` 3.17.x, MIT; last push July 2026). Ecosystem repos `motion-canvas-camera` and `motion-canvas-graphing` are archived: do not depend on them.
- Examples: `midrender/examples` (no licence: read, do not copy), `motion-canvas/examples` (MIT, old).

## Core patterns

**1. A scene is a generator.** Revideo's `makeScene2D` takes a name, Motion Canvas's does not (`makeScene2D(function* (view) {…})`).

```tsx
/** @jsxImportSource @revideo/2d/lib */
import { makeScene2D, Rect, Txt } from "@revideo/2d";
import { all, createRef, easeInOutCubic, easeOutCubic, waitFor } from "@revideo/core";

export default makeScene2D("intro", function* (view) {
  const card = createRef<Rect>();
  const title = createRef<Txt>();
  view.add(<Rect ref={card} width={0} height={220} radius={24} fill="#111" />);
  view.add(<Txt ref={title} text="Ship faster" fill="#fff" fontSize={96} opacity={0} />);
  yield* card().width(900, 0.6, easeInOutCubic);
  yield* all(title().opacity(1, 0.4), title().y(-20, 0.4, easeOutCubic));
  yield* waitFor(1.2);
});
```

**2. Property tweens** are calls: `node().x(300, 0.6, easeOutCubic)` (target, seconds, timing function). Compose with `all(...)` (parallel), `sequence(0.08, ...)` (staggered), `chain(...)` (one after another), `loop(n, i => ...)`. Never write open-ended loops: total duration must be finite.

**3. Signals for derived motion**: `createSignal(0)` and pass functions as props (`x={() => progress() * 800}`) so dependent nodes follow without extra tweens.

**4. Timing functions** come from `@revideo/core`: `easeOutCubic`, `easeInOutCubic`, `easeOutExpo`, `linear`, plus factories `createEaseOutBack()`, `createEaseOutElastic()`. Map them to the project's motion tokens instead of picking per tween.

**5. Project file** sets size, fps and exporter:

```ts
import { makeProject } from "@revideo/core";
import intro from "./intro";
export default makeProject({
  scenes: [intro],
  settings: { shared: { size: { x: 1920, y: 1080 } }, rendering: { fps: 30, exporter: { name: "@revideo/core/wasm" } } },
});
```

**6. Parameters**: `useScene().variables.get("headline", "Default")` returns a signal; pass values from `renderVideo({ variables })`.

**7. Randomness**: `useRandom(123)` gives a seeded RNG (`nextInt`, `nextFloat`); never `Math.random()`.

**8. Media**: `<Video>` and `<Audio>` nodes export with frame-accurate sync in Revideo; keep files local.

## Rendering to video with umd

Revideo renders headless through a Node script; `umd capture` is not needed.

```ts
// render.ts
import { renderVideo } from "@revideo/renderer";
await renderVideo({
  projectFile: "./src/project.ts",
  variables: { headline: "Ship faster" },
  settings: { outFile: "film.mp4", outDir: "./out", workers: 1, logProgress: true },
});
```

`.motion/project.json`: `{ "render": { "command": "npx tsx render.ts", "output": "out/film.mp4" } }` (or compile with `tsc` and run `node dist/render.js` as the template does). `outFile` must end in `.mp4`. Partial renders: `settings.projectSettings.range: [start, end]` in seconds. `workers > 1` only on machines with many cores. Then `umd analyze out/film.mp4`.

Motion Canvas: render from the editor to an image sequence, then encode with FFmpeg; treat it as non-headless.

## When to choose Revideo over Remotion

| Criterion | Revideo | Remotion |
| --- | --- | --- |
| Licence | MIT | Paid above 3 employees |
| Authoring model | Imperative timeline (`yield*`), canvas scene graph | Declarative React, DOM + CSS |
| Ecosystem | Small, single maintainer company | Large: templates, captions, Lambda, skills |
| Best at | Step-by-step diagrams, code, maths-like explainers | Data-driven video, captions, DOM typography |

## Pitfalls

| Breaks | Fix |
| --- | --- |
| Revideo `makeScene2D(name, fn)` / Motion Canvas `makeScene2D(fn)` mixed up | Check which package you import from |
| `Math.random()` or time-based state | `useRandom(seed)`; everything from tweens and signals |
| Fonts not loaded in headless render | Bundle font files and declare them in CSS imported by the project |
| Long timelines with no beat structure | One scene per storyboard beat, `waitFor` holds sized from reading time |
| Copying code from `midrender/examples` | No licence: inspiration only |

## Checks

- **REN**: render twice, `umd compare`; output size/fps match the brief.
- **TIM / LIF**: `umd analyze` motion timeline; no `waitFor` hold over 1 s without ambient motion.
- **LIC**: MIT engine; telemetry disabled for client work.

## Sources

- https://github.com/midrender/revideo (README, `packages/template`, `packages/docs/.../renderVideo.mdx`, `random.mdx`, `parameterized-video.mdx`)
- https://github.com/motion-canvas/motion-canvas · https://docs.re.video/
- research_notes/…/programmatic_video.md
