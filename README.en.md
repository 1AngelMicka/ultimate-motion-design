# Ultimate Motion Design

[Français](README.md) · **English**

A [Claude Code](https://claude.com/claude-code) plugin that makes Claude produce high-end motion design: promo and presentation videos, explainers, vertical shorts, logo animations, animated short films, animated web pages and 3D shots. It checks its own output, frame by frame, before delivering.

- **Every technology, one method.** HTML/CSS, GSAP, Motion, Remotion, HyperFrames, Revideo, three.js/WebGPU, shaders, Lottie, Rive, SVG, canvas, Manim, Blender, Mermaid, Code Hike, VHS. It also handles voice, music, sound effects and captions. Claude picks the right route for each project.
- **Built-in deterministic rendering.** `umd capture` turns any animated HTML page into a video frame by frame, with no Remotion licence needed. Two renders give identical frames.
- **Real quality control.** 12 domains, 58 criteria. Every passed criterion has evidence: a frame at t = 2.40 s, a LUFS measure, a line of code. The score is out of 10; an open blocker caps it and locks delivery.
- **Token-frugal and transparent.** Measurable criteria are decided in code, with no agent involved. Audits are incremental, command output is compact, and a contact sheet replaces dozens of frames. `/umd:tokens` shows what each command used.
- **Licences under control.** A guard refuses to install non-commercial models in commercial work, Tencent models in the EU, or AGPL code in a web page. Every asset is inventoried with its licence.
- **Easy to install.** Two commands, then `/umd:doctor` installs what is missing.
- Free, open source (MIT), no telemetry.

## Workflow

```
/umd:kickoff → /umd:storyboard → /umd:build → /umd:render → /umd:audit → /umd:fix → /umd:deliver
```

| Command | What it does |
| --- | --- |
| `/umd:kickoff` | Asks a few questions, picks the profile, route and engine, checks the tools, writes `BRIEF.md` and `.motion/project.json`. |
| `/umd:storyboard` | Writes the script and timed beats, each with one intent. Renders key stills and compares them with the reference over up to 3 rounds before anything moves. |
| `/umd:build` | Builds each beat with motion tokens, assets, voice, music and captions. Fast drafts are reviewed by a "director" agent. |
| `/umd:render` | Renders the final video twice to prove it is reproducible, then analyses it: cuts, dead air, freezes, flashes, loudness, contact sheet. |
| `/umd:audit` | Runs the automatic measures, then parallel auditors for whatever needs eyes. Gives a score out of 10 and prioritised fixes in `.motion/AUDIT.md`. |
| `/umd:fix` | Fixes issues by priority, verifies each fix, then re-renders and re-audits. |
| `/umd:deliver` | Copies the audited render to `deliverables/` with a manifest and credits. Refused while a blocker is open. |
| `/umd:tokens` · `/umd:doctor` · `/umd:handoff` | Token report · tool check and install · handoff note. |

## Install

You need [Claude Code](https://claude.com/claude-code), [Node.js](https://nodejs.org) 18+ and FFmpeg. `/umd:doctor` installs FFmpeg for you on Windows (winget) and macOS (Homebrew).

```
/plugin marketplace add 1AngelMicka/ultimate-motion-design
```
```
/plugin install umd@ultimate-motion-design
```

Restart Claude Code (or `/reload-plugins`), open a project folder, then run `/umd:doctor`. It installs Playwright and Chromium in `~/.umd/runtime` with your approval and adds nothing to your project. Then run `/umd:kickoff <what you want to make>`.

Team install: run `claude plugin marketplace add 1AngelMicka/ultimate-motion-design --scope project`, then `claude plugin install umd@ultimate-motion-design --scope project`, and commit `.claude/settings.json`.

## Routes

| Route | For | Engines |
| --- | --- | --- |
| `html-video` (default) | Promo, presentation, graphic explainer, social, logo, kinetic type | HTML/CSS/GSAP/canvas through `umd capture`; HyperFrames; Remotion; Revideo |
| `threejs-film` | A character or object in a small 3D world | three.js / WebGPU in one HTML file, shot by shot |
| `blender` | Real materials, rigged characters, product renders | Blender via Python + Blender MCP, BlenderKit |
| `director` | Narrated story, many scenes, generated images and voices | Claude directs, other models draw and speak, under a strict licence registry |
| `explainer` | Maths, diagrams, code, terminal | Manim, Mermaid, D2, Code Hike, VHS |
| `web-page` | Website, landing page, UI | GSAP, Motion, CSS, View Transitions, Lenis, animated shadcn registries |

The plugin also ships 13 recipes and guides for audio, assets, platform specs and licences. The [catalogue](catalogue_motion_design_claude_codex_2026.md) lists 1,072 verified GitHub repositories.

## Quality referential

| Group | Domains |
| --- | --- |
| Story | NAR, TIM, LIF, ART |
| Motion | MOT, TXT, SAF, WEB |
| Sound | AUD, CAP |
| Delivery | REN, LIC |

There are 7 profiles: promo, presentation, explainer, social, film, logo and web. A criterion that was not checked counts as failed. A failed blocker caps its domain at 3/10 and the overall score at 5.9. The full referential is in [docs/en/REFERENTIAL.md](docs/en/REFERENTIAL.md). You can tune the thresholds per project.

## Token economy

- Measurable criteria are decided in code, which settles about 40% of the criteria without an agent.
- Each render produces a 16-frame contact sheet.
- Command output is compact: full logs go to disk, and the tokens saved are counted.
- Audits can run incrementally or in `quick` mode.
- References load on demand.
- `--draft` renders while iterating.
- `audit_model` lets the auditors run on a cheaper model.
- `/umd:tokens` reports input, output and cache tokens per `/umd:*` command, read from the local transcripts.

MIT licence. See [CONTRIBUTING.md](CONTRIBUTING.md) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
