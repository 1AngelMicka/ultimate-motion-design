# Motion grammar of premium launch films

What separates a launch film people share from a sequence of nicely animated slides. Rules adapted from [echris6/motion-video-kit](https://github.com/echris6/motion-video-kit) (MIT), whose author analysed 28 professional SaaS launch films and ran dozens of independent critique rounds with real clients; the shot-as-event method follows beamnxw's "Motion Engineering with Opus 5.5" (X, 2026-10). Read it when writing the storyboard and before each critique round.

## Use when / avoid when

- Use for promo, launch, product demo, explainer and presentation films; most rules also hold for logo stings and animated pages.
- Character films (route film) follow `principles.md` first; keep rules 2, 4 and 6 here.

## Six rules

1. **The foreground carries the transition.** The headline, logo or a shape travels through the camera (scale up, directional blur) while the next scene is already in place behind it. No empty frame between scenes.
2. **One actor persists.** A cursor, a card, a photo, a line or a shape keeps its identity across shots and leads the eye. Unrelated reveals one after another read as a slideshow, however polished each one is.
3. **Density comes from hierarchy, not from quantity.** One primary move (camera or hero object), supporting staggers (cards, labels), fine tertiary detail (an edge sweep, a status tick), overlapping in time. Never start and stop the whole frame on every beat.
4. **Change speed.** Readable target → fast exit → slowing arrival. Motion eases into a landing so the eye can read, then leaves quickly. A constant drift is the signature of a template.
5. **A hard cut is fine when it matches.** Same subject, scale, direction or material on both sides, and motion that continues through the cut. Dissolves everywhere are not "smooth", they are vague.
6. **Every action produces a visible result.** A scan produces findings, a prompt produces an artefact, a press produces a new state. Write the product shot as an event: starting state → cursor on the control → the press registers → the result appears → the result holds long enough to read.

## Composition

- In feature beats the lead subject fills 60 to 85 % of the usable frame. Empty bands read as cheap.
- Vary the composition type from beat to beat: macro detail, wide dimensional, overhead plan, interface close-up, typographic impact. Never "title above three cards" twice.
- One or two reading targets at a time. Dense does not mean everything competes.
- Type is choreography: big words enter on opposing axes, mask or reveal the next scene, and never sit over busy footage without a backing.
- Hand objects across scenes at exact pixel coordinates: the next scene's destination is placed so the carried object lands on it.
- In a run of similar shots keep one wipe direction and one title position. The outgoing title leaves before the wipe, the incoming one enters after it.

## Reusable mechanisms

| Mechanism | What it does |
| --- | --- |
| Foreground fly-through | A claim or logo scales past the camera and reveals a scene already in place |
| Logo as portal | The brand shape grows until its counter (the hole) becomes the next frame |
| Selection → expansion | A selected item expands into the detailed workspace of the next beat |
| Materialising result | A shell appears, then its regions fill in reading order |
| Persistent rails | Lines or paths survive a text change and connect two states |
| Continuous canvas | The camera travels over one spatial layout; the selected item stays sharp, neighbours blur |
| Artefact ring | Small artefacts orbit one stable central sentence |
| Card stack or fan | Screens arrive and occlude; one card becomes a collection, or the reverse |
| Perspective fold | A panel folds into a bright strip; the next panel rises from it |
| Exploded layers | A product separates into its physical layers, then recombines |
| Registered decomposition | The source stays recognisable while regions lift out into categories |
| Wall → one actor | Information overload collapses to one clear subject |
| Carousel emphasis | A rotating list with one bright active item and receding neighbours |
| Request → picker → confirmation | A message anchors while a sheet rises, a choice is made, the state confirms |
| Colour-field takeover | A soft gradient fills the frame for a brand handoff (once per film, not as the vocabulary) |
| Tile wipe | A grid of tiles as a chapter break (sparingly) |

## Pacing for a 30 s business film

- About 12 to 15 compositions, beats of 1.4 to 3.5 s, no motionless stretch over about 0.6 s.
- Frame 0 is a finished composition, never a half-entered word.
- Reading holds only on the frames that carry the message (the result, the call to action); even there a slow 3 to 5 % push keeps it alive.
- End card readable for about 1.5 to 2 s, with a gentle drift. `umd analyze` excludes the last `end_card_s` seconds from the near-still budget (LIF-05).
- Count a reading hold from the frame where the words become legible, not from the start of their entrance. Read the line aloud at normal speed: if the hold ends first, extend it.

## Write the timeline in frames

Decide in seconds, then convert at the project's fps (0.6 s = 18 frames at 30 fps) and write global frame numbers in the storyboard: entrance, landing, press, reveal, legible, cut. Name every value (offset, destination, duration, landing spring) once, in the tokens or a constants block, so a revision touches one place. Label a scene-local frame explicitly when a sequence starts later (local 30 in a sequence starting at 120 = global 150).

## Lay out for the longest copy

Check the opening layout with the longest headline you expect to reuse. If it wraps past the planned number of lines, stop the motion pass: shorten the copy, widen the box, or move the extra information to another beat. Record the limits beside the style: available width, maximum lines, space reserved for the logo, final positions. After any copy change, re-render the landing frame before judging the entrance.

## Checks critics tend to miss (and clients catch)

- Text over text in the middle of a crossfade or wipe. Look at the frames around every cut (`umd frames <video> --cuts`), not only settled frames.
- A state label that contradicts the values on screen ("Open" while a number counts down).
- Dead bands in glanceable layouts; a big number not centred between its label and its bar.
- A first shot that lingers, or a dark, moody opener for a consumer brand.
- Hero moments that are inaudible under the music on a laptop speaker, or effects that spike harshly at 2 to 8 kHz.
- Music that stops dead or is spliced: back-time it instead (`audio/music-sfx.md`).

## Sources

- echris6/motion-video-kit, `references/motion-grammar.md`, `quality-bar.md`, `gauntlet.md` (MIT): https://github.com/echris6/motion-video-kit
- beamnxw, "Motion Engineering with Opus 5.5: Build Launch Videos You Can Sell" (X article, 2026-10-09): https://x.com/beamnxw/status/2108616740846420354
