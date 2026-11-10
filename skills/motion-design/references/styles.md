# Styles, prompts and references: start from proven work

The films people share as "agency level" rarely start from a blank page. They start from a **proven style prompt** (a look with named signature features, materials, colour logic and motion rules), get adapted to the brief, then iterate on stills and on a jury-style critique. This file tells you how to do that with umd.

## Use when / avoid when

- Use at kickoff and storyboard, before any layout: pick a style or a reference, then write the beats in it.
- Use again when a critique says "generic", "template", "AI look": switch to a stronger style rather than polishing a weak one.
- Avoid copying a creator's film or a site's look 1:1; reuse the **grammar** (signature features, techniques, rhythm), never the characters, layouts, typefaces or music of a real work.

## Setup

Nothing to install. `umd styles` searches a local index of 1 323 entries (no tokens, no network). Every entry is tagged with the same facets the library page filters on:

- **project type**, the 8 kinds of piece the plugin makes: promo, presentation, explainer, social (vertical short), logo, film (animated short), web (animated page), 3d (3D shot);
- **mood** (dark, light, playful, premium, retro, minimal, bold, organic, tech, cinematic, calm), **medium** (flat, 3d, drawn, print, photo, ui, dataviz, pixel, shader), **format** (16:9, 9:16, 1:1), **tech**;
- **kind**: full style, creator prompt, ready block, component;
- **tier**: 3 reference (curated styles with a reference film), 2 pro (a film or preview clip and a full prompt), 1 inspiration.

| Source | What | Licence |
| --- | --- | --- |
| lemomo-ai/lemo-opuscar (66 styles) | Full style prompts (`STYLE.md`: essence, materials, colour logic, type, motion, sound) with a demo film each; categories: Graphic & Type, Hand-drawn & Painting, Materials & 3D, Information & Keynote, Edit & Documentary, Evidence Films… | Prompts MIT; demo films CC BY 4.0 (credit LemoLab if you reuse a film or still); films you make are yours |
| Vincentwei1021/mg-styles-15 (15 styles) | 10 s motion-graphics prompts with a reference film with sound and a jury score (flat vector, line art, isometric, 3D render, cel boil, collage, liquid, morph, Bauhaus, synthwave, aurora glass, pixel, HUD…) | MIT |
| yihui-dev/awesome-opus5-5-videos (703 prompts) | Prompts creators shared with their films: motion 369, 3D 117, explainer 116, interactive 101 | Index MIT; each prompt belongs to its author: credit the post |
| lemo-opuscar OPUSCAR 98 (98 styles) | One film style per Best Picture winner, 1927 to 2025 (silent tinted, Technicolor, noir, gongbi, rubber-hose, 65 mm epic, 3D…), each with its prompt embedded in the index and a still | Prompts MIT; stills and film CC BY 4.0 (credit LemoLab) |
| heygen-com/hyperframes registry (441 items) | Ready-made blocks and components with a preview clip: logo outros, charts, phone and app mock-ups, captions, transitions, shader backgrounds, text effects. Install one with `npx hyperframes add <name>` | Apache-2.0 (a few MIT or OFL); items ported from transitions.dev are left out |

## Core patterns

1. **Match the brief first**: `umd styles match` reads BRIEF.md and project.json and ranks the whole library for this project (type, format, mood, medium, ambition), with a `why` per pick and the best ready blocks apart. Add words the brief leaves out: `umd styles match verre premium`. This is the rule before any look decision (storyboard step 0). Show the user the first 3 with their `preview` links, or take #1 when `style_choice` is `auto`.
   **Search by hand** when exploring: `umd styles luxe sombre --project promo --tier 2`, `umd styles --project logo --kind block`, `umd styles aquarelle --project film --medium drawn`, `umd styles --format 9:16 --mood bold`. Users can browse and filter everything at https://1angelmicka.github.io/ultimate-motion-design/library/ and come back with an id.
2. **Download only the chosen one**: `umd styles get lemo:dark-keynote` writes `.motion/styles/<id>.md` (1 200 to 7 700 tokens, median about 3 100; read it once, then work from the `## Style card` in BRIEF.md). For a HyperFrames block it writes a short card with its variables and its `install` command.
3. **Adapt, keep the signature**:
   - Keep the style's signature features, materials, colour logic and motion rules; they are what makes it read as premium.
   - Replace the creative seed: story, product, copy, brand colours (inside the style's colour logic), duration, aspect ratio.
   - Record the choice in `BRIEF.md` ("Style: Dark Tech Keynote, lemo-opuscar, adapted: …") and the credit line from the download.
4. **Translate the style into umd files**: its durations and curves into `.motion/motion-tokens.json`, its type into local fonts (Fontsource, OFL), its palette into CSS variables, its beat rhythm into the storyboard. A style's own technical route (canvas, WebGL, SVG, three.js) usually maps to the `html-video` or `threejs-film` route and renders with `umd capture`.
5. **Stills first**: render 4 to 8 stills in the style, run the critic, fix. A style prompt raises the ceiling; the stills loop is what reaches it.
6. **Raise the bar with the jury**: the critic scores 7 dimensions from 1 to 10 (see `../agents/critic.md`); set `quality_target` in project.json (7 professional, 8 agency, 9 award shortlist) and iterate until every dimension reaches it or 3 rounds are spent.

## Web pages: references before code

For animated sites and landing pages, pick 2 or 3 references before writing a component, and describe in BRIEF.md what you take from each (structure, rhythm, one interaction), never the whole look.

Only free resources are listed: no paid plan, no freemium library whose useful part is locked, no collection whose licence forbids reuse. Galleries are for looking: describe what you take, never copy a site.

| Source | For | Access |
| --- | --- | --- |
| godly.website, land-book.com, landdding.com, recent.design, landing.love, onepagelove.com, lapa.ninja, siteinspire.com, minimal.gallery | Whole landing pages and award sites | Free to browse |
| navbar.gallery, footer.design, cta.gallery | Navbars, footers, calls to action | Free to browse |
| saaspo.com, posts.design, inspora.design, curate.gallery | SaaS sites, launch visuals, inspiration collected from X | Free to browse |
| vibrant.design | Websites, sections and launch videos, each entry with its own link | Free to browse; inspiration only |
| brandguidelines.net | Brand guideline books (logo use, colour, type) | Free to browse |
| reactbits.dev, animata.design, magicui.design | Animated React components with their code | Free, open source; check each component's licence |
| fontshare.com | Fonts under the ITF Free Font License | Free, commercial use allowed; self-host them |
| coolors.co, realtimecolors.com | Palettes; trying colours and fonts on a real page | Free |
| ShaderGradient, Paper Shaders | Moving gradients and shader backgrounds | Open source (`engines/shaders.md`) |

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
- https://github.com/lemomo-ai/lemo-opuscar/tree/main/styleboard (`opuscar98_styles.json`, licence section of the README; read 2026-11-10)
- https://github.com/heygen-com/hyperframes/tree/main/registry (`registry-item.json` of each block and component, LICENSE; read 2026-11-10)
- https://github.com/yihui-dev/awesome-opus5-5-videos (`data/videos.json`; read 2026-11-10)
