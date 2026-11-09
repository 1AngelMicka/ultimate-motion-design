# Recipe — Social short (9:16 Shorts, Reels, TikTok)

A 15–60 s vertical video that must stop the scroll in the first 1–2 s, read with sound off, and survive the platform's overlay UI. Route: [../routes/html-video.md](../routes/html-video.md) (fast), [../routes/director.md](../routes/director.md) for narrated faceless formats.

## Use when / avoid when

- Use for vertical teasers, tips, cut-downs of a longer film, product moments, text-driven shorts.
- Avoid cropping a 16:9 master: re-lay out for 9:16 (same scenes, new composition).

## Setup

- Canvas 1080×1920, 30 fps (60 for fast UI motion), H.264, AAC 48 kHz.
- Word-timed captions are mandatory: [../audio/captions.md](../audio/captions.md) (`umd captions words.json --out subs.ass --style pop`). Licence-free caption components: HyperFrames captions; Remotion options (`remotion-dev/template-tiktok`, `neutral-Stage/remotion-captioneer`, MIT code) carry ⚠️ the Remotion licence (free up to 3 employees, paid above).
- Inspiration: `social-media-skills/remotion-shorts-skill` (topic or changelog → kinetic-type short, MIT, Remotion).

## Core patterns

### Hook in the first 1–2 s

- Frame 0 already shows the subject in motion: no logo, no black, no fade-in.
- The hook is visual + text: the promise or the question in ≤ 7 words, on screen before 0.5 s.
- Patterns: the end result first, a surprising number, a before/after split, a direct question, a pattern interrupt (unexpected object or cut).
- The first cut lands by 1.5–2 s.

### Beat structure (30 s)

| Time | Beat | Intent |
| --- | --- | --- |
| 0–2 s | Hook | Stop the scroll |
| 2–6 s | Setup | Why the viewer should care, one line |
| 6–24 s | 3–4 payoffs, 4–6 s each | Each beat delivers something (tip, feature, step); new visual every ~2 s |
| 24–28 s | Peak | Best moment saved for last |
| 28–30 s | CTA / loop point | Follow, link, or a last frame that cuts cleanly back to frame 0 |

### Safe zones (1080×1920, conventions to check against current app overlays)

| Zone | Keep clear of text and key action |
| --- | --- |
| Top | ~220 px (status bar, account name, search) |
| Bottom | ~420 px (caption, username, music line, progress) |
| Right | ~140 px (like, comment, share column) |
| Left | ~60 px |

Captions sit in the lower-middle third, above the bottom zone (≈ y 1150–1450). Subject and faces in the centre column.

### Shot list template

```
| id | start–end | on screen | caption words | text overlay (≤ 7 words) | motion | sfx | intent |
| h01 | 0.0–1.6 | result screen, push-in | "This took me 4 seconds" | 4 SECONDS | punch zoom 1.0→1.08 | whoosh | curiosity |
```

### Motion vocabulary

- Punch zooms (1.0 → 1.08 in 4–6 frames) on cuts to emphasis, not on every cut.
- Jump cuts on the beat; whip or slide transitions only between sections.
- Captions: 1–3 words at a time, the spoken word highlighted, pop-in 80–120 ms.
- Progress cue for lists ("2/4") so viewers stay.

### Durations

| Platform use | Length |
| --- | --- |
| Teaser / loop | 7–15 s |
| Tip or feature | 20–35 s |
| Story or tutorial | 45–60 s |

Shorter wins when in doubt: cut every beat that does not pay off.

### Do / don't

- Do design for sound off first, then add music and SFX for sound on.
- Do make the last frame loop back to the first when the format allows.
- Don't put text in the bottom 420 px or the right button column.
- Don't use more than 2 fonts or caption styles that change every scene.

## Rendering to video with umd

```json
{ "capture": { "entry": "short/index.html", "fps": 30, "duration": 30 } }
```

Size the page 1080×1920 and capture with `--width 1080 --height 1920`. Normalise to −14 LUFS (`umd normalize in.wav out.wav --lufs -14`).

## Pitfalls

| Breaks | Fix |
| --- | --- |
| Hook arrives at 3 s after an intro | Delete the intro; start on the best frame |
| Captions under the platform UI | Respect the safe-zone table; preview with an overlay mock |
| Captions out of sync | Forced alignment on the known script; `umd captions-check` ≤ 100 ms |
| 16:9 master cropped, subject cut off | Re-compose each scene for 9:16 |
| Fast cuts with flashing colour | ≤ 3 flashes per second (SAF) |

## Checks

- **NAR / TIM**: hook ≤ 2 s, something new every ~2 s, 15–60 s total.
- **CAP**: every word covered, ≤ 2 lines, ≤ 17 chars/s, brand spelled right.
- **ART**: safe zones respected on the contact sheet.
- **SAF**: flash count from `umd analyze`.
- **AUD**: −14 LUFS, true peak ≤ −1 dBTP.

## Sources

- https://github.com/remotion-dev/template-tiktok · https://github.com/neutral-Stage/remotion-captioneer · https://github.com/social-media-skills/remotion-shorts-skill
- Profile `social` and thresholds: plugins/umd/referential/scoring.json
