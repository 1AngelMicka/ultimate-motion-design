# Diagrams, code and terminal: Mermaid, D2, Excalidraw, Code Hike, VHS, asciinema

Text-first tools that produce structure (diagrams), code steps and terminal sessions an agent can generate reliably, then animate. Pick them for technical explainers, product architecture, dev-tool demos and docs videos.

## Use when / avoid when

| Need | Tool | Licence |
| --- | --- | --- |
| Flowcharts, sequences, state, Gantt from text | Mermaid + mermaid-cli (`mmdc`) | MIT |
| Architecture diagrams with layouts, multi-step boards, hand-drawn or isometric look | D2 | MPL-2.0 |
| Whiteboard, hand-drawn explainer reveal | Excalidraw + excalidraw-animate (Mermaid → Excalidraw via `mermaid-to-excalidraw`) | MIT |
| Code that changes step by step | Code Hike (`codehike`, token transitions) or Shiki Magic Move (⚠️ archived 2026, still usable) | MIT |
| CLI demo typed live | VHS (`.tape` scripts) | MIT |
| Replay of a real terminal session | asciinema (CLI GPL-3.0, use as a tool) + `agg` (GIF, GPL-3.0 tool) or `asciinema-player` (Apache-2.0) | see left |

Avoid them for brand promos (too diagrammatic) and for maths (Manim is better, [manim.md](manim.md)).

## Setup

- Mermaid CLI: `npm i -D @mermaid-js/mermaid-cli` (12.x, bin `mmdc`, uses Puppeteer).
- D2: install the `d2` binary (d2lang.com install script or package manager); `d2 layout` lists layout engines, `d2 themes` lists theme ids.
- Excalidraw: `@excalidraw/excalidraw` (0.18.x) to render scenes; `npm i excalidraw-animate` (0.7.x) or the web app dai-shi.github.io/excalidraw-animate; `@excalidraw/mermaid-to-excalidraw` to convert Mermaid.
- Code Hike: `npm i codehike` (1.x). Remotion route: `remotion-dev/template-code-hike` (⚠️ Remotion licence: free up to 3 employees, paid above).
- VHS: `vhs` binary (needs `ttyd` and `ffmpeg`), or its Docker image.

## Core patterns

**1. Generate, render to SVG, then animate the reveal in HTML.**

```bash
npx mmdc -i flow.mmd -o flow.svg -t dark -b transparent        # Mermaid → SVG
d2 --layout elk --theme 200 --pad 40 arch.d2 arch.svg           # D2 → SVG
```

Open the SVG inline in an HTML page, select nodes and edges by their ids/classes, and reveal them in the order of the narration with GSAP or CSS: edges as stroke drawing (`pathLength="1"` + `stroke-dashoffset`, [svg.md](svg.md)), nodes with a short scale/opacity entrance, the active node highlighted while the voice talks about it, the rest dimmed to ~40%.

**2. One idea per diagram state.** Max ~7 visible nodes per beat; split large architectures into zoomed sub-diagrams with a camera move (scale/translate the SVG group) rather than shrinking text.

**3. D2 built-in motion**: `style.animated: true` on connections gives flowing dashes; boards (`layers`, `scenarios`, `steps`) plus `--animate-interval 1200` package several boards into one SVG that steps through them (SVG and GIF only). `--sketch` for a hand-drawn look.

**4. Excalidraw hand-drawn reveals**: convert Mermaid with `mermaid-to-excalidraw` or draw the scene; excalidraw-animate draws each element in order (default 500 ms per element, order and duration editable per element) and exports animated SVG (SMIL) or WebM (its README warns WebM export is imperfect: prefer capturing the SVG).

**5. Code steps with Code Hike.** Write each code state as a step; animate between them with the token transitions utilities (`codehike/utils/token-transitions`) so unchanged tokens slide and new ones fade in. Highlight the one line being explained; keep ≤ 15 visible lines at 1080p and a font size ≥ 28 px for video.

**6. Terminal demos with VHS** (deterministic, scripted):

```tape
Output out/demo.mp4
Set FontSize 32
Set Width 1920
Set Height 1080
Set Theme "Catppuccin Frappe"
Set TypingSpeed 60ms
Type "npx umd doctor"
Sleep 400ms
Enter
Sleep 3s
```

`vhs demo.tape` renders it (`Output` also accepts `.gif`, `.webm` or a `frames/` directory). Use `Hide`/`Show` around setup commands, `Require` at the top for needed binaries.

**7. Real sessions with asciinema**: `asciinema rec demo.cast`, trim long pauses, then `agg demo.cast demo.gif` or embed `asciinema-player` in an HTML scene and capture it.

## Rendering to video with umd

- Diagram/code HTML pages: paused GSAP timeline, `window.umdRender = (t) => tl.seek(t)`, `umd capture diagram.html --out out/diagram.mp4`.
- D2 animated SVG and excalidraw-animate SVG use SMIL/CSS inside the SVG: inline it in a page and, for SMIL, seek with `svg.pauseAnimations(); svg.setCurrentTime(t)` in `umdRender`; CSS animations are seeked by capture automatically.
- VHS writes MP4 directly: declare `{ "render": { "command": "vhs demo.tape", "output": "out/demo.mp4" } }` and run `umd analyze`. Typing speed is scripted, so renders repeat.
- asciinema-player in a page: drive it from `t` with the player's seek API, or convert to GIF/video with `agg` + FFmpeg.

## Pitfalls

| Breaks | Fix |
| --- | --- |
| Mermaid/D2 default theme fonts and colours look generic | Theme/config from the brief palette; local font via CSS in the HTML page |
| Whole diagram appears at once | Reveal in narration order; dim inactive parts |
| Tiny text after fitting a big diagram into 16:9 | Split and zoom; text ≥ 28 px at 1080p (TXT) |
| Code scrolling instead of transitioning | Step-based token transitions; one change per step |
| Real secrets or paths in terminal recordings | Scripted VHS with demo data; `Hide` for setup; review every frame |
| `excalidraw-mcp` (no licence) code copied | Use the MIT `excalidraw` packages; MCP as a tool only |
| VHS output differs between machines | Pin the VHS version and font; render in its Docker image |

## Checks

- **TXT**: code and labels readable at delivery size (frames at each step), no overlap.
- **NAR / TIM**: one idea per beat, reveal order follows the script.
- **REN**: two captures identical; VHS output resolution matches the brief.
- **LIC**: MIT/MPL tools; Remotion licence if `template-code-hike`; GPL CLIs used as tools, not redistributed.

## Sources

- https://github.com/mermaid-js/mermaid · https://github.com/mermaid-js/mermaid-cli · https://github.com/d2lang/d2 (man page `ci/release/template/man/d2.1`)
- https://github.com/dai-shi/excalidraw-animate · https://github.com/excalidraw/mermaid-to-excalidraw · https://github.com/code-hike/codehike · https://github.com/shikijs/shiki-magic-move
- https://github.com/charmbracelet/vhs · https://github.com/asciinema/asciinema · https://github.com/asciinema/agg · https://github.com/asciinema/asciinema-player
- research_notes/…/explainers_quality_refs.md
