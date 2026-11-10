# Music and sound effects

Music beds, stingers, UI sounds and SFX with a licence you can prove, plus beat markers to cut on. Pick generated music (ACE-Step 1.5) or a library track; never a track you cannot trace.

## Use when / avoid when

- Use music when the piece has `has_music`, SFX for UI demos, logo stings, transitions that need weight.
- Avoid a SFX on every motion: sound marks the 2–5 moments that matter per 30 s (convention), not each fade.
- Avoid commercial chart music, "free" YouTube rips, or anything without a licence URL. LIC blocks them.

## Setup

| Tool | Licence | Install | Role |
| --- | --- | --- | --- |
| ACE-Step 1.5 | MIT code, MIT weights on HF (2B turbo, XL, 5Hz LM 0.6B and 4B checked) | `git clone https://github.com/ACE-Step/ACE-Step-1.5.git && cd ACE-Step-1.5 && uv sync && uv run acestep-api` (REST on :8001) | Local music generation, 10–600 s, BPM and key control, ≤ 6 GB VRAM with the 2B turbo DiT |
| FluidSynth | LGPL-2.1 (call the binary, do not link statically) | OS package or release binary | MIDI → WAV when Claude composes in MIDI |
| FluidR3_GM.sf2 | MIT (Debian `fluid-soundfont` copyright) | `fluid-soundfont-gm` package or MuseScore download | General MIDI SoundFont |
| beat_this | MIT | `pip install beat-this` | Beats and downbeats |
| librosa | ISC | `pip install librosa` | Tempo, onsets, fallback beat tracker |
| soundcn | MIT registry | `npx shadcn add @soundcn/click-soft` | 700+ UI sounds as TS modules |

Only clearly commercial local music model: ACE-Step 1.5. The others are blocked by default:
⚠️ MusicGen/AudioGen (audiocraft, CC-BY-NC weights), ⚠️ YuE2 (CC BY-NC weights), ⚠️ MMAudio (CC-BY-NC checkpoints), ⚠️ HunyuanVideo-Foley (Tencent licence excludes EU/UK/South Korea), ⚠️ madmom models (CC BY-NC-SA, so do not use `beat_this --dbn` in a commercial build), Stable Audio Open weights (Stability community licence, read it first).

## Libraries and their licences

| Source | Licence | Attribution | Trap |
| --- | --- | --- | --- |
| Pixabay Music / SFX | Pixabay Content License | not required | no standalone resale; tracks may still trigger Content ID claims |
| Freesound | per sound: CC0, CC BY, CC BY-NC (legacy Sampling+) | CC BY: yes | filter to CC0/CC BY; CC BY-NC is ⚠️ NC |
| Kenney audio packs | CC0 | no | none |
| Incompetech (Kevin MacLeod) | Creative Commons, credit required | yes | paste the generated credit |
| YouTube Audio Library | YouTube Audio Library licence or CC per track | CC tracks: yes | YouTube gives no guidance for off-platform use: avoid outside YouTube |
| Openverse audio | per item CC licence | depends | read the licence on each item |
| Mixkit | own per-type free licences | read the licence | not verified here, read before use |
| soundcn | most sounds CC0 (Kenney) | no | ⚠️ the World of Warcraft collection (110 sounds) belongs to Blizzard: never use |

Record every file in `.motion/assets.lock.json` (format in `assets.md`).

## Core patterns

1. **Brief the bed, not the song.** Prompt ACE-Step with genre, instruments, energy curve, BPM and key: "minimal electronic, soft pulse, warm pads, no vocals, builds at 0:20". Set `bpm`, `audio_duration` to the edit length + 2 s, `use_random_seed: false` and a fixed `seed` so a re-render gives the same track.
2. **Cut to the music, or the music to the cut.** Detect beats, then snap scene changes to the nearest beat or downbeat (± 1 frame). Major section changes land on downbeats.
3. **Compose when the piece is short and rhythmic.** Claude writes a MIDI file (mido or a MIDI library), renders it with FluidSynth: deterministic, licence-clean, exact tempo you chose.
4. **SFX lands 0–1 frame after the image** it underlines (AUD); whooshes start before the move and peak on the arrival frame.
5. **UI demos:** soft clicks and toggles from soundcn or Kenney, one sound family per video, no layered "magic" sparkles.
6. **Loops:** cut at zero crossings and crossfade 10–50 ms (convention) to avoid clicks.
7. **Back-time the music instead of cutting it.** Line the track up so its own ending (or its final hit) lands on the end card, and play it as one continuous piece from film frame 0: the film opens mid-track, nothing is looped or spliced. `umd hits music.wav` lists the strong attacks near the end (the "button" is usually a loud attack followed by a big drop: confirm by ear), then `umd mix --music music.wav --hit 96.02 --card 16.0 …` puts that hit on the end-card cut; `--backtime` alone aligns the file's end with the film's end. Clients reject dead stops and spliced hits as "sudden cuts".
8. **Offer tracks by ear.** Claude cannot listen. Mix 3 to 5 back-timed candidates under the same picture at the same loudness, name the files by track, and let the user pick.
9. **Write cues, then measure them.** List each important sound in the storyboard's `## Sound cues` (`6.5s click: cursor press`, `f210 reveal`), place the files with `--sfx file@time`, and run `umd sync <video>`: each attack must start within ±45 ms of its event (AUD-03). The hero moments must stay audible on a laptop speaker with the music on; effects about +4 dB over the music in their own band, never spiking 10 dB at 2–8 kHz.

```bash
# ACE-Step 1.5 REST: submit, then poll /query_result with the task_id
curl -X POST http://localhost:8001/release_task -H "Content-Type: application/json" -d '{
  "prompt": "minimal electronic bed, warm pads, soft kick, instrumental, no vocals",
  "bpm": 112, "audio_duration": 34, "audio_format": "wav",
  "use_random_seed": false, "seed": 1234 }'

# MIDI composed by Claude -> 48 kHz WAV
fluidsynth -ni -F music.wav -r 48000 -g 0.5 FluidR3_GM.sf2 score.mid

# Beats and downbeats (TSV .beats file)
beat_this music.wav -o music.beats
```

```python
import librosa
y, sr = librosa.load("music.wav", sr=None)
tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units="time")  # fallback when beat_this is unavailable
```

## Rendering to video with umd

- Snap the timeline to beats in the scene code (store beat times in `.motion/beats.json`), then render.
- `umd mix --voice voice.wav --music music.wav --sfx whoosh.wav@1.20 --sfx click.wav@3.47 --out mix.wav`: SFX timestamps in seconds; add one frame (1/fps s) to the image time.
- `umd analyze out.mp4` reports scene cuts; compare them with the beat list to prove cuts land on beats.

## Pitfalls

- ACE-Step may sing even when asked for a bed: listen to the full file; regenerate with another seed rather than masking vocals.
- Generated music with an abrupt ending: generate 2 s longer and fade the tail (`audio/mix.md`).
- Beat trackers halve or double tempo on sparse music: check that the detected BPM matches the requested BPM.
- Library tracks registered with Content ID can block monetisation even when the licence allows use: prefer generated or CC0 for client work.
- `umd capture` cannot fix a mismatched sample rate: convert every source to 48 kHz before mixing.

## Checks

- TIM: cuts on beats (scene cuts from `umd analyze` vs beat list).
- AUD: SFX land 0–1 frame after the image (`umd sync`, measured when the storyboard lists cues); no clicks at loop points; no abrupt end; music back-timed rather than faded or cut.
- Loudness range (`lra` in `umd analyze`): an energetic score around 3 LU or more sounds alive, under 1.5 LU reads as a flat wall. Informative only: 6 of the 15 calibration films sit under 3 LU (docs/CALIBRATION.md).
- LIC: every music/SFX file in `assets.lock.json` with licence and URL; `umd licenses` passes; no NC model.

## Sources

- https://github.com/ace-step/ACE-Step-1.5 (README, docs/en/API.md)
- https://github.com/FluidSynth/fluidsynth, https://metadata.ftp-master.debian.org/changelogs/main/f/fluid-soundfont/unstable_copyright
- https://github.com/CPJKU/beat_this, https://github.com/librosa/librosa
- https://github.com/kapishdima/soundcn
- https://pixabay.com/service/license-summary/, https://freesound.org/help/faq/, https://incompetech.com/music/royalty-free/licenses/, https://support.google.com/youtube/answer/3376882
- research_notes/Dépôts motion design pour agents/audio_captions_ai_assets.md
