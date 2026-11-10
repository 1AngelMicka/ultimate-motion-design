# Mix and loudness

Voice, music and SFX into one 48 kHz track at the destination's loudness. `umd mix` does the default job; this file explains the numbers and the manual route.

## Use when / avoid when

- Use for every deliverable with `has_audio`. Mix last, after picture lock.
- Avoid normalising stems individually to the final target and summing them: the sum overshoots. Normalise the mix, not the parts.

## Setup

| Tool | Licence | Use |
| --- | --- | --- |
| FFmpeg (`sidechaincompress`, `loudnorm`, `afade`, `adelay`, `amix`, `ebur128`) | LGPL/GPL depending on build | Ducking, fades, normalisation, measurement |
| ffmpeg-normalize | MIT (PyPI), `pip install ffmpeg-normalize` | Two-pass EBU R128 normalisation |
| pyloudnorm | MIT, `pip install pyloudnorm` | ITU-R BS.1770 measurement in Python |
| pedalboard (Spotify) | ⚠️ GPL-3.0 | Compressor, EQ, limiter. Calling it to produce audio is fine; bundling its code in a redistributed plugin or app puts that product under GPL |

## Loudness targets

| Destination | Integrated | True peak | Status |
| --- | --- | --- | --- |
| Default umd (web, social, YouTube) | −14 LUFS ±1 | ≤ −1 dBTP | Convention. Spotify documents −14 LUFS / −1 dBTP; YouTube, TikTok, Instagram do not publish a target |
| Broadcast Europe (EBU R128) | −23 LUFS ±0.5 LU (±1 LU live) | ≤ −1 dBTP | Standard |
| Broadcast US (ATSC A/85) | −24 LKFS | −2 dBTP | Standard |
| Presentation embed, kiosk | −16 to −14 LUFS | ≤ −1 dBTP | Convention; rooms are loud, keep the voice forward |
| Web hero video | muted; if it has sound, −14 LUFS | ≤ −1 dBTP | Convention |

Thresholds live in `plugins/umd/referential/scoring.json` (`loudness_lufs`, `loudness_tolerance_lu`, `true_peak_dbtp`) and can be overridden in `.motion/project.json` `thresholds`.

## Core patterns

1. **Gain staging before processing.** Convert all stems to 48 kHz, 24-bit or float. Bring voice to about −20 LUFS, music bed 8–12 LU under the voice when they overlap, SFX by ear (conventions). Leave headroom; the final normaliser sets the level.
2. **Voice chain** (convention): high-pass ~80 Hz, gentle compression 2:1–3:1, de-ess if sibilant, limiter at −1 dBTP. Recorded voice: denoise first.
3. **Ducking.** Music dips under speech and comes back between sentences. Default `umd mix --duck 9` (dB of reduction). Attack 20–50 ms, release 300–600 ms (convention) so the music does not pump between words.
4. **Fades.** No hard start or stop: 20–50 ms fade-in on every clip head, 0.5–2 s fade-out on music at the end (convention). The last sound ends with the last frame, not after it (AUD, `silence_edge_max_s`).
5. **SFX timing.** Place each SFX 0–1 frame after the image event (AUD). At 30 fps one frame is 33.3 ms; at 60 fps 16.7 ms.
6. **Normalise the final mix in two passes**, then measure again. Never trust a single-pass `loudnorm` on short clips.

```bash
# Default: voice + music with ducking + SFX, normalised to -14 LUFS / -1 dBTP
umd mix --voice voice.wav --music music.wav --sfx whoosh.wav@2.033 --out mix.wav --duck 9
umd loudness mix.wav
```

```bash
# Manual ducking with FFmpeg: music (main) is compressed by the voice (sidechain)
ffmpeg -i voice.wav -i music.wav -filter_complex \
 "[0:a]asplit=2[v][sc];\
  [1:a]afade=t=in:d=0.05[m];\
  [m][sc]sidechaincompress=threshold=0.03:ratio=8:attack=30:release=450[duck];\
  [v][duck]amix=inputs=2:normalize=0:duration=longest,afade=t=out:st=28.5:d=1.5[out]" \
 -map "[out]" -ar 48000 -c:a pcm_s24le premix.wav

# Two-pass loudness normalisation
ffmpeg-normalize premix.wav -t -14 -tp -1 -ar 48000 -c:a pcm_s24le -o mix.wav
# or: umd normalize premix.wav mix.wav --lufs -14 --tp -1
```

```python
import soundfile as sf, pyloudnorm as pyln
data, rate = sf.read("mix.wav")
print(pyln.Meter(rate).integrated_loudness(data))   # expect -14 +/- 1
```

- `sidechaincompress` input 0 is the signal to compress, input 1 the key: split the voice so it is both heard and used as key.
- `amix` normalises inputs by default (`normalize=1`), which drops the level: set `normalize=0` and control gains yourself.
- Delay an SFX with `adelay=delays=1233:all=1` (milliseconds) before mixing.

## Rendering to video with umd

- Mux at capture time: `umd capture scene.html --out out.mp4 --audio mix.wav`, or `umd render` when `.motion/project.json` points to the mix.
- Prove it on the final file, not the WAV: `umd analyze out.mp4` reports loudness; the AAC encode can raise true peak, which is why the target is −1 dBTP and not 0.

## Pitfalls

- True peak overs after AAC/Opus encoding: keep −1 dBTP (Spotify advises −2 dBTP if the master is louder than −14 LUFS).
- Pumping music: release too short or ratio too high; listen at the gaps between sentences.
- Mono voice panned hard to one side after a bad conversion: check channel layout with `ffprobe`.
- 44.1 kHz stems resampled several times: convert once to 48 kHz at the start.
- Loudness of very short clips (< 3 s) is unreliable under BS.1770 gating: judge stingers by true peak and ear.

## Checks

- AUD: integrated −14 LUFS ±1 and true peak ≤ −1 dBTP (`umd loudness`, `umd analyze`), ducking audible under voice, SFX offset 0–1 frame, no abrupt start or end, 48 kHz.
- LIC: pedalboard not shipped inside a redistributed product without GPL compliance.

## Sources

- EBU R 128: https://tech.ebu.ch/docs/r/r128.pdf
- ATSC A/85: https://www.atsc.org/atsc-documents/a85-techniques-for-establishing-and-maintaining-audio-loudness-for-digital-television/
- Spotify loudness normalization: https://support.spotify.com/us/artists/article/loudness-normalization/
- FFmpeg filters: https://ffmpeg.org/ffmpeg-filters.html (sidechaincompress, loudnorm, amix, afade, adelay)
- https://github.com/slhck/ffmpeg-normalize, https://github.com/csteinmetz1/pyloudnorm, https://github.com/spotify/pedalboard
