---
name: kickoff
description: "Start a motion design project with Ultimate Motion Design: brief, profile, format, route and engine, licence policy, tool check. Writes BRIEF.md and .motion/. FR : démarrer un projet motion, vidéo, animation, brief."
disable-model-invocation: true
argument-hint: "[what you want to make, in a few words]"
---

# /umd:kickoff

Set up the current folder for a motion piece. The user's words: `$ARGUMENTS`. Talk to the user in their language (French by default) and keep questions few and concrete.

CLI: `node "${CLAUDE_PLUGIN_ROOT}/scripts/umd.mjs"` (written `umd` below). References: `${CLAUDE_PLUGIN_ROOT}/references/`.

**Cost:** low (one doctor run, a few short files). No reference file is needed unless the user hesitates between routes; then read only `routes/<candidate>.md` headers.

## 1. Look

1. `umd detect` → existing engines, web framework, HTML entry, suggested route and engine.
2. If `.motion/project.json` exists, read it and ask whether to update it or start over; never overwrite silently.
3. Read any brief, script or brand file the user points to (only those).

## 2. Ask (one AskUserQuestion call, up to 4 questions, skip what `$ARGUMENTS` or the files already answer)

- **What**: promo / product launch · presentation video · explainer · social short (9:16) · narrative animated short · logo animation · animated web page. → `profile`: promo, presentation, explainer, social, film, logo, web.
- **Format and length**: platform(s), aspect (16:9, 9:16, 1:1, 4:5), target duration, sound on or off by default, and the **frame rate**, with its cost: HTML pieces render cheaply at 60 fps (fast UI and type stay crisp); rendered 3D (Blender, a heavy three.js scene) at 24 or 30 fps with motion blur, since 60 → 30 fps halves the render time. Decide it now: changing it later costs hours of rendering. → `format.fps`.
- **Look**: references described in words (shot length, camera, how things enter, palette, type), brand assets available, and who picks the style from the library: "show me 3 options" (`style_choice: "ask"`, default) or "choose for me" (`"auto"`). Put the mood and medium words in BRIEF.md: `umd styles match` reads them.
- **Characters on screen?** (people, mascots, animals). Say the cost: made in code (HTML, three.js, Blender scripts) they often look stiff and take the most rounds; a concept without characters (objects, hands, cursors, silhouettes, type) is safer. → `flags.has_characters`.
- **Sound**: music (library, generated, composed, or none), voice-over, the feel of the effects (clean UI clicks, cinematic hits, real foley), and whether the piece must work muted (social) or stay silent until a click (web). → `flags.has_music`, `has_voice`; the answer goes in `BRIEF.md` under `## Sound`.
- **Use and licences**: commercial? team size if Remotion is an option (free up to 3 employees, company licence above)? Voice-over? Music?
- **Ambition** (only if unclear): professional (`quality_target` 7, fewer rounds), agency (8, default) or award level (9, more rounds and tokens).

## 3. Decide the route and engine (say why in one line each)

| Piece | Route (references/routes/) | Default engine |
| --- | --- | --- |
| Flat, graphic, UI, typography, promo, presentation, social, logo | `html-video` (R1) | `umd-capture` (HTML/CSS/GSAP/canvas, licence-free). HyperFrames if installed; Remotion if the user already uses React video and the licence fits |
| One character or object in a small 3D world | `threejs-film` (R3) | three.js in one HTML file + umd capture |
| Real materials, rigged characters, product renders | `blender` (R2) | Blender + Blender MCP |
| Narrated story, many scenes, generated images/voices | `director` (R4) | other models orchestrated, strict licence registry |
| Maths, diagrams, code, terminal | `explainer` | Manim / Mermaid / Code Hike / VHS |
| Website or UI | `web-page` | the project's framework + GSAP/Motion/CSS |

## 4. Write

1. `umd init` (creates `.motion/project.json`, `.motion/storyboard.md`, `.motion/motion-tokens.json`, `.motion/assets.lock.json`, `BRIEF.md`, adds render folders to `.gitignore`; never overwrites).
2. Fill `.motion/project.json`: `name`, `language`, `profile`, `flags` (start from the profile defaults in the referential and adjust: `has_voice`, `has_music`, `has_captions`, `has_characters`, `commercial`, `uses_remotion`, `is_web`), `route`, `engine`, `format` {width, height, fps, aspect}, `duration_s`, `platforms`, `render` (from the route file: `{"capture": {"entry": "index.html"}}` or `{"command": "...", "output": "..."}`), `url` for web pages, `license_policy` {commercial, region, remotion: individual | small-company | non-profit | company-license | unknown, allow: []}, `audit_model` ("inherit"; "sonnet" makes audits cheaper), `quality_target` (7 professional, 8 agency, 9 festival selection: from the ambition answer; default 8), `style` (null until the storyboard picks one from `umd styles match`), `style_choice` ("ask" or "auto"), `cost_confirm` ("high" by default: `/umd:go` asks before a step estimated over about 150 k tokens; "medium" asks above 50 k; "never"), `token_budget` if the user gives one.
3. Fill `BRIEF.md` with the user's answers in plain words. References are described, never "copy this video".
4. Adapt `.motion/motion-tokens.json` only if the brand imposes timings; otherwise keep the defaults.

## 5. Tools

1. `umd doctor`. If something required is missing, show the `fix` commands and ask before running `umd doctor --fix` (it installs Playwright and Chromium in `~/.umd/runtime`, and FFmpeg via winget/Homebrew; nothing in the project).
2. Suggest at most 2 optional companions that fit the route, from `references/companions.md` (read only the matching rows). Say that MCP servers add tool definitions to every session, so install them only when the route needs them.
3. If the user gives a reference to move like (URL, video, gif, Lottie) or wants to port their own animation, suggest the `reanimate` companion and say that `references/recipes/match-reference.md` will be used at storyboard time. Note the fidelity they want (motion-faithful by default; pixel-faithful only for their own material or with permission) in BRIEF.md.

## 6. Hand over

Reply in a few lines: profile, route, engine and why, format, duration, licence notes (Remotion, commercial), tools status, then the next step: `/umd:storyboard`. Mention `/umd:tokens` to see token use at any time.
