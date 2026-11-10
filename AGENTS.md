# AGENTS.md — Ultimate Motion Design

Instructions for an AI agent asked to install, set up or use this plugin for a user. Humans: see [README.md](README.md) (French) or [README.en.md](README.en.md).

## What it is

A Claude Code plugin (`umd`) that makes and audits motion design: promo, presentation, explainer and social videos, logo animations, animated short films, animated web pages, 3D shots. It renders HTML animations to video deterministically, scores the result on 60 checks out of 10 with evidence, guards licences and reports token use. One command drives everything: `/umd:go`.

- Repository: https://github.com/1AngelMicka/ultimate-motion-design
- Documentation: https://1angelmicka.github.io/ultimate-motion-design/ (English at `/en/`)
- Full docs in one file: https://1angelmicka.github.io/ultimate-motion-design/llms-full.txt

## Install for the user (Claude Code)

Slash commands can only be typed by the user. Pick one path:

**A. Ask the user to type these two commands** in Claude Code, then restart Claude Code (or type `/reload-plugins`):

```
/plugin marketplace add 1AngelMicka/ultimate-motion-design
/plugin install umd@ultimate-motion-design
```

**B. Project install, done by you** (no slash command): add this to the project's `.claude/settings.json` (merge with existing keys, do not overwrite the file), then ask the user to restart Claude Code in that folder and trust it when asked:

```json
{
  "extraKnownMarketplaces": {
    "ultimate-motion-design": { "source": { "source": "github", "repo": "1AngelMicka/ultimate-motion-design" } }
  },
  "enabledPlugins": { "umd@ultimate-motion-design": true }
}
```

Do not run `claude plugin …` from inside a running Claude Code session: nested sessions are refused.

## Prerequisites and check

- Node.js 18+, git, FFmpeg (with the `ebur128`, `loudnorm`, `freezedetect`, `signalstats` filters; full builds have them).
- Playwright + Chromium: installed by the plugin into `~/.umd/runtime`, nothing goes into the user's project.
- After install, ask the user to run `/umd:doctor`. It lists what is missing with the exact command for their OS, and installs Playwright, Chromium and FFmpeg (winget on Windows, Homebrew on macOS) after the user agrees. On Linux, give the user the `sudo apt install ffmpeg` command; never run `sudo` yourself.
- Ask before installing anything system-wide.

## Guide the user

1. First project: the user types `/umd:go <what they want to make>`, for example `/umd:go a 30-second launch video for our app, 16:9`. It asks a few questions (what, format, length, look, commercial use), then writes `BRIEF.md` and `.motion/project.json`.
2. From then on the user types `/umd:go` to continue. It runs the next step (storyboard, build, render, audit, fix, deliver) and stops at decisions that belong to the user: approving the key stills, accepting a licence exception, delivering.
3. Results: the audit report is `.motion/AUDIT.md` (score out of 10, blockers, fixes); renders and their contact sheets are in `.motion/renders/<id>/`; deliverables in `deliverables/`.
4. Token use: `/umd:tokens`. Cheapest audit: `/umd:audit quick` (automatic checks only, no agent).
5. Resources, at no token cost: `umd styles <words>` (784 styles and prompts, previews at https://1angelmicka.github.io/ultimate-motion-design/en/bibliotheque.html), `umd moves <words>` (120 named techniques), `umd commons <words>` (free images, recorded in the assets lock). Every link the project used is in `SOURCES.md`.

## Use without Claude Code (other agents)

The engine is a zero-dependency Node CLI usable by any agent:

```bash
git clone https://github.com/1AngelMicka/ultimate-motion-design
node ultimate-motion-design/plugins/umd/scripts/umd.mjs            # help
node ultimate-motion-design/plugins/umd/scripts/umd.mjs doctor --fix
node ultimate-motion-design/plugins/umd/scripts/umd.mjs capture page.html --out out.mp4 --duration 6
node ultimate-motion-design/plugins/umd/scripts/umd.mjs analyze out.mp4
```

The method lives in plain Markdown: `plugins/umd/skills/*/SKILL.md` (the steps; `$ARGUMENTS` = the user's words, `${CLAUDE_PLUGIN_ROOT}` = `plugins/umd`), `plugins/umd/references/` (routes, recipes, engines, audio, craft, licences) and `plugins/umd/referential/` (the checks and scoring, JSON).

## Rules to respect when helping

- Never mark a check as passed without evidence (a frame at a time, a measure, a file and line).
- Never add a licence exception (`license_policy.allow`) or lower a threshold on your own: it is the user's decision.
- Do not copy someone else's video or site look; describe references in words (see `plugins/umd/references/recipes/match-reference.md`).
- Record every asset in `.motion/assets.lock.json` with its source and licence.
- Recommend only free, reusable resources: nothing paid, nothing that may not be redistributed.
