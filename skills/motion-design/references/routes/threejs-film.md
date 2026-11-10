# Route R3 — One three.js scene, fixed shot by shot

One HTML file holds one three.js world; the film is a list of shots (camera + events) over that world, captured frame by frame. Pick it for a character or object living in a small stylised 3D world.

## Use when / avoid when

| Use when | Avoid when (pick instead) |
| --- | --- |
| A robot, creature, vehicle or product in a small 3D set | Photoreal materials, cloth, hair, rigged humans → [blender.md](blender.md) |
| Stylised 3D: toy, low-poly, clay, neon, isometric | Flat UI, type, charts → [html-video.md](html-video.md) |
| The same world is seen from many angles (shots reuse assets) | Many unrelated illustrated scenes → [director.md](director.md) |
| You want a web-interactive version of the same scene later | Real-time site hero only, no video → [../recipes/hero-section.md](../recipes/hero-section.md) |

## Setup

- **three** (MIT, 0.187 in Nov 2026). Vendor the module locally and load it with an import map; no CDN at render time. Engine details: [../engines/threejs.md](../engines/threejs.md), shaders: [../engines/shaders.md](../engines/shaders.md).
- Helpers, all MIT: `pmndrs/drei-vanilla` (drei helpers without React), `Alchemist0823/three.quarks` (particles), `boytchev/tsl-textures` (procedural TSL materials), `gkjohnson/three-gpu-pathtracer` (path-traced frames when real time is not needed).
- Capture: `umd capture` (default, virtual time). Alternative with React: Remotion + `@remotion/three` (⚠️ Remotion licence: free up to 3 employees, paid company licence above). Licence-free alternative to Remotion: this route as is.
- ⚠️ `patriciogonzalezvivo/lygia` is non-commercial by default: do not paste its functions into a commercial piece; use MIT noise (stegu/ashima) instead.

## Core patterns

**1. Scene state is a function of `t`.** No `THREE.Clock`, no `requestAnimationFrame` loop of your own:

```js
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
const ready = loadAssets();                       // GLTF, HDR, textures
window.umdDuration = 24;
window.umdRender = async (t) => {
  await ready;                                    // umd waits for images and fonts, not GLTF
  const shot = SHOTS.find(s => t >= s.start && t < s.end) ?? SHOTS.at(-1);
  shot.apply(t - shot.start);                     // camera + events for this shot
  idle(t);                                        // breathing, blinks, flicker: never fully still
  renderer.render(scene, camera);
};
```

**2. Shots are data.** `SHOTS = [{ id, start, end, camera: { from, to, fov }, events: [{ at, do }] }]`, copied from `storyboard.md`. Fix one shot at a time; never re-tune the whole film in one pass.

**3. Still next to the reference, 3 rounds, before any animation.** Render one key frame per shot, put it beside the reference, list the differences in words (silhouette, scale, light direction, palette, detail), correct, repeat three times:

```bash
umd still film.html --at 1,5,9,13 --out .motion/stills
ffmpeg -i ref.png -i .motion/stills/<still>.png -filter_complex "[0]scale=-2:720[a];[1]scale=-2:720[b];[a][b]hstack" .motion/stills/side-by-side.png
```

**4. Detail density sells it.** Reported example: 202 chain links and 480 wheels on one robot octopus. Use `InstancedMesh` for repeated parts, bevels on hard edges, small greebles, contact shadows. An empty plane under a lone primitive reads as AI slop.

**5. Something opens or changes every 2–3 s.** Each shot has at least one event: a hatch opens, a light switches, a part unfolds, a particle burst. Write the event list before building ([../craft/principles.md](../craft/principles.md)).

**6. Light like a set.** Environment map (`RoomEnvironment` + `PMREMGenerator`), one key light with shadows, a rim light, tone mapping set once and kept for stills and final.

**6b. Finish in one module.** `${CLAUDE_PLUGIN_ROOT}/templates/threejs/post.js` adds bloom, a miniature depth of field, grain and vignette, all driven by `t` (grain seeded by the frame number, so two renders stay identical; checked with `templates/threejs/post-demo.html`). Call `post.render(t)` instead of `renderer.render(scene, camera)`, and `post.setFocus(d)` for a focus pull.

**7. Characters**: eyes lead the body by 6–10 frames, idle breathing, blinks, nothing frozen on the last shot ([../recipes/narrative-short.md](../recipes/narrative-short.md)).

### The loop

| Step | Do | Proof |
| --- | --- | --- |
| 1. Brief | Reference image(s) described in words: shot length, camera height, how things enter frame | `BRIEF.md` |
| 2. Storyboard | Shot list with start/end, camera move, event every 2–3 s | `storyboard.md` |
| 3. Stills | Static scene, one still per shot, 3 rounds vs reference | side-by-side PNGs |
| 4. Build | Camera moves and events per shot, idle layer | `film.html`, `assets.lock.json` |
| 5. Draft | `umd render --draft` | render folder |
| 6. Critique | `umd frames <video> --every 2`, check density, events, stillness | frames + notes |
| 7. Final | `umd render`, audio mix ([../audio/mix.md](../audio/mix.md)) | MP4 |
| 8. Audit | `/umd:audit` → `/umd:fix` → `umd deliver` | `audit.json` |

### Cost

Creator-reported (unverified): one reference image and a 475-word prompt; ~14 min for the final render. Tokens go mostly to the three still rounds; a heavy scene renders slowly but costs no tokens while rendering.

## Rendering to video with umd

```json
{ "capture": { "entry": "film.html", "fps": 30, "duration": 24 } }
```

Draft with `umd render --draft` (lower cost) while fixing shots; final at the brief's fps. For path-traced frames, accumulate samples inside `umdRender` before returning (it may return a promise).

## Pitfalls

| Breaks | Fix |
| --- | --- |
| GLTF still loading on frame 0 (empty scene) | Await a `ready` promise inside `umdRender` |
| Physics stepped by wall-clock `dt` | Step a fixed `1/fps` per frame from `t`, or bake the simulation first |
| Shader `uTime` from `performance.now()` | Set uniforms from `t` |
| Unseeded randomness in scatter, particles | Seeded PRNG; `umd capture` seeds `Math.random` only |
| Animating before the still matches the reference | Stop: finish the 3 still rounds first (ART blocker) |
| Thin lines and high-frequency textures shimmer | `antialias: true`, thicker lines, mipmaps; check frames zoomed |
| Camera always orbits at the same speed | Motivated moves: push-in on an event, cut on action, hold on reveals |
| Hunyuan3D or other generated meshes | ⚠️ Tencent licence not valid in EU, UK, South Korea; record every model in `assets.lock.json` |

## Checks

- **ART**: 3 rounds of side-by-side stills saved before building motion.
- **LIF**: frame diff on the last shot (never frozen), events every 2–3 s on the contact sheet.
- **TIM**: `umd analyze` motion timeline, no dead air > 3 s.
- **REN**: `umd compare` two renders identical; no aliasing on zoomed frames.
- **LIC**: `umd licenses` (models, HDRIs, textures in `assets.lock.json`).

## Sources

- https://github.com/mrdoob/three.js · https://github.com/pmndrs/drei-vanilla · https://github.com/Alchemist0823/three.quarks · https://github.com/boytchev/tsl-textures · https://github.com/gkjohnson/three-gpu-pathtracer
- Route and figures: research_notes/…/posts_x_utilisateur.md (post 5, 0x_fokki example) · reports/Dépôts motion design pour agents.md (R3)
