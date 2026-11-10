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
- Promo, launch, demo, explainer or presentation: read `craft/motion-grammar.md` once (six rules, mechanisms, pacing).

## 1. Build, beat by beat

- Structure the scene so each beat is a named, seekable unit (a GSAP label/timeline, a Remotion `<Sequence>`, a shot object driven by `umdRender(t)`, a Manim `construct` section).
- Use the storyboard's event frames (entrance, landing, press, reveal, legible, cut) as named constants, so a correction touches one value.
- Lay out text with the longest copy first; render its landing frame with `umd still` and check lines, margins and the actual font before animating the entrance.
- Durations and easings from the tokens; stagger groups; one focal motion at a time; keep something alive in every hold.
- Assets: local files only (Fontsource for fonts, downloaded images), each recorded in `.motion/assets.lock.json` with its licence the moment it is added. The licence guard blocks forbidden installs.
- Audio (when flags say so), with the matching `audio/*.md`:
  1. voice-over from the script (commercial-safe TTS, `audio/voice.md`);
  2. word timestamps (forced alignment when the script is known), then `umd captions words.json --out .motion/captions.ass`, then `umd captions-check`; set `captions.file` and `captions.words` in project.json;
  3. music and SFX (`audio/music-sfx.md`): place each effect on its cue time from the storyboard's `## Sound cues`;
  4. `umd mix --voice … --music … --sfx file@t … --out audio/mix.wav --backtime` (ducking, fades, −14 LUFS, length = duration_s; `--backtime` makes the track's own ending land on the end card instead of a fade or a cut; `umd hits <music>` lists its final hits, then `--hit s --card s` picks one); set `render.audio` to the mix;
  5. after the next render, `umd sync <video>`: every cue within ±45 ms, otherwise move the effect.

## 2. Draft loop (2 to 3 rounds)

1. `umd render --draft` → compact summary + `sheet.jpg`. Fix page errors first.
2. Read the summary: `dead_air`, `freezes`, `stillness` (≤ 1 s per 30 s), `flashes_max_per_s`, `loudness`, `abrupt_end`. Fix anything flagged.
3. Launch a **new** `umd:critic` agent on the draft every round (project path, render folder, round number, CLI path, and from round 2 the previous critic's reply as "previous report"). Give it the artefact, the brief and the user's own words, never your reasoning or your list of fixes. Apply its ranked fixes, the critical ones and the concept_wow one first. Keep the previous version's source until the new draft is better.
   Append one row to `.motion/LEDGER.md` (create it with the header `| Round | Render | Top findings | Changes | Measured |`): the render id, the critic's top 3, what you changed, and the numbers that moved (scores, stillness per 30 s, sync worst ms, LUFS). It is the proof of craft you can show the client.
4. Stop when every jury dimension reaches `quality_target` (default 8), or after round 3: then show the user the scores and what remains, and ask whether to spend more rounds (each costs a draft render and a critique).

## 3. Checks before handing over

- `umd lint` → `hardcoded_motion`, `ai_tells`, `layout_props`, `transition_all`, `remote_assets`, `determinism` (engine rules) near 0; explain any that remain.
- `umd licenses` → 0 violations, no unlisted asset.
- Web route: `umd webperf <url>` → smooth ratio ≥ 0.95, CLS < 0.1, reduced motion respected.

Reply with: what was built, the draft rounds and what changed, open points, then the next step: `/umd:render` (final) and `/umd:audit`.
