# Motion tokens

Every duration, easing and transition in a umd project comes from `.motion/motion-tokens.json`, written in the DTCG 2025.10 format. No hard-coded `300ms` or `ease-in-out` in scene code (MOT).

## Use when / avoid when

- Create the file at storyboard time (`/umd:storyboard`), before any scene code.
- Extend it rather than bypass it: a new need gets a new token with a `$description`.
- Avoid importing a full design system's token set: keep 5 durations, 5 easings, a few transitions.

## Format (DTCG 2025.10)

| `$type` | `$value` | Notes |
| --- | --- | --- |
| `duration` | `{"value": 240, "unit": "ms"}` | unit `ms` or `s` |
| `cubicBezier` | `[x1, y1, x2, y2]` | x in [0, 1], y any real number (overshoot allowed) |
| `transition` | `{"duration", "delay", "timingFunction"}` | all three required; values or references like `"{duration.md}"` |

DTCG has no spring type: store springs as an overshooting `cubicBezier` plus engine-specific parameters in `$extensions`.

## Default token set

Durations and curves come from IBM Carbon `@carbon/motion` (v11.56.0, Apache-2.0, whose own `motion.tokens.json` already uses the DTCG 2025.10 schema). The spring-like curve is a convention (the classic "back out" cubic-bezier approximation), not a Carbon value.

```json
{
  "$schema": "https://www.designtokens.org/schemas/2025.10/format.json",
  "duration": {
    "xs": {"$type": "duration", "$value": {"value": 70,  "unit": "ms"}, "$description": "Carbon fast-01: press, toggle"},
    "sm": {"$type": "duration", "$value": {"value": 150, "unit": "ms"}, "$description": "Carbon moderate-01: small fades, short moves"},
    "md": {"$type": "duration", "$value": {"value": 240, "unit": "ms"}, "$description": "Carbon moderate-02: panels, toasts, text reveals in UI"},
    "lg": {"$type": "duration", "$value": {"value": 400, "unit": "ms"}, "$description": "Carbon slow-01: large expansion, scene element moves"},
    "xl": {"$type": "duration", "$value": {"value": 700, "unit": "ms"}, "$description": "Carbon slow-02: hero transitions, background dim"}
  },
  "easing": {
    "standard":    {"$type": "cubicBezier", "$value": [0.2, 0, 0.38, 0.9], "$description": "Carbon standard productive: moves within the frame"},
    "enter":       {"$type": "cubicBezier", "$value": [0, 0, 0.38, 0.9],   "$description": "Carbon entrance productive: ease-out"},
    "exit":        {"$type": "cubicBezier", "$value": [0.2, 0, 1, 0.9],    "$description": "Carbon exit productive: ease-in"},
    "expressive":  {"$type": "cubicBezier", "$value": [0.4, 0.14, 0.3, 1], "$description": "Carbon standard expressive: hero and brand moments"},
    "spring-like": {"$type": "cubicBezier", "$value": [0.34, 1.56, 0.64, 1], "$description": "Convention: overshoot ~10%, physical objects only",
                    "$extensions": {"umd.spring": {"stiffness": 300, "damping": 24, "mass": 1}}}
  },
  "transition": {
    "enter":   {"$type": "transition", "$value": {"duration": "{duration.md}", "delay": {"value": 0, "unit": "ms"}, "timingFunction": "{easing.enter}"}},
    "exit":    {"$type": "transition", "$value": {"duration": "{duration.sm}", "delay": {"value": 0, "unit": "ms"}, "timingFunction": "{easing.exit}"}},
    "move":    {"$type": "transition", "$value": {"duration": "{duration.lg}", "delay": {"value": 0, "unit": "ms"}, "timingFunction": "{easing.standard}"}},
    "hero":    {"$type": "transition", "$value": {"duration": "{duration.xl}", "delay": {"value": 0, "unit": "ms"}, "timingFunction": "{easing.expressive}"}}
  }
}
```

The `umd.spring` values are a starting point (convention), tune them per piece.

Other curves worth knowing (Material 3, Apache-2.0, `material-web` tokens): standard `[0.2, 0, 0, 1]`, standard-decelerate `[0, 0, 0, 1]`, standard-accelerate `[0.3, 0, 1, 1]`, emphasized-decelerate `[0.05, 0.7, 0.1, 1]`, emphasized-accelerate `[0.3, 0, 0.8, 0.15]`; durations short1 50 ms to extra-long4 1000 ms. Carbon also has expressive entrance `[0, 0, 0.3, 1]` and exit `[0.4, 0.14, 1, 1]`.

## Consuming tokens

Resolve references once in a loader, then feed each engine:

```js
// tokens.mjs: tiny resolver for this file's shape
import fs from "node:fs";
const T = JSON.parse(fs.readFileSync(".motion/motion-tokens.json", "utf8"));
const get = (p) => p.split(".").reduce((o, k) => o[k], T).$value;
export const ms = (name) => { const v = get(`duration.${name}`); return v.unit === "s" ? v.value * 1000 : v.value; };
export const bezier = (name) => get(`easing.${name}`);               // [x1, y1, x2, y2]
export const frames = (name, fps) => Math.round((ms(name) / 1000) * fps);
```

| Engine | Duration | Easing |
| --- | --- | --- |
| CSS | `--motion-duration-md: 240ms;` then `transition: transform var(--motion-duration-md) var(--motion-easing-enter), opacity …` (never `transition: all`) | `--motion-easing-enter: cubic-bezier(0, 0, 0.38, 0.9);` |
| GSAP 3 | `duration: ms("md") / 1000` (seconds) | `gsap.registerPlugin(CustomEase); CustomEase.create("enter", bezier("enter").join(","));` then `ease: "enter"` |
| Motion (motion.dev) | `transition: { duration: ms("md") / 1000 }` | `ease: bezier("enter")` (4-number array) |
| Remotion | `const d = frames("md", fps)` | `interpolate(frame, [0, d], [0, 1], { easing: Easing.bezier(...bezier("enter")), extrapolateRight: "clamp" })` |
| WAAPI | `duration: ms("md")` | `easing: \`cubic-bezier(${bezier("enter")})\`` |

- Generate the CSS custom properties from the JSON at build time; scene code references names only.
- For video, convert to whole frames (`frames()`), never fractional frames.
- Springs: GSAP has no native spring, use the bezier; Motion and Remotion `spring()` can read `$extensions.umd.spring`, but a spring's duration is emergent, so check it fits the beat.

## Rendering to video with umd

- `umd lint` flags hard-coded durations and easings (`hardcoded_motion_max` = 3) and bare `ease`.
- `umd capture` drives GSAP, CSS and WAAPI on virtual time, so token durations map exactly to frames.

## Pitfalls

- Mixing ms and s between engines (GSAP and Motion use seconds, CSS and WAAPI ms): always convert through the loader.
- x values outside [0, 1] are invalid in CSS and DTCG: overshoot goes in y only.
- Copying easings.net code into the plugin: that site is GPL-3.0; cite curve names, do not embed its source.
- Token drift: an ad-hoc `0.35s` added "just once" spreads; add a token instead.

## Checks

- MOT: durations and easings from motion tokens (`umd lint`).
- REN: deterministic timing in frames (two renders identical with `umd compare`).

## Sources

- DTCG 2025.10 schemas: https://github.com/design-tokens/community-group/tree/main/schemas/src/2025.10/format/values (duration.json, cubicBezier.json, transition.json)
- Carbon: https://github.com/carbon-design-system/carbon/blob/main/packages/motion/tokens/motion.tokens.json, `npm view @carbon/motion` (11.56.0)
- Material 3: https://github.com/material-components/material-web/blob/main/tokens/versions/latest/sass/_md-sys-motion.scss
- GSAP CustomEase: https://gsap.com/docs/v3/Eases/CustomEase/ ; Remotion `interpolate`/`Easing`: https://www.remotion.dev/docs/easing
