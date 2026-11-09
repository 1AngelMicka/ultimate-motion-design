---
name: render
description: "Final render of the motion project: deterministic render twice to prove reproducibility, encode, mux the mix, analyse (cuts, dead air, freezes, flashes, loudness) and build the contact sheet. FR : rendu final, exporter la vidéo."
disable-model-invocation: true
argument-hint: "[draft]"
---

# /umd:render

CLI: `node "${CLAUDE_PLUGIN_ROOT}/scripts/umd.mjs"` (`umd`). Talk in the project's language.

**Cost:** low in tokens (the CLI returns a compact summary; logs stay on disk), long in wall time for big renders: run it in the background when it may exceed 2 minutes.

1. Read `.motion/project.json` → `render`. If missing, read `routes/<route>.md` (section "Rendering to video with umd") and set it: `{"capture": {"entry": "index.html"}}` for HTML routes, or `{"command": "<engine render command>", "output": "<file>"}`; `render.audio` = the mix if any.
2. If `$ARGUMENTS` is `draft`: `umd render --draft` and stop after step 4.
3. Final: `umd render --twice` (renders twice and compares frame hashes: REN-01 needs it). Web-only projects (`is_web` without `is_video`) skip rendering: say so and go to `/umd:audit`.
4. Read the JSON summary only. If `ok` is false, read the `signal_lines`, then the log file around the error, fix, render again.
5. Report in a few lines: output path, duration and size, `determinism.identical`, then any flag in `analysis` (dead air, freezes ≥ 1 s, flashes > 3/s, loudness off target, abrupt end), and the contact sheet path. Look at the contact sheet yourself only if the user asks or something is flagged.
6. Platform exports (vertical cut, GIF, WebM for the web) come after the audit: read `references/platforms.md` for specs.

Next step: `/umd:audit`.
