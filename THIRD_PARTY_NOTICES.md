# Third-party notices

Ultimate Motion Design bundles no third-party code. It calls tools that the user installs separately, each under its own licence:

| Tool | Used for | Licence | Installed by |
| --- | --- | --- | --- |
| FFmpeg | analysis, encoding, mixing, captions burn-in | LGPL-2.1+ or GPL depending on the build | the user (winget/Homebrew via `umd doctor --fix`, or a system package) |
| Playwright + Chromium | HTML capture, stills, web performance checks | Apache-2.0 (Playwright), BSD-style (Chromium) | `umd doctor --fix` into `~/.umd/runtime`, or the project's own install |
| Engines and models chosen per project (Remotion, HyperFrames, three.js, Blender, Manim, TTS, music models…) | production | their own licences; see `plugins/umd/references/licenses.md` and `referential/licenses.json` | the user, per project |

The scoring mechanics, the compact command runner and the auditor pattern come from [quality-pack](https://github.com/1AngelMicka/quality-pack) (MIT, same author).

Motion token defaults reproduce the duration and easing values published by IBM Carbon Design System (`@carbon/motion`, Apache-2.0).
