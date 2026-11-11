# Directing by numbers: brief, clock, springs and the model itself

A precise model given a vague brief returns a precise default. This guide turns intentions into numbers, puts one clock in charge of every event, and says how to direct the agent so it finishes the film instead of stopping at "looks good". Most of it comes from a creator's field notes on 40 films made with Claude Fable 5.2 (flxrnc, November 2026); the numbers are his unless a check of ours is named.

## Use when / avoid when

- Use when writing the brief, the storyboard, a build prompt or a fix note, and whenever a critique says "generic", "floaty", "small", "frozen" or "it stopped early".
- Avoid copying a creator's film, characters or music: reuse the grammar (numbers, clock, checks), never the content.

## Replace every adjective with a number

| You were going to write | Write instead |
| --- | --- |
| premium | roughness 0.38, clearcoat 0.35 (and the style card's materials) |
| cool light | key 3200 K, rim 7500 K |
| modern | 35 mm, f/2.8, cut on the beat |
| smooth | `cubic-bezier(0.16, 1, 0.3, 1)` in, `cubic-bezier(0.7, 0, 0.84, 0)` out, the exit 40 to 50 % shorter |
| bouncy | a spring with damping ratio 0.5, two bounces |
| fast cuts | cut on the beat: frames per beat = fps × 60 ÷ BPM (120 BPM at 60 fps = 30 frames) |
| big, visible | the hero at least 170 px wide at 1080p in every main shot (`umd still --hero`); a screen at least a third of the frame height when the screen is the subject |
| playful | squash 1.25 × 0.75 on landing, crouch 1.2 × 0.75, takeoff 0.85 × 1.28, volume kept; arms lag 4 frames, ties and tails 6 |

A directed brief has the same ten lines every time:

```
SUBJECT  one idea per shot, as an event: "the logo lands on the frame the kick hits"
TIME     length, fps, frames, size: 8 s, 60 fps = 480 frames, 1920x1080
PALETTE  exact hex: background, ink, one accent
TYPE     face, weight, size, tracking
SHOTS    what moves, from which frame to which frame; lens per shot
EASING   a curve or a damping ratio, never an adjective
HOLDS    still while read: 0.3 s per word + 0.5 s
BANNED   the defaults to keep out: glow orbs, purple gradients, fade-in on everything, zooms to fake energy
QA       the stills and measures to report before saying done
LOOP     frame N-1 flows into frame 0 (only for loops)
```

The camera block, in numbers: 35 mm for the room, 50 mm for the action, 85 mm for a face; focus follows the hero's real depth on every frame; energy comes from cuts on the beat, never from zooms or whip pans; a good angle holds a whole beat; text is fully in frame or fully out; the last frame is the image, nothing under it.

## Springs: one number decides the landing

`damping ratio = c / (2 √(k m))`

| Ratio | Feel | For |
| --- | --- | --- |
| 1.0 | lands dead still, no overshoot | UI, text, anything people read |
| 0.8 | one small bounce | products, cards, logos |
| 0.5 | two bounces | characters, mascots, comedy |

Every spring is a closed-form function of time, never integrated frame by frame: a renderer that jumps to frame 300 must get the same landing as one that played frames 0 to 299 (`umd still --seek-check` proves it).

```js
// under-damped spring from 0 to 1, started at t0: same value whatever order the frames are drawn in
function spring(t, t0, { zeta = 0.5, omega = 18 } = {}) {
  const x = Math.max(0, t - t0);
  if (zeta >= 1) return 1 - (1 + omega * x) * Math.exp(-omega * x);              // critically damped
  const wd = omega * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * omega * x) * (Math.cos(wd * x) + (zeta * omega / wd) * Math.sin(wd * x));
}
```

## One clock: `timing.json`

Write the timing before the animation. `.motion/timing.json` (template: `${CLAUDE_PLUGIN_ROOT}/templates/timing.json`) lists every event in frames: hops, presses, cuts, camera moves, and the sound each one makes. The scene code reads it; nothing is timed by hand; a sound lands 1 frame after its picture event. When the music drives the film, the notes are the clock: compute every event from the beat grid. `umd sync <video>` reads `timing.json` when it exists and measures every event that has a sound (±45 ms).

## Design collisions out

Give every moving thing a path that cannot meet another: separate lanes, a plane behind the subject, a grid. A collision made impossible needs no fix. When an object attaches to a character (a megaphone, a phone), ask for a numeric "never intersecting" check, not a visual one.

## Measure, do not look

A model that checks stills will pass a frozen film. Before saying done, report numbers:

- `umd still --at <key times> --hero "<selector>" --seek-check`: the hero's width per shot (over the minimum), and every frame drawn cold equals the same frame drawn in sequence.
- `umd analyze <draft>`: freezes, near-still time, dead air, cuts on motion; `--loop` for loops: the last frame must flow into the first.
- `umd sync <render>`: every sound on its frame.
- One fix round on stills before any full render: stills cost seconds, a render minutes. First stills always come out too wide: fix framing and hero size there.

## Directing the agent

- **Effort.** Iterate at medium (storyboards, stills, notes), build at high. Max thinks longer, costs about three times more and is not reliably better for visuals (`/effort medium`, then `/effort high` before "build it"). `/umd:go` states the suggested effort with each step's cost.
- **Define "finished".** Long tasks sometimes end early with a list of what remains. Put this in the build prompt (the build skill does):

  > Finishing work: this film is done only when the full-length render exists, every check passes with its number, and LEDGER.md lists what changed. A failed render, a timeout, a missing font or a locked file is an ordinary obstacle: fix it and continue. Stop only for a blocker only the user can lift, and say exactly what you need.

- **Ownership and approvals.** One warm line does more than ten CAPS rules: "This film is yours to build; approved without asking: rendering drafts, writing check scripts, changing camera, light and timing inside the brief. Ask first only before changing the story beats or the length." Read the diff, not the summary: ownership also brings changes nobody asked for.
- **Fewer, better rules.** A model that follows rules closely holds on to every old "never": keep shared rules short, delete a rule that stopped no real bug, and replace "act freely" with the exact list of approved steps.
- **Limits as numbers.** "At most 2 render processes at once", "at most 3 revisions per shot": without a number, parallel runs multiply.
- **Builder ≠ reviewer.** The critic and the auditors never built the work and try to break it (umd's critic and auditor agents work that way).
- **Lock the style before the whole build**: one approved style frame, with examples of what you like; the model adds labels and subheaders nobody asked for unless told "only the text listed here appears on screen".

## Pitfalls

| Breaks | Fix |
| --- | --- |
| The hero is a dot | Minimum width per shot, measured: `umd still --hero` |
| The face is soft | Focus follows the hero's real depth; 85 mm for faces; cap motion blur on the face |
| Landings differ between preview and render | Closed-form springs and moves; `umd still --seek-check` |
| The loop stutters | Render frames 0 to N-1 (umd does); `umd analyze --loop` |
| It stopped and offered to continue | The finishing-work block above |
| It thought for minutes and drew nothing | Lower the effort to high |
| Sound early or late | Sounds read from `timing.json`, 1 frame after the picture; `umd sync` |
| The camera zooms to fake energy | Cut on the beat; ban zooms in the brief |

## Checks

- MOT: closed-form motion, damping ratios as written; LIF: no unplanned freeze; ART: hero size per shot.
- AUD-03: every sound in `timing.json` lands on its frame.

## Sources

- flxrnc, "The Fable 5.2 Motion Playbook: One Prompt, One Film", X, 2026-11-10 (lessons, numbers and quoted practices: effort, numbers, springs, motion QA, finishing work, prompt style, agent teams, limits); its own sources include Anthropic's Fable 5.2 prompting guide, Jonathan Edwards' video pipeline write-up and Ethan Mollick's "Portals".
