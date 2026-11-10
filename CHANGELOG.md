# Changelog

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
