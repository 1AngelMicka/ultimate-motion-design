# Composition and camera language

Frame sizes, safe areas, platform overlay zones, grids, and the shot and cut vocabulary to write storyboards with.

## Use when / avoid when

- Use at kickoff (format), storyboard (shots, cuts) and still validation (safe areas).
- Design one master per aspect ratio; do not center-crop a 16:9 master into 9:16 and call it done.

## Formats

| Ratio | Size (px) | Typical use |
| --- | --- | --- |
| 16:9 | 1920×1080 (3840×2160 for 4K master) | YouTube, LinkedIn landscape, presentations, web |
| 9:16 | 1080×1920 | TikTok, Reels, Shorts, Stories |
| 1:1 | 1080×1080 | Feed posts, LinkedIn, X |
| 4:5 | 1080×1350 | Instagram/Facebook feed portrait (tallest safe feed ratio; Instagram's profile grid previews crop to 3:4 since 2025 per secondary sources) |
| 21:9 or wider | e.g. 2560×1080 | Web hero banners (convention), cinematic letterbox |

Exact upload limits per platform: `platforms.md`.

## Safe areas (16:9 and other landscape)

| Area | Margin each side | Remaining | Holds |
| --- | --- | --- | --- |
| Action-safe | 3.5 % | 93 % | all significant action |
| Graphics/title-safe | 5 % | 90 % | all text, logos, captions |

Source: EBU R 95 (also ITU-R BT.1848). On 1920×1080: graphics-safe inset ≈ 96 px left/right, 54 px top/bottom. On the web and in apps, add the player's own controls bar at the bottom (keep the lowest 10–12 % free of key text, convention).

## 9:16 platform UI overlay zones

Platforms draw username, caption, buttons and progress bars over the video. Published guidance:

- Meta (Reels, Stories ads guide, as summarised by several 2026 sources): keep about 14 % top, 35 % bottom and 6 % each side free of text and key elements (≈ 269 px top, 672 px bottom, 65 px sides on 1080×1920).
- TikTok: the Ads help centre requires key elements inside the safe zone and provides downloadable safe-zone templates per placement; it does not publish one fixed pixel set. Use the template for paid placements.
- YouTube Shorts: no official pixel numbers published.

umd default for organic 9:16 (convention covering all three): top 14 % (270 px), bottom 35 % (672 px), left 6 % (65 px), right 11 % (120 px, the button column). Usable area: x 65–960, y 270–1248. Captions sit just above the bottom limit (block bottom edge ≈ 1240 px); titles in the upper half of the usable area. Faces and products: upper-middle third.

## Grids

- Build on a 12-column grid inside graphics-safe for 16:9 (gutters 1–2 % of width, convention); 4–6 columns for 9:16.
- Rule of thirds for subjects and horizons; centre only symmetric or hero moments, not by default.
- Align text to one edge per scene; consistent baselines across scenes help cuts feel intentional.
- Leave negative space in the direction of motion or gaze (lead room).

## Camera language

| Shot size | Shows | Use |
| --- | --- | --- |
| Extreme wide / establishing | whole world, context | open a section |
| Wide | subject + environment | show relations, layout of a UI |
| Medium | subject, some context | explain, demo |
| Close-up | one element | emphasis, a number, a button |
| Extreme close-up / macro | a detail | texture, reveal, transition source |

| Move | Feel | Rule |
| --- | --- | --- |
| Push in (dolly/zoom in) | focus, importance | ease-in-out, slow; end on the detail |
| Pull out | context, reveal scale | start close, end wide |
| Pan / truck | follow, scan a layout | move in the reading direction |
| Tilt / pedestal | reveal height, hierarchy | short and eased |
| Orbit | 3D object showcase | constant speed, small arc for products |
| Rack focus | shift attention | blur only the defocused plane |
| Handheld shake | energy, urgency | rarely in motion design; never on text |

Camera moves follow the same easing rules (`principles.md`): ease-in-out within the shot; never two competing moves at once.

## Cuts

| Cut | What it does | When |
| --- | --- | --- |
| Hard cut | instant change | default; on beat, on action |
| Match cut | shape, colour or motion continues across scenes | link two ideas (circle → logo, cursor → planet) |
| Cut on action | cut during a move, the move continues | hides the cut, keeps energy |
| J-cut | next scene's audio starts before its picture | lead into a new idea with voice or SFX |
| L-cut | previous audio continues over the new picture | let a line land over a reaction or detail |
| Smash cut | abrupt contrast | comedy, surprise |
| Wipe / push along motion | spatial continuity | when the next scene lives "beside" the current |
| Dissolve | time passing, softness | sparingly; not as the default transition |

- Cut on beats or downbeats when there is music (`audio/music-sfx.md`); cut during motion rather than on still frames.
- Respect the 180° rule and screen direction for anything that travels: if it exits right, it enters the next shot from the left.

## Rendering to video with umd

- `umd still scene.html --at 0,2,4 --width 1080 --height 1920` and check every key frame against the safe-area overlay before animating.
- `umd frames out.mp4 --sheet` to review shot-size variety; `umd analyze` to list scene cuts.

## Pitfalls

- Text in the bottom 35 % of a vertical video: hidden under captions and buttons.
- Center-cropped landscape master: subjects cut off, tiny text. Re-layout per ratio.
- Every shot medium-wide at the same scale: no rhythm. Alternate sizes.
- Camera move plus element animation plus transition at the same time: no focal motion.

## Checks

- ART: safe areas respected, sharp assets (`umd still`, `umd frames`).
- LIF: variety between scenes (contact sheet).
- TIM: cuts on beats, duration fits the platform.

## Sources

- EBU R 95 Safe areas for 16:9 television production: https://tech.ebu.ch/publications/r095 ; ITU-R BT.1848-1
- TikTok Ads help (safe zone templates): https://ads.tiktok.com/help/article/tiktok-auction-in-feed-ads
- Meta Reels safe zone (14/35/6 %) as reported by https://knowlify.com/articles/meta-video-ad-specs and https://www.socialync.io/tools/safe-zones/instagram-reels (Meta's own page not read directly)
- YouTube Shorts: https://support.google.com/youtube/answer/15424877
