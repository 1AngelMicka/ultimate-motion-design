# Manim (Community Edition)

Python engine for mathematical and technical explainers: shapes, equations (LaTeX), graphs and transforms rendered to video. Pick Manim CE for maths, physics, algorithms and any "show the idea transform" explainer; add manim-voiceover for narration and manim-slides for live presentations.

## Use when / avoid when

| Use when | Avoid when |
| --- | --- |
| Equations, graphs, geometric proofs, algorithm steps, data-structure walkthroughs | Brand promo with product UI and kinetic type → HTML route (GSAP/HyperFrames) |
| Narrated explainers where animation follows the voice | Photoreal or textured 3D → Blender |
| Talks where each step should wait for a click (manim-slides) | Designers must edit the result visually (no timeline editor) |

Use Manim CE (`ManimCommunity/manim`), not 3b1b's personal `manimgl`: different APIs, CE is documented and stable. Read `3b1b/videos` only for scene ideas.

## Setup

- `pip install manim` (0.22.x in Nov 2026; `uv` works too). Needs FFmpeg; a LaTeX distribution only for `MathTex`/`Tex` (`Text` uses Pango, no LaTeX). Licence MIT.
- Narration: `pip install "manim-voiceover[pyttsx3]"` (local voices; or a local TTS from `audio/voice.md` recorded per line). manim-voiceover 0.4.x, MIT. Local voice: `xposed73/kokoro-manim-voiceover` (MIT). Check each TTS service's terms for commercial use; gTTS uses Google Translate's unofficial endpoint.
- Slides: `pip install manim-slides` (5.7.x, MIT, repo `jeertmans/manim-slides`).

## Core patterns

**1. One scene per beat, relative layout, no magic coordinates.**

```python
from manim import *
class Pythagoras(Scene):
    def construct(self):
        title = Text("a² + b² = c²", font_size=56).to_edge(UP)
        tri = Polygon(ORIGIN, RIGHT * 3, UP * 2, color=BLUE_B).move_to(ORIGIN)
        labels = VGroup(MathTex("a"), MathTex("b"), MathTex("c")).arrange(RIGHT, buff=0.6)
        labels.next_to(tri, DOWN, buff=0.5)
        self.play(Write(title), run_time=1.2)
        self.play(Create(tri), run_time=1.0)
        self.play(LaggedStart(*[FadeIn(l, shift=UP * 0.2) for l in labels], lag_ratio=0.2))
        self.wait(1.0)
```

**2. Layout rules for agents** (from ManimAgentPrompts):
- Absolutely no overlapping text. Place everything relative to something: `to_edge`, `next_to(obj, DOWN, buff=0.4–0.6)`, `VGroup(...).arrange(DOWN|RIGHT, buff≥0.35)`.
- Title on `to_edge(UP)`; explanation bands below the main object; multi-part diagrams grouped and arranged, then the whole group fitted to the 16:9 safe frame (`group.scale_to_fit_width(config.frame_width - 1)`).
- Long phrases: split into stacked `Text` objects, or reduce `font_size`; never tiny offsets like `+0.1`.
- Before finishing, run an overlap check: same vertical band + long items → re-arrange with `VGroup.arrange`. Clear or `FadeOut` old content before the next idea.

**3. Transform, don't replace.** `TransformMatchingTex`, `ReplacementTransform`, `TransformMatchingShapes` keep visual continuity between equation steps; `Indicate`, `Circumscribe` for emphasis (one at a time).

**4. Value-driven animation**: `ValueTracker` + `always_redraw` / `add_updater` for moving dots on graphs and live numbers (`DecimalNumber`).

**5. Narration-led timing with manim-voiceover.**

```python
from manim_voiceover import VoiceoverScene
from manim_voiceover.services.gtts import GTTSService
class Explain(VoiceoverScene):
    def construct(self):
        self.set_speech_service(GTTSService(lang="en"))
        circle = Circle()
        with self.voiceover(text="Start with a circle. <bookmark mark='grow'/> Now let it grow.") as tracker:
            self.play(Create(circle), run_time=tracker.duration / 2)
            self.wait_until_bookmark("grow")
            self.play(circle.animate.scale(2))
```

Animation length comes from `tracker.duration`; the scene waits for the voice to finish at the end of the block. Bookmarks need word timings: install the `[transcribe]` extra and pass `transcription_model="base"` to the speech service when it does not return them.

**6. Slides**: subclass `manim_slides.Slide`, call `self.next_slide()` between steps (`loop=True` for looping slides); `manim-slides render file.py Scene`, then `manim-slides Scene` to present or `manim-slides convert Scene out.html` to export.

**7. Style**: dark neutral background, 2–3 accent colours from the brief, `Text(..., font="Inter")` with a locally installed font, consistent `stroke_width`; `run_time` 0.6–1.5 s per move, `self.wait()` sized from reading time.

## Rendering to video with umd

```bash
manim -qh scene.py Pythagoras              # 1080p60 → media/videos/scene/1080p60/Pythagoras.mp4
manim -ql scene.py Pythagoras              # 480p15 draft
manim -qk --fps 30 scene.py Pythagoras     # 2160p at 30 fps
manim -r 1080,1920 --fps 30 scene.py Short # vertical 9:16
manim -t --format mov scene.py Overlay     # transparent
manim -s scene.py Pythagoras               # last frame as PNG (still check)
```

Quality flags: `-ql` 480p15, `-qm` 720p30, `-qh` 1080p60, `-qp` 1440p60, `-qk` 2160p60. Other useful flags: `--seed` (seed random generators), `--disable_caching`, `-n 3,5` (render animations 3–5 only), `-a` (all scenes), `-o name`, `--format png-sequence`. `.motion/project.json`: `{ "render": { "command": "manim -qh --fps 30 scene.py Main", "output": "media/videos/scene/1080p30/Main.mp4" } }`, then `umd analyze`; mix narration with `umd mix` if not using manim-voiceover.

## Pitfalls

| Breaks | Fix |
| --- | --- |
| Overlapping labels, text off-frame | Layout rules above; `umd frames <video> --sheet` and check every beat (TXT) |
| `MathTex` fails | Install LaTeX, or use `Text`/`MarkupText` for non-maths text |
| Everything appears with `Write`/`FadeIn` | Vary: `Create`, `GrowFromCenter`, `TransformMatchingTex`, `LaggedStart` |
| Mixing manimgl and CE examples | CE only (`from manim import *`) |
| Random placement differs between renders | `--seed` or explicit coordinates |
| Long static `self.wait()` | Keep an ambient updater (slow drift, pulsing highlight) or cut sooner (LIF, TIM) |
| Default 60 fps doubles render time | `--fps 30` unless the brief needs 60 |

## Inspiration (research, not dependencies)

- **TheoremExplainAgent** (TIGER-AI-Lab, MIT): planner → coder → critic agents producing 5-minute Manim videos; shows the need for a visual-critique loop.
- **Code2Video** (showlab, MIT, ICML 2026): code-centric educational video generation with layout-aware planning. Both confirm: render, extract frames, critique, fix.

## Checks

- **TXT**: no overlaps, text inside the safe frame, hold time per text beat (contact sheet).
- **TIM / NAR**: one idea per scene, narration and visuals in sync (bookmarks), no dead air > 3 s.
- **AUD / CAP**: voice level via `umd loudness`; captions from the narration script.
- **REN**: output resolution/fps match the brief; two renders compared with `umd compare`.

## Sources

- https://github.com/ManimCommunity/manim (`manim/cli/render/*.py`, `constants.py` QUALITIES) · https://docs.manim.community
- https://github.com/ManimCommunity/manim-voiceover (`voiceover_scene.py`, pyproject extras) · https://github.com/jeertmans/manim-slides
- https://github.com/mathifylabs/ManimAgentPrompts · https://github.com/TIGER-AI-Lab/TheoremExplainAgent · https://github.com/showlab/Code2Video
- research_notes/…/explainers_quality_refs.md
