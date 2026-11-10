# Styles, prompts and references: start from proven work

The films people share as "agency level" rarely start from a blank page. They start from a **proven style prompt** (a look with named signature features, materials, colour logic and motion rules), get adapted to the brief, then iterate on stills and on a jury-style critique. This file tells you how to do that with umd.

## Use when / avoid when

- Use at kickoff and storyboard, before any layout: pick a style or a reference, then write the beats in it.
- Use again when a critique says "generic", "template", "AI look": switch to a stronger style rather than polishing a weak one.
- Avoid copying a creator's film or a site's look 1:1; reuse the **grammar** (signature features, techniques, rhythm), never the characters, layouts, typefaces or music of a real work.

## Setup

Nothing to install. `umd styles` searches a local index of 784 entries (no tokens, no network):

| Source | What | Licence |
| --- | --- | --- |
| lemomo-ai/lemo-opuscar (66 styles) | Full style prompts (`STYLE.md`: essence, materials, colour logic, type, motion, sound) with a demo film each; categories: Graphic & Type, Hand-drawn & Painting, Materials & 3D, Information & Keynote, Edit & Documentary, Evidence Films… | Prompts MIT; demo films CC BY 4.0 (credit LemoLab if you reuse a film or still); films you make are yours |
| Vincentwei1021/mg-styles-15 (15 styles) | 10 s motion-graphics prompts with a reference film with sound and a jury score (flat vector, line art, isometric, 3D render, cel boil, collage, liquid, morph, Bauhaus, synthwave, aurora glass, pixel, HUD…) | MIT |
| yihui-dev/awesome-opus5-5-videos (703 prompts) | Prompts creators shared with their films: motion 369, 3D 117, explainer 116, interactive 101 | Index MIT; each prompt belongs to its author: credit the post |

## Core patterns

1. **Search by mood, use and medium**, in any language: `umd styles luxe sombre lancement`, `umd styles explainer data`, `umd styles 3d product --kind style`, `umd styles logo --source mg`. Results show id, category, uses, a one-line essence, a `preview` link (the entry on the docs gallery: still or looping video, prompt, credit) and a `film` link. Show the user 3 options with their preview links; let them choose. Users can also browse everything at https://1angelmicka.github.io/ultimate-motion-design/bibliotheque.html and come back with an id.
2. **Download only the chosen one**: `umd styles get lemo:dark-keynote` writes `.motion/styles/<id>.md` (2 000 to 4 000 tokens). Read it once.
3. **Adapt, keep the signature**:
   - Keep the style's signature features, materials, colour logic and motion rules; they are what makes it read as premium.
   - Replace the creative seed: story, product, copy, brand colours (inside the style's colour logic), duration, aspect ratio.
   - Record the choice in `BRIEF.md` ("Style: Dark Tech Keynote, lemo-opuscar, adapted: …") and the credit line from the download.
4. **Translate the style into umd files**: its durations and curves into `.motion/motion-tokens.json`, its type into local fonts (Fontsource, OFL), its palette into CSS variables, its beat rhythm into the storyboard. A style's own technical route (canvas, WebGL, SVG, three.js) usually maps to the `html-video` or `threejs-film` route and renders with `umd capture`.
5. **Stills first**: render 4 to 8 stills in the style, run the critic, fix. A style prompt raises the ceiling; the stills loop is what reaches it.
6. **Raise the bar with the jury**: the critic scores 7 dimensions from 1 to 10 (see `../agents/critic.md`); set `quality_target` in project.json (7 professional, 8 agency, 9 award shortlist) and iterate until every dimension reaches it or 3 rounds are spent.

## Web pages: references before code

For animated sites and landing pages, pick 2 or 3 references before writing a component, and describe in BRIEF.md what you take from each (structure, rhythm, one interaction), never the whole look.

| Source | For | Access |
| --- | --- | --- |
| godly.website, land-book.com, landdding.com, recent.design | Whole landing pages and award sites | Free to browse |
| supahero.io | Hero sections | Free (paid extras) |
| navbar.gallery, footer.design, cta.gallery | Navbars, footers, calls to action | Free to browse |
| styles.refero.design | Design systems of real products as DESIGN.md files (colours, type, spacing, components); a Refero MCP and the `referodesign/refero_skill` plugin fetch them | Free account; describe what you take, never clone a brand |
| saaspo.com, posts.design | SaaS sites; launch posts and visuals from large companies | Free to browse |
| mobbin.com | Real app screens and flows, for product demo shots | Free tier, paid plans |
| inspora.design, curate.gallery | Design inspiration collected from X; curated websites | Free to browse |
| brandguidelines.net | Brand guideline books (logo use, colour, type) | Free to browse |
| backgrounds.supply, horizonx.so | Backgrounds and premium design assets | Check each asset's licence before use; record it in assets.lock.json |
| scrollshaders.com | Animated shader backgrounds in 11 styles | Check the licence before shipping one; open alternatives: Paper Shaders, ShaderGradient (`engines/shaders.md`) |
| 60fps.design | Mobile UI animation | Free (paid extras) |
| scrolltide.co, motionsites.ai | Prompt libraries for 3D and scroll-driven sites, with code | Freemium; full libraries paid (scrolltide lists a $299 lifetime plan, checked 2026-11-10). Check their terms before reusing code in client work |

Then use the `web-page` route, `recipes/hero-section.md`, `recipes/scrollytelling.md`, and `umd webperf` to keep it smooth.

## Pitfalls

- Mixing two styles' signatures in one piece: it reads as neither. One style, adapted.
- Keeping the demo's story or brand names: the seed must be the user's.
- Downloading ten prompts "to compare": read the index lines and previews instead; download one.
- Styles tuned for a specific model: lemo-opuscar states its styles are tuned for Claude Opus 5.5; with another model, expect weaker results and more rounds.
- Treating the jury score as truth: it is a structured critique that orders the fixes. The referential (`/umd:audit`) still decides delivery.

## Checks

- ART-02, ART-03: palette, type and look follow the chosen style; no generic AI look.
- MOT-01..05: the style's motion rules live in the tokens and the choreography.
- LIC-04, LIC-05: credit lines kept (opus prompts, lemo films if reused), references described rather than copied.

## Sources

- https://github.com/lemomo-ai/lemo-opuscar (README, licence section, `styles/*/STYLE.md`, `style.json`; read 2026-11-10)
- https://github.com/Vincentwei1021/mg-styles-15 (README, `prompts/`, `rubric.md`; read 2026-11-10)
- https://github.com/yihui-dev/awesome-opus5-5-videos (`data/videos.json`; read 2026-11-10)
