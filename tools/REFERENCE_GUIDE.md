# Writing reference files for Ultimate Motion Design

Reference files live in `plugins/umd/references/`. Claude reads them **on demand**, only when a command or the `motion` skill points to them. They cost nothing until read, and they cost their full length every time they are read. So:

- **English**, dense, imperative. No intro paragraphs, no marketing, no emoji.
- **60 to 140 lines** per file. Tables and short bullet lists over prose.
- Every fact must be true as of November 2026. Never invent an API, flag, package name or CLI option. If you are not sure, verify (GitHub with `gh api`, npm with `npm view <pkg> version`, official docs), or leave it out.
- Package and repo names must match the catalogue (`catalogue_motion_design_claude_codex_2026.md` at the repo root) or be verified.
- Code snippets: short, complete enough to run, and **deterministic** (see below).

## Fixed structure

```
# <Title>

<one line: what it is and when to pick it>

## Use when / avoid when
## Setup            (exact install commands, versions that matter, licence line)
## Core patterns    (the 3 to 8 things that produce high-quality results, with short snippets)
## Rendering to video with umd   (engines and routes only: how to get a deterministic MP4)
## Pitfalls         (what breaks quality or determinism, and the fix)
## Checks           (which referential criteria this file helps pass, by ID, and how to prove them)
## Sources          (links to the repos and docs used)
```

Drop a section that has nothing useful to say, never pad.

## The umd CLI (what references may tell Claude to run)

`umd` means `node "${CLAUDE_PLUGIN_ROOT}/scripts/umd.mjs"`.

| Command | What it does |
| --- | --- |
| `umd doctor [--fix]` | Checks Node, FFmpeg (filters), Playwright + Chromium, optional tools for the project's route; prints or runs install commands. |
| `umd capture <file.html\|url> --out <file> [--fps 30] [--duration s] [--width 1920 --height 1080] [--from s] [--draft] [--transparent] [--audio file] [--format mp4\|webm\|mov\|gif]` | Deterministic HTML→video. Virtualises `Date.now`, `performance.now`, `requestAnimationFrame`, timers and `Math.random` (seeded); pauses and seeks every CSS/WAAPI animation and `<video>` each frame; GSAP and any rAF-driven library advance on virtual time. If the page defines `window.umdRender(t)` (t in seconds, may return a promise), it is called each frame instead. `window.umdDuration` (seconds) sets the length. Waits for fonts and images. |
| `umd still <file\|url> --at 0,1.5,3 [--out dir]` | Key stills at given times, to validate the look before animating. |
| `umd render [--draft]` | Runs the project's render (from `.motion/project.json`), then `analyze`. Output in `.motion/renders/<id>/`. |
| `umd analyze <video>` | Probe, scene cuts, frozen segments, motion timeline, black frames, flash count, loudness, contact sheet. Compact JSON. |
| `umd frames <video> --at 1,2.5 \| --every 2 \| --sheet` | Extract frames or a contact sheet. |
| `umd compare <a> <b>` | Frame-hash equality and SSIM (determinism, regressions). |
| `umd vmaf <encode> <master>` | Encode quality (VMAF, falls back to SSIM/PSNR). |
| `umd loudness <file>` / `umd normalize <in> <out> [--lufs -14] [--tp -1]` | EBU R128 measure / two-pass loudness normalisation. |
| `umd mix --voice v.wav --music m.wav [--sfx a.wav@1.2] --out mix.wav [--duck 9]` | Voice + music with sidechain ducking, SFX at timestamps, normalised. |
| `umd captions <words.json> --out subs.ass [--style karaoke\|pop\|line] [--max-chars 32]` | Word-timed captions from forced alignment or ASR word timestamps. `umd captions-check <subs> <words.json>` checks coverage, offset, reading speed. |
| `umd lint [dir]` | Motion lint: hard-coded durations/easings, AI motion tells, layout-property animation, `transition: all`, reduced-motion support, font count, slop words, engine determinism rules. |
| `umd licenses` | Dependencies, `.motion/assets.lock.json` and declared models against the licence registry and the project policy. |
| `umd webperf <url>` | Dropped frames, CLS and reduced-motion behaviour of an animated page (Playwright). |
| `umd tokens` | Token use per `/umd:*` command, read from the session transcripts. |
| `umd deliver` | Copies the render to `deliverables/` only when the last audit has no open blocker. |

## Referential criteria codes (for the Checks section)

| Code | Domain |
| --- | --- |
| NAR | Brief and narrative (goal, arc, hook, beats with one intent, works with sound off, script without AI phrasing) |
| TIM | Rhythm and timing (no dead air > 3 s, something new about every 2 s, duration fits brief and platform, holds long enough) |
| LIF | Life and density (nothing fully frozen > 1 s even on the last shot, variety between scenes, eyes lead body by 6–10 frames, overlapping action) |
| ART | Art direction (stills validated against the reference before animating, palette and type from the brief, no AI-look visuals, safe areas, sharp assets) |
| MOT | Easing and choreography (durations/easings from motion tokens, no AI motion tells, every motion has a purpose, easing matches physics, one focal motion at a time, only transform/opacity on the web) |
| TXT | On-screen text (long enough to read, contrast over moving backgrounds, no overlap or clipping, minimum size) |
| SAF | Motion safety (max 3 flashes per second, vestibular-safe) |
| WEB | Animated web pages (prefers-reduced-motion, no dropped frames, no CLS from animation, responsive interactions, no scroll-jacking) |
| AUD | Audio (−14 LUFS ±1 and true peak ≤ −1 dBTP by default, ducking under voice, SFX land 0–1 frame after the image, no clipping or abrupt start/end, clear voice, 48 kHz) |
| CAP | Captions (cover every word, offset ≤ 100 ms, max 2 lines, reading speed ≤ 17 chars/s, exact brand spelling) |
| REN | Render and encoding (two renders identical, output matches the brief spec, VMAF ≥ 93 vs master, local fonts and assets, no stray black frames, no banding or aliasing) |
| LIC | Licences (no non-commercial, Tencent-in-EU, embedded AGPL or unlicensed asset/model in a commercial piece, Remotion licence fits the team, every asset in assets.lock.json, attributions) |

## Licence rules every reference must respect

- Recommend permissive options first (MIT, Apache-2.0, BSD, MPL-2.0, CC0, OFL for fonts).
- Mark non-commercial weights, AGPL, GPL (when redistributed), Commons Clause, Tencent (not valid in the EU, UK, South Korea) and "no licence" explicitly, with a `⚠️` and one line on the consequence.
- Remotion: free for individuals, non-profits and companies up to 3 employees; paid company licence above. Say so wherever Remotion is suggested.
