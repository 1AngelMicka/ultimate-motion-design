---
name: deliver
description: "Deliver the audited render: copies it to deliverables/ with a manifest and credits, refused while a blocker is open or if the render changed since the audit; then optional platform exports. FR : livrer, exporter la vidéo finale."
disable-model-invocation: true
argument-hint: "[file name] [platforms]"
---

# /umd:deliver

CLI: `node "${CLAUDE_PLUGIN_ROOT}/scripts/umd.mjs"` (`umd`). Talk in the project's language.

1. `umd deliver --name <name from $ARGUMENTS or project name>`.
   - Refused (exit 2) → show the open blockers with their fixes and offer `/umd:fix`. Never copy the file by hand to get around it.
   - Refused because the render changed or is a draft → offer `/umd:render` then `/umd:audit`.
2. On success, report the file, its manifest (score, audit date, hash) and `deliverables/credits.txt` if attributions are required.
3. Platform versions (only those asked for, or in `project.json` `platforms`): read `references/platforms.md` for the specs, encode each from the delivered master with FFmpeg through `umd run export-<platform> "<ffmpeg command>"`, then `umd analyze <file>` to check size, fps, loudness. Name them `deliverables/<name>-<platform>.<ext>`.
4. Remind the user of any licence obligation (Remotion company licence, CC-BY credits) in one line.
