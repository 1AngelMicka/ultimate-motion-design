# Route R4 — Claude directs, other models draw, speak and move

Claude writes the script, shot list and prompts, calls image, voice, music and video models, then assembles the film in code. Pick it for narrated stories with many illustrated scenes, when drawing every frame in code would cost more than generating it.

## Use when / avoid when

| Use when | Avoid when (pick instead) |
| --- | --- |
| Narrated story, documentary feel, many distinct painted or photographic scenes | Brand UI, exact type, numbers → [html-video.md](html-video.md) |
| Voice-led pieces: essay video, faceless channel, illustrated explainer | One consistent 3D character → [threejs-film.md](threejs-film.md) or [blender.md](blender.md) |
| Budget allows API spend, or a local GPU runs ComfyUI | The licence policy forbids generated assets, or no model on the allow list fits |

## Setup

**Licence registry is strict on this route.** Every model is declared in `.motion/project.json`, every output in `.motion/assets.lock.json` (model, licence, prompt, seed, date). `umd licenses` blocks the rest.

| Job | Permissive first choice | ⚠️ Avoid in commercial pieces |
| --- | --- | --- |
| Images | Qwen-Image (Apache-2.0), FLUX.1-schnell (Apache-2.0) | ⚠️ FLUX.1-dev weights non-commercial; ⚠️ HunyuanImage (Tencent, not valid in EU/UK/KR) |
| Video clips | Wan 2.2 (Apache-2.0), LTX-Video (code Apache-2.0; check the weights licence of the version used) | ⚠️ HunyuanVideo (Tencent) |
| Voice | Kokoro (Apache-2.0), VoxCPM (Apache-2.0) — [../audio/voice.md](../audio/voice.md) | ⚠️ F5-TTS, XTTS, Fish Speech weights non-commercial |
| Music / SFX | ACE-Step 1.5 (MIT) — [../audio/music-sfx.md](../audio/music-sfx.md) | ⚠️ MusicGen, MMAudio weights non-commercial |
| Lip-sync | LatentSync, MuseTalk (check weights) | ⚠️ LivePortrait, Wav2Lip non-commercial |

umd recommends no paid hosted API. If the user brings one of their own, it is allowed when their terms allow commercial use of outputs: record the terms URL in the lock entry.

**Local generation**: ComfyUI (GPL-3.0, run locally, outputs are yours) driven by `artokun/comfyui-mcp` (MIT):

```json
{ "mcpServers": { "comfyui": { "command": "npx", "args": ["-y", "comfyui-mcp"] } } }
```

Wrappers worth knowing: kijai/ComfyUI-WanVideoWrapper, Lightricks/ComfyUI-LTXVideo, city96/ComfyUI-GGUF (low VRAM). ⚠️ several kijai nodes are GPL or unlicensed: run them, do not redistribute.

## Core patterns

**1. Claude decides, models execute.** Claude owns the script, the beat list, every prompt and every accept/reject. A model never chooses the story.

**2. Script first, written for the ear.** One emotion per beat written at the end of the line; no AI phrasing ([../craft/anti-slop.md](../craft/anti-slop.md)). Generate the voice before images: its timestamps set every shot length.

**3. Consistency kit before the first scene.** A character sheet (front, side, three expressions), a palette and a style line repeated verbatim in every prompt, fixed seeds per character; a LoRA (`ostris/ai-toolkit`, MIT) when the character recurs across many shots.

**4. Generate stills, animate in code.** Most scenes do not need a video model: a generated still + parallax, push-in or depth layers in HTML ([html-video.md](html-video.md)) is cheaper, sharper and deterministic. Reserve video models for shots that need real motion (water, crowds, a turning head).

**5. Shot list as data.** `shots.json`: `{id, start, end, prompt, seed, model, source: "still" | "clip", camera_move}`. Re-generate one shot without touching the others.

**6. Assemble deterministically.** Generated media go into an HTML/HyperFrames timeline (captured with `umd capture`) or an FFmpeg concat; captions and mix from [../audio/captions.md](../audio/captions.md) and [../audio/mix.md](../audio/mix.md).

### The loop

| Step | Do | Proof |
| --- | --- | --- |
| 1. Brief | Goal, audience, licence policy (commercial? NC allowed?), budget cap | `BRIEF.md`, model allow list |
| 2. Script + storyboard | Beats, emotion per beat, voice script | `storyboard.md` |
| 3. Voice | TTS, word timestamps, shot lengths fixed | `voice.wav`, `words.json` |
| 4. Stills | Generate key frames; 8 stills checked per round against the style frame; reject and regenerate | contact sheet of candidates |
| 5. Build | Clips for the few motion shots; assemble timeline | `shots.json`, `assets.lock.json` |
| 6. Draft render + critique | `umd render --draft`, `umd frames <video> --sheet` | contact sheet |
| 7. Final | `umd render`, `umd mix`, captions | MP4 |
| 8. Audit | `/umd:audit` (LIC weighs heavily) → `umd deliver` | `audit.json` |

### Cost

Creator-reported (unverified): "What is the purpose of life?" — 1 prompt, 1 h 20, 8 APIs through OpenRouter for $3.21 (images + TTS) plus about $20 of Opus. A 1-minute film by Leon Lin took about 12 h. Report actual spend per model in the delivery notes; stop at the brief's budget cap.

## Rendering to video with umd

Assembly in HTML (default):

```json
{ "capture": { "entry": "assembly/index.html", "fps": 30, "duration": 60 } }
```

Or HyperFrames when its media handling helps: `{"command": "npx hyperframes render --quality delivery --output out/film.mp4", "output": "out/film.mp4"}`.

## Pitfalls

| Breaks | Fix |
| --- | --- |
| Character drifts between shots | Character sheet + fixed seed + same style line; LoRA if > 5 shots |
| Garbled text inside generated images | Never let a model draw text; overlay real type in HTML |
| AI look: plastic skin, symmetric centre framing, glow everywhere | Describe lens, light and imperfections; reject on the contact sheet ([../craft/anti-slop.md](../craft/anti-slop.md)) |
| Video clips at mixed fps and sizes | Normalise every clip with FFmpeg before assembly |
| An asset with no lock entry | Not deliverable: `umd licenses` fails LIC |
| Budget overrun from blind regeneration | Fix the prompt from the critique, max 3 regenerations per shot |

## Checks

- **LIC**: every model and output in `assets.lock.json`; no NC weights, no Tencent in EU, attributions written.
- **ART**: 8 stills per round compared to the style frame; no AI-look visuals.
- **NAR**: script beats with one emotion each; works with sound off (captions).
- **AUD / CAP**: `umd loudness`, `umd captions-check`.
- **REN**: assembly renders identically twice (`umd compare`).

## Sources

- https://github.com/artokun/comfyui-mcp · https://github.com/Comfy-Org/ComfyUI · https://github.com/QwenLM/Qwen-Image · https://github.com/Wan-Video/Wan2.2 · https://github.com/Lightricks/LTX-Video · https://github.com/hexgrad/kokoro · https://github.com/ace-step/ACE-Step-1.5 · https://github.com/ostris/ai-toolkit
- Figures: research_notes/…/posts_x_utilisateur.md (post 5, route 4) · licences: catalogue section 09 and "Précautions pratiques"
