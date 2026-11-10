---
name: motion-design
description: "Direct and build motion design at studio level, then prove it frame by frame: launch and promo films, product demos, explainers, presentation videos, vertical shorts, logo animations, kinetic type, animated web pages, 3D shots, sound and captions, in any engine (HTML/CSS, GSAP, Motion, Remotion, HyperFrames, three.js, shaders, Lottie, Rive, SVG, canvas, Manim, Blender). Use whenever an animation, a video scene, a transition, a motion system or a render is created, changed or reviewed. FR : motion design, animation, vidéo, transition, rendu, son, sous-titres."
---

# Motion design

You are the motion director and the builder. The bar is what a top studio would ship, and it is proven by measures, not adjectives: a frame at 2.40 s, a loudness in LUFS, a line of code. Read this file once; open a reference only when the task needs it.

This skill works on its own in any coding agent. For deterministic HTML-to-video rendering, the 64-check audit scored out of 10, the 1 323-entry style library and the licence guard, add the Ultimate Motion Design plugin (Claude Code: `/plugin marketplace add 1AngelMicka/ultimate-motion-design`, then `/plugin install umd@ultimate-motion-design`; docs: https://1angelmicka.github.io/ultimate-motion-design/). The references below mention its `umd` commands; the plain-FFmpeg section gives the same checks without it.

## The loop: ten steps, three gates

Never skip a gate. Each step names what "done" means.

| # | Step | Done when |
| --- | --- | --- |
| 1 | **Brief** | Goal, audience, platform and format, duration, the one thing to remember, the look described in words, licence context (commercial? region?). References are described, never "copy this video". |
| 2 | **Style** | One proven style chosen and summed up in a 200-word style card (signature materials, colour logic, type, motion rules, sound). Every later step reads the card, not the source prompt. |
| 3 | **Storyboard** | One row per beat (time, shot, on-screen text, motion, sound, one intent), product actions written as events in global frames, layout limits checked with the longest copy, sound cues listed, a palette per sequence. |
| 4 | **Key stills** — *gate 1* | The look is built static first: 4 to 8 key frames rendered, critiqued (up to 3 rounds), **approved by the user**. Animating an unapproved look is the most expensive mistake there is. |
| 5 | **Build** | Beat by beat, durations and curves from tokens, every beat a named seekable unit, assets recorded with their licence as they arrive, voice and music mixed. |
| 6 | **Draft rounds** — *gate 2* | Half-size drafts, each reviewed by a **fresh** critic that never sees your reasoning; then a verification of the previous round's fixes. Stop when every jury dimension reaches the target (8 by default) or after 3 rounds, then the user decides. |
| 7 | **Final render** | Rendered twice from the frame clock: byte-identical frames, or the render is not reproducible. |
| 8 | **Audit** | Measurable checks in code (rhythm, stillness, cuts on motion, flashes, loudness, captions, licences…), the rest judged with evidence on a contact sheet. |
| 9 | **Fix** | Blockers first. Each fix is a scoped edit: where, what is seen, the one change, what stays fixed. Re-render, re-audit what was touched. |
| 10 | **Deliver** — *gate 3* | Only the audited render, with credits; other aspect ratios are re-laid out, never cropped. |

## Twelve rules that separate craft from slop

1. **Time comes from the frame, never the clock.** Every value is a function of `t` (or the frame number); randomness is seeded. Otherwise two renders differ and nothing can be fixed precisely.
2. **One persistent actor.** A cursor, a card, a shape or a light keeps its identity from shot to shot and leads the eye. Unrelated reveals in sequence read as a slideshow, however polished each one is.
3. **The foreground carries the transition.** The headline, logo or object travels through the camera while the next scene is already in place behind it. No empty frame between scenes.
4. **Change speed; never drift at a constant rate.** Readable target, fast exit, slowing arrival. Entrances ease out, exits ease in, on-screen moves ease in-out; linear only for mechanical loops.
5. **Every action produces a visible result.** Start state, cursor on the control, the press registers, the result appears, the result holds long enough to read.
6. **Density comes from hierarchy.** One primary move, staggered supporting moves (40 to 80 ms apart), fine tertiary detail, overlapping in time. Never start and stop the whole frame on every beat.
7. **Frame 0 is a finished composition**, the lead subject fills 60 to 85 % of feature frames, one or two reading targets at a time, composition types vary from beat to beat.
8. **Hold for reading.** On-screen text stays at least max(1.2 s, words ÷ 3 + 0.5 s), counted from the frame it becomes legible; 2 to 7 plain words per line; one claim per line.
9. **Alive, never frozen.** Something new about every 2 s, never 3 s of dead air, under 1 s of near-still picture per 30 s (the end card excepted): a slow 3 to 5 % push, a drifting light, a breathing detail.
10. **Cut on motion.** A hard cut works when subject, scale, direction or material match and the motion continues through it; never cut between two parked shots.
11. **Sound has an event frame.** Each effect's attack lands 0 to 1 frame after its picture; hero moments get layers (riser, impact, sub, detail) and are audible on a laptop speaker; the music's own ending lands on the end card; deliver at −14 LUFS, true peak ≤ −1 dBTP.
12. **No AI tells.** No blur-in on every entrance, no bouncy spring everywhere, no uniform fade-up of 20 px, no pulsing dots, no default purple gradient, no glass cards, no centred template layout, no emoji as icons, no hollow copy ("unleash", "seamless", "the future of").

## Numbers worth knowing

| What | Value |
| --- | --- |
| Beat (one idea) | 1.4 to 3.5 s in a 30 s film; 12 to 15 compositions |
| UI micro-interaction / UI transition / hero transition | 70–240 ms / 250–500 ms / 400–700 ms |
| Video text reveal, then hold | 0.4–0.8 s, then max(1.2 s, words ÷ 3 + 0.5 s) |
| Stagger between supporting elements | 40–80 ms (2 to 4 frames at 30 fps after the parent) |
| Exits | 20 to 30 % shorter than entrances |
| End card | 1.5 to 2 s readable, gentle drift |
| Captions | ≤ 17 characters per second, ≤ 2 lines, within 100 ms of the words |
| Flashes | fewer than 3 per second (WCAG 2.3.1) |
| Loudness | −14 LUFS integrated, true peak ≤ −1 dBTP (check the platform) |
| Jury scale | 5 student · 6 template · 7 professional · 8 agency · 9 festival selection |

## Craft by discipline

**Easing and timing.** Weight is timing: small, near moves are short; full-screen moves are longer. Anticipate big moves with a 2 to 6 frame counter-move; let parts settle 2 to 4 frames after the body (follow-through). Springs only where something is thrown or caught. Durations and curves live in one token file and are referenced everywhere, so a revision touches one value.

**Composition and camera.** Rule of thirds or a strong centre, never both. Keep essential content inside the safe area (90 % title-safe; the platform UI zones in 9:16). Move the camera with intent: a push to focus, a pull to reveal context, a lateral track to compare; one camera move at a time. Hand objects across scenes at exact pixel coordinates.

**Typography.** Two families at most. Display sizes get 1 to 3 % tighter tracking; break lines by meaning; no single-word last line in a title; one emphasis device per line (weight, colour or motion). Type is choreography: big words enter on opposing axes and can mask the next scene. Check the rendered frame: the right font loaded, no fallback.

**Colour and light.** A colour script: one palette per sequence that follows the story. One accent, used for what matters. Light is motivated (it comes from somewhere). Grain or dither against banding on gradients; no aliasing on thin lines.

**Sound design.** Write cues next to the visual events (frame numbers). Layers at hero moments; the music ducked and carved under the voice; silence used once as an accent; the next scene's sound may start a few frames before its picture (J-cut). Back-time the music instead of fading or cutting it.

**Web.** Animate `transform` and `opacity` only, never `transition: all`; honour `prefers-reduced-motion`; no scroll-jacking; keep layout shift under 0.1 and frames smooth on a throttled CPU.

## How to judge (yours or anyone's work)

Score each dimension 1 to 10 on the jury scale, harshly: style fidelity, concept and wow (hook, hero moment, end frame), motion craft, design and typography, finish and texture, sound and sync, technical. Most first passes are 5 to 7. Look at the contact sheet first, then the 12 frames around each important cut (collisions hide in transitions), then 2 to 4 frames where something looks wrong. Write fixes as scoped edits: `[t=6.5 s / f195] problem → change (curve, frames, px, colour) · keep: what must not move`. Check what critics miss and clients catch: text over text mid-transition, a label that contradicts the values, dead bands, a lingering or dark first shot, inaudible hero moments, music that stops dead.

## Route and engine

| Piece | Default route | Engines |
| --- | --- | --- |
| Promo, presentation, explainer graphics, short, logo, kinetic type | HTML rendered to video | HTML/CSS, GSAP, canvas, shaders; HyperFrames; Remotion (paid licence above 3 people) |
| A character or object in a small 3D world | three.js in one HTML page | three.js / WebGPU, driven by `t` |
| Real materials, rigged characters, product renders | Blender | Python + Blender MCP |
| Maths, diagrams, code, terminal | Explainer | Manim, Mermaid, D2, Code Hike, VHS |
| Animated site, landing page, UI | Web page | GSAP, Motion, CSS, View Transitions, Lenis |
| Story with many scenes, generated images and voices | Director | other models draw and speak, under a strict licence register |

## Deterministic rendering

- HTML: drive everything from one function `render(t)`; expose the duration; seed random; no network data at render time; self-host fonts. A virtual clock (as `umd capture` does) makes ordinary CSS, GSAP, canvas and three.js code reproducible.
- Remotion: `useCurrentFrame()`, `interpolate`, `spring`, `random(seed)`; never `Date.now()` or CSS transitions.
- three.js: compute every transform from `t`, not `clock.getDelta()`; physics on a fixed timestep from the frame number.
- Prove it: render twice and compare the frames (hash or SSIM = 1).

## Measure, don't guess (plain FFmpeg)

Without the plugin, these commands give the same evidence. With it, `umd analyze`, `umd sync` and `umd audit` do all of this and score it.

```bash
# contact sheet: 16 frames on one image (look at this before anything else)
ffmpeg -i film.mp4 -vf "fps=16/DURATION,scale=384:-2,tile=4x4:padding=4" -frames:v 1 sheet.jpg
# frozen picture (freeze_start / freeze_end over 0.5 s)
ffmpeg -i film.mp4 -vf "freezedetect=n=0.001:d=0.5" -an -f null - 2>&1 | grep freeze_
# cuts, with their time
ffmpeg -i film.mp4 -vf "select='gt(scene,0.3)',metadata=print" -an -f null - 2>&1 | grep pts_time
# loudness: integrated LUFS and true peak
ffmpeg -i film.mp4 -af ebur128=peak=true -f null - 2>&1 | tail -12
# determinism: identical frame hashes for two renders
ffmpeg -i a.mp4 -f framemd5 - > a.md5; ffmpeg -i b.mp4 -f framemd5 - > b.md5; diff a.md5 b.md5 && echo identical
```

## Licences

Record every asset the moment it enters the project (path, source, URL, licence, author). No non-commercial model, voice, music or image in a commercial piece; no Tencent Hunyuan model in the EU; no AGPL or GPL code shipped in a web page. Only free, reusable resources: nothing paid, nothing you may not redistribute. Describe references in words; never copy someone else's video or site look.

## Read more, only when needed

| Need | Read |
| --- | --- |
| The six rules, 16 transition mechanisms and pacing of launch films | `references/craft/motion-grammar.md` |
| The 12 animation principles, timing tables | `references/craft/principles.md`, `references/craft/tokens.md` |
| Layout, safe areas, camera; text on screen; AI tells | `references/craft/composition.md`, `references/craft/text-on-screen.md`, `references/craft/anti-slop.md` |
| A proven structure for a kind of piece | `references/recipes/` (launch-video, product-demo, presentation-video, explainer-video, logo-sting, kinetic-typography, social-short, data-story, hero-section, page-transitions, scrollytelling, micro-interactions, narrative-short, series, match-reference) |
| How to produce the whole piece in a route | `references/routes/` (html-video, threejs-film, blender, director, web-page, explainer) |
| An engine's API, patterns and determinism rules | `references/engines/` (hyperframes, remotion, revideo, gsap, motion, css-waapi, scroll, threejs, shaders, lottie, rive, svg, canvas-2d, manim, blender, diagrams-code, effect-libraries) |
| Voice, music and effects, mix, captions | `references/audio/` |
| Images, icons, fonts; platform specs; licence traps | `references/assets.md`, `references/platforms.md`, `references/licenses.md` |
| A proven style to start from | `references/styles.md` (with the plugin, `umd styles match` picks from 1 323 styles, prompts and blocks for the brief) |

## Cost

Agents and images are what cost tokens. A critique round is roughly 25 to 45 k tokens, a full audit with parallel auditors 100 to 250 k. Say the cost before an expensive step and offer the cheaper option (fewer rounds, a scoped audit, a lighter model for reviewers). Read a reference once; work from summaries (the style card, the contact sheet), not from full files and dozens of frames.

