---
name: motion
description: "Craft rules and reference index for motion design work: use when creating or changing any animation, video scene, animated page, transition, logo animation, kinetic type, 3D shot, voice-over, music, captions or render, in any engine (HTML/CSS, GSAP, Motion, Remotion, HyperFrames, Revideo, three.js, Lottie, Rive, SVG, canvas, Manim, Blender). FR : animation, motion design, vidéo, transition, easing, rendu, sous-titres, voix off."
---

# Motion craft (Ultimate Motion Design)

`umd` below means `node "${CLAUDE_PLUGIN_ROOT}/scripts/umd.mjs"`. References are in `${CLAUDE_PLUGIN_ROOT}/references/`. **Read only the file you need, when you need it**: each one costs tokens every time it is read.

## Always

1. **Time comes from the frame, never the clock.** In HTML rendered by `umd capture`, the clock, timers, `requestAnimationFrame` and `Math.random` are virtual and seeded, so ordinary CSS/GSAP/canvas code is deterministic; for full control define `window.umdRender(t)` and `window.umdDuration`. In Remotion use `useCurrentFrame()` and `random(seed)`; in three.js drive everything from `t`, not `clock.getDelta()`.
2. **Durations and easings come from `.motion/motion-tokens.json`** (expose them as CSS variables or a tokens module). No literal `0.3s` or `cubic-bezier(` in components.
3. **Every motion has a job**: direct the eye, explain a change, give feedback, link two ideas. One focal motion at a time; the rest follows, staggered.
4. **Easing follows physics**: entrances ease-out, exits ease-in, on-screen moves ease-in-out, never linear on a spatial move; springs only where something is thrown or caught.
5. **No AI tells**: pulsing dots, blur on every entrance, bouncy springs everywhere, everything fading up 20 px, infinite floating, purple gradients, glass cards, centred template layouts, emoji as icons. See `craft/anti-slop.md`.
6. **Video rhythm**: something new about every 2 s, never 3 s of dead air, nothing fully frozen for more than 1 s (breathing, drift, light), text on screen at least max(1.2 s, words ÷ 3 + 0.5 s).
7. **Look before animating**: render key stills (`umd still <entry> --at …`), compare them with the brief's reference, fix up to 3 rounds, then animate.
8. **Web**: animate `transform` and `opacity` only, never `transition: all`; honour `prefers-reduced-motion`; no scroll-jacking.
9. **Sound** lands 0 to 1 frame after the image; mix with `umd mix` (ducking), deliver at −14 LUFS / −1 dBTP unless the platform says otherwise.
10. **Licences**: record every asset in `.motion/assets.lock.json` (path, source, url, license, author) the moment it enters the project; no non-commercial model or asset in a commercial piece, no Tencent model in the EU. See `licenses.md`.

`umd rules [domain]` prints the project's build rules per quality domain in its language.

## Where to look

| Need | Read |
| --- | --- |
| How to produce the whole piece | `routes/` — html-video (R1, default), threejs-film (R3), blender (R2), director (R4, other models draw), web-page, explainer |
| A proven structure for a kind of piece | `recipes/` — launch-video, product-demo, presentation-video, explainer-video, logo-sting, kinetic-typography, social-short, data-story, hero-section, page-transitions, scrollytelling, micro-interactions, narrative-short |
| Engine API, patterns and determinism rules | `engines/` — hyperframes, remotion, revideo, gsap, motion, css-waapi, scroll, threejs, shaders, lottie, rive, svg, canvas-2d, manim, blender, diagrams-code |
| Timing, easing, principles | `craft/principles.md`, `craft/tokens.md` |
| Layout, safe areas, camera language | `craft/composition.md`, `craft/text-on-screen.md` |
| Voice, music, SFX, mix, captions | `audio/voice.md`, `audio/music-sfx.md`, `audio/mix.md`, `audio/captions.md` |
| Images, icons, fonts, stock, upscaling | `assets.md` |
| Export specs per platform | `platforms.md` |
| Licence traps | `licenses.md` |
| Optional official skills and MCP servers | `companions.md` |

## Useful commands while building

`umd still` (key frames on virtual time) · `umd capture --draft` (half size, 15 fps, fast) · `umd analyze <video>` (cuts, dead air, freezes, flashes, loudness, contact sheet) · `umd frames <video> --at 2.4` · `umd lint` · `umd licenses` · `umd mix` · `umd captions` · `umd webperf <url>`.
