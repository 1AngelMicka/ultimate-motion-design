# Assets

Images, icons, logos, fonts, emojis, stock media and AI-processed assets, each with a recorded licence. Prefer assets built in code (SVG, CSS, shaders) over downloaded ones; when you download, record it.

## Use when / avoid when

- Use when a scene needs a photo, icon, brand logo, font or texture you cannot draw in code.
- Avoid hotlinking or CDNs at render time: download into the project so renders are offline and deterministic (REN).
- Avoid generated images of real people, real brands or living artists' styles.

## Recording: `.motion/assets.lock.json`

One entry per file, written at download time. `umd licenses` reads it.

```json
[
  {"path": "assets/img/desk.jpg", "source": "unsplash", "url": "https://unsplash.com/photos/<id>",
   "license": "Unsplash License", "author": "Jane Doe", "attribution_required": false, "commercial_ok": true},
  {"path": "assets/fonts/inter-latin-400.woff2", "source": "fontsource", "url": "https://fontsource.org/fonts/inter",
   "license": "OFL-1.1", "author": "Rasmus Andersson", "attribution_required": false, "commercial_ok": true}
]
```

- `license`: SPDX id when one exists (`MIT`, `CC0-1.0`, `CC-BY-4.0`, `OFL-1.1`), else the licence name.
- `attribution_required: true` → add the credit to the end card, description or `CREDITS.md` deliverable.
- Unknown licence → `commercial_ok: false` until read. Never guess.

## Icons and logos

| Source | Licence | Install | Notes |
| --- | --- | --- | --- |
| Iconify (`@iconify/json`, `@iconify/utils`) | framework MIT; each set has its own licence | `npm i -D @iconify/json` | 200+ sets; read `info.license` of the set before use |
| Lucide | ISC | `npm i lucide-static` | consistent stroke icons, easy to animate (stroke-dashoffset) |
| Tabler Icons | MIT | `npm i @tabler/icons` | 6,000+ icons |
| Simple Icons | CC0-1.0 (the SVG data) | `npm i simple-icons` | brand logos; the brands keep their trademarks: read DISCLAIMER.md, follow brand guidelines, no implied endorsement |

Use one icon family per piece, one stroke weight, sized to the type.

## Fonts

| Source | Licence | Use |
| --- | --- | --- |
| Fontsource (`@fontsource/<family>`, `@fontsource-variable/<family>`) | packages MIT, fonts mostly OFL-1.1 | `npm i @fontsource/inter`; self-hosted, offline, deterministic |
| Google Fonts files (github.com/google/fonts) | per family: OFL, Apache-2.0 or UFL | download the files into `fonts/`, never link fonts.googleapis.com in a render |
| Commercial foundry fonts | per licence | needs a video/broadcast or app licence; not by default |

Max two families (`fonts_max`). Subset to the scripts you use (Fontsource ships `latin`, `latin-ext`).

## Emojis

| Set | Licence | Notes |
| --- | --- | --- |
| Microsoft Fluent Emoji | MIT | flat, colour and 3D PNG styles |
| Noto Emoji | fonts OFL-1.1, images mostly Apache-2.0 | includes animated emoji |
| Twemoji (jdecked fork) | graphics ⚠️ CC-BY-4.0 | attribution required |
| OpenMoji | ⚠️ CC-BY-SA-4.0 | attribution and share-alike |

Emoji as UI icons is an AI tell (`craft/anti-slop.md`); use them as content, not decoration.

## Stock photos, video, audio

| Source | Licence | Attribution | Limits |
| --- | --- | --- | --- |
| Unsplash | Unsplash License (free, commercial) | not required by the licence; required by the API guidelines (photographer + Unsplash) and API downloads must hit the download endpoint | no selling unaltered copies, no competing service |
| Pexels | Pexels License (free, commercial) | API: show a prominent link to Pexels, credit photographers when possible | API: 200 requests/hour, 20,000/month by default |
| Pixabay | Pixabay Content License | not required | no standalone resale; no commercial use of content with recognisable brands; care with recognisable people |
| Openverse (WordPress) | per item: CC0, CC BY, CC BY-SA, CC BY-NC… | per item | filter to commercial-ok licences; ⚠️ BY-NC/ND are NC or no-derivatives |

No maintained official Pixabay client exists; call its REST API directly. `pexels/pexels-javascript` is inactive.

## Processing

| Task | Tool | Licence | Command |
| --- | --- | --- | --- |
| Background removal | rembg + BiRefNet | MIT / MIT weights | `pip install "rembg[cpu,cli]"` then `rembg i -m birefnet-general in.png out.png` |
| Upscaling | Real-ESRGAN (ncnn-vulkan binary, no Python) | BSD-3-Clause | `realesrgan-ncnn-vulkan -i in.png -o out.png -n realesrgan-x4plus` |
| Frame interpolation | Practical-RIFE | MIT | `python3 inference_video.py --multi=2 --video=in.mp4` |
| Image with readable text | Qwen-Image (and Qwen-Image-2512) | Apache-2.0 code and weights | via diffusers or DiffSynth-Studio; GPU heavy (20B) |

⚠️ Avoid by default: BRIA RMBG-2.0 (custom licence, commercial use needs an agreement), FLUX.1-dev and its Fill/Canny/Depth variants (non-commercial; FLUX.1-schnell is Apache-2.0), CodeFormer (S-Lab licence), LivePortrait face models (InsightFace NC), Wav2Lip (research only), Tencent Hunyuan image/video (licence excludes EU, UK, South Korea). Upscayl and video2x are ⚠️ AGPL apps: fine to run, never embed.

## Core patterns

1. **Code first.** Shapes, charts, UI recreations and backgrounds in SVG/CSS/canvas are sharper, animatable and licence-free.
2. **Download, record, then use.** Write the lock entry in the same step as the download.
3. **Resolution:** source images ≥ 1.5× their largest on-screen size if they will be scaled or pushed in (convention); upscale only as a last resort and check for artefacts.
4. **Optimise SVGs** with svgo before animating; keep IDs you animate (in `svgo.config.js`, `preset-default` with `overrides: { cleanupIds: false }`).
5. **Generated images:** record model, seed, prompt in `assets.lock.json` (`source: "qwen-image"`), and check text in the image letter by letter.

## Rendering to video with umd

- Assets referenced by relative paths; `umd capture` waits for fonts and images to load.
- `umd licenses` checks `assets.lock.json` against the licence registry and `.motion/project.json` `license_policy`.

## Pitfalls

- Brand logos re-coloured or animated in ways the brand guidelines forbid.
- Unsplash/Pexels images containing logos or identifiable people in a commercial ad: get releases or choose another image.
- Fonts loaded from a CDN: a render without network falls back silently (REN).
- Interpolated (RIFE) frames on text and UI create warping: interpolate footage only.

## Checks

- LIC: every asset in `assets.lock.json`, no NC/Tencent-EU/AGPL-embedded/unlicensed asset, attributions shipped (`umd licenses`).
- ART: sharp assets, no AI-look visuals; REN: local fonts and assets.

## Sources

- https://github.com/iconify/iconify, https://github.com/lucide-icons/lucide, https://github.com/tabler/tabler-icons, https://github.com/simple-icons/simple-icons
- https://github.com/fontsource/fontsource, https://github.com/google/fonts
- https://github.com/microsoft/fluentui-emoji, https://github.com/googlefonts/noto-emoji, https://github.com/jdecked/twemoji, https://github.com/hfg-gmuend/openmoji
- https://unsplash.com/documentation, https://www.pexels.com/api/documentation/, https://pixabay.com/service/license-summary/, https://github.com/WordPress/openverse
- https://github.com/danielgatis/rembg, https://github.com/ZhengPeng7/BiRefNet, https://github.com/xinntao/Real-ESRGAN, https://github.com/hzwer/Practical-RIFE, https://github.com/QwenLM/Qwen-Image
- research_notes/Dépôts motion design pour agents/audio_captions_ai_assets.md
