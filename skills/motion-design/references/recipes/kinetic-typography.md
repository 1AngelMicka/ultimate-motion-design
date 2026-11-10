# Recipe — Kinetic typography

Text is the image: words enter, transform and exit in rhythm with a voice or a track. Works as a video (quotes, lyric-style promos, manifestos, shorts) or on a page (headlines, scroll type). Routes: [../routes/html-video.md](../routes/html-video.md), [../routes/web-page.md](../routes/web-page.md).

## Use when / avoid when

- Use for manifestos, quotes, announcements, titles, text-driven shorts, hero headlines.
- Avoid for dense information (use a voice + visuals) or for body copy on a page.

## Setup

- GSAP `SplitText` (included free in `gsap` 3.13+; splits chars/words/lines, can mask lines) — [../engines/gsap.md](../engines/gsap.md). CSS-only option: split once into spans with an index variable (`--i`), stagger with `calc(var(--i) * 30ms)` ([../engines/css-waapi.md](../engines/css-waapi.md)).
- `opentype.js` (MIT) when glyph outlines are needed (draw-on letters, morphs).
- Corpus to study (MIT): `codrops/TextCharacterAnimations` (19 SplitText effects), `codrops/ScrollTextMotion`, `iart-ai/kinetic-typography-skills`, `social-media-skills/remotion-shorts-skill` (⚠️ Remotion licence: free up to 3 employees, paid above). ⚠️ `lukePeavey/SplitType` has no licence and is inactive: do not copy it.
- Fonts: at most 2 families, local files (Fontsource), variable fonts preferred (weight and width can animate). Rules: [../craft/text-on-screen.md](../craft/text-on-screen.md).

## Core patterns

### Reading time rules (hard limits)

| Rule | Value |
| --- | --- |
| Minimum hold of any readable word group | 1.2 s after it is fully in |
| Reading speed | ≤ 3 words/s on screen (≈ 0.33 s per word), slower for long words or second language |
| Entrance duration | 0.25–0.6 s per group; the word is legible before its motion ends |
| Words on screen at once | 1–7; a full sentence only for the payoff line |
| Line length | ≤ 32 characters per line in video, ≤ 2 lines |

The total duration is set by the copy: count words, divide by 3, add holds and transitions. If it does not fit the brief, cut words, not hold time.

### Beat structure (20 s quote/manifesto)

| Time | Beat | Intent |
| --- | --- | --- |
| 0–2 s | Hook word | One word, huge, fills the frame |
| 2–14 s | Phrases | 3–5 groups, each with its own layout (scale, weight, position change) |
| 14–18 s | Payoff line | The whole sentence, calmer, held |
| 18–20 s | Signature | Brand or author, small |

### Shot list template

```
| id | start–end | text (exact) | split | entrance | emphasis word | exit | layout | sync to |
| k03 | 4.0–6.2 | "Build less." | words | mask-up 0.4 s, stagger 80 ms | less (weight 300→800) | cut | left, 18 % size | voice word 12 |
```

### Motion vocabulary

- **Mask reveal**: lines rise from behind an invisible edge (`overflow: hidden` or SplitText `mask: "lines"`).
- **Weight / width morph** on the emphasis word (variable font axes), not colour flashing.
- **Scale cut**: the next group appears at a different scale and position on the beat (no tween between groups).
- **Typewriter** only for code, terminals or "thinking" moments, at uneven human speed.
- **Stagger**: 20–40 ms per character, 60–120 ms per word; chars only for short words.
- **Kerning-safe**: animate words or lines when the font has tight kerning; per-char splits break ligatures.

### Durations per format

| Format | Length |
| --- | --- |
| Social text short | 10–30 s, 9:16 ([social-short.md](social-short.md)) |
| Title card / chapter | 2–4 s |
| Lyric or manifesto video | 30–90 s |
| Web headline entrance | 0.6–1.2 s total, once |

### Do / don't

- Do sync each group to a voice word or a beat; never to arbitrary times.
- Do keep one baseline grid; motion changes scale and position, the grid stays.
- Don't blur every entrance, don't rotate letters for no reason, don't bounce each character.
- Don't animate text the user must read on a web page after it has appeared (no looping headline).

## Rendering to video with umd

Capture block from [../routes/html-video.md](../routes/html-video.md). Call `document.fonts.ready` before splitting; split once, outside `umdRender`. On the web, run SplitText only under `prefers-reduced-motion: no-preference` and keep the unsplit text for screen readers.

## Pitfalls

| Breaks | Fix |
| --- | --- |
| Split before the font loads: wrong line breaks | Split after `document.fonts.ready`; re-split on resize (web) |
| Text too fast to read | Apply the table above; `umd lint` and audit TXT check hold times |
| Low contrast over a moving background | Solid or blurred plate behind text; check contrast per frame |
| Screen readers read letters one by one | Keep `aria-label` on the parent or let SplitText handle aria |
| Every group uses the same entrance | 3–4 entrance types per piece, chosen by meaning |

## Checks

- **TXT**: hold ≥ 1.2 s, ≤ 3 words/s, minimum size, no clipping, contrast.
- **TIM**: groups on beats or voice words.
- **MOT**: durations and staggers from tokens; no AI motion tells.
- **WEB**: reduced motion honoured for page headlines.

## Sources

- https://gsap.com/docs/v3/Plugins/SplitText/ · https://github.com/codrops/TextCharacterAnimations · https://github.com/opentypejs/opentype.js
- https://github.com/iart-ai/kinetic-typography-skills · https://github.com/social-media-skills/remotion-shorts-skill
- Thresholds: plugins/umd/referential/scoring.json (`text_min_s`, `text_words_per_s`)
