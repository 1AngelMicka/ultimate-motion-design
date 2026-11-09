# Blender (bpy, MCP, headless render)

Full 3D DCC driven from Python: modelling, materials, lights, keyframes, Geometry Nodes, physics, EEVEE/Cycles rendering, all scriptable with `bpy` and renderable headless. Pick it when the piece needs real materials, rigged characters, simulations or photoreal product shots that three.js cannot reach.

## Use when / avoid when

| Use when | Avoid when |
| --- | --- |
| Product shots with real materials, glass, metal, caustics | Flat/graphic motion or kinetic type → HTML route |
| Procedural motion graphics (Geometry Nodes, Animation Nodes) | Interactive 3D on a web page → three.js |
| Rigged characters, cloth, fluids, particles | Turnaround in minutes with no GPU (Cycles frames take seconds to minutes each) |

## Setup

- Blender (GPL; your renders and .blend content are yours). Current series is 5.x; Geometry Script needs 5.2+. Check `blender --version` and pin it in `.motion/project.json`.
- **MCP for Blender** (catalogue name `ahujasid/blender-mcp`, now redirected to `ahujasid/mcp-for-blender`, MIT): Claude Code `claude mcp add blender uvx mcp-for-blender` (the legacy `uvx blender-mcp` still runs), then `uvx mcp-for-blender install-addon`. In Blender: 3D viewport → `N` → **MCP for Blender** tab → **Start MCP Server**. Run only one MCP client against it. Verify with `/mcp` in Claude Code that `blender` is connected before any tool call; if not, stop and tell the user.
  - Tools: `execute_blender_code` (runs Python in the live Blender), `look` (viewport/camera/multi-angle views or a frame strip), `get_scene_info`, `get_addon_status`, Poly Haven / Sketchfab / Poly Pizza asset search and import, and AI model generation (Meshy, Tripo, Hyper3D Rodin, Hunyuan3D). ⚠️ Hunyuan3D is a Tencent model: its licence is not valid in the EU, UK and South Korea, so never use it for EU clients. Poly Haven assets are CC0; Sketchfab assets carry per-model licences: record them in `assets.lock.json`. Telemetry can be turned off (`disable_telemetry` tool).
- **BlenderKit** (add-on `BlenderKit/Blendkit`, GPL-2.0): large model/material library; search it once before modelling from scratch; asset licences are per item (royalty-free or CC0): record them.
- **Geometry Script** (`carson-katri/geometry-script`): Geometry Nodes, shaders and compositor trees written in Python. ⚠️ GPL-3.0: fine to use for producing renders; redistributing it inside a non-GPL plugin or product is not. Ships a Claude Code skill: `/plugin marketplace add carson-katri/geometry-script` then `/plugin install geometry-script@geometry-script`.
- **Animation Nodes** (`JacquesLucke/animation_nodes`): node-based motion graphics (MoGraph-like); install from animation-nodes.com; check it supports your Blender version before relying on it.
- **fake-bpy-module** (`pip install fake-bpy-module`, MIT): type stubs so `bpy` code autocompletes and type-checks outside Blender. Recipes: `kolibril13/bpy-gallery` (MIT).

## Core patterns

**1. Build scenes from a script, not by clicking.** One `build_scene.py` that clears, builds and saves, so every change is reproducible:

```python
import bpy, math, os
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.resolution_x, scene.render.resolution_y = 1920, 1080
scene.render.fps, scene.frame_start, scene.frame_end = 30, 1, 150
bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=64, ring_count=32)
obj = bpy.context.active_object
bpy.ops.object.shade_smooth()
mat = bpy.data.materials.new("Gloss"); mat.use_nodes = True
mat.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.15
obj.data.materials.append(mat)
obj.rotation_euler = (0, 0, 0); obj.keyframe_insert("rotation_euler", frame=1)
obj.rotation_euler = (0, 0, math.radians(180)); obj.keyframe_insert("rotation_euler", frame=150)
bpy.ops.object.camera_add(location=(0, -6, 1.2), rotation=(math.radians(84), 0, 0))
scene.camera = bpy.context.active_object
bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath("scene.blend"))  # "//" paths need a saved file
```

**2. Keyframes with intent**: set interpolation per key (`fcurve.keyframe_points[i].interpolation = "BEZIER"`, handle types) instead of default ease on everything; use the Graph Editor's F-curves via `obj.animation_data.action.fcurves`. Camera: one slow move per shot, 35–85 mm focal length, DOF on the subject.

**3. Lighting and look**: HDRI world (Poly Haven, CC0) + key/rim area lights; AgX view transform (Blender 4+ default) or Filmic for older files; avoid pure black backgrounds.

**4. Procedural motion**: Geometry Nodes (via Geometry Script) for arrays, scattering, growth and instancing driven by a frame-based value; Animation Nodes for MoGraph-style effectors. Seeds fixed in every random node.

**5. Direct the agent like a junior 3D artist**: a reference image, one shot at a time, a `look` at the viewport or camera after each step through the MCP, and a still render before animating.

## Rendering to video with umd

Render frames headless, then encode. Argument order matters: options apply to the render actions that follow them, so put `-o`, `-F`, `-E`, `-s`, `-e` **before** `-a` or `-f`.

```bash
blender -b scene.blend -E CYCLES -o //frames/f_#### -F PNG -s 1 -e 150 -a   # animation
blender -b scene.blend -o //stills/s_#### -F PNG -f 75                       # one frame (look check)
blender -b scene.blend --python setup_render.py -a                            # script sets samples, engine, then renders
blender -b -E help                                                             # list engine ids for this version
ffmpeg -framerate 30 -i frames/f_%04d.png -c:v libx264 -crf 16 -pix_fmt yuv420p out/shot.mp4
```

`-b` background, `-E` engine (`CYCLES`; get the exact EEVEE id from `-E help`, it changed between 4.x and 5.x), `-o` output path (`//` = relative to the .blend, `####` = frame number), `-F` format, `-s/-e` start/end, `-a` render animation, `-f N` single frame, `-P`/`--python` run a script, `--python-exit-code 1` to fail the process on a Python error. Then `umd analyze out/shot.mp4`.

| Engine | Use | Typical cost (1080p, mid GPU) |
| --- | --- | --- |
| EEVEE | Stylised, motion graphics, previews, most product spins | Fractions of a second to a few seconds per frame |
| Cycles | Glass, caustics, accurate GI, hero shots | Seconds to minutes per frame; use denoising + adaptive sampling, cap samples (128–512) |

Always render a draft first (EEVEE or Cycles at 25–50% resolution, low samples), check a contact sheet (`umd frames --sheet`), then the final. Keep the PNG sequence: a crash mid-render resumes from the last frame (`-s`).

## Pitfalls

| Breaks | Fix |
| --- | --- |
| `-a` placed before `-o`/`-E` → defaults used | Options first, render action last |
| MCP tools called while not connected | Check `/mcp`; start the server in Blender's sidebar |
| Noise/fireflies in Cycles | Denoiser on, clamp indirect, more samples on the hero shot only |
| Flicker between frames (animated noise seed, adaptive sampling) | Fixed seed or "animated seed" deliberately; same settings for every frame |
| Missing textures on the render machine | `File → External Data → Pack Resources` or relative paths; local assets only |
| Tencent/Hunyuan or unknown-licence assets in client work | Use CC0/royalty-free sources; `umd licenses` (LIC) |
| Long render discovered wrong at the end | Stills at key frames first (`-f`), then a draft animation |

## Checks

- **ART**: stills at key frames validated against the reference before full render.
- **REN**: sequence complete (no missing numbers), no fireflies/flicker on the contact sheet, two encodes identical from the same frames.
- **LIF**: camera or subject never fully frozen > 1 s.
- **LIC**: every asset source/licence in `assets.lock.json`; no Hunyuan3D for EU/UK/KR; GPL add-ons not redistributed.

## Sources

- https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html · https://docs.blender.org/api/current/
- https://github.com/ahujasid/blender-mcp (→ mcp-for-blender README) · https://github.com/BlenderKit/Blendkit
- https://github.com/carson-katri/geometry-script · https://github.com/JacquesLucke/animation_nodes · https://github.com/nutti/fake-bpy-module · https://github.com/kolibril13/bpy-gallery
- research_notes/…/3d_shaders_generative.md; reports/Dépôts motion design pour agents.md (route R2)
