# Blender 5.x recipe, run headless:
#   blender -b --factory-startup --python shot.py -- --shot-config shot.json
# Tested on Blender 5.1. Prints "WROTE <file>" on success.
import bpy, json, math, os, sys

# ---- 1. arguments: everything after "--", long names only (Cycles also reads sys.argv: "--c" is ambiguous)
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
cfg = {"frame": 1, "out": "//still.png", "samples": 32, "res": [640, 360], "post": True}
if "--shot-config" in argv:
    with open(argv[argv.index("--shot-config") + 1], encoding="utf-8") as f:
        cfg.update(json.load(f))

scene = bpy.context.scene

# ---- 2. GPU: Cycles renders on the CPU in -b until the preferences say otherwise
def setup_gpu(scene):
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
    print("GPU none: rendering on the CPU")
    return None

scene.render.engine = "CYCLES"
setup_gpu(scene)
scene.cycles.samples = cfg["samples"]
scene.cycles.seed = 7
scene.render.resolution_x, scene.render.resolution_y = cfg["res"]
scene.render.fps = 30
scene.frame_start, scene.frame_end = 1, 90

# ---- 3. a small scene
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.mesh.primitive_cube_add(size=1.2, location=(0, 0, 0.6))
cube = bpy.context.active_object
mat = bpy.data.materials.new("Screen")
nodes = mat.node_tree.nodes  # 5.x: a new material already has its node tree (use_nodes is deprecated)
bsdf = nodes["Principled BSDF"]
bsdf.inputs["Emission Color"].default_value = (0.2, 0.6, 1.0, 1)
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

# ---- 5. compositor under 5.x: scene.node_tree is gone, the tree is a node group
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

# ---- 6. one frame to check before the whole sequence
scene.frame_set(cfg["frame"])
scene.render.filepath = cfg["out"]
scene.render.image_settings.file_format = "PNG"
bpy.ops.render.render(write_still=True)
print("WROTE", bpy.path.abspath(cfg["out"]))
