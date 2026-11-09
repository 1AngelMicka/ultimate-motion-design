# Shaders and procedural backgrounds

GPU fragment shaders for animated backgrounds, textures, logo effects and transitions: Paper Shaders (ready presets), tsl-textures (three.js TSL presets), noise libraries for custom GLSL, glslViewer for headless shader renders. Pick a preset first; write GLSL only when no preset fits the brief.

## Use when / avoid when

| Use when | Avoid when |
| --- | --- |
| Backgrounds with depth: mesh gradients, grain, smoke, liquid metal, dithering | A flat brand colour does the job (do not add motion for its own sake) |
| Procedural materials on 3D objects (TSL) | Text-heavy frames where moving backgrounds hurt contrast (TXT) |
| Transitions between shots (gl-transitions style) | Low-end mobile pages without a static fallback |

## Setup and licences

| Package | Install | Licence |
| --- | --- | --- |
| Paper Shaders | `npm i @paper-design/shaders` (vanilla) or `@paper-design/shaders-react` (0.0.x: **pin the exact version**, breaking changes ship under 0.0.x) | Apache-2.0 |
| tsl-textures | `npm i tsl-textures` (3.x), needs `three` with WebGPU/TSL | MIT |
| stegu/webgl-noise | copy the `.glsl` files (simplex, classic Perlin, cellular) | MIT |
| glslify | `npm i glslify` (7.x; inactive since 2022 but stable): `#pragma glslify: snoise = require(glsl-noise/simplex/3d)` | MIT |
| ShaderGradient | `npm i @shadergradient/react @react-three/fiber three three-stdlib camera-controls` | ⚠️ README and npm say MIT but the repo has **no LICENSE file**: treat as unlicensed for commercial deliverables until the authors confirm |
| LYGIA | copy functions or use its resolver | ⚠️ Prosperity Public License 3.0.0 = **non-commercial** (30-day commercial trial); commercial use needs the Patron licence (sponsor/contributor) or a paid version licence. Do not ship it in client work by default |
| glslViewer | build or package manager; CLI | BSD-3-Clause |

Prefer Paper Shaders and stegu noise; record every shader source in `assets.lock.json`.

## Core patterns

**1. Paper Shaders preset (React).**

```tsx
import { MeshGradient } from "@paper-design/shaders-react";
<MeshGradient colors={["#0b1020", "#3a2bd8", "#6ad5ff", "#f6c1ff"]} distortion={0.8} swirl={0.2}
  speed={0.15} style={{ position: "absolute", inset: 0 }} />
```

Available families include mesh-gradient, grain-gradient, smoke-ring, liquid-metal, god-rays, warp, waves, voronoi, dithering, halftone, paper-texture, fluted-glass. Low `speed` (0.05–0.3) reads premium; fast swirls read as screensaver.

**2. Deterministic Paper Shaders.** `speed={0}` stops the internal rAF; `frame` is the time in **milliseconds**. React: pass `frame={t * 1000}`. Vanilla: `const m = new ShaderMount(el, meshGradientFragmentShader, uniforms, undefined, 0, 0)` then `m.setFrame(t * 1000)` per frame.

**3. tsl-textures on a three.js material.**

```js
import { marble } from "tsl-textures";
mesh.material.colorNode = marble({ scale: 1.2, thinness: 5, noise: 0.3,
  color: new THREE.Color(0x45464b), background: new THREE.Color(0xf0f0ef), seed: 0 });
```

Fix `seed`; animate by driving a parameter from a `uniform` set from `t` ([threejs.md](threejs.md)).

**4. Custom GLSL skeleton** (WebGL fragment shader, time as a uniform you control):

```glsl
precision highp float;
uniform vec2 u_res; uniform float u_time;
#include "noise3D.glsl"   // stegu snoise(vec3)
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float n = snoise(vec3(uv * 2.0, u_time * 0.08));
  vec3 col = mix(vec3(0.04, 0.06, 0.12), vec3(0.42, 0.84, 1.0), smoothstep(-0.4, 0.8, n + uv.y * 0.6));
  col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0; // dither
  gl_FragColor = vec4(col, 1.0);
}
```

**5. Headless shader renders with glslViewer** (no browser): `glslViewer bg.frag -w 1920 -h 1080 --headless -E sequence,0,8,30` writes a PNG sequence from 0 to 8 s at 30 fps (`-E` runs the command then exits; `record,<file>,<A>,<B>[,<fps>]` records a video). Encode with FFmpeg or composite in another engine.

## Banding and dithering

- Dark, slow gradients band after 8-bit H.264 encoding. Add ±0.5/255 dither in the shader (above) **and** a subtle grain layer (2–4% opacity) so the encoder keeps texture.
- Keep gradients in linear or OKLab-like interpolation inside the shader; avoid stacking several 8-bit post passes.
- Check the encode: `umd vmaf <encode> <master>` and inspect dark frames from `umd frames <video> --at …`. Raise bitrate/lower CRF for gradient-heavy pieces, or deliver 10-bit where the platform accepts it.
- Avoid pure black backgrounds under moving gradients; lift blacks slightly.

## Rendering to video with umd

- Canvas shaders in a page: stop internal loops (`speed={0}` / no rAF) and set time from `window.umdRender = (t) => …`; `umd capture` then grabs each frame. Without `umdRender`, capture's virtual rAF still advances Paper Shaders, but explicit frames are safer.
- Paper Shaders pause when off-screen or when the tab is hidden: keep the canvas inside the captured viewport.
- glslViewer sequences: encode with `ffmpeg -framerate 30 -i <pattern> -c:v libx264 -crf 16 -pix_fmt yuv420p out.mp4` (pattern = the names glslViewer wrote), then `umd analyze out.mp4`.

## Pitfalls

| Breaks | Fix |
| --- | --- |
| Shader time from `performance.now()` deltas | Time is a uniform derived from `t` |
| Unpinned `@paper-design/*` update breaks props | Pin exact version in `package.json` |
| Background steals contrast from text | Darken/blur the area behind text, check contrast on several frames (TXT) |
| LYGIA or ShaderGradient shipped in a commercial piece | Replace with stegu noise / Paper Shaders; `umd licenses` flags them (LIC) |
| High DPR full-screen shader drops frames on the web | Cap pixel count (Paper Shaders `maxPixelCount`, `minPixelRatio`), static fallback on low-end |
| Flicker from fast hue cycling | Slow loops, no luminance flashes > 3/s (SAF) |

## Checks

- **REN**: no banding on the contact sheet; VMAF ≥ 93 vs master; two captures identical.
- **LIC**: every shader source and licence in `assets.lock.json`; no LYGIA/ShaderGradient in commercial work without proof of licence.
- **ART**: background colours from the brief palette, validated with `umd still`.
- **SAF / WEB**: no fast luminance flicker; reduced-motion shows a static frame.

## Sources

- https://github.com/paper-design/shaders (`shader-mount.ts`: `speed`, `frame`, `setFrame`)
- https://github.com/boytchev/tsl-textures · https://github.com/stegu/webgl-noise · https://github.com/glslify/glslify
- https://github.com/ruucm/shadergradient · https://github.com/patriciogonzalezvivo/lygia (LICENSE.md, README)
- https://github.com/patriciogonzalezvivo/glslViewer (ARGUMENTS.md, COMMANDS.md)
- research_notes/…/3d_shaders_generative.md
