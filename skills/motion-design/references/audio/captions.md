# Captions

Word-timed captions from a known script (forced alignment) or from audio (ASR), styled for reading, burned in or shipped as a sidecar.

## Use when / avoid when

- Use on every social video (most views start muted) and every narrated piece (`has_captions`).
- Use forced alignment whenever the script is known (TTS voice-over): no transcription errors on brand names.
- Use ASR only for recorded speech without a reliable script.
- Avoid burn-in when the platform shows its own captions from a sidecar and the brief wants accessibility toggles (YouTube, LinkedIn, web players): ship SRT/VTT instead, or both.

## Setup

| Tool | Licence | Install | Gives |
| --- | --- | --- | --- |
| ctc-forced-aligner | BSD-2-Clause code; ⚠️ default model `MahmoudAshraf/mms-300m-1130-forced-aligner` is CC-BY-NC-4.0 | `pip install git+https://github.com/MahmoudAshraf97/ctc-forced-aligner.git` | Script → word times |
| faster-whisper | MIT | `pip install faster-whisper` | ASR, `word_timestamps=True` |
| WhisperX | BSD-2-Clause (diarization model CC-BY-4.0) | `pip install whisperx` | ASR + wav2vec2 alignment |
| whisper.cpp | MIT | build `whisper-cli` | CPU ASR, `-ml 1 -sow -ojf` for word-level JSON |
| whisper-timestamped | ⚠️ AGPL-3.0 | avoid | AGPL: never embed in the plugin or a shipped product |
| pysubs2 | MIT | `pip install pysubs2` | Write SRT/ASS/VTT, karaoke `\k` |
| libass (via FFmpeg `ass`/`subtitles` filters) | ISC | in FFmpeg builds | Burn-in |
| @remotion/captions | ⚠️ Remotion licence (free up to 3 employees, paid company licence above) | `npm i @remotion/captions` | `Caption` type, `createTikTokStyleCaptions()`, `parseSrt()`, `serializeSrt()` |

## `umd captions` input

`words.json`, one object per spoken word, seconds, sorted, no overlaps:

```json
[{"word": "Meet", "start": 0.42, "end": 0.66}, {"word": "Acme", "start": 0.66, "end": 1.05}]
```

```bash
umd captions words.json --out subs.ass --style karaoke --max-chars 32   # styles: karaoke | pop | line
umd captions-check subs.ass words.json                                   # coverage, offset, reading speed
```

## Core patterns

1. **Known script → forced alignment.** Feed the exact script (with the brand spelling) and the voice WAV. For commercial work always pass an Apache-2.0 language model instead of the NC default:
   ```bash
   ctc-forced-aligner --audio_path voice.wav --text_path script.txt --language "fra" --split_size word \
     --alignment_model jonatasgrosman/wav2vec2-large-xlsr-53-french    # English: ...-xlsr-53-english
   ```
   `--language` is ISO 639-3 (`eng`, `fra`); `--romanize` is only needed with the multilingual default model. The JSON output has `segments: [{start, end, text}]`: map `text` → `word`. Words keep the script's spelling, so CAP brand checks pass.
2. **Unknown script → ASR with word timestamps.**
   ```python
   from faster_whisper import WhisperModel
   m = WhisperModel("large-v3", device="cuda", compute_type="float16")
   segs, _ = m.transcribe("voice.wav", language="fr", word_timestamps=True, vad_filter=True)
   words = [{"word": w.word.strip(), "start": w.start, "end": w.end} for s in segs for w in s.words]
   ```
   Pin `language`; never trust auto-detect on music or noise. Then fix brand names against a glossary before captioning.
3. **Readability rules** (thresholds in `referential/scoring.json`):
   - max 2 lines (`caption_lines_max`), ≤ 42 characters per line for subtitles (Netflix Latin-script rule); social word-pop styles use ≤ 32 (`--max-chars`, convention) and often 1 line.
   - reading speed ≤ 17 characters/s (`caption_cps_max`; Netflix allows 20 for adult English and 17 for children's programmes).
   - each event ≥ 20 frames (Netflix: 4/5 s) and ≥ 2 frames gap between events; do not cross a hard scene cut.
   - word offset ≤ 100 ms vs audio (`caption_offset_ms`), coverage ≥ 98 % of words.
   - break lines at syntax, never between article and noun or number and unit.
4. **Styles.** `line` (classic subtitle, bottom third, sentence case), `pop` (1–3 words, scale-in 80–120 ms, convention), `karaoke` (full line, active word colour change via `\k`). One emphasis colour, no emoji per word, no bouncing every word (see `craft/anti-slop.md`).
5. **Safe areas.** Keep captions inside the title-safe area and out of platform UI zones (`craft/composition.md`): on 9:16, lower-middle band above the bottom 35 %, not under the right-side buttons.
6. **Contrast.** White or near-white text, 2–4 px dark outline or a 60–80 % opacity box (convention) over moving footage (`craft/text-on-screen.md`).
7. **Remotion route.** Convert `words.json` to `Caption[]` (`text` with a leading space, `startMs`, `endMs`, `timestampMs: null`, `confidence: null`), then `createTikTokStyleCaptions({captions, combineTokensWithinMilliseconds: 1200})` gives pages; low values give word-by-word pages.

## Rendering to video with umd

- Burn-in (one master for social): `ffmpeg -i out.mp4 -vf "ass=subs.ass:fontsdir=fonts" -c:a copy out-captioned.mp4`. Ship fonts locally in `fonts/` (REN: local fonts).
- HTML route: render captions in the page from `words.json` and let `umd capture` record them; same timings, CSS styling.
- Sidecar: export SRT/VTT with pysubs2 (`pysubs2.load("subs.ass").save("subs.srt")`) and upload it with the video.
- Verify: `umd captions-check subs.ass words.json`, then `umd frames out-captioned.mp4 --at 1,4,8` to see placement.

## Pitfalls

- ASR spells brand names wrong and merges numbers ("2,5 M€"): always run the glossary pass or use alignment.
- Whisper hallucinates text on silence and music: VAD on, language pinned.
- Captions timed to the TTS file drift once beats are re-ordered: realign after any edit of the voice track.
- ASS fonts silently fall back when not found: pass `fontsdir`, check the first frame.
- Upper-case everywhere reads slower; keep sentence case for lines over 3 words.

## Checks

- CAP: coverage, offset ≤ 100 ms, ≤ 2 lines, ≤ 17 chars/s, exact brand spelling: `umd captions-check`.
- TXT and ART: inside safe areas, contrast on moving backgrounds: `umd frames`.
- LIC: no AGPL aligner embedded; Remotion licence fits the team when the Remotion route is used.

## Sources

- https://github.com/MahmoudAshraf97/ctc-forced-aligner, https://github.com/SYSTRAN/faster-whisper, https://github.com/m-bain/whisperX, https://github.com/ggml-org/whisper.cpp (examples/cli)
- https://github.com/linto-ai/whisper-timestamped (AGPL-3.0), https://github.com/tkarabela/pysubs2, https://github.com/libass/libass
- Remotion captions: https://www.remotion.dev/docs/captions/caption, https://www.remotion.dev/docs/captions/create-tiktok-style-captions, licence https://github.com/remotion-dev/remotion/blob/main/LICENSE.md
- Netflix English Timed Text Style Guide and Subtitle Timing Guidelines: https://partnerhelp.netflixstudios.com/hc/en-us/articles/217350977, https://partnerhelp.netflixstudios.com/hc/en-us/articles/360051554394
