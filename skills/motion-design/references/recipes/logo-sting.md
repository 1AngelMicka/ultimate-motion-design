# Recipe — Logo sting / ident (2–6 s)

A short reveal that ends on the exact logo lockup, used as intro, outro, bumper or loading moment. Built from the logo's own vector geometry, with an optional sound logo. Route: [../routes/html-video.md](../routes/html-video.md) (SVG); 3D variants on [../routes/threejs-film.md](../routes/threejs-film.md) or [../routes/blender.md](../routes/blender.md).

## Use when / avoid when

- Use for video intros and end cards, channel idents, app splash animations, brand guidelines motion.
- Avoid stretching it past 6 s: that is a brand film. Avoid when the brand has a motion guideline already (follow it).

## Setup

- **Clean vector first.** From a raster logo, `nolangz/pixel2motion` (MIT skill) traces a smooth minimal SVG, then produces an HTML motion demo, GIF/video previews and motion QA evidence. From an SVG, optimise without destroying structure:
  ```bash
  npx svgo logo.svg -o logo.clean.svg --config svgo.config.mjs
  ```
  ```js
  // svgo.config.mjs — keep ids and separate paths so parts stay animatable
  export default { plugins: [{ name: "preset-default", params: { overrides: { cleanupIds: false, mergePaths: false } } }] };
  ```
- Animate with GSAP or CSS on the SVG ([../engines/svg.md](../engines/svg.md), [../engines/gsap.md](../engines/gsap.md)); Lottie or Rive when the sting must ship in an app ([../engines/lottie.md](../engines/lottie.md), [../engines/rive.md](../engines/rive.md)). snapcn has `logo-assemble` and `logo-flicker` (⚠️ Remotion licence: free up to 3 employees, paid above).
- Sound logo: [../audio/music-sfx.md](../audio/music-sfx.md).

## Core patterns

### Beat structure (4 s at 30 fps = 120 frames)

| Frames | Beat | Intent |
| --- | --- | --- |
| 0–12 | Anticipation | Empty frame is not allowed: a dot, a line, light, or the first part already moving |
| 12–75 | Build | Parts assemble, draw or morph into the mark; one idea only |
| 75–90 | Snap | Mark locks into its final geometry with a small settle (overshoot ≤ 3 %) |
| 90–120 | Hold + wordmark | Wordmark unfolds from the mark; hold the lockup ≥ 1 s with subtle life (light sweep, 1 % scale drift) |

### Pick one concept from the logo's geometry

| Concept | Fits | Technique |
| --- | --- | --- |
| Draw-on | Line marks, monograms | `stroke-dasharray`/`stroke-dashoffset`, then fill fades in |
| Assemble | Multi-part marks | Parts fly from off-axis with staggered springs to their anchors |
| Morph | Simple shapes, letterforms | flubber or Manim `Transform` from a primitive (circle → mark) |
| Mask reveal | Wordmarks | `clip-path` or SVG mask wipes, following the stroke direction |
| Converge | Brands about connection | Particles or dots gather into the silhouette (motionboard "Converge to Mark") |
| Unfold | Mark + wordmark | Wordmark slides out from behind the mark ("Mark-to-Wordmark Unfold") |

### Shot list template

```
| part (svg id) | enters at (f) | from | ease token | settles at (f) | sfx |
| #mark-left | 14 | x -40, rot -12 | spring-snappy | 78 | tick |
```

### Durations per format

| Format | Length |
| --- | --- |
| Bumper / social end card | 2–3 s |
| Video intro / outro | 3–5 s |
| Broadcast-style ident | 5–6 s |
| App splash | ≤ 1.5 s, skippable, honours reduced motion |

### Do / don't

- Do end on the exact approved lockup (compare the last frame to the master SVG pixel for pixel).
- Do deliver variants: light/dark, transparent `mov`/`webm`, 16:9, 1:1, 9:16.
- Don't distort the logo (no squash on letterforms, no recolouring outside the palette).
- Don't add lens flares, glitch or particle explosions unless the brand already uses them.

### Sound logo

- 1–3 s, one motif; the hit lands 0–1 frame after the snap frame.
- Synthesised or generated with a licence that allows commercial use; record it in `assets.lock.json`.
- Peak ≤ −1 dBTP; stings are short, so check loudness on the full clip with `umd loudness`.

## Rendering to video with umd

```json
{ "capture": { "entry": "sting/index.html", "fps": 60, "duration": 4 } }
```

Transparent version: `umd capture sting/index.html --out out/sting.mov --fps 60 --duration 4 --transparent --format mov`. GIF preview: `--format gif`.

## Pitfalls

| Breaks | Fix |
| --- | --- |
| svgo merged the paths you wanted to animate | `mergePaths: false`, `cleanupIds: false`; check ids before animating |
| Final frame slightly off the master logo | Animate to the original coordinates; extract the last frame (`umd frames out/sting.mp4 --at 3.95`) and overlay it on the static SVG still |
| Thin strokes alias at 1080p | Render at 2× or thicken hairlines in the motion version |
| Every element bounces | One spring settle on the snap; everything else eases out |
| Sound lands before the image | Shift the hit to snap frame + 1 |

## Checks

- **ART**: last frame identical to the approved lockup; palette exact.
- **MOT**: one concept, eases from tokens, no AI motion tells.
- **AUD**: hit 0–1 frame after the snap; no clipping.
- **REN**: alpha variant correct, no aliasing, two renders identical.
- **LIC**: sound logo and fonts in `assets.lock.json`.

## Sources

- https://github.com/nolangz/pixel2motion · https://github.com/svg/svgo · https://github.com/veltman/flubber
- https://github.com/krisyangdev/motionboard (Ending recipes) · https://github.com/shadcn-labs/snapcn
