---
name: build
description: "Build the animation from the validated storyboard in the project's route and engine: scenes, motion, assets, voice, music, captions; iterate with fast draft renders and a director's critique. FR : construire, animer, produire la vidéo ou la page animée."
disable-model-invocation: true
argument-hint: "[beat numbers or notes]"
---

# /umd:build

CLI: `node "${CLAUDE_PLUGIN_ROOT}/scripts/umd.mjs"` (`umd`). References: `${CLAUDE_PLUGIN_ROOT}/references/`. Scope or notes: `$ARGUMENTS` (empty = the whole piece). Talk in the project's language.

**Cost:** the largest step. Keep it lean: read the route file once, the engine file once, one audio file per audio task; draft renders are half size at 15 fps; review drafts on the contact sheet, not frame by frame.

## 0. Before

- Read `.motion/project.json`, `.motion/storyboard.md`, the token file. If the storyboard has no `Stills validated` line, say so and offer `/umd:storyboard` first (the audit blocks without it).
- Read `routes/<route>.md` and `engines/<engine>.md`. Follow the `motion` skill rules (load it if not loaded).
- `umd rules` prints this project's build rules per domain.

## 1. Build, beat by beat

- Structure the scene so each beat is a named, seekable unit (a GSAP label/timeline, a Remotion `<Sequence>`, a shot object driven by `umdRender(t)`, a Manim `construct` section).
- Durations and easings from the tokens; stagger groups; one focal motion at a time; keep something alive in every hold.
- Assets: local files only (Fontsource for fonts, downloaded images), each recorded in `.motion/assets.lock.json` with its licence the moment it is added. The licence guard blocks forbidden installs.
- Audio (when flags say so), with the matching `audio/*.md`:
  1. voice-over from the script (commercial-safe TTS, `audio/voice.md`);
  2. word timestamps (forced alignment when the script is known), then `umd captions words.json --out .motion/captions.ass`, then `umd captions-check`; set `captions.file` and `captions.words` in project.json;
  3. music and SFX (`audio/music-sfx.md`);
  4. `umd mix --voice … --music … --sfx file@t … --out audio/mix.wav` (ducking, fades, −14 LUFS, length = duration_s); set `render.audio` to the mix.

## 2. Draft loop (2 to 3 rounds)

1. `umd render --draft` → compact summary + `sheet.jpg`. Fix page errors first.
2. Read the summary: `dead_air`, `freezes`, `flashes_max_per_s`, `loudness`, `abrupt_end`. Fix anything flagged.
3. Launch the `umd:critic` agent on the draft (project path, render folder, round number, CLI path). Apply its ranked fixes.
4. Stop when the critic has nothing above cosmetic, or after round 3 (then tell the user what remains).

## 3. Checks before handing over

- `umd lint` → `hardcoded_motion`, `ai_tells`, `layout_props`, `transition_all`, `remote_assets`, `determinism` (engine rules) near 0; explain any that remain.
- `umd licenses` → 0 violations, no unlisted asset.
- Web route: `umd webperf <url>` → smooth ratio ≥ 0.95, CLS < 0.1, reduced motion respected.

Reply with: what was built, the draft rounds and what changed, open points, then the next step: `/umd:render` (final) and `/umd:audit`.
