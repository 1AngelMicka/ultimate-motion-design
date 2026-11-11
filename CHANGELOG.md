# Changelog

## 0.10.0 — 2026-11-11

Characters drawn in code were the weakest part of the films (the Blind'N'Quiz figurines were turned down). This version gives the agent real characters and one way to animate any of them.

- **`umd characters`**: a catalogue of about 40 free sources usable in advertising (film rigs from Blender Studio, the MPFB generator from baby to senior, VRoid and anime, KayKit, Kenney and Quaternius, CharMorph, Open Peeps, Humaaans, DiceBear, Rive and Lottie files, Grease Pencil, mocap from CMU and 100STYLE), plus three lists read live: Mesh2Motion (9 rigs including animals and creatures, about 330 CC0 clips), KayKit packs and Open Source Avatars (about 4,000 VRM, 300 of them CC0 with visemes). French words work. `get` downloads and records licence, author, credit and date in the assets lock; `add` records a manual download and refuses NC, ND, SA and AGPL. What is excluded is listed with the reason (Mixamo, non-commercial mocap, paid tools, generated 3D).
- **One animation layer**, `templates/blender/character.py`: maps any humanoid rig to canonical bones (Mixamo, CMU and MotionBuilder BVH, 100STYLE, VRoid, Unity, Unreal, MPFB, Mesh2Motion, KayKit, Rigify, else by meaning), finds blink and mouth shape keys, and says what the rig can and cannot do. Gestures: look at (eyes lead the head by 8 frames), blink, breathe, mouth from lip sync (visemes, VRM vowels, ARKit, else the jaw; a missing shape borrows a near one), play an action, retarget a motion relative to each rest pose. A test shot (`-- test`) is the gate before the stills. Checked on Blender 5.1.2: KayKit knight with its own idle, a CMU walk retargeted on the Mesh2Motion mannequin, a 100Avatars FBX speaking on its visemes.
- **`umd lipsync <voice.wav> [--text script]`**: mouth shapes A to H and X per frame with Rhubarb (MIT, phonetic recogniser for French), installed by `umd doctor --fix --rhubarb` from its official release.
- **2D puppet**, `templates/html/puppet.html`: a cut-out character on the virtual clock that breathes, blinks, looks, gestures and speaks from the same lip-sync file; passes `umd still --seek-check`.
- **The method uses them**: kickoff presents the catalogue when characters are wanted, the storyboard has a characters step (search, licence, profile, test shot, `## Characters` in BRIEF.md), the build uses the layer. New guide `references/characters.md`.
- **Licence guard**: a folder entry in the assets lock covers the files inside it (an extracted character with its textures); `.fbx`, `.vrm`, `.bvh` and `.obj` count as media; "CC BY 4.0" and "CC-BY-4.0" are read as the same licence.

## 0.9.0 — 2026-11-11

- **No brief needed.** Kickoff finds the briefs already in the folder (LISEZMOI, README, BRIEF, a brand folder) and has a decide-for-me path: `/umd:go une vidéo de qualité` infers profile, format and length, picks the style itself and asks only about commercial use, voice and music; the user's taste comes in by picking among three concepts.

A real project made with only part of the plugin (its own render scripts, no key-still gate, no audit) came out with small unreadable screens, empty 3D sets and frozen seconds. This version closes that door and adds what a creator's notes on 40 films showed was missing.

- **No more half use.** `umd adopt <video>` makes a video rendered by the project's own pipeline the latest render, so analysis, the audit and `deliver` apply to it. AGENTS.md, the `motion` skill and `/umd:go` now say it plainly: keep your scripts, route them through `render.command` or `umd adopt`, and never show a result before the measured stills, the critic and the audit.
- **The hero, measured.** `umd still --hero "<selector>"` (or `window.umdHero(t)` for canvas and WebGL) reports the hero's width in each still against a minimum (170 px at 1080p, `thresholds.hero_min_px`, scaled to the frame); the storyboard's key stills use it. "The hero is a dot" was the most common fix in those films.
- **Frames that do not depend on the order they are drawn.** `umd still --seek-check` draws each time cold in a fresh page and compares it with the frame drawn in sequence.
- **Loops without a jump.** `umd analyze --loop` (or `"loop": true` in project.json) checks that the last frame flows into the first, against the film's own frame steps. Capture already renders frames 0 to N-1.
- **Motion blur.** `umd capture --subframes 16 --shutter 0.5` (or `render.capture.subframes`) renders that many sub-frames inside the shutter and averages them; drafts stay sharp and fast. Checked on a fast-moving bar: the frame count stays exact and the bar smears over the shutter.
- **One clock.** `.motion/timing.json` (template in `templates/`) lists every event in frames with its sound; the scene reads it and `umd sync` measures it, each sound 1 frame after its picture.
- **Directing by numbers.** A new guide, `craft/direction.md`: adjectives turned into numbers, the ten-line brief, the camera block, damping ratios (1.0 UI, 0.8 products, 0.5 characters) with a closed-form spring, designing collisions out, measuring instead of looking, and how to direct the agent (iterate at medium effort, build at high, a "finishing work" definition, approvals, limits as numbers). `/umd:go` states the suggested effort with each step's cost; the build skill carries the finishing-work rule.
- **X export.** `platforms.md`: video and GIF limits (15 MB, 350 frames, 300 million pixels), true peak −2 dBTP measured after the AAC encode.
- **Companions**, licences checked: motion2code, claude-video, blender-skills (MIT), OpenRV (Apache-2.0), Rubber Band (GPL-2.0, called as a binary).

## 0.8.0 — 2026-11-10

- **Sound, from picture events to a finished soundtrack.**
  - `umd sfx <kind>`: twelve effects synthesised by FFmpeg (whoosh, swipe, riser, impact, sub drop, click, tick, pop, chime, shimmer, glitch, room tone). Deterministic, the same peak level for all, no download and no licence to track; recorded in the assets lock with the recipe that made them.
  - `umd sounds <words>` and `umd sounds get <id>`: recorded effects (Freesound, Wikimedia Commons) and music (Jamendo, `--music`) through Openverse, CC0, CC BY and public domain only. A download becomes 48 kHz WAV and is recorded with author, licence and ready credit line; `umd licenses` lists the credits to publish.
  - A new guide, `audio/sound-design.md`: the four layers and their levels, what each project type needs, a picture event → sound table with timings, where files come from, a cue sheet, and the full command chain. Kickoff asks about sound; the storyboard picks each cue from the table; the build uses the new commands.
  - A "Sound and music" page on the site, with the palette to listen to.
- **Blender: EEVEE by default** (field report 3.13). Drafts and stylised finals render in EEVEE; Cycles only for glass, caustics, interiors carried by bounce light and dense volumes, decided by an A/B on 2 or 3 key frames. The guides carry the costs measured on one real project with their context (Blender 5.1.2, Radeon RX 7900 XTX with HIP, i7-13700K: about 10× faster at the same size on that project), the EEVEE settings that hold up on 5.1 and the engine id `BLENDER_EEVEE`. `umd render --engine eevee|cycles` (or `render.engine`) passes the engine to the command as `UMD_ENGINE`; the template `templates/blender/shot.py` reads it, renders a sequence for `umd render` and has an A/B mode. Checked by real renders with both engines.
- **Frame rate at kickoff** (3.14): 60 fps for HTML, 24 or 30 fps with motion blur for rendered 3D, since 60 → 30 halves the render.
- **Style search**: entries holding every word come first, French and English synonyms (argile/clay, maquette/diorama/miniature, personnage/character, pièce/room…), and each result says why it matched. "clay stop motion" now finds the stop-motion styles first.

## 0.7.1 — 2026-11-10

Fixes from the first real project made with the plugin (a presentation film, Windows 11, Blender 5.1.2, Radeon RX 7900 XTX).

- **Install by an agent, CLI without the plugin.** The READMEs show the `settings.json` block an agent can merge (the plugin loads at the next start) and how to use the CLI right away: `npx github:1AngelMicka/ultimate-motion-design <command>`, or `node <clone>/plugins/umd/scripts/umd.mjs`; `npm link` puts `umd` on the PATH.
- **`umd styles get`** always writes to `.motion/styles/`, as documented, even before `umd init`.
- **`umd analyze`** prints a motion summary (mean, min, median, seconds under the floor and where) instead of the per-second timeline, which stays in `analysis.json`. Paths outside the project are shown absolute everywhere, never as a chain of `..`.
- **No more freeze on a slow push.** FFmpeg's freezedetect saw a slow camera push over a large flat area as a frozen picture. Each detected segment is now checked end to end (PSNR between its first and last frame): a real freeze ends where it started, a slow move does not and is reported as `slow_moves`. Tested on a synthetic slow push and a still.
- **Blender route rewritten for 5.x.** Scripts only by default, the MCP optional. A tested template (`templates/blender/shot.py`): GPU set-up for HIP (AMD), OptiX/CUDA (NVIDIA), Metal and oneAPI; animation by `keyframe_insert` on objects, light data, camera focus and node inputs; a camera tracking an animated empty; the 5.x compositor (`scene.compositing_node_group`, node options as inputs); a one-frame check. Notes on long argument names (Cycles parses `sys.argv`), the harmless "Not freed memory blocks" line, and real screen captures under AgX.
- **`umd doctor --blender`** finds Blender outside the PATH and reports which GPU Cycles sees. **`umd estimate --frames N -- <command>`** renders one frame, times it and gives the total before a long render.
- **Concepts before style.** A new recipe and storyboard step 0a: three film concepts in one table (idea, hero moment, thread, run-down tied to the voice timing, look, route and cost, risks) when the brief has no idea of the film yet. Kickoff asks whether characters appear on screen, with their cost and risk in code.
- **three.js finish.** `templates/threejs/post.js`: bloom, miniature depth of field, frame-seeded grain and vignette, driven by `t`; two renders are byte-identical.
- **Type.** No outline on a variable font in canvas or CSS: `strokeText` draws the overlapping inner contours.
- **Library.** 285 HyperFrames blocks had a preview their registry entry did not declare: they now show a still (cut from their clip when none is hosted) and play on hover; every entry of the library has a preview.

## 0.7.0 — 2026-11-10

- **The model picks the look from the library, by rule.** `umd styles match` reads BRIEF.md and project.json (project type, format, mood, medium, ambition) and ranks the whole library for this project, with a reason per pick and the best ready blocks apart. The storyboard's step 0, `/umd:go`, the `motion` skill and AGENTS.md now require it before any look is decided. Kickoff asks who picks: "show me 3 options" (`style_choice: "ask"`, default) or "choose for me" (`"auto"`, the model takes the first pick and says why).
- **1 323 entries instead of 784.** New: the 98 OPUSCAR film styles from lemo-opuscar (one per Best Picture winner, from silent tinted film to 65 mm epic, prompts embedded so `umd styles get` needs no network, stills CC BY 4.0) and 441 ready-made blocks and components from the HyperFrames registry (logo outros, charts, phone and app mock-ups, captions, transitions, shader backgrounds, text effects; Apache-2.0; installed with `npx hyperframes add <name>`). Items ported from transitions.dev are left out: that collection may not be repackaged.
- **Every entry is tagged.** The 8 kinds of piece the plugin makes (promo, presentation, explainer, vertical short, logo, animated short film, animated web page, 3D shot), mood, look, format, technology, kind (full style, creator prompt, ready block, component) and a quality tier (reference, pro, inspiration). One vocabulary (`lib/facets.mjs`) serves the index, the library page and the matching. `umd styles` filters on all of it: `--project logo --tier 2`, `--format 9:16 --mood bold`, `--kind block`.
- **A library page of its own.** https://1angelmicka.github.io/ultimate-motion-design/library/ leaves the docs shell: the 8 project types as the main filter, style filters with live counts (quality, kind, mood, look, format, technology, source), search in French or English, four sorts, active filter chips, filters in the address so a view can be shared, a detail panel with the preview, the prompt or the install command, and the licence. French and English on one page; on phones the filters open as a drawer. The old `bibliotheque.html` addresses redirect there and keep their `#id`.

## 0.6.1 — 2026-11-10

- When a command run by `umd run` or a command route of `umd render` times out, the whole process tree is now killed (Windows: `taskkill /T`; Linux and macOS: the process group). Before, only the shell died and a render or an encoder it had started kept running. Found by the 0.6.0 code review, missed in 0.6.0; covered by a new test.

## 0.6.0 — 2026-11-10

A full review of the repository (code, method, documentation, comparison with the most-starred plugins and video skills), then fixes.

- **Craft counts in the score.** ART-06 (idea, hook, hero moment), ART-07 (typography finish), ART-08 (colour script and finish) and AUD-07 (layered sound design) are judged against the project's `quality_target` (64 checks, 29 automatic). A bland but clean piece can no longer score 9.
- **/umd:go cannot loop or skip.** A `Build accepted` line in `.motion/LEDGER.md` gates the final render, so an interrupted build resumes its rounds; fix → render → audit cycles are counted and hand back to the user when two cycles in a row do not raise the score; new words on an existing project go back to kickoff; files that are not sources (ledger, styles, Manim's `media/`, the render output) no longer ask for a re-render.
- **Render fixes.** A soundtrack shorter than the picture no longer truncates the video (padded, never `-shortest`); a `<video>` with `preload="none"` or a missing source no longer hangs the capture; `Date()` without `new`, `performance.timeOrigin` and `crypto.getRandomValues`/`randomUUID` are on virtual time; the local server answers bad byte ranges with 416 and serves pages from another drive.
- **Safety.** `deliver` refuses a render the last audit did not cover; `burn` copes with any subtitle file name (no filter injection); the licence guard catches `pkg>=1`, git URLs, `python -m pip`, `pip3.11` and `npx`, works from a subfolder and stays on with a broken `project.json`; `commons get` never rewrites an invalid assets lock; style prompts are pinned to a reviewed commit with a sha256 check; network calls time out.
- **Robustness.** `doctor --fix` works with spaces in Windows paths; boolean flags no longer swallow the next argument; render paths are stored with `/`; silent mixes are reported instead of failing in loudnorm; long pieces get one contact sheet per stretch.
- **Method.** Storyboard fills Events, Layout limits, Sound cues and Review frames; kickoff records `quality_target` and `style`; one verdict vocabulary for the critic; platform versions with another aspect ratio are re-laid out, never cropped; a sound design pass and a typography finish section; the html-video route matches the build skill.
- **Token costs announced.** `umd next` returns the cost of the next step (measured on this project's earlier runs when possible, estimated otherwise); `/umd:go` states it every time and waits for the user's go-ahead on expensive steps (build, first full audit) or when a `token_budget` would be exceeded, with cheaper options (`cost_confirm`: high by default, medium, never). `/umd:tokens` now counts runs per command.
- **Fewer tokens for the same result.** The style prompt (up to 7,700 tokens) is read once and summed up in a 200-word style card that critics and the build reuse; auditor groups of 3 checks or fewer share an agent; the critic has an image budget per round.
- **Repository.** CI on Linux (Node 18 and 22), macOS and Windows with step timeouts (tests run as `node --test tests/umd.test.mjs`, which Node 22 needs); `tools/build.mjs --check` fails when a document states a wrong number of checks or licence entries; release workflow from CHANGELOG; issue and pull request templates; code of conduct; manifests with `$schema`, docs homepage, category and tags; demo GIF and badges in the READMEs.
- **A real motion design skill.** One source (`tools/skill/SKILL.src.md`) generates the plugin's `motion` skill and a standalone `skills/motion-design/` (SKILL.md, 52 guides, MIT) that any agent can install: the ten-step loop with three gates, twelve rules, the numbers that matter, easing, composition, typography, colour, sound, camera, how to judge, route and engine choice, deterministic rendering, plain-FFmpeg checks, licences, cost. `tools/build.mjs --check` keeps both in sync with the source.
- **A demo that shows the craft.** A new 13 s demo film made with umd's own method: one persistent actor (the record dot), the prompt flying through the camera, a storyboard that renders under the playhead, the hero shot opening into the film (a WebGL aurora shader and a kinetic title), the audit drawing over it, everything folding into the dot. Inter and JetBrains Mono self-hosted (OFL). It passes every automatic check (no near-still time, no dead air, no flash, no black frame, cuts on motion) and two renders are byte-identical.
- **Black frames measured by the brightest pixel.** A dark design with text on it is no longer reported as black (blackdetect counted 98 % dark pixels as black); a true black frame still is. `umd burn` says clearly when FFmpeg has no libass.
- **Docs.** The calibration films are described as what they are (15 reference films scored 7 to 8 by an AI jury); SOURCES.md cleaned (no broken link, no unpublished path, counts that add up); French wording polished.

## 0.5.0 — 2026-11-10

- New check TIM-06 (60 checks, 29 automatic): cuts land on motion, never between two parked shots (`seams` in `umd analyze`); 0 of 28 cuts flagged in the 15 calibration films. Idea from edenfunf/reelmimic's seam ledger.
- `umd moves <words>`: 120 named motion techniques (match cut, whip pan, split-flap, cursor-led demo…), searched locally, from motionvideo.xyz (MIT); `/umd:storyboard` uses their names.
- `umd commons <words>` and `umd commons get "File:…"`: Wikimedia Commons media under public domain, CC0 or CC BY only (CC BY-SA on request), downloaded and recorded in `assets.lock.json` with author and licence. Idea from Moh4696/cinematic-skill.
- References: `engines/effect-libraries.md` (60 effect, 3D, physics, sound and footage libraries with their licence and the determinism rule), `recipes/series.md` (a recurring animated series sold to an app), copy rules for on-screen text and narration, a shot-by-shot breakdown in `match-reference`.
- Licence guard: anything2explainer (non-commercial), Trianglify and color-matcher (GPL), webgl-water (no licence), Essentia (AGPL), arc-art (CC BY-NC), and the paid or non-redistributable collections (transitions.dev, uberdesigner, sceneai, vibrant.design items).
- Nothing paid or non-redistributable is recommended any more: removed from the galleries and companions (scrolltide, motionsites, Mobbin, Refero, Oversight, uberdesigner, sceneai, transitions.dev, ElevenLabs, Spline and others).
- Companions: cinetic, reelmimic, cinematic-skill, creator-generalist, ffmpeg-skill, motionvideo MCP. Catalogue: 38 repositories added (1,113).
- `SOURCES.md`: every link shared, tested or used since the start (315), with what was done with it and why some were set aside.

## 0.4.0 — 2026-11-10

- Motion grammar of premium launch films (`references/craft/motion-grammar.md`): six rules, 16 reusable mechanisms, pacing for a 30 s film, the shot written as an event, layout for the longest copy, and the checks critics miss and clients catch. Adapted from echris6/motion-video-kit (MIT, 28 launch films studied) and beamnxw's "Motion Engineering with Opus 5.5".
- New check LIF-05 (59 checks, 28 automatic): under 1 s of near-still picture per 30 s, end card excluded. Zero false alarm on the 15 calibration films. `umd analyze` adds `stillness`; loudness range is shown but stays informative (it would flag 7 of the 15 reference films).
- `umd sync <video>`: the storyboard's new `## Sound cues` section (`6.5s click`, `f210 reveal`) is measured against the audio onsets; AUD-03 is decided in code when cues exist (±45 ms, new threshold `sync_tolerance_ms`).
- Music back-timing: `umd hits <music>` lists the final hits of a track, `umd mix --backtime` or `--hit s --card s` makes the track's own ending land on the end card, one continuous piece, nothing cut or looped.
- `umd frames <video> --cuts`: one strip of 12 frames around each cut, where text over text, splices and pops hide.
- Critic rounds in the "Gauntlet" way: a fresh critic every round that never sees the builder's reasoning, verification of the previous report (FIXED / PARTLY / STILL PRESENT, then SHIP or ONE MORE PASS), scoped fixes (where, observed, change, what stays fixed) and a `.motion/LEDGER.md` of rounds and measures.
- Storyboard template: event frames, layout limits, sound cues, review frames. Reference analysis labels values measured, estimated or proposed.
- Docs: "Beat the template look", "Sell a video" and precise-correction wording on the Tips page; more web galleries (Refero styles, saaspo, posts.design, Mobbin, inspora, curate, brandguidelines, backgrounds.supply, horizonx, scrollshaders); companions motion-video-kit and refero_skill.

## 0.3.1 — 2026-11-10

- Style library page on the docs site (`bibliotheque.html`, French and English): the 784 styles and prompts as cards with a preview of the result (LemoLab stills, mg-styles-15 silent loops on hover, creators' thumbnails), search in French or English, filters by source and category, and a panel per entry with the film, the credit, `umd styles get <id>` and the prompt read live from its source, ready to copy. Each entry has its own link (`#<id>`).
- `umd styles` and `umd styles get` now give a `preview` link to that gallery entry and a `film` link.
- `tools/styles-index.mjs --media` builds the gallery previews (ffmpeg).

## 0.3.0 — 2026-11-10

- Style library: `umd styles <words>` searches 784 proven styles and prompts (lemo-opuscar 66, mg-styles-15 15, awesome-opus5-5-videos 703) locally, at no token cost; `umd styles get <id>` downloads the chosen prompt. `/umd:storyboard` now starts by offering three styles that fit the brief; `references/styles.md` explains how to adapt a style and lists web reference galleries (free and paid).
- Critic agent scores like a jury: 7 dimensions from 1 to 10 (style fidelity, concept and wow, motion craft, design and typography, finish, sound, technical), adapted from mg-styles-15's rubric; `quality_target` in project.json (7 pro, 8 agency by default, 9 award) drives the stills and draft rounds.
- Calibration: the automatic checks raised zero false alarm on 15 agency-level films (docs/CALIBRATION.md); thresholds kept.
- Documentation: new "Tips and prompts" page (brief recipe, 8 ready-to-copy prompts, styles by mood, feedback phrases, AI tells, token savings, a 20-minute real test).

## 0.2.0 — 2026-11-10

- `/umd:go`: one command that reads the project state (`umd next`, local files only) and runs the next step, chaining until a decision belongs to the user (approving stills, a licence exception, delivery, optional fixes). Plain-words requests ("make me a launch video") are routed to it by the `motion` skill. The ten step commands stay available.
- Documentation site on GitHub Pages, in French and English, generated from the READMEs, the referential, the skills and the references by `tools/site.mjs` (zero dependency), so it cannot drift from the plugin. Demo video rendered by `umd capture` and checked by `umd analyze`.
- For AI agents: `AGENTS.md` (install paths, checks, onboarding rules), `llms.txt` and `llms-full.txt` (the whole documentation in one file).

## 0.1.1 — 2026-11-10

- New recipe `match-reference`: measure a reference animation (live site, video, gif, Lottie, WebGL) into a motion spec, convert it to motion tokens and storyboard beats, rebuild and verify it. Uses the companion skill [reanimate](https://github.com/NiazMorshed2007/reanimate) (MIT, Bun, macOS/Linux upstream), with a umd-only fallback (`umd capture <url>`, `frames`, `compare`) for Windows.
- `/umd:kickoff` suggests reanimate when the brief has a reference; `/umd:storyboard` measures it before writing beats.
- reanimate added to the companions and to the catalogue (1,073 repositories).

## 0.1.0 — 2026-11-10

First version.

- Plugin `umd` with the commands kickoff, storyboard, build, render, audit, fix, deliver, doctor, tokens and handoff, plus the `motion` craft skill.
- Agents `auditor` (one per group, in parallel, evidence for every criterion) and `critic` (director's review of stills and drafts).
- Motion quality referential: 12 domains, 58 criteria, 7 profiles, scoring with blocker caps; 27 automatic criteria decided in code.
- Zero-dependency CLI `umd`: deterministic HTML-to-video capture on virtual time, key stills, render twice and compare, FFmpeg analysis (cuts, dead air, freezes, black frames, flashes, loudness, silences, contact sheet), VMAF/SSIM, mix with ducking and fades, loudness normalisation, word-timed captions (ASS karaoke/pop/line, SRT, VTT) and caption check, burn-in, motion lint, licence check, web performance and reduced-motion check, token report, guarded delivery.
- Hooks: short SessionStart context; PreToolUse licence guard on package installs.
- About fifty on-demand references: 6 routes, 13 recipes, 16 engines, audio, craft, assets, licences, companions, platforms.
- Catalogue of 1,072 verified GitHub repositories for agent-driven motion design.
