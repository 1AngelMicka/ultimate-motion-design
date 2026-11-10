---
name: fix
description: "Fix the issues of the last motion audit by priority (blockers first), verify each fix, then re-render and re-audit the affected criteria. FR : corriger les problèmes de l'audit motion."
disable-model-invocation: true
argument-hint: "[criterion IDs | blockers | domain code] (empty = blockers, then majors)"
---

# /umd:fix

CLI: `node "${CLAUDE_PLUGIN_ROOT}/scripts/umd.mjs"` (`umd`). Scope: `$ARGUMENTS`. Talk in the project's language.

**Cost:** medium. Work from the audit's evidence and fix lines; read references only for the criterion at hand.

1. Read the latest `.motion/audits/<date>.report.json` → `issues` (sorted: blockers, majors, minors; unknowns last). No audit → suggest `/umd:audit`, stop.
2. Pick the scope: `$ARGUMENTS`, or all blockers then majors. Show the list (ID, one-line problem, planned fix) and start, unless a fix changes the creative direction (palette, script, music, route): ask first for those.
3. For each issue, in order:
   - Apply the fix in the source (scene code, tokens, storyboard, mix, captions, assets lock, project.json) as a scoped edit: where (time or frame range), what is observed, the one change, and what must stay fixed (copy, positions, cue frames). Change nothing else.
   - `unknown` issues: provide what was missing (a render, a master, captions words, stills validation) rather than "fixing" anything.
   - Verify with the narrowest command: `umd lint`, `umd licenses`, `umd captions-check`, `umd sync`, `umd still <entry> --at t`, `umd render --draft` + `umd frames --at t`. A visual fix near a transition: also `umd frames <draft> --cuts`, and look at both neighbouring cuts.
4. Final render when any visual or audio file changed: `umd render --twice`.
5. Re-audit only what was touched: `/umd:audit <the fixed IDs>` (scoped mode), or `/umd:audit` if many domains changed.
6. Reply: fixed, still open (why), new score, and whether `/umd:deliver` is now allowed.

Never weaken a threshold, edit an audit result or add a licence exception to make a criterion pass. A threshold change is the user's decision: explain the trade-off and ask.
