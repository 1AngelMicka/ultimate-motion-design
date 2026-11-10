# Third-party notices

Ultimate Motion Design bundles no third-party code. It calls tools that the user installs separately, each under its own licence:

| Tool | Used for | Licence | Installed by |
| --- | --- | --- | --- |
| FFmpeg | analysis, encoding, mixing, captions burn-in | LGPL-2.1+ or GPL depending on the build | the user (winget/Homebrew via `umd doctor --fix`, or a system package) |
| Playwright + Chromium | HTML capture, stills, web performance checks | Apache-2.0 (Playwright), BSD-style (Chromium) | `umd doctor --fix` into `~/.umd/runtime`, or the project's own install |
| Engines and models chosen per project (Remotion, HyperFrames, three.js, Blender, Manim, TTS, music models…) | production | their own licences; see `plugins/umd/references/licenses.md` and `referential/licenses.json` | the user, per project |

The style index (`plugins/umd/references/styles/index.json`) lists names, one-line descriptions and links from [lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) (prompts MIT, demo films CC BY 4.0, credit LemoLab), [Vincentwei1021/mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15) (MIT) and [yihui-dev/awesome-opus5-5-videos](https://github.com/yihui-dev/awesome-opus5-5-videos) (MIT index; each prompt belongs to its author). Prompt bodies are downloaded from their source only when a project uses them. The critic's jury grid is adapted from mg-styles-15's `rubric.md` (MIT).

The scoring mechanics, the compact command runner and the auditor pattern come from [quality-pack](https://github.com/1AngelMicka/quality-pack) (MIT, same author).

Motion token defaults reproduce the duration and easing values published by IBM Carbon Design System (`@carbon/motion`, Apache-2.0).
