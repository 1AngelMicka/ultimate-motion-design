# Route R2 — Claude writes Python, Blender renders

Claude scripts the scene in `bpy` as files, Blender renders frames headless, FFmpeg encodes. The Blender MCP is optional: it helps to explore a scene live, nothing in this route needs it. Pick it for real objects, physical materials, product shots and rigged characters.

## Use when / avoid when

| Use when | Avoid when (pick instead) |
| --- | --- |
| Photoreal or physically lit products, packshots, materials (glass, metal, fabric) | Flat graphic, UI or type piece → [html-video.md](html-video.md) |
| Rigged characters, cloth, fluids, Geometry Nodes motion graphics | Stylised small 3D world that should stay web-native → [threejs-film.md](threejs-film.md) |
| A model or material library (BlenderKit, Poly Haven) gives the look | No GPU and a short deadline: Cycles frames take minutes each |

## Setup

- **Blender** (GPL; renders you produce are yours). Engine notes: [../engines/blender.md](../engines/blender.md).
- **Script only (default)**: nothing to install besides Blender. Start from `${CLAUDE_PLUGIN_ROOT}/templates/blender/shot.py` (GPU, animation, camera, 5.x compositor, one-frame check) and read [../engines/blender.md](../engines/blender.md) for Blender 5.x and the GPU.
- **Blender MCP, optional** (`ahujasid/blender-mcp`, MIT; PyPI package now `mcp-for-blender`), to explore live:
  ```bash
  uvx mcp-for-blender setup                 # installs the addon and configures clients
  claude mcp add blender uvx mcp-for-blender # or manual: then `uvx mcp-for-blender install-addon`
  ```
  Open Blender (the addon starts its server), then check `/mcp` before using MCP tools. If the user declines the MCP, carry on with scripts. Use Opus at high effort for this route.
- **BlenderKit** add-on (GPL-2.0) for free models and materials; each asset carries its own licence: record it in `.motion/assets.lock.json`. Poly Haven assets are CC0.
- ⚠️ The MCP's AI model generators include Hunyuan3D: Tencent licence, not valid in the EU, UK or South Korea. Do not use in those territories.
- Dev aids: `nutti/fake-bpy-module` (MIT, typing outside Blender), `kolibril13/bpy-gallery` (snippets). ⚠️ `carson-katri/geometry-script` is GPL-3.0: fine to render with, do not copy into the plugin.

## Core patterns

**1. Direct like a junior 3D artist.** One instruction per step, with numbers: "50 mm lens, camera at 1.6 m, 15° down", "key light 45° left, 3× rim". After each step render one still (`-f N`, or a viewport screenshot through the MCP) and compare it to the reference image. Never "make it look good".

**2. Search the library once before building.** One BlenderKit / Poly Haven search for the hero object and materials; model from scratch only what is missing.

**3. The scene lives in an idempotent script.** `scene/build.py` clears what it created, rebuilds, sets frame range, fps and output, and saves. The MCP, when used, is for exploring; the script is what renders:

```python
import bpy, random
random.seed(7)                                   # every scatter seeded
scn = bpy.context.scene
scn.render.fps = 30
scn.frame_start, scn.frame_end = 1, 30 * 12      # duration from BRIEF.md
scn.render.resolution_x, scn.render.resolution_y = 1920, 1080
scn.render.image_settings.file_format = "PNG"
scn.render.filepath = "//renders/frame_"         # relative to the .blend
bpy.ops.wm.save_mainfile()
```

**4. Reference image always open.** Describe in words what to keep (camera height, shot length, how objects enter frame); never ask to copy someone's video.

**5. Life**: keyframe secondary motion (light drift, a slow camera dolly, idle breathing on characters); eyes lead the body by 6–10 frames; nothing frozen on the final shot ([../craft/principles.md](../craft/principles.md)).

**6. Draft fast, final slow.** Stills and drafts at low samples and half resolution; the final at full samples with Cycles.

### The loop

| Step | Do | Proof |
| --- | --- | --- |
| 1. Brief | Reference image, materials list, shot lengths | `BRIEF.md` |
| 2. Storyboard | Shots with camera, lens, event per shot | `storyboard.md` |
| 3. Stills | `blender -b scene.blend -f 48` per key frame, next to the reference, fix, repeat | PNG side by side |
| 4. Build | Animation keys in `build.py`, assets locked | `scene/`, `assets.lock.json` |
| 5. Draft render | Low samples, half size, `umd render --draft` | frames + MP4 |
| 6. Critique | `umd frames <video> --sheet`, compare to stills | contact sheet |
| 7. Final | `umd render` (Cycles), then audio mix | MP4 |
| 8. Audit | `/umd:audit` → `/umd:fix` → `umd deliver` | `audit.json` |

### Cost

Token cost is moderate (scripts are short; screenshots dominate). Time cost is render time: frames × seconds per frame. Budget it from one test frame before committing to a duration: `umd estimate --frames 570 -- blender -b --python shot.py -- --shot-config shot.json` renders that frame, times it and multiplies. Turn the GPU on first ([../engines/blender.md](../engines/blender.md)): on the CPU the estimate is many times higher. No creator figures were reported for this route.

## Rendering to video with umd

```json
{
  "command": "blender -b scene/scene.blend -E CYCLES -a && ffmpeg -y -framerate 30 -i scene/renders/frame_%04d.png -c:v libx264 -pix_fmt yuv420p -crf 16 out/film.mp4",
  "output": "out/film.mp4"
}
```

`-b` background, `-E` render engine, `-a` animation, `-f N` one frame; options are read in order, so put `-a`/`-f` last. Render a PNG sequence (resumable after a crash), encode once.

## Pitfalls

| Breaks | Fix |
| --- | --- |
| MCP silently disconnected, Claude "builds" nothing | Work from scripts; when using the MCP, check `/mcp` and the MCP tab in Blender (N panel) |
| Cycles on the CPU in `-b` mode | `setup_gpu()` in the script (HIP for AMD, OptiX/CUDA for NVIDIA, Metal for Apple) |
| A 4.x recipe breaks in 5.x (`scene.node_tree`, `action.fcurves`) | The 5.x table in [../engines/blender.md](../engines/blender.md) |
| Re-running a script duplicates objects | Script deletes what it owns (collection per script) before rebuilding |
| Frame range or fps not matching the brief | Set both in `build.py`; `umd analyze` checks duration |
| Fireflies, noise between frames | Enough samples + denoiser on the final; same seed everywhere |
| Colour shifts between stills and final | Keep view transform and look identical for every render |
| Assets with unknown licence | Only library assets with a recorded licence; otherwise model it |
| Camera locked still | Slow dolly or focus pull on every shot |

## Checks

- **ART**: side-by-side stills vs reference before animating.
- **LIF**: last shot never frozen (frame diff), secondary motion visible.
- **REN**: two renders identical (`umd compare`) when seeds are fixed; no noise flicker; output size and fps match the brief.
- **LIC**: every model, material, HDRI in `assets.lock.json`; `umd licenses` clean.

## Sources

- https://github.com/ahujasid/blender-mcp (README: mcp-for-blender setup) · https://github.com/BlenderKit/Blendkit
- https://github.com/nutti/fake-bpy-module · https://github.com/kolibril13/bpy-gallery · https://github.com/carson-katri/geometry-script
- Setup advice (sorenxet): research_notes/…/posts_x_utilisateur.md (post 5, route 2)
