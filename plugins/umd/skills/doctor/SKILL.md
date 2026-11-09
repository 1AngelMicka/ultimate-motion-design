---
name: doctor
description: "Check and install what Ultimate Motion Design needs on this machine: Node, FFmpeg and its filters, Playwright and Chromium, and the tools of the project's route (Blender, Manim, Python…). FR : vérifier l'installation, installer FFmpeg, Playwright."
disable-model-invocation: true
argument-hint: "[fix]"
---

# /umd:doctor

1. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/umd.mjs" doctor`.
2. Show the user `ready` in one line and each `missing` item with its `fix` command (required first, then optional).
3. If a required item is missing, ask whether to run the automatic fix. On yes (or if `$ARGUMENTS` is `fix`), run `… umd.mjs doctor --fix`. It installs Playwright and Chromium in `~/.umd/runtime` (nothing in the project) and FFmpeg through winget (Windows) or Homebrew (macOS). On Linux, give the `sudo apt` command for the user to run.
4. After installing FFmpeg, a new terminal may be needed for PATH: say so, then run doctor again.
5. Finish with one line: ready or not, and the next step (`/umd:kickoff` if there is no `.motion/project.json`).
