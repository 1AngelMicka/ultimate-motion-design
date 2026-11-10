# Platform export specs

What to render and encode for each destination. Figures checked 2026-11-10 from the sources listed; platforms change limits often, so re-check a limit that decides the brief (duration, file size). Loudness targets: `audio/mix.md`.

## Use when / avoid when

- Use at kickoff (format, duration) and at `umd render` (encode settings).
- One master per aspect ratio at the highest quality (ProRes/high-bitrate H.264 or lossless PNG sequence), then one encode per destination. Never re-encode an encode.

## Video platforms

| Destination | Frame | fps | Codec / container | Limits | Source |
| --- | --- | --- | --- | --- | --- |
| YouTube (long-form) | 16:9, 1920×1080 or 3840×2160 | same as source (24, 25, 30, 48, 50, 60) | MP4 fast-start, H.264 High, 4:2:0, closed GOP of half the frame rate, VBR; AAC-LC or Opus 48 kHz | 256 GB or 12 h, whichever is less; 15 min until the account is verified | YouTube Help 1722171, 71673 |
| YouTube bitrates (SDR, recommended) | 1080p: 8 Mbps (24–30 fps), 12 Mbps (48–60) | | | 4K: 35–45 / 53–68 Mbps | YouTube Help 1722171 |
| YouTube Shorts | 9:16 or 1:1, 1080×1920 | 30 or 60 | as YouTube | ≤ 3 min, square or vertical (uploads since 2024-10-15) | YouTube Help 15424877 |
| Instagram Reels | 9:16 recommended, width ≤ 1920 px (1080×1920) | 23–60 | MP4/MOV, moov atom first, H.264 or HEVC, closed GOP, 4:2:0, VBR ≤ 25 Mbps; AAC ≤ 48 kHz, 128 kbps | 3 s–15 min, 300 MB (Graph API publishing spec; in-app limits may differ) | Meta Instagram Graph API, IG User Media reference |
| Instagram / Facebook feed | 4:5 (1080×1350) or 1:1 | 30 | as Reels | profile grid previews crop to 3:4 (secondary sources) | see `craft/composition.md` |
| TikTok | 9:16, 1080×1920 | 23–60 | MP4 (recommended), MOV, WebM; H.264 (recommended), H.265, VP8, VP9 | API upload: ≤ 10 min, ≤ 4 GB, 360–4096 px per side; in-app upload limits are longer and not published in one official page | TikTok Content Posting API media transfer guide |
| LinkedIn | 1:2.4 to 2.4:1; 1920×1080, 1080×1080 or 1080×1350 | 10–60 | MP4 recommended (also MOV, WebM, MKV…) | 75 KB–5 GB; 3 s–15 min (2 s on mobile); 256×144 to 4096×2304 | LinkedIn Help a548372 |
| X | 16:9, 1:1 or 9:16; aspect 1:3–3:1 | ≤ 60 (30 or 60 recommended) | H.264 High, 4:2:0, progressive, no open GOP; AAC-LC mono/stereo | API: 0.5 s–20 min and 8 GB by default; 125 min / 16 GB for Premium | X API media best practices |

Defaults for all social encodes (umd convention): H.264 High, yuv420p, CRF 18 or VBR at the YouTube recommended bitrate, `-movflags +faststart`, AAC-LC 48 kHz stereo at 192–320 kbps, −14 LUFS, ≤ −1 dBTP.

```bash
ffmpeg -i master.mov -c:v libx264 -profile:v high -pix_fmt yuv420p -preset slow -crf 18 \
  -g 15 -keyint_min 15 -sc_threshold 0 -bf 2 -c:a aac -b:a 256k -ar 48000 -movflags +faststart out-30fps.mp4
# -g = half the frame rate (YouTube closed-GOP recommendation): 15 at 30 fps, 30 at 60 fps
```

## Web hero video

| Item | Rule | Status |
| --- | --- | --- |
| Autoplay | `<video autoplay muted loop playsinline poster="hero.jpg">`; muted autoplay is always allowed in Chrome; iOS Safari needs `muted` and `playsinline` | Chrome autoplay policy, WebKit iOS video policy |
| Sources | WebM (VP9 or AV1) first, MP4 (H.264) fallback | convention |
| Audio | strip the audio track (`-an`): smaller file, no autoplay issues | convention |
| Size budget | ≤ 2–3 MB for a 6–12 s 1080p loop; ≤ 1 MB mobile variant at 720p | convention, measure with `umd webperf` |
| Poster | first frame or the key still, compressed (AVIF/WebP/JPEG); text stays in HTML, not in the video | convention |
| Loop | first and last frames match; no hard jump | convention |
| Reduced motion | under `prefers-reduced-motion: reduce`, do not autoplay; show the poster with a play control | WCAG 2.2.2 Pause, Stop, Hide; WEB criteria |
| Layout | reserve space with `width`/`height` or `aspect-ratio` to avoid CLS | WEB |

```bash
ffmpeg -i master.mov -an -vf "scale=1920:-2" -c:v libvpx-vp9 -b:v 0 -crf 34 -row-mt 1 hero.webm
ffmpeg -i master.mov -an -vf "scale=1920:-2" -c:v libx264 -pix_fmt yuv420p -crf 26 -movflags +faststart hero.mp4
```

## GIF and email

- Prefer a short MP4 where the destination supports it; GIF is 256 colours and large.
- GIF: 10–15 fps, ≤ 600–800 px wide, ≤ 1–2 MB for email (convention). `umd capture … --format gif`, or gifski (⚠️ AGPL-3.0: run it as a tool, never bundle it).
- Some desktop Outlook versions show only the first frame of an animated GIF (widely reported by email-testing vendors): make frame 1 a complete, readable still with the message and CTA.
- No essential text only in the animation; repeat it in HTML.

## Presentation embed

- PowerPoint: Microsoft recommends `.mp4` with H.264 video and AAC audio. Keynote and Google Slides accept the same file (Slides via Drive or YouTube).
- 1920×1080, 30 fps, moderate bitrate (≈ 10–15 Mbps, convention) so the deck stays portable; loudness −16 to −14 LUFS (`audio/mix.md`).
- For loops behind a speaker, no audio track and a seamless loop.

## Rendering to video with umd

- `umd capture scene.html --out out.mp4 --fps 30 --width 1080 --height 1920 --audio mix.wav` for vertical; `--format webm` for the web; `--format gif` for email.
- `umd analyze out.mp4` to confirm resolution, fps, duration and loudness against this table; `umd vmaf out.mp4 master.mov` for encode quality (REN: VMAF ≥ 93).

## Pitfalls

- 25 or 50 fps sources converted to 30 by frame duplication: judder. Render at the target fps.
- **Frame rate is a cost decision, made at kickoff.** HTML and UI pieces: 60 fps is cheap and keeps fast type and scrolling crisp. Rendered 3D: 24 or 30 fps with motion blur (shutter 0.5) stays smooth on slow camera moves, and 60 → 30 fps halves the render time. A mixed piece can render its 3D at 30 and its HTML at 60 only if the final is 60 and the 3D frames are each shown twice; usually pick 30 for the whole film.
- HDR or 10-bit masters uploaded to platforms expecting SDR 8-bit 4:2:0: washed-out colours. Encode yuv420p SDR unless the brief asks for HDR.
- Duration over a platform limit discovered at upload: check the brief against this table at kickoff.
- Vertical video with text in platform UI zones (`craft/composition.md`).

## Checks

- REN: output matches the brief spec (resolution, fps, codec, duration), VMAF ≥ 93 vs master, no stray black frames.
- TIM: duration fits brief and platform. AUD: loudness per destination. WEB: hero video reduced-motion and CLS.

## Sources

- YouTube: https://support.google.com/youtube/answer/1722171, https://support.google.com/youtube/answer/71673, https://support.google.com/youtube/answer/15424877
- Instagram Graph API (Reels specifications): https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media
- TikTok: https://developers.tiktok.com/doc/content-posting-api-media-transfer-guide
- LinkedIn: https://www.linkedin.com/help/linkedin/answer/a548372
- X: https://docs.x.com/x-api/media/quickstart/best-practices
- Chrome autoplay: https://developer.chrome.com/blog/autoplay ; WebKit: https://webkit.org/blog/6784/new-video-policies-for-ios/
- PowerPoint formats: https://support.microsoft.com/en-us/office/video-and-audio-file-formats-supported-in-powerpoint-d8b12450-26db-4c7b-a5c1-593d3418fb59
