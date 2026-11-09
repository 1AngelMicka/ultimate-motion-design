# Recipe — Product launch film

A 20–60 s film in the Apple/Linear register: the product's own interface becomes the hero, cut to music, every state change driven by a cursor or a morph. Default route: [../routes/html-video.md](../routes/html-video.md).

## Use when / avoid when

- Use for a launch, a major release, a feature announcement, a site hero video.
- Avoid when the viewer must learn a workflow (→ [product-demo.md](product-demo.md)) or understand a concept (→ [explainer-video.md](explainer-video.md)).

## Setup

- Route R1; engine HyperFrames or plain HTML + `umd capture` (licence-free), Remotion if the team fits its licence (⚠️ free up to 3 employees, paid company licence above).
- Music first: a ~120 BPM licensed track, beat grid measured before any animation ([../audio/music-sfx.md](../audio/music-sfx.md)).
- Inspiration, MIT: `AbubakrChan/product-launch-motion` (rules below, music-first, closed-form springs, Playwright subframes + FFmpeg motion blur), `krisyangdev/motionboard` (38 shot recipes from Apple/Linear films, rebuilt in HyperFrames). Install either with `npx skills add <owner>/<repo>` if the user wants the skill itself; this file only borrows their structure.

## Core patterns

### Beat structure (30 s at 120 BPM: 1 bar = 2 s)

| Time | Beat | Intent | Typical shot (motionboard name) |
| --- | --- | --- | --- |
| 0–2 s | Hook | Curiosity: one striking state | Light Reveal, Macro Pull-out Reveal, Rhythmic Typing |
| 2–8 s | Problem or promise | "This is hard today" or the one-line promise | Word-by-Word Highlight, Pile-up and Clear |
| 8–22 s | 3 features, one per 4–5 s | Each feature = one UI state change, shown not told | Auto Zoom, Morph Relay, Control-Driven Change, Tilted UI with Depth of Field |
| 22–26 s | Proof | Real numbers, logos on the beat | Odometer, logo slam one per beat |
| 26–30 s | Lockup | Name + call to action, held | Converge to Mark, Mark-to-Wordmark Unfold, Rotate to Lockup |

Scale: 15 s = hook + 1 feature + lockup; 60 s = 5–6 features, or a mid-film drop on the music.

### Shot list template (`storyboard.md`)

```
| id | start–end | beat | shot recipe | on screen | camera | cursor action | sfx on beat | intent |
| s01 | 0.0–2.0 | hook | light-reveal | product UI from black | slow push 3% | — | swell | curiosity |
```

### Motion vocabulary (rules from product-launch-motion, adapted)

- **One shape, never cut**: states are the same element morphing size, radius and colour; transitions are morphs, camera pushes, or zooms into an element that becomes the next scene.
- **Content swaps**: old text exits short and early, new text springs in; never overlap two labels.
- **Springs with a tiny overshoot at most**; never bouncy easing everywhere.
- **A cursor drives every change**: press-scale and ripple on click, drags that spring back.
- **The camera frames every state**: an empty frame is a bug; pull back to reveal scale (one email becomes a wall).
- **Real data**: real numbers on odometers, real customer logos (with permission), nothing copied from the website.

### Durations

| Format | Length | Notes |
| --- | --- | --- |
| Site hero loop | 10–20 s | Silent, seamless loop: last frame = first frame |
| Social teaser | 15 s | 9:16 version re-laid out, not cropped ([social-short.md](social-short.md)) |
| Launch film | 30–45 s | Music-cut, 16:9 master |
| Keynote film | 60–90 s | Needs a mid-film change of energy |

### Do / don't

- Do log creative calls as `DECISION:` lines in `storyboard.md` so the user can overturn them in one reply.
- Do land each SFX on the beat and 0–1 frame after the image it underlines.
- Don't use stock "AI" scenes: floating 3D blobs, glowing particles behind a laptop, gradient mesh with no product.
- Don't explain features in paragraphs; one short line per feature, ≤ 6 words.

## Rendering to video with umd

Render 60 fps if the brief asks for "Apple-smooth" motion; otherwise 30. Real motion blur (product-launch-motion's method): capture at 4× the delivery fps, then average groups of 4 frames and decimate, e.g. `umd capture film.html --fps 240 --out sub.mp4` then `ffmpeg -i sub.mp4 -vf "tmix=frames=4,fps=60" -c:v libx264 -crf 16 -pix_fmt yuv420p film.mp4`. Never fake blur with CSS on every move.

## Pitfalls

| Breaks | Fix |
| --- | --- |
| Cuts on guessed times, music feels off | Measure the beat grid first; cut on bars |
| Cursor teleports | Cursor path eased between targets, arrives 4–6 frames before the click |
| Every feature uses the same zoom | Alternate recipes: zoom, morph, split-screen control → result |
| Lockup appears and the film ends | Hold the lockup ≥ 2 s with a slow drift; audio tail fades |
| Logos or numbers invented | Ask for real ones; otherwise leave the proof beat out |

## Checks

- **NAR**: hook within 2 s, one feature per beat, CTA at the end.
- **TIM**: cuts on the beat grid; something new about every 2 s.
- **MOT**: no AI motion tells; springs with small overshoot only; one focal motion.
- **AUD**: SFX 0–1 frame after the image; −14 LUFS; music licence in `assets.lock.json`.
- **ART**: stills vs reference before animating; brand palette and type.

## Sources

- https://github.com/AbubakrChan/product-launch-motion (rules, v2 pipeline) · https://github.com/krisyangdev/motionboard (38 recipes, https://motionboard.app)
- https://github.com/shadcn-labs/snapcn (logo and hero scene components, Remotion)
