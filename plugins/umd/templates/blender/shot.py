# Blender 5.x shot template, run headless:
#   blender -b --factory-startup --python shot.py -- --shot-config shot.json
# Tested on Blender 5.1.2 (Windows 11, Radeon RX 7900 XTX with HIP). Prints "WROTE <file>" for every image.
#
# The engine is chosen at render time, the scene is the same for both:
#   "engine": "eevee" (default) | "cycles" | "ab"     in shot.json, or the UMD_ENGINE variable (set by `umd render --engine`)
#   "ab" renders the "frames" list with both engines into "ab_dir", for a side-by-side choice on images.
import bpy, json, math, os, sys

# ---- 1. arguments: everything after "--", long names only (Cycles also reads sys.argv: "--c" is ambiguous)
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
cfg = {"frame": 1, "out": "//still.png", "samples": 32, "res": [640, 360], "fps": 30, "post": True,
       "engine": None, "frames": [1, 45, 90], "ab_dir": "//ab", "exposure": 0.0}
if "--shot-config" in argv:
    with open(argv[argv.index("--shot-config") + 1], encoding="utf-8") as f:
        cfg.update(json.load(f))
ENGINES = {"eevee": "BLENDER_EEVEE", "cycles": "CYCLES", "BLENDER_EEVEE": "BLENDER_EEVEE", "CYCLES": "CYCLES"}
engine = (cfg["engine"] or os.environ.get("UMD_ENGINE") or "eevee")
engine = "ab" if str(engine).lower() == "ab" else ENGINES.get(engine, ENGINES.get(str(engine).lower(), "BLENDER_EEVEE"))

scene = bpy.context.scene


# ---- 2. engines
def setup_gpu(scene):
    """Cycles only: in -b mode it renders on the CPU until the preferences pick a device. EEVEE uses the GPU by itself."""
    prefs = bpy.context.preferences.addons["cycles"].preferences
    for kind in ("OPTIX", "CUDA", "HIP", "METAL", "ONEAPI"):  # NVIDIA RTX, NVIDIA, AMD, Apple, Intel Arc
        try:
            prefs.compute_device_type = kind
        except TypeError:
            continue  # not available in this build
        prefs.refresh_devices()
        gpus = [d for d in prefs.devices if d.type == kind]
        if gpus:
            for d in prefs.devices:
                d.use = d.type == kind
            scene.cycles.device = "GPU"
            print(f"GPU {kind}: {', '.join(d.name for d in gpus)}")
            return kind
    scene.cycles.device = "CPU"
    print("GPU none: Cycles renders on the CPU")
    return None


def setup_eevee(scene, samples=64):
    """EEVEE settings that hold up for a final on 5.1 (field-tested, see engines/blender.md)."""
    e = scene.eevee
    e.taa_render_samples = samples
    e.use_raytracing = True                       # screen-space ray tracing for reflections
    e.ray_tracing_options.use_denoise = True
    e.use_shadows = True
    e.shadow_ray_count = 2
    e.shadow_step_count = 8
    e.use_fast_gi = True                          # fast indirect light
    e.fast_gi_method = "GLOBAL_ILLUMINATION"
    e.use_volumetric_shadows = True


def use_engine(scene, eng):
    scene.render.engine = eng
    if eng == "CYCLES":
        setup_gpu(scene)
        scene.cycles.samples = cfg["samples"]
        scene.cycles.use_denoising = True
        scene.cycles.seed = 7
    else:
        setup_eevee(scene, max(cfg["samples"], 64))
    print("ENGINE", eng)


scene.render.resolution_x, scene.render.resolution_y = cfg["res"]
scene.render.fps = cfg["fps"]
scene.frame_start, scene.frame_end = 1, 90
scene.view_settings.exposure = cfg["exposure"]   # EEVEE reads darker on interiors lit by bounce light: about +0.5 EV
# motion blur: at 24 or 30 fps it keeps slow camera moves smooth (shutter 0.5 = 180 degrees)
scene.render.use_motion_blur = True
scene.render.motion_blur_shutter = 0.5

# ---- 3. a small scene
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.mesh.primitive_cube_add(size=1.2, location=(0, 0, 0.6))
cube = bpy.context.active_object
mat = bpy.data.materials.new("Screen")
nodes = mat.node_tree.nodes  # 5.x: a new material already has its node tree (use_nodes is deprecated)
bsdf = nodes["Principled BSDF"]
bsdf.inputs["Emission Color"].default_value = (0.2, 0.6, 1.0, 1)
bsdf.inputs["Roughness"].default_value = 0.2
strength = bsdf.inputs["Emission Strength"]
cube.data.materials.append(mat)
bpy.ops.mesh.primitive_plane_add(size=12)
bpy.ops.object.light_add(type="AREA", location=(2.5, -2, 3.5))
key = bpy.context.active_object
key.data.size = 2

# ---- 4. animation in a script under 5.x: keyframe_insert on what you animate
# (5.x actions are "slotted": do not reach for action.fcurves, insert keys on the owner)
cube.rotation_euler = (0, 0, 0); cube.keyframe_insert("rotation_euler", frame=1)
cube.rotation_euler = (0, 0, math.radians(90)); cube.keyframe_insert("rotation_euler", frame=90)
key.data.energy = 200; key.data.keyframe_insert("energy", frame=1)          # light data
key.data.energy = 600; key.data.keyframe_insert("energy", frame=90)
strength.default_value = 0.0; strength.keyframe_insert("default_value", frame=1)   # a node socket
strength.default_value = 3.0; strength.keyframe_insert("default_value", frame=45)

# camera that follows an animated empty, with a focus pull
bpy.ops.object.empty_add(location=(0, 0, 0.6))
target = bpy.context.active_object
target.location.x = -0.4; target.keyframe_insert("location", frame=1)
target.location.x = 0.4; target.keyframe_insert("location", frame=90)
bpy.ops.object.camera_add(location=(0, -5, 2))
cam = bpy.context.active_object
scene.camera = cam
track = cam.constraints.new("TRACK_TO")
track.target = target
track.track_axis, track.up_axis = "TRACK_NEGATIVE_Z", "UP_Y"
cam.data.dof.use_dof = True
cam.data.dof.focus_object = target
cam.data.dof.aperture_fstop = 2.8; cam.data.dof.keyframe_insert("aperture_fstop", frame=1)
cam.data.dof.aperture_fstop = 8.0; cam.data.dof.keyframe_insert("aperture_fstop", frame=90)


# ---- 5. compositor under 5.x: scene.node_tree is gone, the tree is a node group (works with both engines)
def post_5x(scene):
    tree = bpy.data.node_groups.new("Post", "CompositorNodeTree")
    scene.compositing_node_group = tree
    n, l = tree.nodes, tree.links
    rl = n.new("CompositorNodeRLayers")
    glare = n.new("CompositorNodeGlare")
    out = n.new("NodeGroupOutput")
    tree.interface.new_socket("Image", in_out="OUTPUT", socket_type="NodeSocketColor")
    # 5.x moved node options to inputs: Type, Quality, Threshold, Strength, Size...
    glare.inputs["Type"].default_value = "Bloom"
    glare.inputs["Threshold"].default_value = 0.8
    glare.inputs["Strength"].default_value = 0.6
    l.new(rl.outputs["Image"], glare.inputs["Image"])
    l.new(glare.outputs["Image"], out.inputs[0])
    return tree


if cfg["post"]:
    post_5x(scene)

scene.render.image_settings.file_format = "PNG"


def still(frame, path):
    scene.frame_set(frame)
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print("WROTE", bpy.path.abspath(path))


# ---- 6. one frame to check before the whole sequence, or the A/B pair
if engine == "ab":
    for eng, tag in (("BLENDER_EEVEE", "eevee"), ("CYCLES", "cycles")):
        use_engine(scene, eng)
        for fr in cfg["frames"]:
            still(fr, f"{cfg['ab_dir']}/f{fr:04d}_{tag}.png")
elif cfg.get("sequence"):  # {"out": "scene/frames/f_####", "start": 1, "end": 90}: the whole shot, for umd render
    # paths are made absolute from the folder umd runs in: without a saved .blend, Blender does not resolve them there
    use_engine(scene, engine)
    seq = cfg["sequence"]
    scene.frame_start, scene.frame_end = seq.get("start", scene.frame_start), seq.get("end", scene.frame_end)
    out = seq["out"] if seq["out"].startswith("//") else os.path.abspath(seq["out"])
    scene.render.filepath = out
    bpy.ops.render.render(animation=True)
    print("WROTE", bpy.path.abspath(out), f"frames {scene.frame_start}-{scene.frame_end}")
else:
    use_engine(scene, engine)
    still(cfg["frame"], cfg["out"])
