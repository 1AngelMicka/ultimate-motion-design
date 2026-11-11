# Characters: where they come from, how to animate them

A character that acts badly ruins a good film faster than any other flaw. Characters drawn in code (primitives, hand-made SVG faces) often look stiff. This guide gives the agent real characters, free and usable in commercial work, and one way to animate any of them.

## Use it when / instead

| Use it when | Instead |
|---|---|
| A person, mascot, animal or creature appears on screen | No character needed: objects, hands, cursors, silhouettes, type (`recipes/concepts.md`) |
| The brief names a character the user owns (a brand mascot) | Ask for the files; record them with `umd characters add` |

## 1. Choose (no tokens)

`umd characters [words] [--dims 3d|2d] [--style …] [--age child|senior…] [--face visemes|full] [--kind …] [--route blender|threejs|html]`

- It searches `references/characters/catalog.json` (about 40 sources, tools and kits) and three live lists read at search time: **Mesh2Motion** (9 rigs including animals and creatures, about 330 CC0 clips), **KayKit** (CC0 chibi packs with 76 embedded actions) and **Open Source Avatars** (about 4,000 VRM avatars, including 300 CC0 100Avatars with visemes). French words work (`enfant qui parle`, `dragon`, `foule`, `manga`).
- `umd characters` with no words lists everything, plus what is excluded and why.
- `umd characters info <id>` shows an entry in full.
- Only free sources usable in client work are listed. Excluded: non-commercial data (Bandai Namco, LAFAN1, SFU, SMPL-X), AGPL and share-alike assets, paid tools, and files that may not be redistributed (Mixamo). Generated 3D goes through the director route only, with the user's consent.

| Need | First picks |
|---|---|
| Hero in close-up who acts and speaks (film look) | `blender-studio-rain`, `blender-studio-snow` (CC BY, full face rig) |
| A family, a cast from baby to senior, a crowd | `mpfb2` (generator, CC0 core assets), `100avatars` |
| Anime or manga | `vroid-samples`, `vroid-studio`, `osa-collections` |
| Low-poly, chibi, toy, game look | `kaykit-adventurers`, `kaykit-skeletons`, `kenney-characters`, `quaternius-characters` |
| Animals, creatures, monsters | `mesh2motion` (fox, horse, dragon, spider, shark, snake, bird, kaiju) |
| Realistic adult with a full face rig | `charmorph` (Vitruvian CC0 or Antonia CC BY), `mpfb2` |
| 2D explainer people | `open-peeps`, `humaaans`, `kenney-2d`, `dicebear`, then `svg-puppet` |
| Mascot with bones and states in 2D | `rive-community`, `grease-pencil`, `coa-tools2` |
| Body motion | `mesh2motion-clips`, `cmu-mocap`, `100style` (100 walking styles), `quaternius-ual` |
| Lip sync | `rhubarb` (`umd lipsync`) |
| Wide choice, by hand | `sketchfab-cc`, `poly-pizza`, `opengameart-3d` (licence per model: CC0 and CC BY only) |

With `style_choice: "ask"`, show the user 3 candidates with their preview or page; with `"auto"`, take the first that fits the style card and say why.

## 2. Get it and record its licence

- `umd characters get <id>` downloads into `assets/characters/<id>/` and records licence, author, credit and date in `.motion/assets.lock.json`. A zip is extracted into its own folder, recorded as one folder entry.
- Some sources have no direct link (Kenney, VRoid, Quaternius, Sketchfab, Poly Pizza: their terms or their site require a manual download). The user downloads the file, then `umd characters add <file or folder> --id <entry> [--licence CC-BY-4.0 --author name --url page]`. Non-commercial, no-derivatives, share-alike and AGPL licences are refused.
- CC BY: the credit line goes in the end credits or the description (`umd licenses` lists every asset that needs one). Blender Studio: never name the character or its film in an advert.
- Keep the files of Quaternius and QAL packs out of public repositories (their licence allows use in products, not redistribution of the files).

## 3. Profile: what this rig can really do

`blender -b --factory-startup -P ${CLAUDE_PLUGIN_ROOT}/templates/blender/character.py -- profile <file> [--out .motion/characters/<id>.json]`

The profile maps the bones to canonical names (hips, spine, chest, neck, head, eyes, jaw, arms, legs), recognises the family (Mixamo, MotionBuilder and CMU BVH, 100STYLE, VRoid, Unity humanoid, Unreal, MPFB and Mesh2Motion, KayKit, Rigify, Blender metarig, else by meaning), finds blink and mouth shape keys (visemes, VRM vowels, ARKit) and lists the actions the file carries. Its `can` and `cannot` lists are binding. **Never write a gesture the rig cannot do.** A painted face cannot speak: give it a body gesture or a cut instead.

## 4. Character test shot (a gate, before the storyboard stills)

`blender -b --factory-startup -P …/character.py -- test <file> --out-dir .motion/characters/test [--action Idle] [--motion walk.bvh] [--lipsync .motion/lipsync/voice.json] [--engine eevee|cycles]`

The test shot is 4 s: the character breathes, looks at a product (eyes first, head 8 frames later), blinks, speaks if a lip-sync file is given and plays an action or a retargeted motion. Show the frames to the user with the profile before building the stills. If the character does not hold up here, change the character, not the shot. Optionally, compare EEVEE and Cycles on the same frames (gaze direction, hand contact, materials).

## 5. Animate (Blender)

Import `character.py` as a module in the shot script:

```python
import sys; sys.path.insert(0, r"<plugin>/templates/blender"); import character as ch
rig = ch.load("assets/characters/kaykit-knight/Knight.glb"); ch.rest(rig); ch.hide_props(rig)
p = ch.profile(rig)
ch.play(rig, "Unarmed_Idle", 1, repeat=8)          # an action the rig carries (NLA strip)
ch.breathe(rig, p, 1, 240)                         # idle layer: nothing is ever frozen
ch.look_at(rig, p, product, 60, 150)               # eyes lead, head follows 8 frames later
ch.blink(rig, p, 40); ch.blink(rig, p, 130)
ch.mouth_from_lipsync(rig, p, ".motion/lipsync/voice.json", 90)
src = ch.load("assets/characters/cmu/02_01.bvh"); ch.retarget(src, rig, 2, 400, dst_profile=p, step=ch.bvh_fps(path) / 30)
```

- **Retarget** copies each canonical bone's rotation relative to its own rest pose, so a T-pose clip lands on an A-pose rig. The hips move by the leg-length ratio. It is faithful to the source, and that is the point to watch: a clip made for chibi proportions (KayKit) looks odd on a realistic body, so take human motion (CMU, 100STYLE, Mesh2Motion human) for human bodies and keep stylised clips on their own rigs.
- **BVH**: CMU runs at 120 fps and 100STYLE at 60, so pass `step = fps_source / fps_film`. The first frame of a CMU conversion is a T-pose; start at the second.
- **Mesh2Motion clips** are meshopt-compressed GLB: three.js reads them (MeshoptDecoder); Blender 5.1's glTF importer does not. In Blender, use their rig `.glb` (not compressed) and take motion from BVH or another rig.
- **FBX** from Unity or Mixamo: `load` applies the 0.01 scale and repairs materials that arrive with Alpha 0 (invisible). It prints `MISSING TEXTURES` when the FBX does not carry them: 100Avatars keeps its textures in the VRM, so prefer the VRM (it needs the VRM add-on).
- Speech: `umd lipsync voice.wav --text script.txt` writes `.motion/lipsync/<name>.json` (Rhubarb, MIT; the phonetic recogniser for any language other than English). Mouth shapes switch on Rhubarb's cues. A shape the rig lacks borrows a near one at a lower weight, and a rig with only a jaw bone opens it by the shape's amount.

## 6. Animate (HTML, 2D)

`templates/html/puppet.html` is a cut-out puppet on the virtual clock. It breathes, blinks, looks (eyes before the head), gestures from a list of beats, and speaks from the same lip-sync JSON. Swap its parts for your drawing (Open Peeps, Humaaans, Kenney 2D, DiceBear faces): one group per part with its pivot. It passes `umd still --seek-check` because every frame is a pure function of `t`.

## Checks

- [ ] The character comes from the catalogue or the user, and is recorded in `assets.lock.json` with its licence (CC BY with its credit line).
- [ ] The profile is saved; every gesture in the storyboard is in its `can` list.
- [ ] The test shot was shown to the user before the stills.
- [ ] Eyes lead the head by 6 to 10 frames; breathing or an idle runs in every hold; blinks every 2 to 5 s.
- [ ] Speech: mouth shapes from `umd lipsync`, voice mixed with the same file, `umd sync` on the first syllables.
- [ ] No retargeted motion across very different proportions without a look at the frames.
