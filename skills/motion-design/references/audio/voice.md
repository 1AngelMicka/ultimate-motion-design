# Voice-over

Script → spoken track. Use a local, commercially licensed TTS.

## Use when / avoid when

- Use for narrated explainers, promos, product demos, any piece with `has_voice`.
- Avoid voice when the brief says "works with sound off" only and captions carry the story; a voice still helps, but never let it be the only carrier of meaning (NAR).
- Avoid cloning a real person's voice without their written consent.

## Setup

| Engine | Licence (code / weights) | French | Run it |
| --- | --- | --- | --- |
| Kokoro-82M (default, light) | Apache-2.0 / Apache-2.0 | 1 voice, `ff_siwis`, `lang_code='f'` | `docker run -p 8880:8880 ghcr.io/remsky/kokoro-fastapi-cpu:latest` (Kokoro-FastAPI, Apache-2.0, OpenAI-compatible) |
| VoxCPM2 (premium, 2B) | Apache-2.0 / Apache-2.0 | yes (30 languages), voice design, cloning, 48 kHz out | `pip install voxcpm` |
| Qwen3-TTS (premium) | Apache-2.0 / Apache-2.0 | yes (10 languages), voice design, 3 s clone | `pip install -U qwen-tts` |
| Pocket-TTS (CPU only) | MIT / ⚠️ CC-BY-4.0 weights (gated on HF) | yes, voice `estelle` | `uvx pocket-tts generate --language french --voice estelle --text "…"` |

- ⚠️ `ff_siwis` is trained on the SIWIS corpus, marked CC BY in Kokoro's VOICES.md: add an attribution line and record it in `assets.lock.json`.
- ⚠️ Pocket-TTS weights are CC-BY-4.0 and each voice has its own licence (see huggingface.co/kyutai/tts-voices): attribution required, check the voice before use.
- Kokoro on Windows needs espeak-ng (MSI from the espeak-ng releases); Kokoro outputs 24 kHz, resample to 48 kHz before the mix (AUD).

### Non-commercial or restricted: off by default

Block unless `.motion/project.json` `license_policy.allow` lists them. See `licenses.md`.

| Model | Problem |
| --- | --- |
| F5-TTS | ⚠️ NC weights (CC-BY-NC) |
| Fish Speech / OpenAudio S2 | ⚠️ Fish Audio licences, S2-Pro research only |
| Higgs Audio v3 | ⚠️ research and non-commercial licence |
| XTTS v2 (coqui) | ⚠️ Coqui Public Model License, non-commercial |
| IndexTTS | ⚠️ custom bilibili licence, read before use |
| NeuTTS | ⚠️ paid licence above a revenue threshold |
| ChatTTS | ⚠️ AGPL-3.0 code |
| Piper (piper1-gpl) | ⚠️ GPL-3.0: fine to call, not to embed |
| Chatterbox | MIT but support ended: usable, not a core dependency |

## Core patterns

1. **Write for the ear first.** One idea per sentence, 8 to 20 words, active verbs, numbers rounded the way people say them ("about two thousand", not "1,987"). Read it aloud once; cut every word you stumble on.
2. **Humanize the script.** Run blader/humanizer (`/humanizer`) or apply `craft/anti-slop.md` phrase bans. No "Let's dive in", "game-changer", "Dans un monde où", "Il est important de noter". NAR fails on AI phrasing.
3. **Pace from words, then measure.** Start from a convention of 140–160 words/min for English narration and a little slower for dense French technical text; these are conventions, not standards. Budget words per beat = beat seconds × 2.5. After synthesis, measure real duration (`ffprobe`) and fix the script, not the speed slider; keep `speed` within 0.9–1.1 (convention: beyond that, prosody degrades audibly).
4. **Brand names and acronyms.** Keep a pronunciation map in `.motion/pronunciations.json` (`{"Kubernetes": "kou-ber-né-tisse"}`). Substitute in the TTS input only; captions keep the exact spelling (CAP). Spell acronyms with spaces or dots when they are letters ("A P I"), leave them whole when they are words ("NASA"). Re-listen to every brand name.
5. **Deterministic synthesis.** Fix seeds (VoxCPM `seed=42`), pin model revisions, render each beat to its own file `voice/beat-03.wav`, then concatenate. Re-render one beat instead of the whole track.
6. **Breaths and pauses.** Insert pauses with punctuation and sentence breaks, not silence padding in code; leave 150–300 ms between beats (convention) so cuts can breathe.
7. **Word timings come free with a known script.** Use Kokoro-FastAPI `/dev/captioned_speech` timestamps when available (English and espeak languages), otherwise forced alignment (`audio/captions.md`).

```python
# Kokoro-FastAPI, French, OpenAI-compatible endpoint
import requests
r = requests.post("http://localhost:8880/v1/audio/speech",
  json={"model": "kokoro", "voice": "ff_siwis", "input": open("script/beat-01.txt").read(),
        "response_format": "wav", "speed": 1.0})
open("voice/beat-01.wav", "wb").write(r.content)
```

```python
# VoxCPM2 with voice design and a fixed seed
from voxcpm import VoxCPM
import soundfile as sf
m = VoxCPM.from_pretrained("openbmb/VoxCPM2", load_denoiser=False)
wav = m.generate(text="(Voix féminine posée, chaleureuse)Bienvenue.", cfg_value=2.0,
                 inference_timesteps=10, seed=42)
sf.write("voice/beat-01.wav", wav, m.tts_model.sample_rate)
```

## Rendering to video with umd

- Concatenate beats, then `umd mix --voice voice.wav --music music.wav --out mix.wav` (see `audio/mix.md`).
- Pass the mix to capture: `umd capture scene.html --out out.mp4 --audio mix.wav`.
- Measure: `umd loudness mix.wav`; then `umd analyze out.mp4` reports loudness of the final file.

## Pitfalls

- Long inputs rush or drift: Kokoro works best around 100–200 tokens per call (VOICES.md). Synthesize per sentence or per beat.
- Kokoro has a single French voice of grade B-; for a flagship French piece prefer VoxCPM2 or Qwen3-TTS and A/B a beat.
- Numbers, dates, units and currencies read wrong: write them out in the TTS input ("vingt-trois euros").
- Clipping from hot TTS output: normalise each beat to about −20 LUFS before the mix (convention), never boost the master to fix it.
- A cloned voice is personal data: keep consent and source recording outside the repo.

## Checks

- NAR: script free of AI phrasing (humanizer pass, `umd lint` slop words).
- AUD: clear voice, 48 kHz, no clipping, no abrupt start/end: `umd loudness`, `umd analyze` (loudness, silence edges).
- CAP: exact brand spelling comes from the script, not ASR.
- LIC: voice model and voice listed in `.motion/assets.lock.json`; `umd licenses` passes.

## Sources

- https://github.com/hexgrad/kokoro, https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md
- https://github.com/remsky/Kokoro-FastAPI
- https://github.com/OpenBMB/VoxCPM, https://github.com/QwenLM/Qwen3-TTS
- https://github.com/kyutai-labs/pocket-tts, https://huggingface.co/kyutai/pocket-tts
- https://github.com/blader/humanizer
- research_notes/Dépôts motion design pour agents/audio_captions_ai_assets.md (licence checks, 2026-11-09)
