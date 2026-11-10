---
name: go
description: "The one command of Ultimate Motion Design: looks at the project and runs the next step (tools, kickoff, storyboard, build, render, audit, fix, deliver), chaining steps until a decision belongs to the user. FR : lancer, continuer, faire la suite, une seule commande."
disable-model-invocation: true
argument-hint: "[what you want to make] or [step: kickoff | storyboard | build | render | audit | fix | deliver | tokens]"
---

# /umd:go

The user's words: `$ARGUMENTS`. Talk in the user's language (French by default). `umd` means `node "${CLAUDE_PLUGIN_ROOT}/scripts/umd.mjs"`.

## 1. Where are we?

Run `umd next`. It returns `step`, `reason`, `needs_user`, `optional`, `cost` and a short `state` (tools, storyboard, latest render, last audit). It reads local files only.

## 2. Which step?

- `$ARGUMENTS` names a step, in any language (`audit`, `vérifier`, `corriger`/`fix`, `rendu`/`render`, `livrer`/`deliver`, `tokens`, `storyboard`, `build`/`construire`, `kickoff`/`démarrer`) → run that step, then stop.
- `$ARGUMENTS` describes something to make ("une vidéo de lancement de 30 s…") and there is no project yet → `kickoff`, with these words as the brief.
- `$ARGUMENTS` describes something to make and a project already exists → `kickoff` (it asks whether to update this project or start a new one in another folder); never ignore the user's words.
- Otherwise → the step from `umd next`.

Tell the user in one line: the step, why (`reason`) and what it will cost (`cost.tokens`, `cost.level`, and "measured" when `cost.source` says so).

**Expensive steps.** When `cost.confirm` is true (a high-cost step, or the project's `token_budget` would be exceeded), stop before running it: give the estimate, the main drivers (`cost.drivers`) and the cheaper options (`cost.cheaper`), and ask whether to go ahead. A project can set `"cost_confirm": "medium"` (ask more often) or `"never"` in `.motion/project.json`.

## 3. Run it

Read `${CLAUDE_PLUGIN_ROOT}/skills/<step>/SKILL.md` and follow it exactly, as if the user had typed `/umd:<step>`. Its `$ARGUMENTS` are the user's remaining words, or empty. Do not re-read a step file you have already followed in this conversation unless the step is new to you.

## 4. Chain until a decision is needed

After a step ends, run `umd next` again and continue with the new step **without asking**, except in these cases, where you stop and ask:

- `needs_user` is true: the stills must be approved (storyboard), fixes are not converging (`umd next` counts the fix → render → audit cycles), or the piece is ready to deliver;
- the step file itself asks the user (route choice, creative change, licence exception, installing tools);
- `optional` is true (only major issues left): ask whether to fix them or deliver as is;
- the same step comes back twice in a row with the same reason: something is blocking; say what and stop;
- `done`.

If the user asked for one step (step 2, first bullet), do not chain.

## 5. End

Finish with three lines at most: what was done, the score if there was an audit, and what `/umd:go` will do next time. Every two or three chained steps, mention `/umd:tokens` once if the session is getting long.
