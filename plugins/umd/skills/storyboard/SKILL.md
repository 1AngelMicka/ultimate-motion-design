---
name: storyboard
description: "Write the storyboard (beats, timings, on-screen text, motion, sound, one intent per beat), then render key stills and validate the look against the brief before any animation. FR : storyboard, découpage, plans, images clés."
disable-model-invocation: true
argument-hint: "[notes or changes]"
---

# /umd:storyboard

CLI: `node "${CLAUDE_PLUGIN_ROOT}/scripts/umd.mjs"` (`umd`). Talk in the project's language. Extra notes: `$ARGUMENTS`.

**Cost:** medium. Read one recipe file at most; stills rounds use the `umd:critic` agent on small images.


Naming a technique in the Motion column? `umd moves <words>` (no tokens) gives 120 named moves with one line each (match cut, whip pan, split-flap, cursor-led demo…); use their names so the critic and the user share the vocabulary.
## 0. Style (before any beat)

**Rule: never invent a look from a blank page when the library has one that fits.** If `project.json` has no `style` yet, choose it from the library before any beat (`${CLAUDE_PLUGIN_ROOT}/references/styles.md`). A strict brand system does not skip this step: it narrows it (keep the brand's colours and type, take the motion and composition from the style).

1. `umd styles match [a few words the brief leaves out]` (no tokens). It reads BRIEF.md and project.json (project type, format, mood, medium, ambition) and ranks the 1 323 entries: `looks` (full styles and creator prompts) and `blocks` (ready-made HyperFrames blocks and components), each with `why` and a `preview` link. Never pick from memory or from a plain word search instead.
2. Choose:
   - `style_choice: "ask"` (the default): show the user the first 3 looks, each with its preview link and the `why` in one line, and let them pick (or give an id they found on the library page).
   - `style_choice: "auto"` (the user left it to you at kickoff): take look #1, unless its `why` does not mention the project type, then take the first one that does. Say in one line which one and why, with its preview link.
   - Useful blocks (a logo outro, a chart, a phone mock-up): note them for the build; they install with their `install` command when the engine is HyperFrames, and serve as a reference otherwise.
3. On the choice: `umd styles get <id>` (its output gives `approx_tokens`: style prompts weigh 1 to 8 k tokens), read `.motion/styles/<id>.md` **once**, set `"style": "<id>"` in project.json, and write a `## Style card` in BRIEF.md: at most 200 words with the signature features you keep (materials, colour logic, type, motion rules, sound), what you adapt (story, product, copy, brand colours inside the style's colour logic) and the credit line. From then on every step and every critic reads the card, never the full prompt again.
4. Web pages: also pick 2 or 3 references from the galleries listed in `references/styles.md` and say what you take from each.

## 1. Beats

1. Read `BRIEF.md` and `.motion/project.json`. If missing, stop and suggest `/umd:kickoff`.
2. Read the matching recipe in `${CLAUDE_PLUGIN_ROOT}/references/recipes/` (one file: launch-video, product-demo, presentation-video, explainer-video, logo-sting, kinetic-typography, social-short, data-story, hero-section, page-transitions, scrollytelling, micro-interactions, narrative-short or series).
   - If BRIEF.md names a reference to move like, or an animation of the user's to port, also read `recipes/match-reference.md`: measure the reference first (reanimate if installed, otherwise the umd fallback), then put the measured durations and curves in the motion tokens and the measured sequence in the beats.
3. Write the script in plain words first if there is a voice-over (no hollow phrasing: `umd lint` flags it).
4. Fill `.motion/storyboard.md`: the arc line, then one table row per beat: `| # | Time | Shot | On-screen text | Motion | Sound | Intent |`. Then fill `## Events` (each product action in seconds and global frames: start state, cursor on the control, press, result, legible), `## Layout limits` (checked with the longest copy), `## Sound cues` (one line per sound of the Sound column: `6.5s click: cursor press`; `umd sync` measures them) and `## Review frames`. Give each sequence a palette (colour script) in its Shot cell.
   - Time as `a–b s`; beats sum to `duration_s`.
   - Something new about every 2 s; no 3 s without meaningful motion.
   - On-screen text gets at least max(1.2 s, words ÷ 3 + 0.5 s).
   - Each Motion cell names its role and a token (`entrance-expressive`, `moderate-02`…).
   - Sound lands 0–1 frame after the image it underlines.
   - Last column: one intent or emotion per beat.
   - Film: wants → tries → surprise → looks at camera; eyes lead the body by 6–10 frames; nothing fully still.
5. `umd lint` → `storyboard` must show 0 beats without duration or intent and 0 text too short. Fix and re-run.

## 2. Key stills (the look, before any animation)

1. Build only the static layout of the key beats (up to 8), in the route's engine, using the tokens and brand assets. Record each asset in `.motion/assets.lock.json` as it arrives.
2. Render them: HTML routes `umd still <entry> --at <t1>,<t2>,… --out .motion/stills`; other engines with their still command (see the route file) into `.motion/stills/`.
3. Review round: launch the `umd:critic` agent with the project path, `.motion/stills/`, the round number and the CLI path. Apply its fixes, re-render the stills.
4. Up to 3 rounds. Stop when the critic says "ready" (every dimension at `quality_target`) or after round 3; then show the user the last scores and what is left.
5. Show the user the stills (paths), the critic's last verdict, and ask for approval. On approval, add `Stills validated YYYY-MM-DD` (today) under `## Stills` in the storyboard. This line is what the audit checks (ART-01).

## 3. Hand over

Summarise: beats count, total duration, stills validated or not, open points. Next step: `/umd:build`.
