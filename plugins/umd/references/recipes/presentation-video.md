# Recipe — Presentation video (company, product, project)

A 1–3 min narrated video built from a deck or a script: a voice leads, each slide becomes a designed scene with purposeful motion, captions on. Route: [../routes/html-video.md](../routes/html-video.md); voice from [../audio/voice.md](../audio/voice.md).

## Use when / avoid when

- Use for company intros, investor or project overviews, internal announcements, conference talk trailers, turning an existing deck into a video.
- Avoid when the content is a single product launch (→ [launch-video.md](launch-video.md)) or teaches a mechanism (→ [explainer-video.md](explainer-video.md)).

## Setup

| Source | Path |
| --- | --- |
| Existing PowerPoint | `zarazhangrui/frontend-slides` (MIT, Claude Code plugin) converts PPTX to one HTML file per deck; or extract text and images and rebuild |
| Script only | Write scenes directly as HTML sections (default) |
| Markdown deck | Slidev (`@slidev/cli`, MIT) or reveal.js (MIT): design the slides there, then rebuild timed scenes for video |

Install frontend-slides as a plugin (`/plugin marketplace add https://github.com/zarazhangrui/frontend-slides`, then `/plugin install frontend-slides@frontend-slides`) only if the user wants it; its single-file HTML output is directly capturable.

Slides are click-driven; video is time-driven. Do not screen-record a slideshow. Convert each slide into a scene whose builds are placed on the voice's word timestamps, inside one paused timeline exposed as `window.umdRender(t)`. reveal.js `autoSlide` or Slidev clicks are not frame-accurate: keep them for live talks.

## Core patterns

### Beat structure (90 s)

| Time | Beat | Intent |
| --- | --- | --- |
| 0–5 s | Hook | One bold claim or number, no logo intro |
| 5–20 s | Context | Who it is for, the problem in one image |
| 20–65 s | 3 pillars × 15 s | One idea per scene: headline (≤ 7 words) + one visual + one motion |
| 65–80 s | Proof | Numbers counting up, customer or partner marks, a quote |
| 80–90 s | Close | Name, URL or contact, held ≥ 3 s |

Rule of thumb: one scene per 8–15 s of voice; ~150 spoken words per minute.

### Shot list template

```
| id | start–end | slide source | headline | visual | build order | motion (token) | voice line | intent |
| p03 | 20.0–34.5 | slide 4 | Built for small teams | team grid | title → grid → highlight | stagger-in base | "…" | reassurance |
```

### Motion vocabulary

- **Builds, not transitions**: elements arrive in reading order as the voice names them; scene changes are simple (cut on a beat, short cross-fade, or a shared element that carries over).
- **Continuity**: a recurring brand shape or colour block moves between scenes (match-cut) instead of page flips.
- **Numbers count** ([data-story.md](data-story.md)); **quotes type or reveal by line** ([kinetic-typography.md](kinetic-typography.md)).
- **Ken Burns on photos**: 3–6 % scale over the scene, never more.
- No 3D cube flips, no PowerPoint-style fly-ins, no bouncing bullet points.

### Durations per format

| Format | Length | Notes |
| --- | --- | --- |
| Company intro | 60–120 s | Voice + music bed, captions burned in |
| Investor / project overview | 2–3 min | Chapters every ~30 s |
| Event trailer | 20–40 s | Music-led, little or no voice |
| Social cut-down | 15–30 s | 9:16 re-layout ([social-short.md](social-short.md)) |

### Do / don't

- Do cut text by half when moving from slide to video: the voice carries the detail.
- Do keep one layout grid for all scenes; vary composition, not margins.
- Don't put a full slide of bullets on screen while the voice reads it.
- Don't run music at the same level as the voice: duck it ([../audio/mix.md](../audio/mix.md)).

## Rendering to video with umd

```json
{ "capture": { "entry": "presentation/index.html", "fps": 30, "duration": 90 } }
```

Build the mix first (`umd mix --voice voice.wav --music music.wav --out audio/mix.wav`); for a one-off render with sound use `umd capture presentation/index.html --out out/presentation.mp4 --fps 30 --duration 90 --audio audio/mix.wav`. Captions: `umd captions words.json --out subs.ass --style line`.

## Pitfalls

| Breaks | Fix |
| --- | --- |
| Slides recorded as a screen capture | Rebuild as timed scenes; frame-accurate builds |
| Text-heavy scenes, viewers read instead of listen | ≤ 7-word headline per scene; detail in voice |
| Visual lags the voice | Builds on word timestamps; `umd captions-check` shows offset |
| Same scene template 10 times | Alternate 3–4 compositions: full-bleed image, split, big number, quote |
| Logo animation at the start eats the hook | Logo at the end; open on the claim |

## Checks

- **NAR**: hook in 5 s, one idea per scene, clear close.
- **TXT / CAP**: reading time, contrast; captions cover every word, ≤ 17 chars/s.
- **AUD**: −14 LUFS, voice clear, music ducked.
- **LIF**: variety between scenes; nothing frozen > 1 s.

## Sources

- https://github.com/zarazhangrui/frontend-slides · https://github.com/slidevjs/slidev · https://github.com/hakimel/reveal.js
- research_notes/…/agent_skills_mcp.md (section D, slides)
