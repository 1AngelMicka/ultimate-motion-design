# Rive

Interactive vector animation authored in the Rive editor and played by small runtimes (web canvas/WebGL2, React, iOS, Android, Flutter, C++). State machines and data binding make animations react to inputs and data. Pick it when the animation must respond to the user or to app state, not just play.

## Use when / avoid when

| Use when | Avoid when |
| --- | --- |
| Interactive characters, mascots, game-like UI, animated buttons with many states | A linear, non-interactive loop a designer exported from After Effects → Lottie ([lottie.md](lottie.md)) |
| One asset driven by inputs (hover, press, progress, booleans) or bound data (text, numbers, colours) | No one can author in the Rive editor (the `.riv` must be made there) |
| Small file size and runtime performance matter (mobile, games) | Authored video timeline with exact beats → GSAP/Remotion, embed Rive only for one element |
| Same asset across web, iOS, Android, Flutter | |

### Rive vs Lottie

| | Rive | Lottie |
| --- | --- | --- |
| Interactivity | State machines, listeners, data binding built in | Playback control; dotLottie state machines are newer and simpler |
| Authoring | Rive editor only | After Effects (Bodymovin), LottieFiles Creator, code/JSON |
| Agent-editable source | No (binary `.riv`) | Yes (JSON, relottie) |
| Typical file | Very small, vector + bones/meshes | Larger JSON, grows with layers |

## Setup

- Web: `npm i @rive-app/canvas` (2.50.x; canvas 2D renderer, smallest) or `@rive-app/webgl2` (2.50.x; better for complex vector effects); React: `npm i @rive-app/react-canvas` (4.x). All MIT runtimes (`rive-app/rive-wasm`, `rive-react`, `rive-runtime`).
- Editor files: `.riv` exports from the Rive editor (rive.app; account and plan apply to the editor, not the runtimes).
- Agent skills: Claude Code `/plugin marketplace add rive-app/skills` then `/plugin install rive@rive` (MIT, official: when and how to use Rive). Docs: `rive-app/rive-docs` (no licence: reference only).

## Core patterns

**1. Load a state machine.**

```js
import { Rive, Fit, Alignment, Layout } from "@rive-app/canvas";
const r = new Rive({
  src: "./assets/mascot.riv",
  canvas: document.querySelector("#mascot"),
  stateMachines: "State Machine 1",
  autoplay: true,
  autoBind: true,                        // binds the default view model instance
  layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
  onLoad: () => r.resizeDrawingSurfaceToCanvas(),
});
```

Call `resizeDrawingSurfaceToCanvas()` on load and on resize so it renders sharp at the device pixel ratio.

**2. Drive it with data binding.** Create with `autoBind: true`, then set view-model properties on `r.viewModelInstance`:

```js
const vm = r.viewModelInstance;          // after load
vm.number("progress").value = 0.6;
vm.boolean("isHover").value = true;
vm.string("headline").value = "Ship faster";
vm.trigger("celebrate").trigger();
```

Agree on property names with the designer up front; never guess them. State machine inputs (`stateMachineInputs(...).value`, `.fire()`), text-run APIs (`setTextRunValue`) and Rive Events (`EventType.RiveEvent`) still work for older files but are **deprecated** in current runtimes: use them only when the `.riv` has no view model.

**3. React**: `const { rive, RiveComponent } = useRive({ src, stateMachines: "State Machine 1", autoplay: true, autoBind: true })`, then `useViewModelInstanceNumber("progress", rive?.viewModelInstance)` (and the `Boolean`, `String`, `Color`, `Enum`, `Trigger` variants) from `@rive-app/react-canvas`. Check the hook signatures in the installed version.

**4. Sync sound or UI with the file**: observe view-model properties the designer exposes (data binding) rather than polling animation state.

**5. Layout**: `Fit.Layout` lets responsive Rive layouts follow the canvas size; otherwise `Fit.Contain`/`Fit.Cover`.

**6. Performance and accessibility**: one Rive instance per visible asset; `r.cleanup()` on unmount; pause off-screen (`r.pause()` when an IntersectionObserver reports hidden); under `prefers-reduced-motion`, set the state machine to a calm idle state or pause on a meaningful frame.

## Rendering to video with umd

- `umd capture` virtualises `requestAnimationFrame` and `performance.now`; the Rive runtime computes elapsed time from rAF timestamps, so state machines advance on virtual time. Set view-model properties at fixed times from `window.umdRender(t)` (e.g. `isHover` true once `t` crosses 2.0) so every render takes the same path.
- For exact seeking, ask for a state machine whose timeline follows a number property, and set it from `t` (`vm.number("time").value = t`). `r.scrub(animationName, seconds)` seeks a linear animation but is deprecated: only for simple legacy files.
- Prove determinism: capture twice and `umd compare`. If frames differ, an input depended on real pointer events or the file uses random/time-based logic.
- Transparent overlays: `umd capture … --transparent --format mov`, canvas background transparent in the file.

## Pitfalls

| Breaks | Fix |
| --- | --- |
| Blurry canvas on HiDPI | `resizeDrawingSurfaceToCanvas()` on load and resize; size the canvas with CSS |
| Wrong state machine or property name → `null`, nothing happens | Names from the designer's handoff; check `vm.number(...)` is not `null` |
| Deprecation warnings (inputs, text runs, events, `scrub`) | Migrate to data binding (rive.app/docs data-binding migration guide) |
| `.riv` from a newer editor than the runtime | Upgrade the runtime; pin versions together |
| Fonts in text runs not embedded | Embed fonts in the Rive file or use runtime font loading as documented |
| Several heavy instances in one page | Share one canvas where possible; pause off-screen |
| Capture depends on pointer events | Script properties from `t` in `umdRender` |

## Checks

- **WEB**: reduced-motion state, no dropped frames (`umd webperf <url>`), pause off-screen.
- **REN**: two captures identical when used in a video.
- **MOT / LIF**: idle state keeps subtle life (breathing, blinks), not a frozen pose.
- **LIC**: runtime MIT; `.riv` source and its author in `assets.lock.json`.

## Sources

- https://github.com/rive-app/rive-wasm (`js/src/rive.ts`: `viewModelInstance`, `autoBind`, deprecations of inputs/text runs/events/`scrub`, `resizeDrawingSurfaceToCanvas`)
- https://github.com/rive-app/rive-react · https://github.com/rive-app/rive-runtime · https://github.com/rive-app/skills · https://rive.app/docs
- research_notes/…/web_animation.md
