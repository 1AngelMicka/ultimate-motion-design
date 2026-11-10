# Sound design: from picture events to a finished soundtrack

How to give a motion piece its sound: what each kind of project needs, which sound goes on which picture event, where to get the files with a clean licence, and how to place, mix and check them. The detailed guides stay next to this one: voice in [voice.md](voice.md), music and libraries in [music-sfx.md](music-sfx.md), levels and ducking in [mix.md](mix.md), captions in [captions.md](captions.md).

## Use when / avoid when

- Use for every video with `has_music`, `has_voice` or sound effects, from the storyboard on: sound is written next to the picture, not added at the end.
- Use for web pages only when the brief asks for sound: UI sounds start muted, behind a visible toggle, and never play before a user gesture.
- Avoid filling every move with a sound: 2 to 5 marked moments per 30 s carry a film; the rest is music, room tone and silence.

## The four layers

| Layer | What it does | Typical level in the mix |
| --- | --- | --- |
| Voice | Carries the message | Integrated around −16 to −14 LUFS for the whole mix, voice on top |
| Music | Energy, emotion, the cut rhythm | Ducked about 9 dB under the voice ([mix.md](mix.md)) |
| Effects | Make picture events physical: arrivals, presses, reveals | About +4 dB over the music in their own band, short |
| Room tone | A quiet bed so a pause never sounds like a dropout | Around −45 to −50 dBFS, felt rather than heard |

## What each project type needs

| Project type | Music | Effects | Voice | Watch out for |
| --- | --- | --- | --- | --- |
| Promo, product launch | Leads: cut on beats and downbeats, back-timed so its ending lands on the end card | Hits on reveals, swipes on UI moves, one riser into the hero moment | Optional, short lines | Content ID on library tracks; a dead stop at the end |
| Presentation | A calm bed under the voice | Few: clicks on product actions, a chime at the end | Leads | Music fighting the voice: duck, then carve 2–5 kHz |
| Explainer | Light, steady, low | Ticks on counters, pops on icons, clicks on diagrams | Leads; words timed for captions | Sound on every element: keep it to the step changes |
| Vertical short (social) | A hook in the first half-second, energetic | Punchy, few | Often | Most viewers start muted: captions carry the message, sound rewards those who unmute |
| Logo animation | A sting: 2–8 s | Designed: riser → impact (+ sub drop) → tail (shimmer or chime) | No | The last note must ring out over the held logo, not cut |
| Animated short film | Score with silences | Foley (steps, cloth, objects) and ambiences per place | Characters, narration | Silence is a tool: drop the music before the biggest moment |
| Animated web page | None by default | UI sounds ≤ 150 ms, soft, one family, off until enabled | No | Autoplay rules: no sound before a click; respect a mute preference |
| 3D shot | Supports the material | Material foley: glass rings, metal clanks, plastic ticks; air for camera moves | Optional | A generic whoosh on a glass object sounds wrong: match the material |

## Picture event → sound

Write each line in the storyboard's `## Sound cues` with its time; `umd sync` then measures that each attack lands on its event (±45 ms).

| Picture event | Sound | `umd sfx` kind | Timing |
| --- | --- | --- | --- |
| Element slides or flies in | Swipe or whoosh | `swipe`, `whoosh` | Starts 2–4 frames before the move; peaks on the arrival frame |
| Camera move, fly-through, transition | Whoosh, air | `whoosh` (longer `--dur`) | Peak on the cut or the arrival |
| Build-up to a reveal | Riser | `riser` | Ends exactly on the reveal frame; nothing after it but the hit |
| Hero reveal, logo landing, beat drop | Impact, with sub drop under it | `impact` + `subdrop` | Attack 0–1 frame after the picture |
| Tail after a reveal | Shimmer or chime | `shimmer`, `chime` | Starts on the hit, rings over the hold |
| Cursor press, toggle, key | Click | `click` | On the press frame |
| Icon, badge, bubble appears | Pop | `pop` | On the first visible frame |
| Counter or list stepping | Tick per step | `tick` | One per step up to about 12 per second, then a continuous roll |
| Success state, notification | Chime | `chime` | On the state change |
| Glitch cut, error, digital transition | Glitch | `glitch` | Over the cut, 2–6 frames |
| Pause before the big moment | Room tone only | `roomtone` | Music out; the next sound is the reveal |

Vary repeated effects so they do not read as stock: another `--seed`, a slightly different `--dur` or `--gain`, or two library takes. Name the moves with `umd moves` in the storyboard; the sound column follows the same names.

## Where the files come from

In this order, each one recorded in `.motion/assets.lock.json` the moment it enters the project:

1. **`umd sfx <kind>`**: synthesised by FFmpeg, deterministic, your own files (no licence to track). Good for drafts and for clean UI and motion-graphics cues; less character than a recorded sound. `umd sfx` alone lists the kinds.
2. **`umd sounds <words>`**: recorded effects from Freesound and Wikimedia Commons through Openverse, filtered to CC0, CC BY and public domain only. `--cc0` keeps CC0 alone (no credit to manage); `--max 3` keeps short sounds. `umd sounds get <id>` downloads it as 48 kHz WAV with its credit line.
3. **`umd sounds <mood> --music`**: tracks from Jamendo under CC BY (credit in the description or the end credits). One mood word works best; with several words that match nothing together, the search goes word by word. Offer 3 to 5 back-timed candidates under the picture and let the user choose by ear ([music-sfx.md](music-sfx.md)).
4. **Generated or composed music**: ACE-Step 1.5 (MIT) or a MIDI score rendered with FluidSynth, when the piece needs exact tempo, length or a mood the libraries miss ([music-sfx.md](music-sfx.md)).
5. **UI packs**: Kenney audio packs (CC0) and soundcn (mostly CC0) for interface sounds on web pages.

Never: chart music, tracks ripped from video platforms, non-commercial (NC) or no-derivatives (ND) licences, or a file without a source URL. The licence guard refuses them.

## Cue sheet

In `.motion/storyboard.md`:

```
## Sound cues
0.00s roomtone: air bed (whole film, -48 dBFS)
1.10s swipe: card enters from the left
3.47s click: cursor presses "Generate"
5.20s riser: into the reveal (ends 7.00s)
7.00s impact: product revealed
7.00s subdrop: under the impact
7.02s shimmer: tail over the hold
```

## Rendering to video with umd

```bash
umd sfx swipe --out assets/audio/swipe.wav
umd sfx riser --dur 1.8 --out assets/audio/riser.wav
umd sounds glass impact --cc0 --max 3        # pick one, then:
umd sounds get <id> --name glass-hit
umd sounds ambient --music --limit 5          # audition, then get two or three candidates
umd mix --voice audio/voice.wav --music assets/audio/<track>.wav --backtime \
  --sfx assets/audio/swipe.wav@1.10 --sfx assets/audio/riser.wav@5.20 --sfx assets/audio/glass-hit.wav@7.00 --out audio/mix.wav
umd render && umd sync .motion/renders/<id>/video.mp4   # every cue within ±45 ms of its event
umd licenses                                              # attribution_required lists the credit lines to publish
```

## Pitfalls

| Breaks | Fix |
| --- | --- |
| A sound on every motion | Keep 2–5 marked moments per 30 s; let the music carry the rest |
| The same whoosh ten times | Vary seed, length and gain, or use two library takes |
| Effects late by a few frames | Attack 0–1 frame after the picture; whooshes start before the move; check with `umd sync` |
| Music and voice fighting | Duck 9 dB, then dip the music 2–5 kHz under the voice |
| Logo sting cut short | Let the tail ring over the held logo; back-time the music |
| CC BY music without credit | Copy the credit line from `assets.lock.json` into the description or the end credits |
| Library track blocked by Content ID | Prefer CC0, generated or composed music for client work |
| Sound on a web page that plays by itself | Off by default, a visible toggle, nothing before a user gesture |

## Checks

- **AUD-03**: each listed cue lands within ±45 ms of its picture event (`umd sync`).
- **AUD-07**: hero moments are layered (riser, impact, tail) and the music leaves room for them.
- **AUD**: loudness on target, no clipping, no abrupt end (`umd analyze`).
- **LIC**: every sound in `assets.lock.json` with source, licence and author; credit lines published for CC BY (`umd licenses`).

## Sources

- https://api.openverse.org/v1/ (audio search: sources Freesound, Wikimedia Commons audio, Jamendo; licence and length filters; ready attribution text; 20 results per anonymous page)
- https://creativecommons.org/licenses/by/4.0/ and https://creativecommons.org/publicdomain/zero/1.0/
- https://ffmpeg.org/ffmpeg-filters.html (anoisesrc, aevalsrc, apulsator, alimiter, acrusher)
- Picture-event timings: [music-sfx.md](music-sfx.md) (attack 0–1 frame after the image), AUD-03 tolerance from the referential
