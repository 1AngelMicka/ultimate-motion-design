# Text on screen

Titles, callouts, kinetic type and captions that can actually be read at the size and speed people watch: on a phone, often muted, often once.

## Use when / avoid when

- Use for every card, lower third, label, number and kinetic-type sequence.
- Avoid putting the voice-over script on screen word for word as titles; captions do that. Titles carry the key idea in fewer words.

## How long text stays on screen

Hold time after the text is fully visible (umd thresholds in `referential/scoring.json`):

```
hold_s = max(text_min_s, words / text_words_per_s)      # defaults: text_min_s = 1.2, text_words_per_s = 3
total_s = entrance_s + hold_s + 0.3                       # + 0.3 s eye-travel margin (convention)
```

| Words on card | Minimum hold | Note |
| --- | --- | --- |
| 1–3 | 1.2 s | logos, single numbers, labels |
| 6 | 2.0 s | short headline |
| 12 | 4.0 s | upper limit for one card |
| > 12 | split into two cards | or move it to the voice |

- 3 words/s ≈ 180 words/min; it is a convention, conservative against the 17–20 characters/s Netflix allows for subtitles (adult English 20, children 17).
- Numbers and names take longer to read than common words: add 0.5 s per figure group ("€2.4M", "37 %"), convention.
- Text read while it is still moving does not count: start the hold when the motion settles.
- Muted social viewing: if the idea only exists in the voice, it does not exist (NAR "works with sound off").

## Size

Minimum sizes (conventions, check on a phone-size still; these are not platform rules):

| Frame | Body / labels | Captions | Headlines |
| --- | --- | --- | --- |
| 1920×1080 landscape | ≥ 40 px (≈ 3.7 % of height) | 48–60 px | ≥ 72 px |
| 1080×1920 vertical | ≥ 48 px (≈ 4.4 % of width) | 56–72 px | ≥ 96 px |
| 1080×1080 square | ≥ 44 px | 52–64 px | ≥ 80 px |
| Web hero video behind HTML text | text lives in HTML, not in the video | n/a | n/a |

- px means the font size (em box) at native resolution. Thin weights (≤ 300) need +20 % (convention).
- Test: `umd still … --width 1080 --height 1920`, then view the PNG at 360 px wide (a phone). If you squint, it fails.

## Words per card

- Headline: 3–7 words. Supporting line: ≤ 12 words. One idea per card (NAR).
- Lists on screen: ≤ 3 items visible at once; reveal in reading order.
- Max two lines for captions (`caption_lines_max`), ≤ 42 characters per line for subtitles, ≤ 32 for social caption styles (`audio/captions.md`).

## Contrast over moving backgrounds

- Target WCAG 2.x contrast: 4.5:1 for body text, 3:1 for large text (≥ 24 px regular or ≥ 18.66 px bold at 1x CSS; in video treat headlines as large). Measure against the worst frame under the text, not the average.
- Techniques, from least to most visible:
  1. Place text over calm areas (sky, wall, blurred depth plane), chosen at storyboard time.
  2. Local scrim: gradient from 0 to 50–70 % black behind the text block (convention).
  3. Text shadow or outline: 2–4 px dark stroke at 1080p, or soft shadow 0 2 8 rgba(0,0,0,.6) (convention).
  4. Solid or 60–80 % opacity box (captions, lower thirds).
- Never put text on a bright, high-frequency moving texture (foliage, water, confetti) without a box.
- Check with `umd frames out.mp4 --at …` on the busiest frame of each text card; measure with a contrast tool (color.js).

## Kinetic type readability

- Reveal in reading order (left→right, top→bottom for Latin scripts); never reveal the end of a sentence before its start.
- Each word or chunk visible ≥ 0.3 s before the next replaces it (convention); a word-by-word "pop" faster than speech is unreadable.
- Animate entrances, then hold still: no scale, rotate, wobble or float on text while it is being read.
- One emphasis device per line (colour or weight or scale), not all three.
- Line breaks by meaning ("Ship faster / with fewer bugs"), not by width.
- Letter-by-letter animation only for short words (≤ 2 per card); it slows reading.
- Avoid text flashing or strobing (SAF: ≤ 3 flashes/s).
- Keep text inside graphics-safe and away from platform overlays (`composition.md`).

## Rendering to video with umd

- Fonts local (Fontsource or project `fonts/`), loaded before capture; `umd capture` waits for fonts.
- `umd still` at the first fully-settled frame of each card; `umd analyze` reports how long each segment holds.
- `umd lint` counts font families (`fonts_max` = 2).

## Pitfalls

- Text animated in, then immediately animated out: viewers see motion, not words.
- Long sentences on a single kinetic card to "match the voice": split, or let captions carry it.
- Light grey on white, white on pastel gradients: fails contrast on most phones outdoors.
- Text near edges on 9:16 hidden by platform UI; text in the bottom 35 %.
- Captions and on-screen titles on the same band at the same time: overlap (TXT).

## Checks

- TXT: long enough to read, contrast over moving backgrounds, no overlap or clipping, minimum size (`umd still`, `umd frames`, `umd analyze`).
- SAF: no flashing text.
- NAR: the story works with sound off.

## Sources

- WCAG 2.2, Success Criterion 1.4.3 Contrast (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- WCAG 2.2, 2.3.1 Three Flashes or Below Threshold: https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html
- Netflix English Timed Text Style Guide: https://partnerhelp.netflixstudios.com/hc/en-us/articles/217350977
- https://github.com/color-js/color.js, https://github.com/fontsource/fontsource

## Copy that a stranger understands

- Launch film: by 3 s a line says what the product is in plain words ("[Name] turns [input] into [output]"); then one concrete thing per line, with a verb, while the picture shows it; close on the name and the next action.
- On screen, one line at a time, 2 to 7 words, one claim, no metaphor ("second brain", "superpower"), no slogan shape ("Meet X", "X, reimagined", "Less X. More Y."). `umd lint` flags the hollow words (NAR-05).
- Narration: at most about 22 words per line, numbers written as words, and never the same sentence typed on screen and spoken word for word.
(After Leonxlnx/cinetic's copy check and Moh4696/cinematic-skill's narration rules, both MIT.)

## Typography finish (ART-07)

- Display sizes (above about 72 px at 1080p): tighten tracking by 1 to 3 %; body text keeps the font's default.
- Break lines by meaning, never mid-phrase; no single-word last line (widow) in a title.
- One emphasis device per line: weight, colour or motion, not all three.
- Hang punctuation and quotes outside the text block so the left edge stays optically straight.
- Variable fonts: animate an axis (weight, width) for emphasis rather than scaling the whole line.
- Check the rendered frame, not the CSS: `document.fonts.check()` true for every family, no fallback font in the still.
