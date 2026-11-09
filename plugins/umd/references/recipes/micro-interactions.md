# Recipe — Micro-interactions

Small, fast feedback on a single control: press, toggle, hover, focus, loading, success, error. Duration 100–300 ms, purpose always "the system heard you" or "here is what changed". Route: [../routes/web-page.md](../routes/web-page.md).

## Use when / avoid when

- Use on buttons, toggles, checkboxes, inputs, tabs, menus, toasts, drawers, loaders, likes.
- Avoid decorating static content or animating on every hover of a dense list.

## Setup

| Need | Tool | Licence |
| --- | --- | --- |
| Most states | CSS transitions on `transform`/`opacity`, `:active`, `:focus-visible` | native |
| React state and presence | `motion` (`whileTap`, `AnimatePresence`, `layout`) | MIT |
| Toasts, drawers | `sonner`, `vaul` | MIT |
| Animated icons | itshover (Apache-2.0), Lucide icons animated by hand (ISC) | — |
| Bursts, confetti | `mojs` (MIT), `canvas-confetti` (ISC) — rarely | — |
| Rive state machines for rich controls | Rive runtime | MIT ([../engines/rive.md](../engines/rive.md)) |

Inspiration (MIT): `solinkz/micro-interactions-skill` (20+ patterns, spring physics), `kylezantos/design-motion-principles` (audit mode for AI motion tells). Tokens: [../craft/tokens.md](../craft/tokens.md).

## Core patterns

### Duration and easing table

| Interaction | Duration | Easing |
| --- | --- | --- |
| Press (scale 0.96–0.98) | 80–120 ms down, 150–200 ms release | ease-out |
| Hover colour / elevation | 120–180 ms | ease-out |
| Toggle knob, checkbox tick | 150–250 ms | ease-out or spring, overshoot ≤ 3 % |
| Tab indicator, segmented control | 200–300 ms | ease-in-out |
| Menu / popover open | 150–220 ms in, 100–150 ms out | ease-out in, ease-in out |
| Toast in / out | 200–300 ms / 150–200 ms | ease-out / ease-in |
| Error shake | 250–350 ms, 2–3 cycles, ≤ 6 px | — |
| Loader appears | only after ~300 ms of waiting | fade 150 ms |

Exits are faster than entrances. Nothing on a frequently used control exceeds 300 ms.

### Patterns

```css
.btn { transition: transform 120ms var(--ease-out), background-color 160ms var(--ease-out); }
.btn:active { transform: scale(0.97); }
.btn:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .btn { transition: background-color 160ms; } .btn:active { transform: none; } }
```

- **Respond on press, not on release**: visible change within 100 ms of input.
- **Optimistic state**: the toggle flips immediately; roll back with an error message if the request fails.
- **Loading button**: keep width fixed, swap label for a spinner after ~300 ms, success check for ~600 ms, then back.
- **Spring knobs**: the two edges of a toggle knob can ride slightly different springs so it stretches a little (product-launch-motion rule); keep it subtle.
- **Error**: colour + icon + message; shake only as a secondary cue, never alone (not accessible).
- **Success bursts** only for rare, meaningful events (first purchase, task done), never on every click.

### Spec template (one row per control state)

```
| control | trigger | property | from → to | duration | easing token | reduced motion | a11y |
| Toggle | click/Space | knob translateX | 0 → 20px | 200ms | spring-snappy | instant | aria-checked updates |
```

### Do / don't

- Do give every interactive state a non-motion signal too (colour, icon, text) for reduced motion and colour-blind users.
- Do match keyboard and touch: `:focus-visible` gets the same care as `:hover`.
- Don't use `transition: all`; list properties.
- Don't make users wait for an animation before they can act again.
- Don't pulse or bounce idle elements to attract attention (AI tell).

## Rendering to video with umd

Not needed. For a component showcase or docs GIF, script the interactions in a page that triggers them at fixed times and capture: `umd capture states.html --out states.gif --format gif --duration 6`.

## Pitfalls

| Breaks | Fix |
| --- | --- |
| Animating `width`/`height`/`box-shadow` on hover lists → jank | Transform/opacity; pre-render shadow on a pseudo-element and fade it |
| Hover effects stick on touch devices | Wrap in `@media (hover: hover)` |
| Spinner flashes for fast requests | Delay ~300 ms before showing |
| Layout shift when a label changes | Fixed width or `min-width` on the button |
| Durations differ across components | All from tokens; `umd lint` flags hard-coded values |

## Checks

- **MOT**: 100–300 ms, tokens only, transform/opacity, no AI tells (`umd lint`).
- **WEB**: reduced motion alternative for every animated state; responsive within 100 ms; no CLS.
- **SAF**: no repeated flashing (success/error loops).
- **TXT**: labels remain readable during state changes.

## Sources

- https://github.com/solinkz/micro-interactions-skill · https://github.com/kylezantos/design-motion-principles · https://github.com/emilkowalski/sonner · https://github.com/emilkowalski/vaul · https://github.com/itshover/itshover · https://github.com/mojs/mojs
- https://github.com/AbubakrChan/product-launch-motion (spring rules)
