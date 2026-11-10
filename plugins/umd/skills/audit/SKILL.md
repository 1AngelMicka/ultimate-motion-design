---
name: audit
description: "Scored motion quality audit of the current render and project across 12 domains (narrative, timing, life, art direction, easing, text, safety, web, audio, captions, render, licences), with evidence for every criterion; writes .motion/AUDIT.md. Automatic checks run in code; agents only judge what needs eyes. FR : audit motion, noter la vidéo, vérifier la qualité."
disable-model-invocation: true
argument-hint: "[quick | full | group | domain code | criterion IDs | blockers] (empty = incremental)"
---

# /umd:audit

CLI: `node "${CLAUDE_PLUGIN_ROOT}/scripts/umd.mjs"` (`umd`). Arguments: `$ARGUMENTS`. Talk in the project's language.

## Modes, cheapest first

| Arguments | What runs | Cost |
| --- | --- | --- |
| `quick` | Automatic checks only (analysis, lint, licences, captions, web perf), scored in code. No agent | Lowest |
| empty | Incremental: automatic checks + agents only for criteria a change can affect; the rest is carried over. Full on the first audit, after a plugin update, or after 30 days | Low to medium |
| a group (`story`, `motion`, `sound`, `delivery`), a domain code (`TXT`), criterion IDs or `blockers` | Scoped | Low to medium |
| `full` | Everything again | Highest |

## 1. Evidence (in code)

1. No `.motion/project.json` → say so, suggest `/umd:kickoff`, stop.
2. `umd evidence` → runs analysis of the latest render, lint, licences, captions check, web perf (web projects), VMAF (when a master exists) and decides every automatic criterion. Read its summary: `counts`, `not_passing`, `notes`. If a note says there is no final render, offer `/umd:render` first.

## 2. Plan

`umd plan` with `--incremental` when `$ARGUMENTS` is empty, otherwise `umd plan $ARGUMENTS`. Note `out_dir`, `mode`, `incremental`, `criteria_for_auditors`, `groups`, `audit_model`, `umd_cli`, `plugin_root`.

- `quick`, or `criteria_for_auditors` is 0, or `incremental.no_changes` → go to step 4.

## 3. Auditors (parallel)

Before launching, tell the user how many agents will run (each reads its plan, the evidence and the contact sheet: roughly 25 to 60 k tokens) unless the mode is `quick`.

Launch one `umd:auditor` agent per group in the plan, all in one message, except that a group with 3 criteria or fewer is given to the agent of another group (list both groups in its prompt; it writes one part file per group): an agent for two criteria costs as much as one for fifteen. If `audit_model` is not `inherit`, pass it as the agent's model. Prompt, filled in:

```
Audit group <group> of Ultimate Motion Design in <absolute project path>.
Plan: <out_dir>/plan.json (only the criteria of group <group>). Mode: <mode>.
Evidence: <out_dir>/evidence.json. Contact sheet: <analysis.sheet.file from evidence, or "none">.
CLI: node "<umd_cli>"   Plugin root (references): <plugin_root>
Write your results to <out_dir>/parts/<group>.json. Write "fix" in <language>.
```

## 4. Score and report

1. `umd assemble`. If it warns (invalid part, pass without evidence, criteria not returned), re-run only that auditor. Never edit a result to raise the score.
2. Reply in a few lines:
   - the overall score, grade and trend; the mode;
   - the open blockers, each with its fix in one line (delivery stays locked while one is open);
   - how many other issues and unchecked criteria; how many criteria were decided automatically;
   - the tokens saved by compact outputs (`token_savings`), and `/umd:tokens` for the full breakdown;
   - `.motion/AUDIT.md` for the full report; `/umd:fix` to fix by priority; `/umd:deliver` once no blocker is open.

A score is only worth its evidence: never pass a criterion because it is probably fine.
