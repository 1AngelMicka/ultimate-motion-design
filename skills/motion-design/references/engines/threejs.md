# three.js, WebGPU/TSL and react-three-fiber

The standard web 3D stack: three.js (WebGL or WebGPU renderer, TSL node shaders), react-three-fiber + drei + postprocessing for React, `@pmndrs/vanilla` (drei-vanilla) for plain HTML, three-gpu-pathtracer for offline photoreal frames. Pick it for 3D heroes, product turntables, data globes and small 3D films.

## Use when / avoid when

| Use when | Avoid when |
| --- | --- |
| 3D hero or product shot in a web page | Rigged characters, cloth, complex materials → Blender ([blender.md](blender.md)) |
| A short 3D film drawn by code (route threejs-film) | A flat 2D look → GSAP/SVG/canvas |
| Data globes, particles, shader-driven backgrounds with depth | Only a gradient background → Paper Shaders ([shaders.md](shaders.md)) |
| Photoreal stills or slow shots rendered offline (path tracer) | Low-end mobile as main audience without a fallback |

## Setup

- `npm i three` (0.187 in Nov 2026, MIT). WebGPU: `import * as THREE from "three/webgpu"`, nodes from `"three/tsl"`. Vendor modules locally and load with an import map in HTML videos; no CDN at render time.
- React: `npm i @react-three/fiber @react-three/drei @react-three/postprocessing` (fiber 9.x for React 19, drei 10.x; all MIT).
- Plain HTML helpers: `npm i @pmndrs/vanilla` (drei-vanilla: `MeshTransmissionMaterial`, `MeshReflectorMaterial`, `Caustics`, `Sparkles`, `Stars`, `Grid`, `Outlines`, `Billboard`, `pcss`…). Post-processing for the WebGL renderer: `npm i postprocessing`.
- Offline path tracing: `npm i three-gpu-pathtracer` (0.0.x, MIT; current API is `WebGPUPathTracer` from `three-gpu-pathtracer/webgpu`, requires WebGPU).
- Assets: glTF/GLB only; compress with `gltfpack` (meshoptimizer) or `gltf-transform`; CC0 HDRIs from Poly Haven.

## Core patterns

**1. WebGPU renderer with WebGL2 fallback.**

```js
import * as THREE from "three/webgpu";
const renderer = new THREE.WebGPURenderer({ antialias: true });
await renderer.init();                 // falls back to a WebGL2 backend when WebGPU is missing
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
```

**2. TSL materials instead of raw GLSL**: `material.colorNode = mix(color("#0b1020"), color("#6cf"), uv().y)`; procedural presets from `tsl-textures` ([shaders.md](shaders.md)). Drive time through a `uniform(0)` you set from `t`, not the built-in `time` node, when the output must be deterministic.

**3. One `render(t)` function that owns the whole state.** Camera path, object transforms, material uniforms and `AnimationMixer` all derive from `t`:

```js
const uT = uniform(0);
function render(t) {
  uT.value = t;
  camera.position.set(Math.cos(t * 0.3) * 6, 2 + 0.2 * Math.sin(t), Math.sin(t * 0.3) * 6);
  camera.lookAt(0, 0.8, 0);
  mixer.setTime(t);                    // glTF clips seeked, not stepped
  renderer.render(scene, camera);
}
```

**4. Camera language**: slow dolly/orbit with eased speed, one move per shot, focal length 35–50 mm equivalent (`fov` 30–45), depth of field only to guide focus. Hold the end state with a slight drift (LIF).

**5. Lighting**: environment map (HDRI) + one key light with soft shadows; ACES or AgX tone mapping; keep `outputColorSpace` sRGB. Matcaps for stylised looks.

**6. React-three-fiber**: `<Canvas camera={{ fov: 35 }} dpr={[1, 2]}>`, drei `<Environment>`, `<ContactShadows>`, `<Float>`, `<Text>` (troika SDF text), `<MeshTransmissionMaterial>`; `@react-three/postprocessing` `<EffectComposer><Bloom mipmapBlur luminanceThreshold={0.9} /><Noise opacity={0.03} /><Vignette /></EffectComposer>`. Keep bloom selective; grain hides banding ([shaders.md](shaders.md)).

**7. Plain HTML with drei-vanilla** for `umd capture` and HyperFrames: same materials without React, e.g. `new MeshTransmissionMaterial({...})`, `new Sparkles({...})`, updated in `render(t)`.

**8. Path tracer for offline frames**: `const pt = new WebGPUPathTracer(renderer); pt.setScene(scene, camera);` then per frame: update the scene from `t`, call `pt.updateCamera()` / `pt.updateTransforms()` / `pt.updateMaterials()` as needed, and loop `pt.renderSample()` until enough samples (`maxSamples`, or the `complete` event) before capturing. Each frame is noisy until converged: budget seconds per frame and use the denoiser (`setDenoiser`).

## Rendering to video with umd

```js
renderer.setAnimationLoop(null);            // no free-running loop
window.umdDuration = 10;
window.umdRender = (t) => render(t);       // may return a promise (e.g. path tracer)
```

`umd capture index.html --out out/shot.mp4 --fps 30 --duration 10`. For the path tracer, make `umdRender` await convergence (resolve on `complete` or after N `renderSample()` calls). R3F: `<Canvas frameloop="never" gl={{ preserveDrawingBuffer: true }}>`, keep `t` in a ref read inside `useFrame`, and call `advance(t * 1000)` (exported by `@react-three/fiber`) from `umdRender`. In Remotion: `@remotion/three` `<ThreeCanvas>` + `useCurrentFrame()`. In HyperFrames: draw in an `hf-seek` listener.

Check WebGPU availability in the capture browser with `umd still` first; if the fallback kicks in, compare looks between backends.

## Pitfalls

| Breaks | Fix |
| --- | --- |
| `clock.getDelta()`, `performance.now()` deltas, physics stepped by real dt | Everything from `t`; physics stepped in fixed `1/fps` increments from 0 to `t` |
| TSL `time` node / `requestAnimationFrame` loop in a video | Own `uniform` set from `t`; `setAnimationLoop(null)` |
| Blank frames when capturing WebGL | `preserveDrawingBuffer: true` or capture right after `render()` |
| Banding in dark gradients and fog | Add grain/dither, higher precision targets, avoid 8-bit post chains |
| Aliasing on thin lines and text | `antialias: true`, render at 2× DPR or capture at 2× and downscale |
| 30 MB GLB, slow first frame | `gltfpack`/Draco/meshopt compression; wait for load before frame 0 |
| Random particle seeds per load | Seeded PRNG; capture seeds `Math.random`, other runtimes do not |
| Archived helpers (Tresjs/cientos, rapier.js, react-three-editor) | Use maintained packages (`dimforge/rapier`, drei) |

## Checks

- **REN**: two captures identical (`umd compare`), no banding/aliasing on the contact sheet, assets local.
- **ART**: key frames validated with `umd still` against the reference before animating.
- **LIF**: camera or subject never fully frozen > 1 s.
- **WEB** (pages): `umd webperf` dropped frames; DPR capped; reduced-motion stops auto-orbit.

## Sources

- https://github.com/mrdoob/three.js (WebGPURenderer, TSL) · https://threejs.org/docs
- https://github.com/pmndrs/react-three-fiber · https://github.com/pmndrs/drei · https://github.com/pmndrs/drei-vanilla · https://github.com/pmndrs/react-postprocessing · https://github.com/pmndrs/postprocessing
- https://github.com/gkjohnson/three-gpu-pathtracer (`src/webgpu/API.md`)
- research_notes/…/3d_shaders_generative.md
