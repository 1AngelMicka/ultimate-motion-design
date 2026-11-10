# Recipe — Animated hero section

The first viewport of a site: headline, value line, call to action, and one living visual (shader, 3D object, product UI, type reveal) that loads fast and never blocks reading. Route: [../routes/web-page.md](../routes/web-page.md).

## Use when / avoid when

- Use for landing pages, product sites, portfolios, launch pages.
- Avoid a heavy WebGL hero on content sites (docs, blogs) where readers scroll past instantly; a type reveal is enough.

## Setup

| Visual | Tool | Licence | Engine file |
| --- | --- | --- | --- |
| Shader background (mesh gradient, grain, liquid metal) | `@paper-design/shaders` / `@paper-design/shaders-react` (0.0.x, pin the version) | Apache-2.0 | [../engines/shaders.md](../engines/shaders.md) |
| 3D object or scene | three.js (+ R3F/drei in React) | MIT | [../engines/threejs.md](../engines/threejs.md) |
| Interactive vector character or icon | Rive, Lottie | MIT runtimes | [../engines/rive.md](../engines/rive.md), [../engines/lottie.md](../engines/lottie.md) |
| Headline reveal | GSAP SplitText or CSS | GSAP Standard / none | [kinetic-typography.md](kinetic-typography.md) |
| Product UI motion | HTML/CSS rebuild of the UI | — | [product-demo.md](product-demo.md) |

Inspiration: motionboard recipes can be ported to a site hero ("Tilted UI with Depth of Field"), Codrops demos (MIT), `darkroomengineering/satus` (agency starter with Lenis, GSAP, WebGL). ⚠️ `ruucm/shadergradient` and `latentcat/uvcanvas` have no licence: do not copy. ⚠️ LYGIA is non-commercial by default.

## Core patterns

### Load sequence (total ≤ 1.2 s, text first)

| t | What | Rule |
| --- | --- | --- |
| 0 ms | Headline, value line, CTA rendered in HTML, visible | LCP element is text or a static poster, never the canvas |
| 0–600 ms | Headline reveal (lines mask up, 60–90 ms stagger) | Only if text was readable in the static state design |
| 200–900 ms | Visual fades or grows in | Canvas starts after first paint (`requestIdleCallback` or after `load`) |
| 900+ ms | Ambient loop | Slow, low contrast, never competes with the headline |

### Performance budget

| Item | Budget |
| --- | --- |
| JS for the hero visual | ≤ 150 KB gzip (three.js scenes: lazy-load the module) |
| 3D assets | ≤ 1–2 MB, Draco/meshopt-compressed glTF, KTX2 textures |
| Frame time | Smooth ≥ 95 % of frames on a mid-range phone (`umd webperf`) |
| CLS | ≤ 0.1; hero box has fixed dimensions |
| Shader cost | Cap `devicePixelRatio` at 1.5–2; lower resolution on mobile |

### Interaction

- Pointer parallax or tilt ≤ 8–10° or ≤ 20 px, eased (lerp 0.08–0.15 per frame), off on touch and under reduced motion.
- Pause the loop when the hero leaves the viewport (`IntersectionObserver`) or the tab is hidden.
- CTA micro-interaction from [micro-interactions.md](micro-interactions.md).

### Shot list template (one row per layer)

```
| layer | element | enters at | duration | ease token | loop | pointer | reduced-motion state |
| bg | paper mesh gradient | 300 ms | 800 ms fade | ease-out | speed 0.2 | none | static frame |
```

### Do / don't

- Do design the static poster frame first; it is what reduced-motion users, slow devices and crawlers see.
- Do keep headline contrast ≥ 4.5:1 over every frame of the background loop.
- Don't autoplay a loud or fast loop; no strobing gradients (SAF).
- Don't ship the AI default: purple-blue gradient blob, floating glass cards, sparkles ([../craft/anti-slop.md](../craft/anti-slop.md)).

## Rendering to video with umd

Not needed for the site. For a promo clip of the hero, capture the page: `umd capture http://localhost:5173 --out hero.mp4 --duration 8`.

## Pitfalls

| Breaks | Fix |
| --- | --- |
| Blank hero until WebGL loads | Static poster image underneath; fade canvas over it |
| LCP is the canvas | Text is the LCP; canvas lazy |
| Phone overheats, frames drop | Lower DPR, fewer passes, pause off-screen |
| Headline hidden by initial CSS `opacity: 0` | Set hidden state from JS only |
| Reduced motion still runs the shader | Render one frame and stop |

## Checks

- **WEB**: `umd webperf <url>` (smooth frames, CLS, reduced motion); no scroll-jacking.
- **TXT**: headline contrast over the moving background, readable at load.
- **SAF**: no flashing; parallax off under reduced motion.
- **ART**: static frame matches the reference before motion.
- **LIC**: shader and 3D assets licensed.

## Sources

- https://github.com/paper-design/shaders · https://github.com/mrdoob/three.js · https://github.com/darkroomengineering/satus · https://github.com/krisyangdev/motionboard
- research_notes/…/3d_shaders_generative.md (shader presets, licences)
