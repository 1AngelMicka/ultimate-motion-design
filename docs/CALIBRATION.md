# Calibration of the automatic checks

Date: 2026-11-10 · umd 0.3.0 · FFmpeg 9.0.2 · `umd analyze` on each film, defaults unchanged.

## Reference set: 15 award-level films

The 15 films of [Vincentwei1021/mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15) (MIT): 10 s each, made by Claude Opus 5.5 in code, scored 7 to 8 by an AI jury against award-level criteria, with music and sound. Fourteen in 16:9, one in 9:16. The question: do the automatic checks raise **false alarms** on films people judge excellent?

| Film | Cuts | Frozen > 1 s | Dead air > 3 s | Flashes/s (max) | LUFS | True peak dBTP | Motion: lowest 0.5 s bucket | Mean motion |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 flat vector | 1 | none | none | 1 | −14.1 | −2.3 | 0.4 | 5.6 |
| 02 line art | 0 | none | none | 0 | −14.1 | −1.2 | 0.3 | 0.9 |
| 03 isometric | 0 | none | none | 0 | −14.1 | −1.2 | 0.6 | 8.5 |
| 04 3D render | 0 | none | none | 0 | −14.0 | −1.2 | 0.5 | 8.4 |
| 05 cel boil | 7 | none | none | 1 | −14.0 | −1.8 | 2.2 | 10.2 |
| 06 collage | 5 | none | none | 0 | −14.1 | −2.3 | 1.1 | 3.9 |
| 07 liquid | 0 | none | none | 1 | −14.0 | −2.7 | 0.5 | 3.4 |
| 08 morph | 2 | none | none | 1 | −14.1 | −2.6 | 0.8 | 2.9 |
| 09 Bauhaus | 2 | none | none | 1 | −14.3 | −1.9 | 0.4 | 2.4 |
| 10 synthwave | 2 | none | none | 1 | −14.0 | −3.6 | 3.8 | 8.4 |
| 12 aurora glass | 0 | none | none | 0 | −14.1 | −1.9 | 0.5 | 1.6 |
| 18 hanazi (9:16) | 5 | none | none | 2 | −14.0 | −1.5 | 1.3 | 9.1 |
| 19 paperclip | 0 | none | none | 0 | −14.1 | −1.6 | 0.4 | 5.8 |
| 20 pixel | 4 | none | none | 2 | −14.0 | −1.9 | 0.4 | 5.5 |
| 22 HUD | 0 | none | none | 0 | −14.0 | −1.5 | 0.6 | 2.1 |

**Result: 0 false alarm out of 15** for TIM-01 (dead air), LIF-01 (frozen picture), SAF-01 (flashes), AUD-01 (loudness and true peak) and AUD-04 (leading silence, abrupt end).

## Negative checks: what the thresholds do catch

| Case | Measure | Caught by |
| --- | --- | --- |
| umd's own first demo (text and a thin timeline on a flat background) | dead air 0–3.5 s, frozen 1.5–7 s, motion 0.0–0.1 | TIM-01, LIF-01 (fixed by adding a beat every 0.6 s and a slow camera drift) |
| Synthetic clip: 2 s test pattern then 2 s held frame (`tests/umd.test.mjs`) | frozen ≥ 1.5 s from 2 s | LIF-01 |
| Synthetic 5 Hz full-frame strobe (`tests/umd.test.mjs`) | > 3 flashes/s | SAF-01 |

## What this says about the thresholds

- `motion_floor` 0.4 with `dead_air_s` 3: the calmest award films (line art, Bauhaus, paperclip, pixel) dip to 0.3–0.4 for single 0.5 s buckets but never for 3 s in a row. Kept.
- `freeze_s` 1.0: no reference film holds a fully static picture for 1 s. Kept.
- `flashes_per_s` 3 (WCAG 2.3.1): fast-cut films reach 2. Kept. The measure is full-frame only; localised flashes still need the auditor's eye.
- Loudness −14 LUFS ±1, true peak ≤ −1 dBTP: every reference film sits within −14.3 to −14.0 LUFS and −3.6 to −1.2 dBTP. Kept.
- Not calibrated by this set (no data): VMAF floor (93), caption offset (100 ms) and reading speed (17 chars/s), web smoothness ratio (0.95). They remain conventions; adjust them per project in `thresholds` if your platform specifies otherwise.

## Reproduce

```bash
git clone --depth 1 --filter=blob:limit=2m https://github.com/Vincentwei1021/mg-styles-15
for f in mg-styles-15/videos/*.mp4; do node plugins/umd/scripts/umd.mjs analyze "$f" --out "calib/$(basename "$f" .mp4)"; done
```
