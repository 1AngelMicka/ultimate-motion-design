# Match a reference animation

Measure how a reference moves (a live site, a screen recording, an mp4/gif, a Lottie, a WebGL scene) and turn it into a motion spec, motion tokens and, when allowed, a verified rebuild. Companion skill: **reanimate** (NiazMorshed2007/reanimate, MIT).

## Use when / avoid when

- Use when the brief says "move like this", "same feel as X", hands over a gif or video of a motion, or asks to port the user's **own** animation to another stack (old site → new site, After Effects export → code, video → HTML scene).
- Use to **study** a reference: extract its timings, easings, stagger and sequence, then design your own piece with those numbers.
- Avoid a pixel-faithful copy of someone else's site or film. Fonts, images, shaders, models and code of another site belong to their owners (LIC-05). Motion-faithful study with your own look is the default; pixel-faithful only for the user's own material or with written permission.
- Avoid when the reference is behind a login, on YouTube or Loom: ask the user for a screen recording.

## Setup

reanimate is a separate skill, installed on demand (a skill costs almost nothing until it is used):

```bash
npx skills add NiazMorshed2007/reanimate -g -a claude-code
```

- Needs [Bun](https://bun.sh) 1.1+. Upstream supports macOS and Linux; **Windows is untested upstream** (use WSL, or the umd-only fallback below).
- First run: `bash <skill>/scripts/setup.sh` installs Playwright's Chromium and a static ffmpeg (~250 MB). No API key.
- Licence: MIT. Its examples recreate third-party sites as a study; do not reuse their assets.

## Core patterns

1. **Scope in three lines** (reanimate writes them to `.reanimate/<name>/spec.md`): target (URL + selector, or file + time range), destination (file and stack), fidelity: `motion-faithful` (default: trigger, order, stagger, timing ±80 ms, easing family, distance), `pixel-faithful` (adds fonts, colours, spacing, ≤ 2 % mean pixel mismatch), or `mixed` (clone + additions).
2. **Capture the reference** with a fixed viewport, fps, trigger and duration: `bun <skill>/scripts/capture.ts --url … --out ref --selector <section> --trigger load|scroll|hover|click|none --duration 3000 --track "<moving elements>"`. For canvas/WebGL/3D add `--clock virtual --gl --assets` (exact, repeatable frames; shader sources, uniforms and animated channels in `gl-track.json`). For video/gif: `frames.ts --in file --out ref/frames --start … --end … --crop …`. A Lottie file is already the spec: read it.
3. **Write the motion spec**: one row per element per property (start, duration, from → to, easing, stagger). Numbers come first from the page's declared animations (`inspect.json`), then from `easing.ts` fits on tracked elements, then from reading frames. A "?" means the frames are not read yet.
4. **Convert the spec into umd files** (this is where umd takes over):
   - durations and curves → `.motion/motion-tokens.json` (DTCG `duration` and `cubicBezier`; name them by role, e.g. `entrance-reference`);
   - sequence and stagger → rows of `.motion/storyboard.md` (time, motion, intent);
   - in `BRIEF.md`, describe the reference in words and cite the spec file; do not paste its assets.
5. **Rebuild only what the brief allows**, in the project's stack, then let reanimate verify: capture the clone with the **same** command (only `--url` and `--out` change), `compare.ts`, `sheet.ts compare`, `easing.ts --compare-track`. Expect 2 to 5 rounds; after 5, report the rows that still fail with their numbers rather than lowering a threshold.
6. **Then run the umd loop as usual**: `/umd:render`, `/umd:audit`. reanimate proves "moves like the reference"; umd proves the piece is good (rhythm, text, safety, audio, licences).

## Rendering to video with umd

- A rebuilt HTML scene renders like any R1 scene: `umd capture <entry> --out …` or `/umd:render`.
- **umd-only fallback** (Windows without WSL, or a quick study): `umd capture <url> --out ref.mp4 --duration 4 --width 1440 --height 900` records a live page on umd's virtual clock (CSS, WAAPI, GSAP, three.js), then `umd frames ref.mp4 --sheet` and `umd frames ref.mp4 --at 0.2,0.4,0.6` give the frames to read timings from; `umd analyze ref.mp4` gives cuts and the motion timeline. After the rebuild, capture it the same way and run `umd compare ref.mp4 clone.mp4` (frame hashes + SSIM). There is no per-element tracking or easing fit in this fallback: read start/end frames by eye and pick the closest token curve.

## Pitfalls

- Different viewport, crop, trigger or fps between reference and clone: the comparison then measures the setup, not the work.
- Judging from the first and last frame only: the easing lives in the middle frames; read the sheets.
- GSAP and spring libraries ignore playback-rate tricks: use tracked values and fit overshoot and settle time.
- Scroll-driven motion depends on scroll position, not time: capture both sides with the same scroll steps and compare per position.
- Canvas/WebGL on the real clock: frames drop in software GL and random content changes on each load; use `--clock virtual` and the same seed on both sides.
- Copying the look along with the motion "because it was easy": that turns a study into a reproduction of someone else's work.

## Checks

- **LIC-05**: no third-party look, assets or code reproduced without rights; the fidelity level is written in the spec.
- **LIC-03**: anything taken from the reference (font, image, model) is in `assets.lock.json` with its licence, or not used.
- **MOT-01**: the measured durations and curves live in the motion tokens, not as literals in components.
- **ART-01**: the stills of the rebuild are validated like any other piece.
- Evidence to cite in audits: `.reanimate/<name>/spec.md`, the last `compare-N/report.md`, the compare sheets.

## Sources

- https://github.com/NiazMorshed2007/reanimate (README, `skills/reanimate/SKILL.md`, `references/verify.md`, `scripts/capture.ts --help`; read 2026-11-10)
- `../craft/tokens.md`, `../craft/principles.md`, `../licenses.md`
