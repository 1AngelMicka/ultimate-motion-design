# Licence policy

How umd classifies every dependency, model and asset, what each class means for a commercial deliverable, and how `umd licenses` and the install guard enforce `.motion/project.json`. This is engineering guidance, not legal advice; when money or a client contract depends on it, the user should read the licence or ask a lawyer.

## Use when / avoid when

- Read at kickoff (set the policy), before installing anything, and before `umd deliver`.
- Do not judge a licence from the GitHub SPDX badge alone: weights, voices, datasets and territory clauses live in the README, the model card or a separate LICENSE file.

## Policy in `.motion/project.json`

```json
{ "license_policy": { "commercial": true, "region": "EU", "allow": [] } }
```

- `commercial`: the deliverable is used commercially (client work, ads, product marketing, monetised channels). Default `true`.
- `region`: where the user and the deliverable operate; `EU` activates the Tencent territory block.
- `allow`: explicit, per-item exceptions (package, model or asset ids) the user approved in chat after reading the consequence. Never add to it on your own.

## Classes

| Class | Meaning | Commercial deliverable | Default |
| --- | --- | --- | --- |
| `ok` | MIT, Apache-2.0, BSD, ISC, MPL-2.0, LGPL called as a library or binary, CC0, CC-BY (with attribution), OFL for fonts, Unsplash/Pexels/Pixabay licences | allowed; ship attributions where required | allowed |
| `remotion` | Remotion licence, and anything that runs on Remotion (templates, caption kits, `@remotion/*`) | free for individuals, non-profits and for-profit companies up to 3 employees; above that a paid Company License; never resell a Remotion derivative | warn at kickoff; user confirms eligibility or licence |
| `gpl-redistribution` | GPL-2.0/3.0 tools (pedalboard, matchering, piper1-gpl, ffmpeg-static binaries, Geometry Script) | running them to make a video is fine; bundling or redistributing their code inside a shipped product puts that product under GPL | allowed to run, blocked from being vendored into the plugin or a client app |
| `agpl` | AGPL-3.0 (whisper-timestamped, aeneas, essentia, upscayl, video2x, gifski, ChatTTS, OpenChatCut, DepthFlow) | running locally to produce a file is fine; embedding in the plugin, or offering it over a network service, triggers AGPL source obligations | blocked for embedding; run as an external tool only with `allow` |
| `nc` | non-commercial weights, data or content (CC BY-NC, research-only, custom NC) | not allowed | blocked |
| `tencent-eu` | Tencent Hunyuan Community License: "does not apply" in the EU, UK and South Korea | not licensed at all in those regions | blocked when `region` is EU/UK/KR |
| `commons-clause` | MIT/Apache + Commons Clause (Animate UI, react-bits) | use allowed, selling the software or a service whose value is the software is not | warn; fine for videos, not for reselling components |
| `no-licence` | no licence file (all rights reserved by default) | cannot copy code or assets; may only be referenced or installed separately per its author's terms | blocked for copying |

## Known traps

| Item | Trap | Class |
| --- | --- | --- |
| F5-TTS | code MIT, weights CC-BY-NC | nc |
| Fish Speech / OpenAudio S2-Pro | Fish Audio community / research licence | nc (read) |
| Higgs Audio v3 | research and non-commercial licence | nc |
| XTTS v2 | Coqui Public Model License, non-commercial | nc |
| MusicGen / AudioGen (audiocraft) | weights CC-BY-NC 4.0 | nc |
| YuE2 | weights CC BY-NC 4.0 (+ creator permission) | nc |
| MMAudio | checkpoints CC-BY-NC 4.0 | nc |
| madmom | models CC BY-NC-SA (also via `beat_this --dbn`) | nc |
| ctc-forced-aligner default model | `mms-300m-1130-forced-aligner` CC-BY-NC-4.0; pass an Apache wav2vec2 model | nc |
| LivePortrait | InsightFace models NC | nc |
| Wav2Lip | personal/research only | nc |
| FLUX.1-dev, Fill, Canny, Depth | FLUX.1-dev Non-Commercial License (schnell is Apache-2.0) | nc |
| CodeFormer | NTU S-Lab License | nc |
| BRIA RMBG-2.0 | custom licence, commercial needs agreement | nc (read) |
| Gaussian splatting reference code | non-commercial | nc |
| HunyuanVideo-1.5, HunyuanVideo-Foley | Tencent territory exclusion | tencent-eu |
| HunyuanImage-3.0 | Tencent family licence, territory to verify | tencent-eu (until read) |
| NeuTTS | paid licence above a revenue threshold | read |
| WanGP | forbids resale | read |
| LTX-2.x, SkyReels-V2 | community licences with conditions | read |
| Kokoro voice `ff_siwis` | SIWIS corpus, CC BY | ok + attribution |
| Pocket-TTS weights | CC-BY-4.0, voices licensed individually | ok + attribution |
| soundcn World of Warcraft sounds | Blizzard property | nc / no-licence |
| GSAP | Standard "no charge" licence; prohibited in no-code visual animation builders competing with Webflow | ok for videos and sites |
| easings.net | GPL-3.0 site: cite curve names, do not copy its source | gpl-redistribution |
| Remotion and everything built on it (snapcn, caption kits, template-tiktok) | Remotion licence inherited at runtime | remotion |

## Core patterns

1. **Permissive first.** Recommend MIT, Apache-2.0, BSD, ISC, MPL-2.0, CC0 and OFL fonts before anything else.
2. **Two licences per model.** Check code and weights separately (and the voice or dataset for TTS).
3. **Generated content inherits nothing magic.** If the model is NC, the output is unusable commercially, whatever the code licence says.
4. **Record as you go** in `.motion/assets.lock.json` (format in `assets.md`) and declare models in `.motion/project.json`.
5. **Escalate, do not decide.** When a licence is custom or unclear, mark it `read`, tell the user the exact clause and its consequence, and wait.

## Enforcement with umd

- **Install guard** (PreToolUse hook on package installs and model downloads): looks the item up in the licence registry and the project policy; blocks `nc`, `tencent-eu` (in EU/UK/KR), `agpl` embedding and `no-licence` copying unless the id is in `license_policy.allow`. It prints the class and the one-line consequence.
- **`umd licenses`**: scans dependencies, `assets.lock.json` and declared models; reports each item's class, missing lock entries, missing attributions, and the Remotion team-size warning. Run before `umd deliver`.
- **`umd deliver`** copies the render only when the last audit has no open blocker; an LIC blocker stops delivery.

## Pitfalls

- "Open source" model with a GitHub MIT badge and NC weights on Hugging Face (F5-TTS, audiocraft, MMAudio).
- Tencent models used from an EU machine "for testing" then shipped.
- Copying a no-licence skill or template into the project because it is public on GitHub.
- Forgetting attribution for CC BY assets in the final credits.

## Checks

- LIC: no NC, Tencent-in-EU, embedded AGPL or unlicensed asset/model in a commercial piece; Remotion licence fits the team; every asset in `assets.lock.json`; attributions present (`umd licenses`).

## Sources

- Remotion licence: https://github.com/remotion-dev/remotion/blob/main/LICENSE.md
- GSAP Standard License: https://gsap.com/standard-license
- Model licences: https://github.com/SWivid/F5-TTS, https://github.com/facebookresearch/audiocraft, https://github.com/multimodal-art-projection/YuE, https://github.com/hkchengrex/MMAudio, https://github.com/Tencent-Hunyuan/HunyuanVideo-1.5, https://github.com/black-forest-labs/flux, https://github.com/MahmoudAshraf97/ctc-forced-aligner, https://huggingface.co/briaai/RMBG-2.0
- reports/Dépôts motion design pour agents.md (section "Un plugin distribué doit filtrer les licences par défaut")
