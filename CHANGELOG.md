# Changelog

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
