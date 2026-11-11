# Character layer for Blender 5.x: one way to animate any humanoid, whatever its source.
#
#   load(path)            imports .glb/.gltf/.fbx/.vrm/.bvh, or appends the armature of a .blend; returns the armature
#   profile(rig)          maps its bones to canonical names (hips, spine, chest, neck, head, eyes, jaw, arms, legs),
#                         finds blink and mouth shape keys, the head's forward axis and the actions it carries;
#                         says which gestures this rig can really do (never animate one it lacks)
#   look_at(rig, p, target, f0, f1)       head (and eyes) turn to an object; eyes lead the head by 6 to 10 frames
#   blink(rig, p, frame)                  shape keys if any, else nothing (reported)
#   breathe(rig, p, f0, f1)               idle layer: chest rise and fall, so nothing is ever frozen
#   mouth_from_lipsync(rig, p, json, f0)  mouth shapes A-H, X from `umd lipsync`: visemes, VRM vowels, ARKit, else the jaw
#   play(rig, action_name, f0)            an action the rig already carries (KayKit: 76 of them), as an NLA strip
#   retarget(src, dst, f0, f1)            copies a motion from another skeleton (BVH, a clip, another rig) through the
#                                         canonical names, relative to each rest pose, hips scaled to leg length
#
# Run alone for the character test (profile + a short shot):
#   blender -b --factory-startup -P character.py -- profile Knight.glb [--out profile.json]
#   blender -b --factory-startup -P character.py -- test Knight.glb --out-dir frames [--action Walking_A]
#           [--motion walk.bvh] [--lipsync .motion/lipsync/voice.json] [--frames 1,30,60,90] [--engine eevee]
# Tested on Blender 5.1.2 with KayKit (CC0) and Mesh2Motion (CC0) characters.
import bpy, json, math, os, re, sys
from mathutils import Matrix, Vector, Quaternion

# ---- 1. canonical skeleton: family tables first, then a fuzzy match by name and side
CANON = ["hips", "spine", "chest", "upper_chest", "neck", "head", "eye.L", "eye.R", "jaw",
         "shoulder.L", "upper_arm.L", "forearm.L", "hand.L", "shoulder.R", "upper_arm.R", "forearm.R", "hand.R",
         "thigh.L", "shin.L", "foot.L", "toe.L", "thigh.R", "shin.R", "foot.R", "toe.R"]

def _side(tbl):  # expands "X" templates to .L and .R
    out = {}
    for k, v in tbl.items():
        if "{s}" in k:
            for s, ls in (("L", "l"), ("R", "r")):
                out[k.format(s=s)] = v.format(s=s, ls=ls, Side="Left" if s == "L" else "Right", side="left" if s == "L" else "right")
        else:
            out[k] = v
    return out

FAMILIES = {
    "mixamo": _side({"hips": "mixamorig:Hips", "spine": "mixamorig:Spine", "chest": "mixamorig:Spine1", "upper_chest": "mixamorig:Spine2", "neck": "mixamorig:Neck",
        "head": "mixamorig:Head", "eye.{s}": "mixamorig:{Side}Eye", "shoulder.{s}": "mixamorig:{Side}Shoulder", "upper_arm.{s}": "mixamorig:{Side}Arm",
        "forearm.{s}": "mixamorig:{Side}ForeArm", "hand.{s}": "mixamorig:{Side}Hand", "thigh.{s}": "mixamorig:{Side}UpLeg", "shin.{s}": "mixamorig:{Side}Leg",
        "foot.{s}": "mixamorig:{Side}Foot", "toe.{s}": "mixamorig:{Side}ToeBase"}),
    # CMU (MotionBuilder BVH) and Mixamo without its prefix share these names
    "motionbuilder": _side({"hips": "Hips", "spine": "Spine", "chest": "Spine1", "neck": "Neck", "head": "Head", "shoulder.{s}": "{Side}Shoulder",
        "upper_arm.{s}": "{Side}Arm", "forearm.{s}": "{Side}ForeArm", "hand.{s}": "{Side}Hand", "thigh.{s}": "{Side}UpLeg", "shin.{s}": "{Side}Leg",
        "foot.{s}": "{Side}Foot", "toe.{s}": "{Side}ToeBase"}),
    # 100STYLE: "Shoulder" is the upper arm there, "Collar" the clavicle
    "100style": _side({"hips": "Hips", "spine": "Chest", "chest": "Chest2", "upper_chest": "Chest3", "neck": "Neck", "head": "Head", "shoulder.{s}": "{Side}Collar",
        "upper_arm.{s}": "{Side}Shoulder", "forearm.{s}": "{Side}Elbow", "hand.{s}": "{Side}Wrist", "thigh.{s}": "{Side}Hip", "shin.{s}": "{Side}Knee",
        "foot.{s}": "{Side}Ankle", "toe.{s}": "{Side}Toe"}),
    "vroid": _side({"hips": "J_Bip_C_Hips", "spine": "J_Bip_C_Spine", "chest": "J_Bip_C_Chest", "upper_chest": "J_Bip_C_UpperChest", "neck": "J_Bip_C_Neck",
        "head": "J_Bip_C_Head", "eye.{s}": "J_Adj_{s}_FaceEye", "shoulder.{s}": "J_Bip_{s}_Shoulder", "upper_arm.{s}": "J_Bip_{s}_UpperArm",
        "forearm.{s}": "J_Bip_{s}_LowerArm", "hand.{s}": "J_Bip_{s}_Hand", "thigh.{s}": "J_Bip_{s}_UpperLeg", "shin.{s}": "J_Bip_{s}_LowerLeg",
        "foot.{s}": "J_Bip_{s}_Foot", "toe.{s}": "J_Bip_{s}_ToeBase"}),
    "humanoid": _side({"hips": "Hips", "spine": "Spine", "chest": "Chest", "upper_chest": "UpperChest", "neck": "Neck", "head": "Head", "eye.{s}": "{Side}Eye", "jaw": "Jaw",
        "shoulder.{s}": "{Side}Shoulder", "upper_arm.{s}": "{Side}UpperArm", "forearm.{s}": "{Side}LowerArm", "hand.{s}": "{Side}Hand",
        "thigh.{s}": "{Side}UpperLeg", "shin.{s}": "{Side}LowerLeg", "foot.{s}": "{Side}Foot", "toe.{s}": "{Side}Toes"}),
    # Unreal mannequin, MPFB game_engine and Mesh2Motion human
    "unreal": _side({"hips": "pelvis", "spine": "spine_01", "chest": "spine_02", "upper_chest": "spine_03", "neck": "neck_01", "head": "head",
        "shoulder.{s}": "clavicle_{ls}", "upper_arm.{s}": "upperarm_{ls}", "forearm.{s}": "lowerarm_{ls}", "hand.{s}": "hand_{ls}", "thigh.{s}": "thigh_{ls}",
        "shin.{s}": "calf_{ls}", "foot.{s}": "foot_{ls}", "toe.{s}": "ball_{ls}"}),
    "kaykit": _side({"hips": "hips", "spine": "spine", "chest": "chest", "head": "head", "upper_arm.{s}": "upperarm.{ls}", "forearm.{s}": "lowerarm.{ls}",
        "hand.{s}": "wrist.{ls}", "thigh.{s}": "upperleg.{ls}", "shin.{s}": "lowerleg.{ls}", "foot.{s}": "foot.{ls}", "toe.{s}": "toes.{ls}"}),
    # CloudRig (Blender Studio: Rain, Snow): the FK and master controls
    "cloudrig": _side({"hips": "MSTR-Pelvis", "spine": "FK-Spine", "chest": "FK-Chest", "upper_chest": "FK-RibCage", "neck": "FK-Neck", "head": "FK-Head",
        "eye.{s}": "MSTR-Eye.{s}", "jaw": "MSTR-Jaw", "shoulder.{s}": "MSTR-Clavicle.{s}", "upper_arm.{s}": "FK-Upperarm.{s}", "forearm.{s}": "FK-Forearm.{s}",
        "hand.{s}": "FK-Hand.{s}", "thigh.{s}": "FK-Thigh.{s}", "shin.{s}": "FK-Shin.{s}", "foot.{s}": "FK-Foot.{s}", "toe.{s}": "FK-Toe.{s}"}),
    # Rigify generated rig: the FK controls are what an animator (and the retarget) drives
    "rigify": _side({"hips": "torso", "spine": "spine_fk.001", "chest": "chest", "neck": "neck", "head": "head", "eye.{s}": "eye.{s}", "jaw": "jaw_master",
        "shoulder.{s}": "shoulder.{s}", "upper_arm.{s}": "upper_arm_fk.{s}", "forearm.{s}": "forearm_fk.{s}", "hand.{s}": "hand_fk.{s}",
        "thigh.{s}": "thigh_fk.{s}", "shin.{s}": "shin_fk.{s}", "foot.{s}": "foot_fk.{s}", "toe.{s}": "toe_fk.{s}"}),
    # Rigify metarig and Blender's own naming
    "blender": _side({"hips": "spine", "spine": "spine.001", "chest": "spine.002", "upper_chest": "spine.003", "neck": "spine.004", "head": "spine.006",
        "eye.{s}": "eye.{s}", "jaw": "jaw", "shoulder.{s}": "shoulder.{s}", "upper_arm.{s}": "upper_arm.{s}", "forearm.{s}": "forearm.{s}", "hand.{s}": "hand.{s}",
        "thigh.{s}": "thigh.{s}", "shin.{s}": "shin.{s}", "foot.{s}": "foot.{s}", "toe.{s}": "toe.{s}"}),
}

# fuzzy fallback: words that name each canonical bone in the wild (after prefixes and the side are removed)
FUZZY = {"hips": ["hips", "hip", "pelvis"], "spine": ["spine", "spine1", "spine01", "abdomen", "waist"], "chest": ["chest", "spine2", "spine02", "torso"],
    "upper_chest": ["upperchest", "spine3", "spine03"], "neck": ["neck", "neck1", "neck01"], "head": ["head"], "eye": ["eye", "faceeye"], "jaw": ["jaw", "chin"],
    "shoulder": ["shoulder", "clavicle", "collar"], "upper_arm": ["upperarm", "arm", "uparm"], "forearm": ["forearm", "lowerarm", "elbow"],
    "hand": ["hand", "wrist"], "thigh": ["thigh", "upleg", "upperleg"], "shin": ["shin", "calf", "leg", "lowerleg", "knee"], "foot": ["foot", "ankle"],
    "toe": ["toe", "toes", "toebase", "ball"]}
PREFIX = re.compile(r"^(mixamorig\d*[:_]|j_bip_[clr]_|j_adj_[lr]_|def[-_]|org[-_]|mch[-_]|bip0?1[ _]|cc_base_|rig[:_]|armature[:_])", re.I)

def _parse(name):
    """(core, side) of a bone name: 'mixamorig:LeftForeArm' -> ('forearm', 'L'), 'upperarm_l' -> ('upperarm', 'L')."""
    n = PREFIX.sub("", name)
    side = None
    m = re.match(r"^(left|right)[ _.-]?(.*)$", n, re.I) or re.match(r"^(.*?)[ _.-]?(left|right)$", n, re.I)
    if m:
        side = "L" if "left" in (m.group(1) + m.group(2)).lower()[:5] or m.group(m.lastindex).lower() == "left" else "R"
        n = m.group(2) if m.group(1).lower() in ("left", "right") else m.group(1)
    else:
        m = re.match(r"^(.*?)[ _.-]([lr])$", n, re.I) or re.match(r"^([lr])[ _.-](.*)$", n, re.I)
        if m:
            a, b = m.group(1), m.group(2)
            if len(a) == 1: side, n = a.upper(), b
            else: side, n = b.upper(), a
    core = re.sub(r"[^a-z0-9]", "", n.lower())
    return core, side

def _map(rig):
    names = [b.name for b in rig.data.bones]
    have = set(names)
    best, best_n = None, 0
    for fam, tbl in FAMILIES.items():
        n = sum(1 for v in tbl.values() if v in have)
        if n > best_n:
            best, best_n = fam, n
    mapping = {}
    if best and best_n >= 8:
        mapping = {k: v for k, v in FAMILIES[best].items() if v in have}
    # fill the gaps by meaning; the first bone of a chain wins (spine before spine2)
    for c in CANON:
        if c in mapping:
            continue
        base, side = (c.split(".") + [None])[:2]
        for b in names:
            core, s = _parse(b)
            if s != side or b in mapping.values():
                continue
            if core in FUZZY.get(base, []) or (base == "eye" and core.endswith("eye")):
                mapping[c] = b
                break
    return (best if best_n >= 8 else "fuzzy"), mapping

# ---- 2. face: blink and mouth shape keys under the names each ecosystem uses
BLINK = ["eyelidsclosel", "eyelidscloser", "blink", "eyeblinkleft", "eyeblinkright", "fclEYEclose", "fcleyeclose", "vrcblink", "eyesclosed", "blinkl", "blinkr", "eyeclose", "eyesclose"]
VISEMES = {  # Rhubarb shape -> candidate shape keys (Meta/Oculus and VRChat visemes, VRM vowels, ARKit), best first
    "A": ["visemepp", "vrcvpp", "pp", "mouthclose"],
    "B": ["visemekk", "visemess", "vrcvkk", "vrcvss", "ih", "i", "fclmthi", "mouthstretchleft"],
    "C": ["visemee", "vrcve", "ee", "e", "fclmthe", "jawopen", "mouthopen"],
    "D": ["visemeaa", "vrcvaa", "aa", "a", "fclmtha", "jawopen", "mouthopen"],
    "E": ["visemeo", "vrcvoh", "oh", "o", "fclmtho", "mouthfunnel"],
    "F": ["visemeu", "vrcvou", "ou", "u", "fclmthu", "mouthpucker"],
    "G": ["visemeff", "vrcvff", "ff", "mouthrolllower"],
    "H": ["visemenn", "visemedd", "vrcvnn", "vrcvdd", "nn", "dd"],
}
# a shape the rig lacks borrows a near one at a lower weight (C: half-open, from the wide-open D)
NEAR = {"C": ("D", 0.6), "B": ("C", 0.5), "E": ("F", 0.7), "G": ("A", 0.8), "H": ("C", 0.5), "F": ("E", 0.8), "D": ("C", 1.0)}
JAW_OPEN = {"A": 0.0, "B": 0.12, "C": 0.45, "D": 0.8, "E": 0.5, "F": 0.3, "G": 0.1, "H": 0.35, "X": 0.0}  # fraction of 20 degrees

def _norm(k):
    return re.sub(r"[^a-z0-9]", "", k.lower())

def _meshes(rig):
    return [o for o in bpy.data.objects if o.type == "MESH" and (o.parent == rig or any(m.type == "ARMATURE" and m.object == rig for m in o.modifiers))]

def _keys(rig):
    out = {}
    for o in _meshes(rig):
        if o.data.shape_keys:
            for k in o.data.shape_keys.key_blocks[1:]:
                out.setdefault(_norm(k.name), []).append((o, k.name))
    return out

def _forward_axis(rig, bone):
    """Local axis of a bone that points where the character faces (-Y in world for a Blender character)."""
    want = (rig.matrix_world.to_3x3().inverted() @ Vector((0, -1, 0))).normalized()
    m = rig.data.bones[bone].matrix_local.to_3x3()
    axes = {"TRACK_X": m.col[0], "TRACK_NEGATIVE_X": -m.col[0], "TRACK_Y": m.col[1], "TRACK_NEGATIVE_Y": -m.col[1], "TRACK_Z": m.col[2], "TRACK_NEGATIVE_Z": -m.col[2]}
    return max(axes, key=lambda a: axes[a].normalized().dot(want))

def profile(rig, out=None):
    fam, mp = _map(rig)
    keys = _keys(rig)
    blink = sorted({n for n in keys if n in [_norm(b) for b in BLINK]})
    mouth = {}
    for shape, cands in VISEMES.items():
        for c in cands:
            if c in keys:
                mouth[shape] = c
                break
    jaw = mp.get("jaw")
    actions = [{"name": a.name, "frames": [int(a.frame_range[0]), int(a.frame_range[1])]} for a in bpy.data.actions
               if any(_owner_ok(a, rig, b) for b in mp.values())][:200]
    # height from the meshes the rig deforms (a chibi head is far above its head bone), else from the bones
    pts = [o.matrix_world @ Vector(c) for o in _meshes(rig) if not o.hide_render for c in o.bound_box]
    lowest = min((p.z for p in pts), default=min((rig.matrix_world @ b.head_local).z for b in rig.data.bones))
    top = max((p.z for p in pts), default=None)
    head = rig.matrix_world @ rig.data.bones[mp["head"]].head_local if "head" in mp else None
    p = {"armature": rig.name, "family": fam, "bones": mp, "missing": [c for c in CANON if c not in mp],
         "head_forward": _forward_axis(rig, mp["head"]) if "head" in mp else None,
         "eye_forward": _forward_axis(rig, mp["eye.L"]) if "eye.L" in mp else None,
         "eye_target": _eye_target(rig),
         "height_m": round(top - lowest, 3) if top is not None else (round((head.z - lowest) * 1.12, 3) if head else round(rig.dimensions.z, 3)),
         "face": {"blink": blink, "mouth": mouth, "mouth_kind": "shape keys" if len(mouth) >= 4 else ("jaw bone" if jaw else ("partial" if mouth else "none"))},
         "actions": actions}
    can = []
    if "head" in mp: can.append("look_at (head)")
    if (("eye.L" in mp and "eye.R" in mp) or p["eye_target"]):
        can.append("look_at (eyes lead" + (f", through {p['eye_target']})" if p["eye_target"] else ")"))
    if blink: can.append("blink")
    if p["face"]["mouth_kind"] != "none": can.append(f"speak ({p['face']['mouth_kind']})")
    if any(c in mp for c in ("chest", "spine")): can.append("breathe")
    if all(c in mp for c in ("hips", "thigh.L", "shin.L", "thigh.R", "shin.R")): can.append("retarget body motion")
    if actions: can.append(f"play {len(actions)} actions")
    p["can"] = can
    p["cannot"] = [g for g, ok in (("blink", bool(blink)), ("speak", p["face"]["mouth_kind"] != "none"), ("eyes", "eye.L" in mp)) if not ok]
    if out:
        with open(out, "w", encoding="utf-8") as f:
            json.dump(p, f, indent=1)
    return p

def _owner_ok(action, rig, bone):
    return any(f'pose.bones["{bone}"]' in fc.data_path for fc in _fcurves(action))

def _fcurves(action):
    """F-curves of a 5.x slotted action (layers > strips > channelbags) or of an older flat one."""
    try:
        out = []
        for layer in action.layers:
            for strip in layer.strips:
                for cb in strip.channelbags:
                    out.extend(cb.fcurves)
        return out
    except AttributeError:
        return list(getattr(action, "fcurves", []))

# ---- 3. loading
def load(path, name=None):
    ext = os.path.splitext(path)[1].lower()
    before = set(bpy.data.objects)
    if ext in (".glb", ".gltf"):
        bpy.ops.import_scene.gltf(filepath=path)
    elif ext == ".fbx":
        bpy.ops.import_scene.fbx(filepath=path, automatic_bone_orientation=True)
    elif ext == ".vrm":
        if not hasattr(bpy.ops.import_scene, "vrm"):
            raise RuntimeError("VRM needs the VRM add-on: Blender > Get Extensions > VRM format (umd characters info vrm-addon)")
        bpy.ops.import_scene.vrm(filepath=path)
    elif ext == ".bvh":
        bpy.ops.import_anim.bvh(filepath=path, axis_forward="-Z", axis_up="Y", update_scene_fps=False, update_scene_duration=False)
    elif ext == ".blend":
        with bpy.data.libraries.load(path, link=False) as (src, dst):
            dst.objects = list(src.objects)
        for o in dst.objects:
            if o is not None:
                bpy.context.scene.collection.objects.link(o)
        # bone shapes (WGT-*) and helper objects were hidden in their own collection: keep them out of the render
        shapes = {pb.custom_shape for a in dst.objects if a is not None and a.type == "ARMATURE" for pb in a.pose.bones if pb.custom_shape}
        for o in dst.objects:
            if o is not None and (o in shapes or o.name.startswith(("WGT-", "WGT_", "HLP-", "CS_")) or o.name.endswith("_viewport")):
                o.hide_render = o.hide_viewport = True
    else:
        raise RuntimeError(f"Unsupported format {ext}")
    new = [o for o in bpy.data.objects if o not in before]
    arms = [o for o in new if o.type == "ARMATURE"]
    if not arms:
        raise RuntimeError(f"No armature in {path}")
    rig = max(arms, key=lambda a: len(a.data.bones))
    # FBX from Unity or Mixamo arrives with the armature at scale 0.01 and the skin evaluated at 100x: apply the scale
    if ext == ".fbx" and any(abs(s - 1) > 1e-3 for s in rig.scale):
        bpy.ops.object.select_all(action="DESELECT")
        for o in [rig, *rig.children_recursive]:
            o.select_set(True)
        bpy.context.view_layer.objects.active = rig
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    # Unity FBX materials often arrive with Alpha 0 and nothing plugged into it: the character renders invisible
    for o in [*rig.children_recursive]:
        for s in getattr(o, "material_slots", []):
            m = s.material
            for x in (m.node_tree.nodes if m and m.use_nodes else []):
                if x.type == "BSDF_PRINCIPLED" and not x.inputs["Alpha"].is_linked and x.inputs["Alpha"].default_value < 0.01:
                    x.inputs["Alpha"].default_value = 1.0
    missing = sorted({x.image.filepath for o in rig.children_recursive for s in getattr(o, "material_slots", []) if s.material and s.material.use_nodes
                      for x in s.material.node_tree.nodes if x.type == "TEX_IMAGE" and x.image and not x.image.packed_file and not os.path.exists(bpy.path.abspath(x.image.filepath))})
    if missing:
        print("MISSING TEXTURES", missing)
    if name:
        rig.name = name
    return rig

def rest(rig):
    """Clear the action an importer left active, so the rest pose is what the camera sees until we animate."""
    if rig.animation_data:
        rig.animation_data.action = None
    for pb in rig.pose.bones:
        pb.matrix_basis = Matrix.Identity(4)

def hide_props(rig):
    """Packs often ship every weapon and accessory at once (KayKit): keep only the meshes the armature deforms."""
    hidden = []
    for o in rig.children_recursive:
        if o.type == "MESH" and not any(m.type == "ARMATURE" for m in o.modifiers):
            o.hide_render = o.hide_viewport = True
            hidden.append(o.name)
    return hidden

# ---- 4. gestures
def _bone_target(rig, bone, target, axis, f0, f1, ease_frames, name, amount=1.0):
    pb = rig.pose.bones[bone]
    c = pb.constraints.get(name) or pb.constraints.new("DAMPED_TRACK")
    c.name, c.target, c.track_axis = name, target, axis
    c.influence = 0.0
    c.keyframe_insert("influence", frame=f0)
    c.influence = amount
    c.keyframe_insert("influence", frame=f0 + ease_frames)
    if f1 is not None:
        c.keyframe_insert("influence", frame=f1)
        c.influence = 0.0
        c.keyframe_insert("influence", frame=f1 + ease_frames)
    return c

def _eye_target(rig):
    """The bone the eyes aim at, when the rig has one (CloudRig TGT-Eyes, Rigify "eyes", many film rigs): the eyeballs
    follow it through their own aim constraints, so moving it is the only way the iris and the pupil stay together."""
    found = None
    for pb in rig.pose.bones:
        if "eye" not in pb.name.lower():
            continue
        for c in pb.constraints:
            st = getattr(c, "subtarget", "")
            # only a bone named as a target (TGT-Eye.L, eye_target, Look): eyelids also track helper bones
            if c.type in ("DAMPED_TRACK", "TRACK_TO", "LOCKED_TRACK", "IK") and st and getattr(c, "target", None) == rig \
                    and re.search(r"(tgt|target|look)", st, re.I):
                top = rig.pose.bones.get(st)
                # climb to the shared target (both eyes) while the parent is still an eye target
                while top and top.parent and re.search(r"(tgt|target|look)", top.parent.name, re.I) and "eye" in top.parent.name.lower():
                    top = top.parent
                if top:
                    found = top.name
    return found

def look_at(rig, p, target, f0, f1=None, head_amount=0.8, lead=8, ease=10):
    """Eyes first, then the head (6 to 10 frames later), never the whole body at once."""
    b = p["bones"]
    if p.get("eye_target"):
        # move the rig's own eye target onto the object: the rig aims both eyeballs (iris and pupil together)
        pb = rig.pose.bones[p["eye_target"]]
        c = pb.constraints.get("umd_look") or pb.constraints.new("COPY_LOCATION")
        c.name, c.target = "umd_look", target
        c.target_space = c.owner_space = "WORLD"
        e = max(3, ease // 3)
        c.influence = 0.0
        c.keyframe_insert("influence", frame=f0)
        c.influence = 1.0
        c.keyframe_insert("influence", frame=f0 + e)
        if f1 is not None:
            c.keyframe_insert("influence", frame=f1)
            c.influence = 0.0
            c.keyframe_insert("influence", frame=f1 + e)
    elif "eye.L" in b and "eye.R" in b and p.get("eye_forward"):
        for e in ("eye.L", "eye.R"):
            _bone_target(rig, b[e], target, p["eye_forward"], f0, f1, max(3, ease // 3), "umd_look")
    # the neck takes part of the turn, the head the rest: a turn that starts lower reads as a person, not a turret
    if "neck" in b:
        _bone_target(rig, b["neck"], target, _forward_axis(rig, b["neck"]), f0 + lead, None if f1 is None else f1 + lead, ease + 4, "umd_look", head_amount * 0.4)
    if "head" in b:
        _bone_target(rig, b["head"], target, p["head_forward"], f0 + lead, None if f1 is None else f1 + lead, ease, "umd_look", head_amount)

def blink(rig, p, frame, close=2, hold=1, open_=3):
    names = p["face"]["blink"]
    if not names:
        return False
    keys = _keys(rig)
    for n in names:
        for o, kn in keys[n]:
            k = o.data.shape_keys.key_blocks[kn]
            for f, v in ((frame, 0.0), (frame + close, 1.0), (frame + close + hold, 1.0), (frame + close + hold + open_, 0.0)):
                k.value = v
                k.keyframe_insert("value", frame=f)
    return True

def _key_rot(pb, q, frame):
    if pb.rotation_mode == "QUATERNION":
        pb.rotation_quaternion = q
        pb.keyframe_insert("rotation_quaternion", frame=frame)
    else:
        pb.rotation_euler = q.to_euler(pb.rotation_mode)
        pb.keyframe_insert("rotation_euler", frame=frame)

def breathe(rig, p, f0, f1, period=90, degrees=1.6):
    """A slow chest rotation around its side axis: about 20 breaths a minute at 30 fps."""
    bone = p["bones"].get("chest") or p["bones"].get("spine")
    if not bone:
        return False
    pb = rig.pose.bones[bone]
    base = pb.rotation_quaternion.copy() if pb.rotation_mode == "QUATERNION" else pb.rotation_euler.to_quaternion()
    step = max(1, period // 6)
    for f in range(f0, f1 + 1, step):
        a = math.radians(degrees) * 0.5 * (1 - math.cos(2 * math.pi * (f - f0) / period))
        _key_rot(pb, base @ Quaternion((1, 0, 0), -a), f)
    return True

def mouth_from_lipsync(rig, p, lipsync_file, f0=1, fps=None, strength=1.0):
    """One mouth shape per Rhubarb cue; shape keys when the rig has them, else the jaw opens by the shape's amount."""
    with open(lipsync_file, encoding="utf-8") as f:
        data = json.load(f)
    fps = fps or bpy.context.scene.render.fps
    cues = data["cues"]
    mouth = p["face"]["mouth"]
    keys = _keys(rig)
    if len(mouth) >= 4:
        used = {mouth[s] for s in mouth}
        for c in cues:
            fr = f0 + round(c["start"] * fps)
            v, w = c["value"], 1.0
            if v not in mouth and v in NEAR:
                v, w = NEAR[v]
                if v not in mouth and v in NEAR:
                    v, w2 = NEAR[v]
                    w *= w2
            want = mouth.get(v)
            for n in used:
                for o, kn in keys[n]:
                    k = o.data.shape_keys.key_blocks[kn]
                    k.value = strength * w if n == want else 0.0
                    k.keyframe_insert("value", frame=fr)
        return "shape keys"
    jaw = p["bones"].get("jaw")
    if jaw:
        pb = rig.pose.bones[jaw]
        base = pb.rotation_quaternion.copy() if pb.rotation_mode == "QUATERNION" else pb.rotation_euler.to_quaternion()
        for c in cues:
            _key_rot(pb, base @ Quaternion((1, 0, 0), math.radians(20) * JAW_OPEN.get(c["value"], 0) * strength), f0 + round(c["start"] * fps))
        return "jaw bone"
    return None

def use_action(rig, action_name):
    """Makes an action the active one (5.x actions are slotted: the slot must be assigned too)."""
    act = bpy.data.actions[action_name]
    ad = rig.animation_data or rig.animation_data_create()
    ad.action = act
    if hasattr(ad, "action_slot") and getattr(act, "slots", None) and ad.action_slot is None:
        ad.action_slot = act.slots[0]
    return act

def play(rig, action_name, f0=1, repeat=1, blend=6):
    """Adds an action the rig carries as an NLA strip (several strips blend into each other)."""
    act = bpy.data.actions[action_name]
    ad = rig.animation_data or rig.animation_data_create()
    ad.action = None
    track = ad.nla_tracks.new()
    track.name = f"umd {action_name}"
    strip = track.strips.new(action_name, int(f0), act)
    strip.repeat = repeat
    # the first strip starts at full weight: a blend-in from nothing shows the rest pose (T-pose) on the first frames
    strip.blend_in = 0 if f0 <= bpy.context.scene.frame_start else blend
    strip.blend_out = blend
    if hasattr(strip, "action_slot") and act.slots:
        strip.action_slot = act.slots[0]
    return strip

def bvh_fps(path):
    """Frame rate of a BVH file (CMU: 120, 100STYLE: 60), from its "Frame Time" line."""
    with open(path, encoding="utf-8", errors="ignore") as f:
        for line in f:
            if line.strip().lower().startswith("frame time"):
                return round(1.0 / float(line.split(":")[1]))
    return None

def retarget(src, dst, f0, f1, src_profile=None, dst_profile=None, dst_start=None, root_motion=True, step=1.0):
    # step: source frames per target frame (a 120 fps BVH on a 30 fps film: 4)
    """Bakes src's motion on dst: each canonical bone keeps its rotation relative to its own rest pose, so an A-pose
    rig takes a T-pose clip without twisted arms; the hips move by the leg-length ratio."""
    sp = src_profile or profile(src)
    dp = dst_profile or profile(dst)
    pairs = [(c, sp["bones"][c], dp["bones"][c]) for c in CANON if c in sp["bones"] and c in dp["bones"] and not c.startswith(("eye", "jaw"))]
    order = sorted(pairs, key=lambda x: len(dst.data.bones[x[2]].parent_recursive))
    sw, dw = src.matrix_world, dst.matrix_world
    srest = {c: (sw @ src.data.bones[s].matrix_local).to_quaternion() for c, s, _ in pairs}
    drest = {c: (dw @ dst.data.bones[d].matrix_local).to_quaternion() for c, _, d in pairs}
    shead = {c: sw @ src.data.bones[s].head_local for c, s, _ in pairs}
    ratio = 1.0
    if "hips" in sp["bones"] and "hips" in dp["bones"]:
        sh = (sw @ src.data.bones[sp["bones"]["hips"]].head_local).z - min((sw @ b.head_local).z for b in src.data.bones)
        dh = (dw @ dst.data.bones[dp["bones"]["hips"]].head_local).z - min((dw @ b.head_local).z for b in dst.data.bones)
        ratio = dh / sh if sh > 1e-6 else 1.0
    start = dst_start if dst_start is not None else f0
    scene = bpy.context.scene
    # hips travel is measured from the clip first frame, not the rest pose (a CMU BVH rests with the hips on the floor)
    scene.frame_set(f0)
    hips0 = (sw @ src.pose.bones[sp["bones"]["hips"]].head) if "hips" in sp["bones"] else Vector()
    count = int((f1 - f0) / step) + 1
    for i in range(count):
        sf = f0 + i * step
        scene.frame_set(int(sf), subframe=sf - int(sf))
        f = f0 + i  # target frame index
        world = {c: (sw @ src.pose.bones[s].matrix).to_quaternion() for c, s, _ in pairs}
        hips_shift = (sw @ src.pose.bones[sp["bones"]["hips"]].head) - hips0 if "hips" in world else Vector()
        for c, s, d in order:
            pb = dst.pose.bones[d]
            q_world = (world[c] @ srest[c].inverted()) @ drest[c]
            m = pb.matrix.copy()
            loc = m.to_translation()
            if c == "hips" and root_motion:
                loc = (dw.inverted() @ (dw @ dst.data.bones[d].head_local + hips_shift * ratio))
            pb.matrix = Matrix.LocRotScale(loc, dw.to_quaternion().inverted() @ q_world, m.to_scale())
            bpy.context.view_layer.update()
            _key_rot(pb, pb.rotation_quaternion.copy() if pb.rotation_mode == "QUATERNION" else pb.rotation_euler.to_quaternion(), start + f - f0)
            if c == "hips" and root_motion:
                pb.keyframe_insert("location", frame=start + f - f0)
    return {"bones": len(pairs), "frames": count, "hips_ratio": round(ratio, 3), "step": step}

# ---- 5. command line: profile, or a test shot (the character looks at a product, blinks, breathes, talks)
def _test(path, args):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.fps = int(args.get("fps", 30))
    rig = load(path, "character")
    rest(rig)
    if not args.get("props"):
        hide_props(rig)
    p = profile(rig)
    acts = [a["name"] for a in p["actions"]]
    n = int(args.get("length", 120))
    scene.frame_start, scene.frame_end = 1, n
    h = p["height_m"]
    # product at chest height, to the character's left; in a close-up, held closer (about 30 degrees off the nose):
    # a look past 40 degrees shows mostly the white of the eye, which reads as a fault in close-up
    loc = (h * 0.28, -h * 0.5, h * 0.74) if args.get("framing") == "face" else (h * 0.55, -h * 0.45, h * 0.62)
    bpy.ops.mesh.primitive_cube_add(size=h * 0.12, location=loc)
    product = bpy.context.object
    product.name = "product"
    if args.get("action") and args["action"] in acts:
        play(rig, args["action"], 1, repeat=max(1, n // max(1, int(bpy.data.actions[args["action"]].frame_range[1]))))
    if args.get("motion"):
        src = load(args["motion"], "motion_source")
        if args.get("motion-action"):
            use_action(src, args["motion-action"])
        act = src.animation_data.action if src.animation_data else None
        fps_src = bvh_fps(args["motion"]) if args["motion"].lower().endswith(".bvh") else scene.render.fps
        step = max(1.0, fps_src / scene.render.fps)
        a0, a1 = (int(act.frame_range[0]), int(act.frame_range[1])) if act else (1, n)
        if args["motion"].lower().endswith(".bvh"):
            a0 += 1  # CMU conversions put a T-pose on the first frame
        r = retarget(src, rig, a0, min(a1, a0 + int(n * step)), dst_profile=p, dst_start=1, step=step)
        for o in [src, *_meshes(src), *src.children_recursive]:
            o.hide_render = o.hide_viewport = True
        print("RETARGET", json.dumps(r))
    breathe(rig, p, 1, n)
    look_at(rig, p, product, int(n * 0.25), None)
    for f in (int(n * 0.15), int(n * 0.6), int(n * 0.9)):
        blink(rig, p, f)
    if args.get("lipsync"):
        print("MOUTH", mouth_from_lipsync(rig, p, args["lipsync"], int(n * 0.3)))
    # camera at eye level, three-quarter, framing head to knees; key and rim light
    cam_data = bpy.data.cameras.new("cam")
    cam_data.lens = 50
    cam = bpy.data.objects.new("cam", cam_data)
    scene.collection.objects.link(cam)
    aim = bpy.data.objects.new("aim", None)
    scene.collection.objects.link(aim)
    if args.get("framing") == "face" and "head" in p["bones"]:
        # close-up for acting: 85 mm at eye level, head and shoulders, product edge in frame
        hz = (rig.matrix_world @ rig.data.bones[p["bones"]["head"]].head_local)
        cam_data.lens = 85
        aim.location = (hz.x + h * 0.04, hz.y, hz.z + h * 0.05)
        cam.location = (hz.x + h * 0.25, hz.y - h * 1.1, hz.z + h * 0.06)
    else:
        cam.location = (h * 1.3, -h * 3.6, h * 0.8)
        aim.location = (h * 0.2, 0, h * 0.5)
    t = cam.constraints.new("TRACK_TO")
    t.target, t.track_axis, t.up_axis = aim, "TRACK_NEGATIVE_Z", "UP_Y"
    scene.camera = cam
    for name, loc, energy in (("key", (h * 2, -h * 2, h * 2.5), 900 * h * h), ("rim", (-h * 1.5, h * 2, h * 2), 600 * h * h)):
        L = bpy.data.objects.new(name, bpy.data.lights.new(name, "AREA"))
        L.data.energy, L.data.size = energy, h
        L.location = loc
        L.constraints.new("TRACK_TO").target = aim
        scene.collection.objects.link(L)
    world = bpy.data.worlds.new("w")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.05, 0.055, 0.07, 1)
    scene.world = world
    eng = str(args.get("engine", os.environ.get("UMD_ENGINE", "eevee"))).lower()
    scene.render.engine = "CYCLES" if eng == "cycles" else "BLENDER_EEVEE"
    if eng != "cycles":
        # film characters have refractive corneas: without ray tracing EEVEE draws the eyes as dark holes
        e = scene.eevee
        e.use_raytracing = True
        e.ray_tracing_options.use_denoise = True
        e.use_shadows = True
        e.use_fast_gi = True
        e.taa_render_samples = 64
    if eng == "cycles":
        scene.cycles.samples = 64
    scene.render.resolution_x, scene.render.resolution_y = (int(x) for x in str(args.get("res", "960x540")).split("x"))
    out_dir = os.path.abspath(args.get("out-dir", "character-test"))
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, "profile.json"), "w", encoding="utf-8") as f:
        json.dump(p, f, indent=1)
    for fr in [int(x) for x in str(args.get("frames", f"1,{n//4},{n//2},{3*n//4},{n}")).split(",")]:
        scene.frame_set(fr)
        scene.render.filepath = os.path.join(out_dir, f"frame_{fr:04d}.png")
        bpy.ops.render.render(write_still=True)
        print("WROTE", scene.render.filepath)
    if args.get("blend"):
        bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(args["blend"]))
    print("PROFILE", json.dumps({k: p[k] for k in ("family", "can", "cannot", "missing")}))

if __name__ == "__main__" and "--" in sys.argv:
    argv = sys.argv[sys.argv.index("--") + 1:]
    if argv and argv[0] in ("profile", "test"):
        cmd, path = argv[0], argv[1]
        args = {}
        i = 2
        while i < len(argv):
            if argv[i].startswith("--"):
                args[argv[i][2:]] = argv[i + 1] if i + 1 < len(argv) and not argv[i + 1].startswith("--") else True
                i += 2 if args[argv[i][2:]] is not True else 1
            else:
                i += 1
        if cmd == "profile":
            bpy.ops.wm.read_factory_settings(use_empty=True)
            rig = load(path)
            p = profile(rig, args.get("out"))
            print("PROFILE", json.dumps(p))
        else:
            _test(path, args)
