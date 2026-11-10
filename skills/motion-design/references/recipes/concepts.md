# Recipe — Concepts before style

Three film concepts in the same format, compared side by side, before any style or beat. A style gives a look; it does not give an idea. When the brief asks for something "more evolved", "less template", or only says what the piece must say, start here. Used by `/umd:storyboard` step 0a.

## Use when / avoid when

- Use when the brief has a message and maybe a voice-over, but no idea of the film: no hero moment, no thread, no reason to watch to the end.
- Use again when a critique says "generic", "a sequence of slides", "nothing happens".
- Avoid when the brief already fixes the concept (a storyboard, a reference film to match, a logo sting with a set mark): go straight to the style.

## Inputs

- `BRIEF.md`: audience, the one thing to remember, constraints (real screens, brand system, no characters…).
- The voice-over timing if there is one: phrase start and end times (from the TTS output, captions words JSON or `umd captions`), so every concept lands its moments on the words.
- `umd styles match` (no tokens): the looks that fit, to attach one to each concept.

## The format (same for the three)

| Field | What it says |
| --- | --- |
| Idea | One sentence a stranger understands: the device that carries the film ("the quiz is a TV game show broadcast from the phone") |
| Hero moment | The one shot people will remember, with its time |
| Thread | What persists from start to end (an actor, an object, a camera move, a sound) |
| Run-down | 4 to 8 lines, each tied to a phrase of the voice: time, what we see, what changes |
| Look | One pick from `umd styles match` (id, preview link) and what to adapt |
| Route and cost | Route, engine, rough render time, token level, characters or not |
| Risks | What can fail (code-made characters look stiff, real screens under a film look, a long 3D render) and the fallback |

Make the three really different: one literal (show the product doing its job), one metaphor (a device from another world), one structural (a single continuous move, a split screen, a countdown). Not three looks of the same idea.

## Choosing

Show the three tables, recommend one in a line with the reason, and let the user choose or mix. Record the chosen concept in `BRIEF.md` under `## Concept`; the beats are then written from its run-down.

## Pitfalls

- Concepts that are styles in disguise ("a neon version", "a paper version"): the idea is missing.
- A hero moment that falls on no word of the voice: move it or change the line.
- A concept that needs characters when the route is code: say the risk, or keep a version without people (objects, hands, cursors, silhouettes).
- Three concepts in long prose: the user cannot compare them. Keep the table.

## Cost

One text answer, about 3 to 6 k tokens; no images. Far cheaper than a stills round on the wrong idea.

## Checks

- ART-06 (idea, hook, hero moment) is judged against the chosen concept.
- STO checks: the run-down gives one intent per beat.

## Sources

- Field report on a real presentation film (2026-11-10): the style library pushed towards existing looks, nothing helped to design the film's idea.
