# Anti-slop: AI motion and script tells

The patterns that make a video or page read as "made by AI", and what to do instead. Read before storyboarding and before every audit.

## Use when / avoid when

- Use at storyboard (design out the tells), at build (`umd lint`), at audit (MOT, ART, NAR, LIF).
- What makes slop is frequency and uniformity, not a single use. One intentional pulse on a live recording dot is fine; pulses on every badge are not (design-motion-principles heuristic).

## Motion tells

| Tell | Why it reads as AI | Replace with |
| --- | --- | --- |
| Pulsing dots, glowing or breathing CTAs, looping rings | Attention by default, no meaning | Static status; one state-change animation when status changes |
| Blur on every entrance (`filter: blur()` on ≥ 3 components in a view) | Uniform "premium" filter, hurts text first paint | Opacity + short translate; reserve blur for one hero or depth-of-field shot |
| Bouncy springs everywhere, overshoot on menus, toggles, modals | Playful physics on utility actions | Token curves; springs only where something is thrown, dropped or dragged |
| Everything fades up 20 px with the same duration | No hierarchy, no direction | Direction from layout (from the side it relates to), distance and duration from size and role |
| Stagger on every list | Default polish, not a moment | Stagger only one list per view, when order matters |
| Hover-scale on every card (`scale(1.05)` everywhere) | Indiscriminate | Hover changes only on primary actions; use elevation or colour |
| Infinite floating / bobbing elements | Fake life, distracts | Micro-life tied to meaning (breath, light drift ≤ 2 px, convention) or a hold |
| Motion on mount for static content | Animation as decoration | Animate on change, on scroll into meaning, or not at all |
| Spinning 3D logo, lens flare, particle burst outro | Template ending | A sting built from the brand's own shapes; end on a readable hold |
| Same transition between every scene (crossfade or zoom-blur) | No editing intent | Choose per cut: hard cut, match cut, wipe along motion, J/L audio cut |

## Visual tells

| Tell | Replace with |
| --- | --- |
| Purple-to-blue gradient on dark background | Palette from the brief or the brand; if none, derive from one real reference |
| Glassmorphism cards stacked on a blurred gradient | Solid surfaces, real hierarchy, one material |
| Centered hero + three feature cards + CTA template layout | Grid from the content; asymmetric when content is asymmetric (`composition.md`) |
| Emoji as icons | One icon set (Lucide, Tabler via Iconify) at one stroke weight (`assets.md`) |
| Generic stock 3D (glossy blobs, floating spheres, isometric laptops) | Product UI recreated in code, real photos with licence, or 3D built for the brief |
| Inter/system font everywhere, 4+ fonts | 1–2 families from the brief (`fonts_max` = 2) |
| Neon glow on every text | Contrast from colour and size; glow only on one hero word if the style asks |

## Script tells (ban list for voice-over, captions and on-screen text)

English: "Let's dive in", "In today's fast-paced world", "game-changer", "unlock the power of", "seamless", "revolutionize", "elevate your", "It's not just X, it's Y", "Here's the thing", "delve", "testament to", "landscape", "harness", "supercharge", "Say goodbye to … say hello to …", rhetorical "Imagine a world where…", closing "The future is here."

French: « Dans un monde où… », « Plongeons dans… », « Il est important de noter que », « Ce n'est pas seulement X, c'est Y », « révolutionner », « booster », « sublimer », « véritable game-changer », « Dites adieu à… et bonjour à… », « Imaginez un monde où… », « Que vous soyez … ou … », « Et si on vous disait que… », « Le futur, c'est maintenant. », « en toute simplicité », « fluide et intuitif ».

Rules (from blader/humanizer patterns): state the point instead of staging it; no forced triads; no one-line dramatic closers after each beat; plain verbs (is, has) over "serves as", "boasts"; no borrowed authority ("experts say") without a named source; keep numbers and names from the brief, never invent them. Run `/humanizer` on the script when installed.

## Variety between scenes

- No two consecutive scenes share the same layout, entrance direction and transition (LIF variety, convention).
- Vary shot size and density across the arc: wide establishing → close detail → medium (see `composition.md`).
- Give each beat one distinct motion idea, written in the storyboard line next to its intent.
- Contact sheet test: `umd frames out.mp4 --sheet`; if three thumbnails look interchangeable, redesign one.

## References: describe, never copy

- Describe what you like in a reference in words: shot length, camera position, how elements enter the frame, palette, type scale, rhythm against the music.
- Never ask for, or build, a shot-for-shot copy of someone else's video, a living artist's signature style, or a brand's identity the user does not own.
- Use the description to write the storyboard and tokens; validate stills against your own description (ART).

## Rendering to video with umd

- `umd lint [dir]` reports AI motion tells, slop words, hard-coded durations/easings, `transition: all`, font count.
- `umd still` before animating; `umd frames --sheet` after rendering to judge variety.

## Pitfalls

- Removing every tell leaves a flat piece: replace each one with a purposeful motion, do not just delete.
- Banning words without rewriting the sentence produces broken grammar; rewrite from the fact.
- Over-correcting into brutalist minimalism when the brief asks for playful: the lens depends on the brief (Jhey Tompkins lens for playful, Emil Kowalski for productivity).

## Checks

- MOT: no AI motion tells (`ai_tells_max` = 0 in `umd lint`).
- ART: no AI-look visuals, palette and type from the brief (stills vs brief).
- NAR: script without AI phrasing (`umd lint` slop words, humanizer pass).
- LIF: variety between scenes (contact sheet).

## Sources

- https://github.com/kylezantos/design-motion-principles (references/anti-checklist.md: pulsing indicators, blur-everywhere, hover-scale, stagger-spam, bouncy springs)
- https://github.com/blader/humanizer (26 patterns), https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing
- research_notes/Dépôts motion design pour agents/posts_x_utilisateur.md (variety constraint, describe references in words)
