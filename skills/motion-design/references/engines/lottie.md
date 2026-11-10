# Lottie and dotLottie

Vector animation as JSON (Lottie) or zipped JSON + assets + state machines (`.lottie`). Players: dotlottie-web (ThorVG, canvas/WASM, recommended) and lottie-web (SVG/canvas, classic). Pick it for icons, illustrations and After Effects-authored loops that must play in apps, pages and videos alike.

## Use when / avoid when

| Use when | Avoid when |
| --- | --- |
| Designer delivers After Effects (Bodymovin) or LottieFiles Creator animations | Interactive, input-driven characters and UI with many states → Rive ([rive.md](rive.md)) |
| Animated icons, empty states, onboarding illustrations | Long narrative film: build it in GSAP/Remotion and embed Lottie only for parts |
| Same asset in web, iOS, Android and a video | Effects Lottie does not support (most AE effects, expressions vary by player) |
| Agent-generated or agent-edited vector animation (JSON is editable) | Raster-heavy content (embedded PNGs bloat files) |

## Setup

| Package | Install | Licence |
| --- | --- | --- |
| dotlottie-web | `npm i @lottiefiles/dotlottie-web` (0.8x, pin it); framework wrappers `@lottiefiles/dotlottie-react`, `-vue`, `-svelte` | MIT |
| lottie-web | `npm i lottie-web` (5.13) | MIT |
| relottie | `npm i @lottiefiles/relottie` (unified processor; plugins over the Lottie AST "last") | MIT |
| lottie-spec | format specification and schema (`lottie/lottie-spec`); prose docs in `LottieFiles/lottie-docs` (CC-BY-4.0) | spec |
| lottie-converter | Docker images `edasriyan/lottie-to-gif`, `-png`, `-apng`, `-webp`, `-webm` | MIT |
| OmniLottie | research model, text/image → Lottie (CVPR 2026) | Apache-2.0 code; check weights before commercial use |

Agent skills and tools: `npx skills add LottieFiles/motion-design-skill` (MIT; timing, easing and choreography principles); `LottieFiles/creator-agent-plugin` (MIT; MCP tools to create, edit and export in LottieFiles Creator, needs a LottieFiles account and approved scopes; confirm before any write or export). Avoid archived `LottieFiles/lottie-react` and `lottie-interactivity`.

## Core patterns

**1. dotlottie-web player.**

```js
import { DotLottie } from "@lottiefiles/dotlottie-web";
const player = new DotLottie({
  canvas: document.querySelector("#hero-anim"),
  src: "./assets/hero.lottie",           // or .json
  autoplay: true, loop: true,
  renderConfig: { autoResize: true },
});
player.addEventListener("load", () => console.log(player.totalFrames, player.duration));
```

Self-host the `.wasm` for offline renders: `DotLottie.setWasmUrl(new URL("./vendor/dotlottie-player.wasm", import.meta.url).href)` with the same version as the JS.

**2. lottie-web player** when you need SVG DOM (CSS on layers, crisp scaling):

```js
import lottie from "lottie-web";
const anim = lottie.loadAnimation({ container: el, renderer: "svg", loop: false, autoplay: false, path: "./assets/logo.json" });
anim.addEventListener("DOMLoaded", () => anim.playSegments([0, 90], true));
```

**3. Interactivity**: dotLottie state machines (`stateMachineLoad(id)`, `stateMachineStart()`) instead of the archived lottie-interactivity; keep loops short and calm.

**4. Edit JSON programmatically** with relottie plugins (recolour to the brand palette, rename layers, strip unused assets) rather than string replacements; validate against `lottie-spec` schema after edits.

**5. Generate** with OmniLottie or write simple shape-layer JSON guided by the spec; always preview and fix timing by hand. Motion principles from `motion-design-skill` apply: ease in/out, overlap, no linear moves on characters.

**6. Optimise**: `.lottie` (zipped) over raw JSON, no embedded large rasters, reduce precision of keyframe values, remove hidden layers.

## Rendering to video with umd

Seek frames explicitly so every capture frame is exact:

```js
// lottie-web
window.umdDuration = anim.totalFrames / anim.frameRate;
window.umdRender = (t) => anim.goToAndStop(Math.min(t * anim.frameRate, anim.totalFrames - 1), true);

// dotlottie-web (create with autoplay: false)
window.umdRender = (t) => player.setFrame(Math.min(t / player.duration, 1) * (player.totalFrames - 1));
```

`goToAndStop(value, true)` takes frames when the second argument is `true` (seconds otherwise). For dotLottie in captures set `renderConfig: { freezeOnOffscreen: false }` so it never pauses. In HyperFrames push the player to `window.__hfLottie` with `autoplay: false`.

Without a browser: `docker run --rm -e WIDTH=1920 -e HEIGHT=1080 -e FPS=30 -v "$PWD/anims":/source edasriyan/lottie-to-webm` writes a `.webm` next to each source file (transparent; also gif/png/apng/webp images). Then `umd analyze` the result or composite it.

## Pitfalls

| Breaks | Fix |
| --- | --- |
| Expressions or AE effects missing in the player | Bake expressions on export; test in the target player (dotLottie and lottie-web differ) |
| Fractional frames in seeks → jitter at low fps | Seek on the animation's own frame grid when its fps differs from capture fps, or capture at a multiple |
| Text layers with fonts not embedded | Convert text to shapes, or load the font before play |
| Huge JSON (MBs) with base64 images | Externalise or replace images; `.lottie` packaging |
| Colours not matching the brand | Recolour via relottie or theming, never by eye |
| Loops that pop at the seam | First and last frame identical; ease into the loop point |
| Downloading animations from marketplaces | Check each file's licence; record it in `assets.lock.json` |

## Checks

- **REN**: two captures identical; no blank frames at load (`umd analyze` black frames).
- **MOT**: easing and overlap on character motion; no linear tweens on organic shapes.
- **LIC**: source and licence of each Lottie file in `assets.lock.json`; OmniLottie weights licence checked.
- **WEB**: `prefers-reduced-motion` → `autoplay: false` and show a meaningful static frame.

## Sources

- https://github.com/LottieFiles/dotlottie-web (`packages/web/src/dotlottie.ts`) · https://github.com/airbnb/lottie-web
- https://github.com/LottieFiles/relottie · https://github.com/lottie/lottie-spec · https://github.com/LottieFiles/lottie-docs
- https://github.com/ed-asriyan/lottie-converter · https://github.com/OpenVGLab/OmniLottie
- https://github.com/LottieFiles/motion-design-skill · https://github.com/LottieFiles/creator-agent-plugin
- research_notes/…/web_animation.md
