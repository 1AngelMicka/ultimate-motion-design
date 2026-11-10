# Motion (ex Framer Motion)

Declarative animation for React (`motion/react`), vanilla JS (`motion`) and Vue (`motion-v`): springs, layout animations, enter/exit presence, gestures and scroll. Pick it for component-level UI motion in apps and marketing sites.

## Use when / avoid when

| Use when | Avoid when |
| --- | --- |
| React/Vue state changes: open/close, reorder, tabs, shared-element moves | A 30 s authored video timeline → GSAP ([gsap.md](gsap.md)) or Remotion |
| Exit animations of unmounting components (`AnimatePresence`) | Pure CSS hover/focus → CSS ([css-waapi.md](css-waapi.md)) |
| Layout animations without measuring (`layout`, `layoutId`) | Heavy scroll choreography with pinning → ScrollTrigger |
| Interruptible, velocity-aware springs for gestures | |

## Setup

- React / JS: `npm i motion` (14.x in Nov 2026). Import from `motion/react` (React) or `motion` (vanilla). `framer-motion` is the legacy name: migrate imports to `motion/react`.
- Vue / Nuxt: `npm i motion-v` (repo `motiondivision/motion-vue`, 2.x), `import { motion } from "motion-v"`.
- Licence: MIT. Motion+ (paid, one-time) adds premium components and examples; not needed.
- `motiondivision/motionone` is archived (merged into `motion`): do not install it.

## Core patterns

**1. Variants orchestrate parent → children.**

```tsx
import { motion } from "motion/react";
const list = { hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };
<motion.ul variants={list} initial="hidden" animate="show">
  {items.map((i) => <motion.li key={i.id} variants={item} />)}
</motion.ul>
```

**2. Springs with sane bounce.** Use the duration-based form so springs match motion tokens: `transition={{ type: "spring", visualDuration: 0.35, bounce: 0.15 }}`. UI elements: `bounce` 0–0.2. Playful accents: up to 0.3. Above that reads as toy-like unless the brief asks for it. `visualDuration` is the time to visually reach the target; the tail settles after.

**3. Presence (exit) animations.**

```tsx
import { AnimatePresence, motion } from "motion/react";
<AnimatePresence mode="wait" initial={false}>
  {open && <motion.div key="panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} />}
</AnimatePresence>
```

Direct children need a stable `key`. `mode="wait"` for swaps, `"popLayout"` when siblings must reflow immediately.

**4. Layout animations.** `layout` on an element animates its size/position change with transforms; `layoutId="active-pill"` on two elements makes a shared-element transition. Wrap related layout siblings in `<LayoutGroup>`. Use `layout="position"` when text would distort while scaling.

**5. Reduced motion.** App-wide: `<MotionConfig reducedMotion="user">` (drops transform/layout animation, keeps opacity). Per component: `const reduce = useReducedMotion()` and swap movement for a fade.

**6. Gestures and scroll**: `whileHover`, `whileTap`, `whileInView` (+ `viewport={{ once: true, amount: 0.4 }}`), `useScroll()` + `useTransform()` for scroll-linked values; `useSpring` to smooth a motion value.

**7. Vanilla JS**: `animate(el, { opacity: 1, transform: "none" }, { duration: 0.4, ease: [0.2, 0, 0, 1] })`, `stagger(0.05)`, `inView(".card", (el) => …)`, `scroll(animation)`.

**8. Vue (`motion-v`)**: same props as Vue bindings: `<motion.div :initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :exit="{ opacity: 0 }" />`, `<AnimatePresence>` from `motion-v`.

## Rendering to video with umd

Motion is built for interactive UIs, not authored timelines. For a capture of a Motion page (UI demo, product video):

- `umd capture` virtualises `requestAnimationFrame`, `performance.now` and timers, so Motion springs advance on virtual time; trigger state changes at fixed times with `setTimeout` (virtualised) or from `window.umdRender(t)`.
- For full control, drive the vanilla API explicitly: `const a = animate(el, {...}, {...}); a.pause();` then `window.umdRender = (t) => { a.time = t; };` (`time` is in seconds).
- Prove it: render twice and `umd compare`. If frames differ, the trigger depended on real input or network.

## Pitfalls

| Breaks | Fix |
| --- | --- |
| Animating `width/height/top/left` by hand | `layout` prop (transform-based) or `x/y/scale` |
| `AnimatePresence` exits never run | Child must be a direct child with a stable `key`; conditional inside the presence |
| Every element springs with default bounce | `bounce` ≤ 0.2 for UI, tokens via `visualDuration` |
| Layout animation distorts text/borders | `layout="position"` or animate `borderRadius` via `style` so it is scale-corrected |
| `whileInView` triggers once on load in a short viewport | Tune `viewport.amount`; avoid scroll-triggered content above the fold |
| Mixing `framer-motion` and `motion` packages | One package, imports from `motion/react` |
| No reduced-motion path | `MotionConfig reducedMotion="user"` at the root (WEB) |

## Checks

- **WEB**: reduced-motion behaviour and dropped frames via `umd webperf <url>`; no CLS from animation.
- **MOT**: springs and durations match tokens; no AI motion tells (bounce on everything, fade-up on every element), `umd lint`.
- **REN** (when captured): two captures identical.

## Sources

- https://github.com/motiondivision/motion · https://motion.dev/docs
- https://github.com/motiondivision/motion-vue (`npm install motion-v`)
- research_notes/…/web_animation.md
