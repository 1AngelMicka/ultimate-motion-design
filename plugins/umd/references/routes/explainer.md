# Route — Technical explainer (Manim, diagrams, code, terminal)

A sub-route of R1 (or R4 when imagery is generated) for teaching: maths, algorithms, architecture, code walkthroughs and CLI demos, cut to a voice-over. Structure comes from text sources (Python scenes, diagram code, code diffs, tape files) so every frame is exact and re-renderable.

## Use when / avoid when

| Use when | Avoid when (pick instead) |
| --- | --- |
| Equations, graphs, geometry, algorithms → **Manim** | Marketing explainer for a product (characters, UI) → [html-video.md](html-video.md) + [../recipes/explainer-video.md](../recipes/explainer-video.md) |
| System or data-flow diagrams → **diagrams as code** | Narrative with painted scenes → [director.md](director.md) |
| Code that changes step by step → **Code Hike / Shiki Magic Move** | Real app walkthrough → [../recipes/product-demo.md](../recipes/product-demo.md) |
| Terminal sessions → **VHS** | |

## Setup

| Tool | Install | Licence | Engine file |
| --- | --- | --- | --- |
| Manim Community + `manim-voiceover` | `pip install manim manim-voiceover` (needs FFmpeg; LaTeX only for `MathTex`) | MIT | [../engines/manim.md](../engines/manim.md) |
| Mermaid CLI, D2, Excalidraw (+ excalidraw-animate) | `npm i -D @mermaid-js/mermaid-cli`; D2 binary | MIT / MPL-2.0 / MIT | [../engines/diagrams-code.md](../engines/diagrams-code.md) |
| Shiki Magic Move | `npm i shiki-magic-move` | MIT | [../engines/diagrams-code.md](../engines/diagrams-code.md) |
| Code Hike + Remotion `template-code-hike` | per template | Code Hike MIT; ⚠️ template runs on Remotion: free up to 3 employees, paid company licence above | [../engines/remotion.md](../engines/remotion.md) |
| VHS | binary from charmbracelet releases | MIT | — |

Licence-free alternative to the Remotion code template: Shiki Magic Move in an HTML page captured with `umd capture`. ⚠️ `F4bbi/manim-dsa` has no licence: read, do not copy.

## Core patterns

**1. Voice script first; the voice is the clock.** Write the narration ([../craft/anti-slop.md](../craft/anti-slop.md) for phrasing), generate it ([../audio/voice.md](../audio/voice.md)), get word timestamps, then place each visual change on the word that names it.

**2. Manim with the voice inside the scene.**

```python
from manim import *
from manim_voiceover import VoiceoverScene

class Explainer(VoiceoverScene):
    def construct(self):
        self.set_speech_service(...)          # a service from ../audio/voice.md
        eq = MathTex(r"e^{i\pi} + 1 = 0")
        with self.voiceover(text="Five constants in one line.") as tracker:
            self.play(Write(eq), run_time=tracker.duration)
```

**3. One idea on screen at a time.** Build up, then clear. Keep a stable layout: the same element stays in the same place across beats. Check overlap and clipping on every still ([../craft/text-on-screen.md](../craft/text-on-screen.md)).

**4. Diagrams: generate the structure, animate the reveal.** Mermaid or D2 produce SVG (`mmdc -i flow.mmd -o flow.svg`; D2 has `--animate-interval` for multi-step SVG). Then reveal nodes and edges in order of the explanation with GSAP or CSS in an HTML page ([../engines/svg.md](../engines/svg.md)).

**5. Code: diff, don't retype.** Show the before state, morph to the after state (Magic Move tokens move), highlight the changed lines, hold long enough to read: ~3 words/s, more for code.

**6. Terminal: script it.** A `.tape` file with `Output demo.mp4`, `Set FontSize`, `Type`, `Sleep`, `Enter`; render with `vhs demo.tape`, then cut the clip into the main timeline.

### The loop

| Step | Do | Proof |
| --- | --- | --- |
| 1. Brief | Audience level, the one thing they must understand | `BRIEF.md` |
| 2. Script + storyboard | Narration with a visual per sentence; beat times from the voice | `storyboard.md`, `words.json` |
| 3. Stills | Manim: `manim -s` saves the last frame; HTML: `umd still`; check layout and legibility | PNGs |
| 4. Build | Scenes per beat | source |
| 5. Draft | `manim -ql …` or `umd render --draft` | MP4 |
| 6. Critique | `umd frames <video> --sheet`; does each frame show what the voice says? | sheet |
| 7. Final | `manim -qh …` / `umd render`; music under voice with `umd mix`; captions | MP4 |
| 8. Audit | `/umd:audit` (TXT, CAP, AUD weigh most) | `audit.json` |

### Cost

Low tokens per scene, but many small scenes. Manim renders are fast at `-ql`, slower at `-qh`/`-qk`. Most time goes into syncing visuals to the voice: fix timing in the scene, not by stretching video.

## Rendering to video with umd

```json
{ "command": "manim -qh scenes.py Explainer", "output": "media/videos/scenes/1080p60/Explainer.mp4" }
{ "capture": { "entry": "explainer/index.html", "fps": 30, "duration": 90 } }
{ "command": "vhs demo.tape", "output": "demo.mp4" }
```

Several sources (Manim + HTML + VHS) are assembled in one HTML timeline with `<video>` elements, which `umd capture` seeks frame by frame.

## Pitfalls

| Breaks | Fix |
| --- | --- |
| Visual arrives before or long after the word | Place on word timestamps; `umd captions-check` for drift |
| Text overlaps or leaves the frame (common in generated Manim) | Check every still; use `next_to`/`arrange` with buffers, never absolute guesses |
| Too much on screen at once | One new element per beat; fade the rest to 30 % |
| Default Manim look everywhere (black, blue, white) | Palette and font from the brief ([../craft/tokens.md](../craft/tokens.md)) |
| Mixed fps between Manim (60) and capture (30) | Render all sources at the delivery fps |
| Terminal typing too fast to read | `Set TypingSpeed` and `Sleep` after each command |

## Checks

- **TXT**: frames at each beat, no overlap or clipping, minimum size, reading time.
- **CAP / AUD**: `umd captions-check`, `umd loudness`; voice clear over music (ducking).
- **NAR**: one idea per beat; the script has no AI phrasing.
- **REN**: Manim and capture outputs match the brief's size and fps.

## Sources

- https://github.com/ManimCommunity/manim · https://github.com/ManimCommunity/manim-voiceover · https://github.com/mermaid-js/mermaid-cli · https://github.com/d2lang/d2 · https://github.com/code-hike/codehike · https://github.com/charmbracelet/vhs · https://www.npmjs.com/package/shiki-magic-move
- research_notes/…/explainers_quality_refs.md (three explainer chains)
