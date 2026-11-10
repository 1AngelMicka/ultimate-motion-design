# Effect and engine libraries

The open-source libraries that keep coming back in "free motion studio" lists, sorted by job, with their licence and what to watch in a deterministic render. Licences checked on GitHub on 2026-11-10. Read the row you need, not the file.

## Use when / avoid when

- Use to pick one library for one job (glitch, liquid image, self-drawing type, physics, splats) after the route is chosen.
- Avoid stacking them: one renderer owns the frame, each library gets one layer and one job, written in the brief. Handing an agent 20 libraries at once makes it pick one and half-use the rest.

## Determinism rule

`umd capture` replaces the clock (`requestAnimationFrame`, `performance.now`, `Date`, timers) and seeds `Math.random`, so most of these render frame-exact. Three exceptions:

- **Physics and simulations** (Planck, Rapier, gpu-io, Warp): step them with a fixed timestep derived from the frame number, never from wall time, and reset them when seeking backwards (re-simulate from 0 or cache states).
- **Libraries with their own GPU timers or workers** (some fluid and particle systems): check `umd render --twice` gives identical frames before trusting them.
- **Audio libraries** (Howler, wavesurfer): the picture is rendered silent; mix the sound with `umd mix`, not in the page.

## Effects for pages and scenes

| Library | Job | Licence | Notes |
| --- | --- | --- | --- |
| Alchemist0823/three.quarks | Particles in three.js: fire, magic, explosions | MIT | Seed emitters; render with the frame clock |
| 7PH/powerglitch | Glitch any element | MIT | Glitch counts as flashing: keep under 3 per second (SAF-01) |
| fand/vfx-js | Glitch, bloom, pixel effects on DOM elements via WebGL | MIT | |
| bradley/Blotter | Melting, dripping text | MIT | Old (2020), WebGL 1; test before relying on it |
| martinlaxenaire/curtainsjs | Images and video distorted by shaders | MIT | |
| robin-dela/hover-effect | Liquid transition between two images | MIT | |
| amandaghassaei/gpu-io | GPU fluid and reaction-diffusion simulations | MIT | Fixed timestep |
| cmiscm/leonsans | Type that draws itself | MIT | Unmaintained since 2020 |
| maxwellito/vivus | SVG line drawing | MIT | |
| sarcadass/granim.js | Living gradients | MIT | Or ShaderGradient (`engines/shaders.md`) |
| nolimits4web/atropos | 3D parallax tilt cards | MIT | Interactive pages; on video, drive the tilt from time |
| 0beqz/realism-effects | SSGI, SSR, motion blur, TRAA for three.js | MIT | Heavy; unmaintained since 2024 |
| mkkellogg/GaussianSplats3D | Gaussian splats in three.js | MIT | |
| patriciogonzalezvivo/glslCanvas | Fragment shaders on a canvas | MIT | |
| qrohlf/trianglify | Low-poly backgrounds | **GPL-3.0** | Licence trap in a shipped page or closed tool: render a still offline, or write your own |
| evanw/webgl-water | Water with caustics (demo) | **no licence** | Study only; do not copy its code |

## 2D, vector and layout

| Library | Job | Licence |
| --- | --- | --- |
| juliangarnier/anime | Timelines, easing, choreography | MIT |
| Popmotion/popmotion | Springs and keyframes (unmaintained; Motion is its successor) | MIT (package) |
| daybrush/scenejs | CSS keyframe scenes | MIT |
| konvajs/konva | Layered 2D canvas | MIT |
| fabricjs/fabric.js | Editable canvas graphics | MIT |
| rough-stuff/rough | Hand-drawn shapes | MIT |
| metafizzy/zdog | Flat pseudo-3D illustrations | MIT |
| KDE/glaxnimate | Desktop vector animation editor, exports Lottie | GPL-3.0 (an app: fine as a tool) |

## 3D, physics and rendering

| Library | Job | Licence |
| --- | --- | --- |
| mrdoob/three.js | Scenes, lights, cameras | MIT |
| threlte/threlte | three.js with Svelte | MIT |
| pmndrs/uikit | Interfaces inside 3D scenes | MIT |
| pmndrs/react-three-rapier | Rigid-body physics for React Three Fiber | MIT |
| gkjohnson/three-bvh-csg | Boolean operations on meshes | MIT |
| piqnt/planck.js | 2D physics | MIT |
| NVIDIA/warp | GPU simulation in Python | Apache-2.0 |
| amandaghassaei/OrigamiSimulator | Folding simulation | MIT |
| google/filament | Physically based renderer (native, WebGL build) | Apache-2.0 |
| mitsuba-renderer/mitsuba3 | Research path tracer | BSD-style |
| blender/blender | Modelling, rigging, Cycles (route R2) | GPL (an app: renders are yours) |
| AcademySoftwareFoundation MaterialX, OpenColorIO, OpenTimelineIO, alembic | Material, colour, editorial and geometry interchange | Apache-2.0 / BSD |
| zeux/meshoptimizer, regl-project/regl, ashima/webgl-noise | Mesh compression, functional WebGL, GLSL noise | MIT |
| guillaumeblanc/ozz-animation | Skeletal animation runtime (C++) | MIT |

## Sound and delivery

| Library | Job | Licence |
| --- | --- | --- |
| goldfire/howler.js | Web audio playback | MIT |
| katspaugh/wavesurfer.js | Waveforms on pages | BSD-3-Clause |
| adefossez/demucs | Stem separation | MIT (code; check each model's licence) |
| xiph/rnnoise | Voice denoising | BSD-3-Clause |
| myshell-ai/MeloTTS | Text to speech | MIT |
| k2-fsa/sherpa-onnx | Offline speech recognition and TTS | Apache-2.0 (models vary) |
| TMElyralab/MuseTalk | Lip-sync of a face to audio | MIT (code; check model weights) |
| MTG/essentia | Music analysis | **AGPL-3.0** (commercial licence sold separately): avoid in a shipped tool |
| LMMS/lmms | Music production app | GPL-2.0 (an app: tracks are yours) |
| Comfy-Org/ComfyUI | Node-based image and video generation | GPL-3.0 (an app; each model has its own licence) |
| Zulko/moviepy, Vanilagy/mediabunny | Video editing in Python; media in the browser | MIT; MPL-2.0 |
| obsproject/obs-studio, FFmpeg/FFmpeg | Screen capture; encoding | GPL / LGPL-or-GPL (tools) |

## Editing existing footage

For a route that starts from filmed material rather than code (route `edit` or a hybrid film). Each tool runs offline on your files; GPL tools are fine as tools, the licence matters only if you ship their code.

| Tool | Job | Licence |
| --- | --- | --- |
| Breakthrough/PySceneDetect | Detect every shot in a rush | BSD-3-Clause |
| WyattBlue/auto-editor | Cut silences and dead air | Unlicense |
| georgmartius/vid.stab | Stabilise (also the `vidstab` filters of GPL FFmpeg builds) | GPL-2.0 |
| hahnec/color-matcher | Match every shot's grade to one reference frame | GPL-3.0 (tool) |
| danielgatis/rembg | Remove backgrounds without a green screen | MIT (check each model) |
| hzwer/ECCV2022-RIFE | Frame interpolation (slow motion) | MIT |
| xinntao/Real-ESRGAN | 4× upscaling | BSD-3-Clause |
| facebookresearch/demucs | Stems (voice, drums, bass, other); archived, see adefossez/demucs | MIT |
| librosa/librosa | Beats and onsets, to cut on the music | ISC |

`umd analyze` already finds cuts, frozen and black frames and loudness; `umd sync` checks sound cues; these tools cover what umd does not (stabilisation, grading, upscaling, stems).

## Sources

Lists shared on X by @m4lkxx, @0xnicc0, @0xnoonez, @0xrivvian and @dyfwsammy (2026-11-10), each checked repository by repository; see SOURCES.md.
