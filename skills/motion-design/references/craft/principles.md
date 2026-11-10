# Animation principles for motion design and UI

The 12 principles (Thomas and Johnston, *The Illusion of Life*, 1981) translated into rules Claude can apply and check, with timing tables and easing choices.

## Use when / avoid when

- Read before storyboarding any piece and before writing motion tokens.
- Do not apply character-animation exaggeration to product UI; restraint is the default for interfaces (Emil Kowalski lens in design-motion-principles).

## The 12 principles, applied

| Principle | Motion design / video | UI |
| --- | --- | --- |
| Squash and stretch | Shapes and logos deform 5–15 % on impact (convention), volume preserved | Almost never; a pressed button may scale to 0.97 |
| Anticipation | Small counter-move (2–6 frames) before a big move or a cut | Hover/press state before navigation |
| Staging | One focal motion at a time; everything else holds or moves less | Only the changed element animates |
| Straight ahead / pose to pose | Pose to pose with keyframes from tokens; straight ahead only for procedural noise, particles | Pose to pose (states) |
| Follow-through and overlapping action | Parts settle after the body stops; children trail parents by 2–4 frames | Content inside a panel lands 1 step after the panel |
| Slow in and slow out | Easing on every move; linear only for constant mechanical motion, rotation loops, scrolling credits | Standard curves from tokens |
| Arcs | Organic moves travel on curves (motion paths), not straight diagonals | Shared-element transitions may arc |
| Secondary action | Breath, blink, light shimmer that supports the main action | Icon detail after a state change |
| Timing | Number of frames defines weight and mood | Duration tokens per distance and size |
| Exaggeration | Push key poses for clarity in short social pieces | Minimal |
| Solid drawing | Consistent perspective, light and depth in 2.5D/3D | Consistent elevation and shadows |
| Appeal | Clear silhouettes, readable shapes, one style | Calm, predictable motion |

## Timing

| Kind | Duration | Source |
| --- | --- | --- |
| UI micro-interaction (button, toggle, fade of small element) | 70–240 ms | Carbon `fast-01` 70 ms … `moderate-02` 240 ms |
| UI transition (panel, modal, page element) | 250–500 ms | Material 3 `medium1` 250 ms … `long2` 500 ms; Carbon `slow-01` 400 ms |
| Large or hero transition, background dim | 400–700 ms | Carbon `slow-01`/`slow-02` |
| Video text reveal | 0.4–0.8 s, then hold (see `text-on-screen.md`) | Convention |
| Video beat (one idea) | 2–4 s; something new about every 2 s, no dead air > 3 s | umd TIM thresholds (convention, calibrate) |
| Scene in a promo | 3–6 s | Convention |
| Eyes lead body (character) | 6–10 frames | Creator rule from posts (convention) |

Scale duration with distance and size: small, near moves are short; full-screen moves are longer. Exits are about 20–30 % shorter than entrances (convention): the user already knows the content.

## Frames, not milliseconds, for video

| fps | 1 frame | 100 ms | 250 ms | 500 ms |
| --- | --- | --- | --- | --- |
| 24 | 41.7 ms | 2.4 f | 6 f | 12 f |
| 30 | 33.3 ms | 3 f | 7.5 f | 15 f |
| 60 | 16.7 ms | 6 f | 15 f | 30 f |

- Round every video timing to whole frames; quote animations in frames in the storyboard ("12 f in, 48 f hold").
- 24 fps reads cinematic and hides little; 30 fps is the social and screen-recording default; 60 fps only for UI demos, games, fast camera moves.
- A move shorter than 3 frames at 30 fps reads as a cut. A hold shorter than 6 frames reads as a stutter.

## Easing choice

| Motion | Curve | Token (see `tokens.md`) |
| --- | --- | --- |
| Element enters the frame | ease-out (decelerate): arrives fast, settles | `easing.enter` |
| Element leaves the frame | ease-in (accelerate): leaves quickly | `easing.exit` |
| Element moves within the frame | ease-in-out | `easing.standard` |
| Large, branded or hero moment | expressive curve | `easing.expressive` |
| Physical object, drag release, playful brand | spring, used on purpose | `easing.spring-like` or engine spring |
| Constant rotation, conveyor, ticker | linear | `linear` |

- Springs: only where physics is implied (thrown, dropped, dragged). No bounce on utility actions (menus, toggles, modals).
- Never the bare CSS `ease` keyword or the engine default: always a token.

## Core patterns

1. **One focal motion.** At any instant, one thing leads; supporting elements move later, shorter, or less. Stagger only when the order means something.
2. **Overlap, do not queue.** Start the next move before the previous ends (overlap 20–40 %, convention); queued animations feel robotic.
3. **Anticipate big moves and cuts** with a 2–6 frame counter-move or a camera ease.
4. **Arcs for organic motion**, straight lines for UI and mechanics.
5. **Settle, then hold.** Every reveal ends in a readable hold; even holds keep micro-life (LIF: nothing frozen > 1 s).
6. **Every motion has a purpose**: direct attention, show a relation, give feedback, or show change. If it does none, cut it (MOT).
7. **Web: animate `transform` and `opacity` only**; avoid layout properties (WEB, MOT).
8. **Respect reduced motion**: replace movement with opacity changes under `prefers-reduced-motion: reduce` (WEB, SAF).

## Rendering to video with umd

- Validate key poses first: `umd still scene.html --at 0,1.5,3` before animating (ART).
- `umd lint` flags hard-coded durations/easings and layout-property animation; `umd analyze` gives the motion timeline, freezes and dead air.

## Pitfalls

- Same duration and curve on everything: no hierarchy. Vary by size and role through tokens.
- Everything starts at frame 0: stagger by meaning or not at all.
- Linear fades on scale: looks mechanical; ease them.
- Bouncy overshoot on text: hurts reading; overshoot ≤ 5 % on headings, none on body text (convention).

## Checks

- MOT: durations/easings from tokens, one focal motion, easing matches physics, transform/opacity only on the web (`umd lint`, `umd frames --sheet`).
- LIF: overlapping action, eyes lead body, no frozen segment > 1 s (`umd analyze`).
- TIM: new event about every 2 s, no dead air > 3 s (`umd analyze`).
- WEB/SAF: reduced-motion support (`umd webperf`).

## Sources

- Carbon motion tokens: https://github.com/carbon-design-system/carbon/tree/main/packages/motion
- Material 3 motion tokens: https://github.com/material-components/material-web (tokens/versions/latest/sass/_md-sys-motion.scss), https://m3.material.io/styles/motion/overview
- https://github.com/kylezantos/design-motion-principles (Emil Kowalski, Jakub Krehel, Jhey Tompkins lenses)
- https://github.com/LottieFiles/motion-design-skill
- Thomas, F. and Johnston, O., *The Illusion of Life: Disney Animation*, 1981
- research_notes/Dépôts motion design pour agents/posts_x_utilisateur.md (creator rules, 2026-11-09)
