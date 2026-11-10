# Ultimate Motion Design

[Français](README.md) · **English** · **[Documentation](https://1angelmicka.github.io/ultimate-motion-design/en/)** · [For AI agents](AGENTS.md)

A plugin for [Claude Code](https://claude.com/claude-code) that makes Claude produce high-end motion design, then checks it frame by frame before delivering it. It covers:

- promo videos and product launches;
- presentation videos and explainers;
- vertical shorts for social media;
- logo animations;
- animated short films;
- animated web pages and 3D shots.

What it brings:

- **Every technology, one method.**
  - Engines: HTML/CSS, GSAP, Motion, Remotion, HyperFrames, Revideo, three.js and WebGPU, shaders, Lottie, Rive, SVG, canvas, Manim, Blender, Mermaid, Code Hike, VHS.
  - Sound and text: voice-over, music, sound effects and captions.
  - Claude picks the right route for each project.
- **Built-in deterministic rendering.** `umd capture` turns any animated HTML page into a video, frame by frame, with no Remotion licence. Two renders give identical frames.
- **Real quality control.**
  - 12 domains and 59 checks, from narrative to licences.
  - Every passed check has evidence: a frame at t = 2.40 s, a LUFS measure, a line of code.
  - Score out of 10. An open blocker caps the score and locks delivery.
  - A critic agent scores every draft like a jury (7 = professional, 8 = agency, 9 = award) and sends it back until it reaches the target. A fresh critic every round, which never sees the builder's reasoning and checks the previous round's fixes item by item.
  - Sound is measured against picture: each effect lands on its event within ±45 ms (`umd sync`), and the music's real ending lands on the end card (`umd mix --backtime`).
- **The grammar of professional launch films.** Six rules and 16 mechanisms drawn from the analysis of 28 launch films: one persistent actor, every action producing a result, the foreground carrying the transition.
- **Token-frugal and transparent.**
  - About 250 tokens loaded at all times.
  - Measurable checks are done in code, without an agent.
  - A contact sheet replaces dozens of frames.
  - `/umd:tokens` shows what each command used. See [Token economy](#token-economy).
- **Licences under control.**
  - A guard refuses to install a non-commercial model in a commercial project, a Tencent model in Europe, or AGPL code in a web page.
  - Every asset is inventoried with its licence.
- **Easy to install.** Two commands, then `/umd:doctor` installs whatever is missing.
- **Free, open source, no telemetry**, in French and English.

## How it works

**One command to remember: `/umd:go`.** It looks at where your project stands and runs the next step, then chains on its own until the next decision that is yours: approving the look, accepting a licence exception, delivering.

```
/umd:go a 30-second launch video for our app, 16:9
```

Under the hood it follows these steps, which you can also run one by one:

```
/umd:kickoff → /umd:storyboard → /umd:build → /umd:render → /umd:audit → /umd:fix → /umd:deliver
```

| Step | What happens | What it produces |
| --- | --- | --- |
| `/umd:kickoff` | Claude looks at the folder and asks a few questions: what, format, length, look, commercial use. It picks the profile, route and engine, checks the tools and writes the brief. | `BRIEF.md`, `.motion/project.json` |
| `/umd:storyboard` | Script, then timed beats, with one intent per beat. Before anything moves, the **key stills** are rendered, compared with the reference and corrected over up to 3 rounds by an "art director" agent. | `.motion/storyboard.md`, `.motion/stills/` |
| `/umd:build` | Builds beat by beat with motion tokens, assets, voice, music and captions. Fast drafts (half size, 15 fps) are reviewed by the same agent. | the piece's sources, `.motion/assets.lock.json` |
| While you work | The `motion` skill applies the craft rules by itself. Time comes from the frame, never the clock. Durations and curves come from the tokens, and every motion has a job. No AI motion tells, nothing frozen. The licence guard watches installs. | |
| `/umd:render` | Final render, done twice to prove it is reproducible, then analysed: cuts, dead air, frozen frames, black frames, flashes, loudness, contact sheet. | `.motion/renders/<id>/` |
| `/umd:audit` | Automatic measures are done in code. Then one auditor per group judges, in parallel, whatever needs eyes. Result: the overall score, each domain's score, the trend and prioritised fixes. | `.motion/AUDIT.md` |
| `/umd:fix` | Fixes issues in order, blockers first. Each fix is verified, then the render and audit are redone. | |
| `/umd:deliver` | Copies the audited render to `deliverables/` with a manifest and credits. Refused while a blocker is open or if the render changed since the audit. | `deliverables/` |

## Install

**You need:** [Claude Code](https://claude.com/claude-code), [Node.js](https://nodejs.org) 18 or newer, `git` and [FFmpeg](https://ffmpeg.org). On Windows and macOS, `/umd:doctor` installs FFmpeg for you.

**1. Add the marketplace and install the plugin.** In Claude Code, type:

```
/plugin marketplace add 1AngelMicka/ultimate-motion-design
```
```
/plugin install umd@ultimate-motion-design
```

**2. Restart Claude Code** (or type `/reload-plugins`), open your project folder and run:

```
/umd:doctor
```

It checks Node, FFmpeg and the filters it needs, Playwright and Chromium, and your route's tools (Blender, Manim, Python…). With your approval it installs what is missing:

- **Playwright and Chromium** go to `~/.umd/runtime`, shared by all your projects; nothing is added to your project;
- **FFmpeg** comes through winget (Windows) or Homebrew (macOS). On Linux it gives you the `apt` command.

**3. Start your first project:**

```
/umd:go a 30-second launch video for our app, 16:9
```

Then just type `/umd:go` each time to carry on.

**4. Optional, depending on your route:** the useful official skills and MCP servers. See [Companion tools](#companion-tools); `/umd:kickoff` suggests the ones that fit your project.

### Install for a whole team

In the project folder, run once in your terminal, then commit `.claude/settings.json`:

```bash
claude plugin marketplace add 1AngelMicka/ultimate-motion-design --scope project
```
```bash
claude plugin install umd@ultimate-motion-design --scope project
```

Your teammates get the plugin when they open the project in Claude Code and trust the folder. Each of them runs `/umd:doctor` once on their machine.

### Update

Type `/plugin marketplace update ultimate-motion-design` in Claude Code. For automatic updates: `/plugin` → **Marketplaces** → **ultimate-motion-design** → **Enable auto-update**.

### Uninstall

```
/plugin uninstall umd@ultimate-motion-design
```
```
/plugin marketplace remove ultimate-motion-design
```

Your project keeps its `.motion/` folder and deliverables; delete them if you no longer want them. The shared Playwright runtime lives in `~/.umd/runtime`.

## Commands

`/umd:go` is all you need day to day. The other commands drive one specific step.

| Command | For |
| --- | --- |
| `/umd:go [what you want to make]` | **The command to remember.** Runs the next step and chains until the next decision. `/umd:go audit`, `/umd:go deliver`… forces a step |
| `/umd:kickoff [what you want to make]` | Set up or update the project: brief, profile, format, route, engine, licence policy, tools |
| `/umd:storyboard [notes]` | Write the beats and validate the look on stills before animating |
| `/umd:build [beats or notes]` | Build the piece, with drafts reviewed over up to 3 rounds |
| `/umd:render` · `/umd:render draft` | Final render, done twice to prove determinism, then analysed · quick draft |
| `/umd:audit` | Incremental audit: only what a change can affect is re-checked. It runs in full on the first audit, after a plugin update, or when the last full audit is older than 30 days |
| `/umd:audit quick` | Automatic checks only, no agent: the cheapest |
| `/umd:audit full` | Re-check everything from scratch |
| `/umd:audit story` | One group: `story`, `motion`, `sound` or `delivery` |
| `/umd:audit TXT` · `/umd:audit TXT-01 SAF-01` · `/umd:audit blockers` | One domain, specific checks, or blockers only |
| `/umd:fix` · `/umd:fix blockers` · `/umd:fix AUD-01` | Fix by priority (blockers then majors), blockers only, or one issue |
| `/umd:deliver [name]` | Deliver the audited render, then the platform versions you ask for |
| `/umd:tokens [days]` | Token use per command, and the one change that would save the most |
| `/umd:doctor` · `/umd:doctor fix` | Check or install the tools |
| `/umd:handoff` | Write `.motion/handoff.md` to resume in another session |

All these commands rely on a zero-dependency CLI that you can also run yourself: `node <plugin>/scripts/umd.mjs` (with no argument it prints its help). It includes `capture`, `still`, `analyze`, `frames`, `compare`, `vmaf`, `mix`, `normalize`, `captions`, `burn`, `lint`, `licenses`, `webperf` and `tokens`.

## Routes and technologies

At kickoff, Claude picks a route based on what you are making. Each route has its own step-by-step guide, loaded only when needed.

| Route | For | Engines |
| --- | --- | --- |
| `html-video` (default) | Promo, presentation, graphic explainer, short, logo, kinetic type | HTML/CSS, GSAP, canvas rendered by `umd capture`; HyperFrames; Remotion; Revideo |
| `threejs-film` | A character or an object in a small 3D world | three.js or WebGPU in a single HTML file, corrected shot by shot |
| `blender` | Real materials, rigged characters, product renders | Blender driven through Python and its MCP server, BlenderKit |
| `director` | Narrated story, many scenes, generated images and voices | Claude directs, other models draw and speak, under a strict licence registry |
| `explainer` | Maths, diagrams, code, terminal | Manim, Mermaid, D2, Code Hike, VHS |
| `web-page` | Website, landing page, UI | GSAP, Motion, CSS, View Transitions, Lenis, animated shadcn registries |

On top of that:

- **14 proven recipes:** product launch, product demo, presentation video, explainer, logo sting, kinetic typography, vertical short, data story, hero section, page transitions, scrollytelling, micro-interactions, narrative short, and matching a reference animation;
- **16 engine guides;**
- **craft guides:** animation principles, motion tokens, composition and safe areas, on-screen text, anti "AI slop";
- **audio guides:** commercial-safe voices, music and sound effects, mixing, captions;
- **practical guides:** assets, platform specs, licences.

**784 proven styles and prompts** serve as starting points: 66 film styles from [lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar), 15 motion-design styles from [mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15) and 703 prompts from [awesome-opus5-5-videos](https://github.com/yihui-dev/awesome-opus5-5-videos). `/umd:storyboard` offers three that fit your brief, and `umd styles <words>` searches them at no token cost. To choose by eye: the [Style library](https://1angelmicka.github.io/ultimate-motion-design/en/bibliotheque.html) shows every style with a preview of the result (still or video) and its prompt to copy. Ready-to-copy prompts and advice: the [Tips and prompts](https://1angelmicka.github.io/ultimate-motion-design/en/astuces.html) page.

The file [catalogue_motion_design_claude_codex_2026.md](catalogue_motion_design_claude_codex_2026.md) lists **1,075 GitHub repositories**, checked on 9 and 10 November 2026, with licence warnings.

### Deterministic rendering

`umd capture` opens your page in Chromium (through Playwright) on a small local server. Before any of the page's scripts runs, it replaces these with **virtual time**:

- the clock (`Date`, `performance.now`);
- `requestAnimationFrame` and timers;
- `Math.random`, made reproducible with a seed.

On every frame it pauses every CSS and Web Animations animation and every `<video>` element, and sets each to the right time. Libraries driven by `requestAnimationFrame` (GSAP, three.js, Lottie, p5…) advance one step per frame. FFmpeg then encodes the screenshots. You can also define `window.umdRender(t)` to control everything yourself. Tested on a GSAP and three.js scene: two renders give byte-identical frames.

## What it checks

| Group | Domains |
| --- | --- |
| Story | NAR brief and narrative · TIM rhythm and timing · LIF life and density · ART art direction |
| Motion | MOT easing and choreography · TXT on-screen text · SAF motion safety · WEB animated web pages |
| Sound | AUD audio · CAP captions |
| Delivery | REN render and encoding · LIC licences and rights |

Every rule and check is detailed in [docs/en/REFERENTIAL.md](docs/en/REFERENTIAL.md).

28 of the 59 checks are measured in code, without an agent (which ones apply depends on the profile):

- output length and format;
- frozen frames, dead air and total near-still time (under 1 s per 30 s, end card excluded);
- sounds landing on their picture, when the storyboard lists sound cues (`umd sync`);
- black frames;
- flashes, as a full-frame approximation of WCAG 2.3.1;
- loudness and true peak;
- silences and abrupt audio cuts;
- render reproducibility, and how faithful the delivered encode is to the master (VMAF);
- caption coverage, sync and reading speed;
- for pages: smoothness, CLS and `prefers-reduced-motion`;
- in the code: hard-coded durations, AI motion tells, remote fonts and assets, hollow wording;
- asset inventory and licences.

The other checks are judged by the auditors, from the contact sheet and a few targeted frames.

### Scoring

- Each check is a **blocker** (5 points), **major** (3) or **minor** (1). Passed = all points, partial = half, failed or not checked = none.
- A failed blocker caps its domain at 3/10 and the overall score at 5.9/10. Examples:
  - a dangerous flash;
  - text too short to read;
  - a render that is not reproducible;
  - stills not validated before animation;
  - a non-commercial asset in an ad.
- The overall score weights the domains by profile: `promo`, `presentation`, `explainer`, `social`, `film`, `logo` or `web`. Domains that do not apply are ignored, such as captions for a logo or audio for a web page.
- Thresholds can be tuned per project in the `thresholds` of `.motion/project.json`: −14 LUFS, 3 flashes per second, 3 s of dead air, VMAF 93… The dead-air, frozen-picture, flash and loudness thresholds were checked on 15 agency-level films with zero false alarm ([docs/CALIBRATION.md](docs/CALIBRATION.md)). The VMAF, caption and web ones remain conventions.

## Licences and rights

Licences are the most concrete risk in a motion project: many state-of-the-art models have non-commercial weights. The plugin handles them at three levels:

- **At kickoff**, the project's policy is written into `license_policy`: commercial use or not, region, Remotion status (free up to 3 employees, paid company licence above), accepted exceptions.
- **While you work**, a hook refuses to install (npm, pnpm, yarn, bun, pip, uv, pipx, poetry) a package or model that the policy forbids, and suggests an alternative. The registry has 30 entries:
  - non-commercial weights such as F5-TTS, MusicGen, YuE, FLUX.1 [dev]…;
  - Tencent Hunyuan models, whose licence does not apply in Europe;
  - AGPL and GPL;
  - Animate UI's Commons Clause;
  - repositories without a licence.
- **At audit**, `umd licenses` cross-checks dependencies, declared models and `.motion/assets.lock.json`. Every asset is recorded there with its source and licence; required credits are copied into `deliverables/credits.txt`.

An exception is still possible: it is your decision, written down explicitly in `license_policy.allow`.

## Token economy

The plugin cuts tokens in three places:

- **what is loaded at all times**: as little as possible;
- **what Claude reads**: JSON summaries, a contact sheet and targeted frames rather than raw output and dozens of images;
- **what gets redone**: only what changed is re-checked, and the project is not re-explored every session.

### What the plugin does on its own

| Mechanism | Effect |
| --- | --- |
| **Almost nothing loaded at all times** | About 250 tokens loaded at all times: the description of the `motion` skill and those of the two agents. The eleven `/umd:*` commands cost nothing until you run them. In a umd project, the startup hook adds about 150 tokens of context. |
| **References on demand** | 49 guides of 1,200 to 2,100 tokens each, read one at a time, only when needed: for example the project's route, then its engine's guide. |
| **Checks done in code** | 28 of the 59 checks are decided by the CLI from FFmpeg measures, lint, licences and browser tests. The auditors only look at what needs eyes. |
| **Contact sheet** | Each render produces a 16-frame sheet: a single image to read. Claude then extracts only 2 to 6 targeted frames if a doubt remains. |
| **Compact output** | Renders, encodes and analyses write their full output to disk and return only a summary. In our test, 3 commands went from about 3,700 tokens of output to about 700. |
| **Incremental audit by default** | Only the checks that a changed file or a new render can affect are re-checked. If nothing changed, no auditor is started. |
| **Quick mode** (`/umd:audit quick`) | Automatic measures only, no agent. |
| **Drafts** (`/umd:render draft`) | Half resolution at 15 fps while iterating. |
| **Cheaper model for the auditors** | `"audit_model": "sonnet"` in `.motion/project.json`; your session stays on your usual model. |
| **Handoff** (`/umd:handoff`) | A short note lets the next session resume without re-exploring. The startup hook points to it for 14 days. |

### Transparency

- `/umd:tokens` reads Claude Code's local transcripts for this folder, subagents included. For each `/umd:*` command it shows input, output, cache-write and cache-read tokens. It adds the one change that would save the most on your project.
- With a `token_budget` in `.motion/project.json`, it shows the share of the budget used.
- The audit report also shows the tokens saved by compact output.

### By kind of piece

| Piece | Typical cost | To spend less |
| --- | --- | --- |
| **Short** (logo, micro-interaction, 2 to 10 s) | Low: few beats, one sheet is enough | `/umd:audit quick` while iterating, a full audit before delivery |
| **Medium** (promo, presentation, short, 15 to 90 s) | Medium: the storyboard and drafts dominate | Validate the look on stills before animating, 2 draft rounds, auditors on Sonnet |
| **Long** (narrative film, explainer of several minutes, `director` route) | High: many scenes, assets and reviews | Work sequence by sequence (`/umd:build 1-6`), audits by group, `/umd:handoff` at the end of each session |

## Companion tools

These tools are not included in the plugin: they are separate projects, installed separately. `/umd:kickoff` suggests the ones that fit your route and installs them only with your approval. Skills cost almost nothing until they are used. An MCP server, on the other hand, adds its tools to every session: install it at project level, only for the route that needs it.

| Tool | When | What it adds |
| --- | --- | --- |
| [remotion-dev/skills](https://github.com/remotion-dev/skills) | Route with Remotion | Remotion best practices. Mind the Remotion licence |
| [greensock/gsap-skills](https://github.com/greensock/gsap-skills) | Pages or scenes animated with GSAP | Timelines, ScrollTrigger, plugins |
| [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) | Route with HyperFrames | HTML → video skills and CLI |
| [LottieFiles/motion-design-skill](https://github.com/LottieFiles/motion-design-skill) | Every route | Timing, easing and choreography principles |
| [kylezantos/design-motion-principles](https://github.com/kylezantos/design-motion-principles) | Animated UIs and pages | Audit mode and anti-AI-tell checklist |
| [blader/humanizer](https://github.com/blader/humanizer) | Pieces with voice-over or lots of text | Removes AI phrasing from scripts and captions |
| [elevenlabs/skills](https://github.com/elevenlabs/skills) | If you accept a paid online voice service | Voices, sound effects, music |
| [rive-app/skills](https://github.com/rive-app/skills) · [splinetool/spline-skills](https://github.com/splinetool/spline-skills) | Interactive vector animation · editable 3D | Official Rive and Spline skills |
| [ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) | Debugging animated pages | Performance traces, dropped frames |
| [ahujasid/mcp-for-blender](https://github.com/ahujasid/mcp-for-blender) | `blender` route only | Drives a running Blender |
| [NiazMorshed2007/reanimate](https://github.com/NiazMorshed2007/reanimate) | A reference animation to study (site, video, gif, Lottie, WebGL), or your own animation to port | Records it, extracts its durations and curves, rebuilds it and measures the gap frame by frame. Needs Bun; tested on macOS and Linux only. See [the recipe](plugins/umd/references/recipes/match-reference.md) |

The exact install commands, checked against each project, are in [references/companions.md](plugins/umd/references/companions.md).

## What it creates in your project

```
BRIEF.md                         the brief (written by /umd:kickoff)
.motion/
  project.json                   profile, route, engine, format, render, licence policy, thresholds
  storyboard.md                  the beats, and the dated "Stills validated" line
  motion-tokens.json             durations and curves (DTCG format)
  assets.lock.json               every asset with its source and licence
  stills/                        the key stills
  renders/<id>/                  video, render.json, analysis.json, sheet.jpg, determinism.json, logs
  renders/latest.json            the latest render
  AUDIT.md                       the latest audit report
  audits/<date>.json             every audit, to track the score over time
  audits/<date>/                 evidence.json, plan.json, parts/ (auditor results)
  token-savings.json             tokens saved by compact output
  handoff.md                     the handoff between sessions
deliverables/                    deliverables, with their manifest and credits.txt
```

Commit `BRIEF.md` and `.motion/`, except the renders, to keep the score history. `/umd:kickoff` adds the renders, audit logs and token counter to your `.gitignore`.

## Troubleshooting

| Problem | Solution |
| --- | --- |
| The `/umd:...` commands do not show up | Restart Claude Code or type `/reload-plugins`. Check `/plugin` → **Installed** and the **Errors** tab. |
| `node: command not found` | Install Node.js 18+ and make sure `node` is on your PATH. |
| Adding the marketplace fails | Make sure `git` is installed. Without a GitHub SSH key, set `CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1` and try again. |
| `ffmpeg not found` | Run `/umd:doctor`. After an install through winget or Homebrew, open a new terminal so the PATH is reloaded. You can also point to the binaries with `UMD_FFMPEG` and `UMD_FFPROBE`. |
| `Playwright not found` or `Chromium is not installed` | `/umd:doctor fix` installs both in `~/.umd/runtime`. |
| `Unknown duration` when rendering | Set `window.umdDuration` (in seconds) in the page, or `duration_s` in `.motion/project.json`. |
| The render is not reproducible (REN-01) | A source of randomness escapes virtual time: network data, a server timestamp, WebGPU, a font loaded online. The engine's guide (`references/engines/`) lists the rules. Drive the scene with `window.umdRender(t)`. |
| 3D is slow or blank in the render | Headless Chromium uses software rendering. Iterate with `/umd:render draft` and check one frame first with `umd still`. |
| An install is blocked by the guard | Use the suggested alternative (`references/licenses.md`). If you accept the risk, add the name to `license_policy.allow`: that is your decision, Claude does not make it for you. |
| `/umd:deliver` refuses to deliver | A blocker is open, or the render changed since the audit: `/umd:fix`, then `/umd:render` and `/umd:audit`. |
| `/umd:tokens` is empty | Transcripts appear after the first Claude Code session in this folder. If you moved your configuration, set `CLAUDE_CONFIG_DIR`. |

## Privacy and security

The plugin sends no telemetry.

- **What it contacts:**
  - During a render, it serves your files on `127.0.0.1` and only contacts the URLs your page loads itself.
  - `/umd:doctor fix` downloads Playwright from npm, Chromium from Playwright's servers, and FFmpeg through winget or Homebrew.
- **What it reads:** `/umd:tokens` reads Claude Code's transcripts on your machine and sends nothing.
- **Hooks:** they run locally and are short enough to read: [licence guard](plugins/umd/scripts/hooks/license-guard.mjs), [session reminder](plugins/umd/scripts/hooks/session-start.mjs).
- **Reporting a vulnerability:** see [SECURITY.md](SECURITY.md).

The plugin helps you spot licence traps; it does not replace a lawyer's advice.

## Contributing

Ideas, bugs, new recipes and new engines are welcome: see [CONTRIBUTING.md](CONTRIBUTING.md). Planned:

- calibrating the thresholds on real renders;
- an After Effects and Premiere module through MCP;
- automated platform exports;
- a visual judge specialised in timing.

## Credits and licence

The scoring, audit and token-saving mechanics come from [quality-pack](https://github.com/1AngelMicka/quality-pack), by the same author. The catalogue and guides build on a study of more than 900 repositories. Third-party tools are credited in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). MIT licence.
