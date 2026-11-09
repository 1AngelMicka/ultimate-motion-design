# Route R1 — HTML video drawn by code

Every frame is HTML/CSS/SVG/Canvas computed from time, then captured to MP4. The cheapest and fastest route: pick it for flat or graphic styles, promos, launch films, explainers, kinetic type, data and shorts.

## Use when / avoid when

| Use when | Avoid when (pick instead) |
| --- | --- |
| Flat, graphic, UI-based, typographic or 2.5D look | Real materials, photoreal objects, rigged characters → [blender.md](blender.md) |
| Promo, launch, product demo, explainer, social short, logo sting | One character living in a small 3D world → [threejs-film.md](threejs-film.md) |
| Fast iteration: a draft render in seconds to minutes | Many illustrated scenes with narration and generated imagery → [director.md](director.md) |
| Brand fonts, real UI, real numbers must stay exact | Pure maths or algorithm explainer → [explainer.md](explainer.md) (Manim) |

## Setup

Engine choice, decided at kickoff and written in `.motion/project.json`:

| Engine | Pick when | Licence |
| --- | --- | --- |
| **Plain HTML + GSAP/CSS, `umd capture`** (default) | One file, any library, no build step | GSAP free "Standard" licence (not OSI, see [../engines/gsap.md](../engines/gsap.md)); CSS/WAAPI none |
| HyperFrames | Multi-scene compositions, its own `lint`/`check` audits, captions, registry blocks | Apache-2.0 — [../engines/hyperframes.md](../engines/hyperframes.md) |
| Remotion | React team, snapcn components, Remotion templates (captions, Code Hike) | ⚠️ Remotion licence: free for individuals, non-profits and companies up to 3 employees; paid company licence above — [../engines/remotion.md](../engines/remotion.md) |
| Revideo | TypeScript scene graph, headless `renderVideo()` | MIT — [../engines/revideo.md](../engines/revideo.md) |

Licence-free alternatives to Remotion: plain HTML + `umd capture`, HyperFrames, Revideo, or Multiplane (Apache-2.0, `render(t)` contract). Choose one at kickoff; never mix two engines in one piece.

Run `umd doctor` once (Node, FFmpeg, Playwright + Chromium). Serve fonts and libraries from disk (Fontsource, `node_modules`), never from a CDN at render time.

## Core patterns

**1. Every frame is a pure function of `t`.** Build a paused timeline and expose it to `umd capture`:

```html
<script src="./vendor/gsap.min.js"></script>
<script>
  const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
  tl.from(".title span", { yPercent: 110, duration: 0.6, stagger: 0.04 }, 0.3)
    .to(".card", { scale: 1.04, duration: 1.2 }, 1.1);
  window.umdDuration = 12;            // seconds
  window.umdRender = (t) => tl.seek(t); // called once per frame
</script>
```

Without `umdRender`, `umd capture` still virtualises time (rAF, timers, `Date.now`, seeded `Math.random`) and seeks CSS/WAAPI animations, so plain CSS keyframes work too. Remotion uses `useCurrentFrame()`, HyperFrames its own timeline: see the engine files.

**2. Scene list mirrors the storyboard.** One `<section data-beat="b03">` per beat, start and end times taken from `storyboard.md`, durations and easings from `motion-tokens.json` ([../craft/tokens.md](../craft/tokens.md)). `umd lint` flags hard-coded values.

**3. Something new about every 2 s**, nothing frozen for more than 1 s, even on the end card: slow push, drifting grain, a breathing gradient ([../craft/principles.md](../craft/principles.md)).

**4. One focal motion at a time.** Stagger secondary elements 40–80 ms behind the hero move; never start three unrelated moves on the same frame.

**5. Backgrounds with depth, not stock gradients**: Paper Shaders (`@paper-design/shaders`, Apache-2.0) or a canvas pass ([../engines/shaders.md](../engines/shaders.md), [../engines/canvas-2d.md](../engines/canvas-2d.md)). Check [../craft/anti-slop.md](../craft/anti-slop.md) before choosing.

**6. Audio and captions are separate passes**: [../audio/voice.md](../audio/voice.md), [../audio/music-sfx.md](../audio/music-sfx.md), [../audio/mix.md](../audio/mix.md), [../audio/captions.md](../audio/captions.md). Cut on the beat grid or on voice word timestamps, never on guessed times.

### The loop

| Step | Do | Proof file |
| --- | --- | --- |
| 1. Brief | `/umd:kickoff`: goal, audience, format, duration, profile, engine, licence | `BRIEF.md`, `.motion/project.json` |
| 2. Storyboard | Beats with duration + one intent each, shot list, motion tokens | `storyboard.md`, `motion-tokens.json` |
| 3. Stills | Build each key frame static first; `umd still index.html --at 0.5,3,6.5,11 --out .motion/stills`; put each next to the reference, fix, max 3 rounds | PNGs side by side |
| 4. Build | Animate between the validated stills; `umd lint` while writing | source + `assets.lock.json` |
| 5. Draft render | `umd render --draft` | `.motion/renders/<id>/` |
| 6. Critique | `umd frames <video> --sheet` and `umd analyze <video>`; read the sheet beat by beat, fix the worst issue first | contact sheet, analyze JSON |
| 7. Final render | `umd render`, then audio mix and captions burn or sidecar | MP4 + `render.json` |
| 8. Audit | `/umd:audit`, `/umd:fix` until no blocker, then `umd deliver` | `audit.json` |

### Cost

The cheapest route. Creator-reported (unverified): "The Life of a Human", 2 prompts, 2 h, 27M tokens; a stickman thriller in 20 min with no image spend. Expect most tokens in steps 3 and 6; renders themselves cost no tokens. A 30 s 1080p30 capture is minutes, not hours.

## Rendering to video with umd

`.motion/project.json` → `"render"`, one of:

```json
{ "capture": { "entry": "index.html", "fps": 30, "duration": 12 } }
{ "command": "npx hyperframes render --quality delivery --output out/film.mp4", "output": "out/film.mp4" }
{ "command": "npx remotion render src/index.ts Main out/film.mp4", "output": "out/film.mp4" }
```

For 9:16 pass the size in the page and capture (`--width 1080 --height 1920` on `umd capture`). Use `--transparent --format mov` or `webm` for overlays. Revideo: a script calling `renderVideo()`, see [../engines/revideo.md](../engines/revideo.md).

## Pitfalls

| Breaks | Fix |
| --- | --- |
| Remote fonts or CDN scripts: fallback font in frame 0, different renders | Local files; `umd capture` waits for fonts, but only those the page can load offline |
| Physics or particles stepped by real `dt` | Step by fixed `1/fps` from `t`; seed every RNG |
| CSS transitions or Remotion with CSS keyframes | Remotion ignores CSS time: use `interpolate`/`spring` from the frame |
| Every scene uses the same entrance (fade-up-blur) | Vary per beat; blur only where it means focus ([../craft/anti-slop.md](../craft/anti-slop.md)) |
| Heavy `filter: blur()` or `backdrop-filter` on large layers | Slow capture and banding: pre-blur images or blur smaller layers |
| Text gone before it can be read | Hold ≥ 1.2 s and ~3 words/s ([../craft/text-on-screen.md](../craft/text-on-screen.md)) |
| Animating to the end then hard stop | Keep a slow drift through the last frame; end on the logo, not on black |
| Remotion chosen for a team above 3 people | Flag at kickoff; switch to HyperFrames, Revideo or plain capture |

## Checks

- **REN**: `umd compare` two renders (frame-hash equal); `umd analyze` shows no stray black frames; fonts local.
- **TIM / LIF**: `umd analyze` motion timeline, no freeze > 1 s, no dead air > 3 s.
- **ART**: stills next to the reference saved before step 4.
- **MOT**: `umd lint` (no hard-coded durations, no AI motion tells).
- **TXT**: frames at each text beat, reading time from `storyboard.md`.
- **LIC**: `umd licenses`; Remotion licence fits the team size.

## Sources

- https://github.com/heygen-com/hyperframes · https://github.com/remotion-dev/remotion (LICENSE.md) · https://github.com/midrender/revideo · https://github.com/LBEILC/Multiplane
- https://github.com/paper-design/shaders · https://github.com/greensock/GSAP
- Four production routes: research_notes/…/posts_x_utilisateur.md (post 5), https://github.com/alchaincyf/huashu-art-motion
