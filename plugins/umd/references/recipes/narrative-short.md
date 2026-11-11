# Recipe — Narrative short with a character

A 30–120 s animated short where a character wants something small, tries, meets a surprise, and looks at the camera. Acting carries it: eyes first, body after, never fully still. Routes: [../routes/threejs-film.md](../routes/threejs-film.md) (character in a small 3D world), [../routes/html-video.md](../routes/html-video.md) (2D, stickman, cut-out), [../routes/blender.md](../routes/blender.md) (rigged, realistic), [../routes/director.md](../routes/director.md) (narrated, generated scenes).

## Use when / avoid when

- Use for brand shorts, mascot films, festival or social shorts, story-driven ads.
- Avoid when there is no character with a want; use [explainer-video.md](explainer-video.md) or [launch-video.md](launch-video.md).

## Setup

- Character from the catalogue, not drawn in code: `umd characters`, then its profile and a test shot ([../characters.md](../characters.md)).
- Character bible before any frame: silhouette, 3 expressions (neutral, effort, surprise), colours, scale against the set, one signature idle (ear twitch, antenna sway).
- Story script with **one emotion per beat written at the end of the line**.
- Sound design plan from the start ([../audio/music-sfx.md](../audio/music-sfx.md)); no voice needed — sound and acting tell it.
- References: describe in your own words what you like (shot lengths, camera position, how characters enter frame); never copy someone else's film.

## Core patterns

### Story arc: want → try → surprise → look at camera

| Part | Share of runtime | Content | Example (45 s) |
| --- | --- | --- | --- |
| Want | 15 % | Establish the character and the small thing it wants | 0–7 s: robot sees the last cookie on a high shelf — *longing* |
| Try | 40 % | 2–3 escalating attempts, each fails differently | 7–25 s: stretch, stack boxes, jump — *determination*, *frustration* |
| Surprise | 30 % | Something unexpected changes the situation | 25–38 s: a bird takes the cookie, drops half in its hands — *shock*, *delight* |
| Look at camera | 15 % | The character looks at the viewer; held beat | 38–45 s: looks at us, shrugs, bites — *complicity* |

### Shot list template (`storyboard.md`)

```
| id | start–end | shot (size, angle) | action | eyes (lead frames) | idle layer | event | sfx (+1 frame) | emotion |
| n05 | 14.0–17.5 | medium, low angle | jumps for the shelf | eyes up 8 f before crouch | antenna sway | box wobbles at 15.2 | boing at land+1 f | determination |
```

### Acting rules (from creators, enforced by the audit)

- **Eyes lead the body by 6–10 frames**: gaze shifts to the target, then head, then body (overlapping action).
- **Never fully still**, including the final shot: breathing (1–2 % scale, 3–4 s cycle), blinks every 2–6 s at irregular intervals, small weight shifts.
- **A new event about every 2 s**: an action, a reaction, a camera change, a sound.
- **Anticipation → action → follow-through** on every big move; holds after a reaction (8–16 frames) so it reads.
- **Sound lands one frame after the image** it belongs to.
- **Readable silhouette**: every key pose reads as a solid black shape.

### Review rhythm: 8 stills per round

Before animating each sequence, render 8 key stills (one per beat or key pose) and review them as a sheet: pose clarity, staging, eye direction, continuity, palette. Fix, re-render the 8, repeat until they read without explanation.

```bash
umd still film.html --at 2,6,10,14,20,27,33,41 --out .motion/stills/round-2
```

After the draft render, review the contact sheet the same way (`umd frames <video> --sheet`).

### Durations

| Format | Length | Attempts in "try" |
| --- | --- | --- |
| Social short | 30–45 s | 2 |
| Brand short | 60–90 s | 3 |
| Festival short | 2–5 min | 3 + a second surprise |

### Do / don't

- Do give the character one clear want a child could state.
- Do frame the final look-at-camera as a close-up and hold it ≥ 1.5 s, still breathing.
- Don't explain with text what acting can show; don't add dialogue to fill silence.
- Don't let the camera move without motivation; cut on action.

## Rendering to video with umd

Use the chosen route's render block; render at 24 or 30 fps (pick once, the acting timings in frames depend on it). Place each SFX at its image frame + 1 (at 30 fps, an event at 15.200 s gets its sound at 15.233 s) and pass those timestamps to `umd mix … --sfx boing.wav@15.233`; music-and-SFX mixes without voice are covered in [../audio/mix.md](../audio/mix.md).

## Pitfalls

| Breaks | Fix |
| --- | --- |
| Character freezes between actions | Idle layer always on (breathing, blinks, sway) |
| Body and eyes move together (puppet feel) | Offset gaze 6–10 frames ahead |
| Surprise is telegraphed | Plant it early but out of focus; reveal on a cut |
| Ending on a fade to black | End on the look at camera, held, alive |
| Stills skipped to save time | The 8-still round is the cheapest fix; skipping it costs full re-renders |

## Checks

- **NAR**: want → try → surprise → look at camera; one emotion per beat in `storyboard.md`.
- **LIF**: no frame-diff freeze > 1 s, including the last shot; eyes lead body 6–10 frames (inspect frames).
- **TIM**: event about every 2 s; no dead air > 3 s.
- **ART**: 8 stills per round reviewed before animating.
- **AUD**: SFX 0–1 frame after the image; −14 LUFS.

## Sources

- Creator rules and routes: research_notes/…/posts_x_utilisateur.md (post 5) · https://github.com/alchaincyf/huashu-art-motion
- reports/Dépôts motion design pour agents.md (referential: NAR, LIF, AUD rules)
