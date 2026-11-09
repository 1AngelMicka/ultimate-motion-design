# Recipe — Product demo video

Shows how a product is used: a task from start to result, cursor-led, with zooms on what matters. Two ways to get the pixels: **recode the UI** as animation, or **film the real app** with Playwright. Route: [../routes/html-video.md](../routes/html-video.md).

## Use when / avoid when

- Use for onboarding videos, feature walkthroughs, changelog clips, sales demos, docs embeds.
- Avoid for brand launches with no workflow to show (→ [launch-video.md](launch-video.md)).

## Setup — choose the capture path

| | Recode the UI | Film the real app |
| --- | --- | --- |
| Pick when | Polished marketing look, idealised data, UI not finished, any aspect ratio | Truthful demo, docs, frequent re-recording after releases |
| Tools | HTML/CSS rebuild + GSAP; snapcn (Remotion components: `phone-frame`, `laptop-frame`, `terminal-simulator`, `answer-stream`, `search-typing`, `prompt-zoom`) | `@argo-video/cli` (MIT): Playwright script + scenes manifest + TTS → MP4; `demo-machine` (MIT): `.demo.yaml` spec → cursor, typing, zoom framing, MP4 |
| Install | `npx shadcn@latest add @snapcn/laptop-frame` (needs a Remotion project with `components.json` and the `@/` alias) | `npm i -D @argo-video/cli` then `npx argo init`; demo-machine: see its CLI reference |
| Licence | snapcn MIT but ⚠️ runs on Remotion: free up to 3 employees, paid company licence above | MIT; local Kokoro TTS is Apache-2.0; check cloud TTS terms before commercial use |

Licence-free alternative to snapcn: rebuild device frames in plain HTML/CSS and capture with `umd capture`. Hybrid (often best): film the real app with Playwright, then add zooms, cursor and captions in an HTML timeline.

## Core patterns

### Beat structure (45 s)

| Time | Beat | Intent |
| --- | --- | --- |
| 0–3 s | Result first | Show the finished outcome, then "here's how" |
| 3–8 s | Starting point | The empty or messy state, in context (device frame or full UI) |
| 8–35 s | 3–5 steps | One action per step: cursor moves, zoom in, action lands, zoom out |
| 35–42 s | Result | The outcome again, with the value stated (time saved, number) |
| 42–45 s | CTA | Product name + URL or next step, held |

### Shot list template

```
| id | start–end | screen/state | cursor target | action | zoom (scale, focus) | caption (≤ 7 words) | voice line |
| d04 | 12.0–16.5 | Settings › Billing | #plan-pro | click | 1.8×, plan card | Switch plans in one click | "Upgrade without leaving the page." |
```

### Cursor choreography

- Cursor arrives 4–8 frames before the click, eases in (no linear glides), slight overshoot at most.
- Click feedback: press-scale 0.92 → 1, ripple, and the UI reacts on the same frame.
- Typing at human uneven speed, 8–14 chars/s; never paste a full string in one frame.
- Oversized cursor (1.5–2× native) for video; hide it when nothing is being pointed at.

### Zooms

- Push to the target in 0.4–0.8 s, hold for the action, pull back before the next step (motionboard "Auto Zoom").
- Zoom 1.5–2.5×; above that, re-render the UI at higher resolution instead of scaling pixels.
- Never zoom and pan in two directions at once; one camera move per step.

### Durations per format

| Format | Length | Ratio |
| --- | --- | --- |
| Feature clip / changelog | 15–30 s | 16:9 or 1:1 |
| Walkthrough | 45–90 s | 16:9 |
| Social demo | 20–40 s | 9:16 re-laid out ([social-short.md](social-short.md)) |
| Docs embed GIF | 5–12 s loop | `umd capture loop.html --out loop.gif --format gif` |

### Do / don't

- Do use realistic, consistent demo data (names, numbers) and a clean account: no personal data, no notifications.
- Do hide scrollbars, dev banners and cookie popups in the recording.
- Don't record at 1× DPR then zoom: capture at 2× or recode.
- Don't let the voice describe what the viewer already sees; say why it matters.

## Rendering to video with umd

```json
{ "command": "npx argo pipeline onboarding", "output": "videos/onboarding.mp4" }
{ "capture": { "entry": "demo/index.html", "fps": 30, "duration": 45 } }
{ "command": "npx remotion render src/index.ts Demo out/demo.mp4", "output": "out/demo.mp4" }
```

Check argo's `outputDir` in its config (default `videos`).

## Pitfalls

| Breaks | Fix |
| --- | --- |
| Real-app recording with network jitter, spinners | Seed data locally, wait for network idle, mock slow calls |
| Zoom on low-res pixels looks soft | Higher device scale factor or recode the panel |
| Cursor and UI out of sync after re-recording | Drive both from one script (argo marks, demo-machine spec) |
| Captions cover the clicked element | Captions in a fixed safe band; move them when the target is there |
| Demo runs too fast to follow | ≥ 1.5 s hold after each result; one step per beat |

## Checks

- **NAR**: result shown first and last; one action per beat.
- **TXT**: captions readable, never covering the action.
- **MOT**: cursor eased, zooms 0.4–0.8 s, one camera move at a time.
- **REN**: sharp UI at zoom; output size matches the brief.
- **LIC**: snapcn/Remotion licence fits; demo data is fictional.

## Sources

- https://github.com/shadcn-labs/snapcn (README component list, install) · https://github.com/shreyaskarnik/argo (`@argo-video/cli`) · https://github.com/45ck/demo-machine
- https://github.com/krisyangdev/motionboard (Auto Zoom recipe) · research_notes/…/programmatic_video.md (two demo paths)
