# Sound and music

A motion piece is judged by ear as much as by eye. The plugin treats sound like picture: written in the storyboard, timed on picture events, measured, and with a licence for every file.

## The four layers

- **Voice** carries the message; the mix aims at −16 to −14 LUFS, voice in front.
- **Music** gives energy and the cut rhythm; it ducks about 9 dB under the voice and ends on the end card (`umd mix --backtime`).
- **Effects** make events physical: an arrival, a click, a reveal. Two to five marked moments per 30 s, not one sound per move.
- **Room tone** is a very low air bed, so a pause never sounds like a dropout.

## Listen to the palette

`umd sfx <kind>` makes these sounds with FFmpeg: nothing to download, no licence to track, the same file for the same settings. Vary `--dur`, `--seed` and `--gain` so a repeated sound does not read as stock.

@@SFX@@

## Which sound on which event

| On screen | Sound | Timing |
| --- | --- | --- |
| An element slides or enters | `swipe` or `whoosh` | Starts 2 to 4 frames before, peaks on the arrival |
| Build-up to a reveal | `riser` | Ends exactly on the reveal frame |
| Hero moment, logo landing | `impact` + `subdrop` | Attack 0 to 1 frame after the picture |
| Tail after the reveal | `shimmer` or `chime` | Starts with the impact, rings over the hold |
| Cursor press, toggle | `click` | On the press frame |
| Icon or badge appears | `pop` | On the first visible frame |
| Counter stepping | `tick` | One per step, up to 12 per second |
| Digital cut | `glitch` | Over the cut |

Each sound goes in the storyboard's `## Sound cues` with its time; `umd sync` checks it lands within ±45 ms of its picture.

## Find free sounds and music

```bash
umd sounds whoosh --cc0 --max 3
```
```bash
umd sounds get <id>
```
```bash
umd sounds ambient --music --limit 5
```

`umd sounds` searches Freesound and Wikimedia Commons (effects) or Jamendo (music) through Openverse, keeping only CC0, CC BY and public domain. `get` downloads the file as 48 kHz WAV and records the author, licence and credit line in `.motion/assets.lock.json`. For CC BY music the credit line goes in the description or the end credits: `umd licenses` lists them.

For tailored music: ACE-Step 1.5 (MIT) locally, or a MIDI score written by Claude and rendered with FluidSynth. Never chart music, tracks ripped from video platforms, or a non-commercial licence.

## By project type

| Project | Music | Effects |
| --- | --- | --- |
| Promo, launch | Leads the edit, cuts on beats | Impacts on reveals, one riser into the hero moment |
| Presentation, explainer | A calm bed under the voice | Few: clicks, pops, ticks on step changes |
| Vertical short | A hook in the first half-second | Few and punchy; captions carry the message when muted |
| Logo animation | A 2 to 8 s sting | Riser, impact, a tail ringing over the held logo |
| Short film | Score with silences | Foley and ambiences per place |
| Web page | None by default | Short UI sounds, off until the user turns them on |
| 3D shot | Supports the material | Foley that matches the material: glass, metal, plastic |

The full guide, for the agent: `references/audio/sound-design.md`.
