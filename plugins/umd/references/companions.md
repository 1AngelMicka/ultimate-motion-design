# Companion skills, plugins and MCP servers

Optional official or well-maintained add-ons that deepen one route. umd works without any of them. Install commands are copied from each project's README (checked 2026-11-10).

## Cost rule

- **Skills** cost almost nothing until used: only their name and description sit in context; the body loads when invoked.
- **MCP servers** add their tool definitions to every session where they are enabled, whether used or not. Install them only for the routes that need them, at project scope (`claude mcp add --scope project …`), and remove them when the project ends.
- Only free companions are listed: no paid API, no account-gated service.

## Skills and skill plugins

| Companion | Adds | Install when | Install |
| --- | --- | --- | --- |
| remotion-dev/skills | Remotion best practices (compositions, timing, captions, rendering) | Route uses Remotion. ⚠️ Remotion licence: free up to 3 employees, paid company licence above | `npx skills add remotion-dev/skills` (or `gh skill install remotion-dev/skills`) |
| greensock/gsap-skills (MIT) | GSAP core, timelines, ScrollTrigger, plugins, framework patterns | Web pages or HTML scenes animated with GSAP | `npx skills add https://github.com/greensock/gsap-skills`; in Claude Code: `/plugin marketplace add greensock/gsap-skills` then `/plugin install gsap-skills@gsap-skills` (plugin name from its marketplace.json) |
| heygen-com/hyperframes (Apache-2.0) | HyperFrames HTML→video skills, CLI, registry, media handling | Route uses HyperFrames | `claude plugin marketplace add heygen-com/hyperframes` then `claude plugin install hyperframes@hyperframes`; or `npx hyperframes skills update` for the core set |
| LottieFiles/motion-design-skill (MIT) | Timing, easing and choreography principles for agents | Any route; cheap second opinion on motion | `npx skills add LottieFiles/motion-design-skill` |
| kylezantos/design-motion-principles (MIT) | Build and audit modes; anti-AI-slop motion checklist; three designer lenses | UI motion, animated pages, audit of an existing codebase | `npx skills add kylezantos/design-motion-principles` |
| blader/humanizer (MIT) | Rewrites scripts, captions and copy without the 26 AI-writing patterns | Any narrated or text-heavy piece | `/plugin marketplace add blader/humanizer` then `/plugin install humanizer@humanizer` (Claude Code ≥ 2.1.142); else `npx skills add blader/humanizer --global --agent claude-code` |
| nextlevelbuilder/ui-ux-pro-max-skill (MIT) | Palettes, font pairings, UI style rules | No brand kit and the piece needs a visual system | `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill` then `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill` |
| rive-app/skills (MIT, official) | When and how to use Rive: state machines, runtimes | Interactive vector animation for apps and sites | `/plugin marketplace add rive-app/skills` then `/plugin install rive@rive` |
| NiazMorshed2007/reanimate (MIT) | Records a reference (site, video, gif, Lottie, WebGL on a virtual clock), writes a motion spec, rebuilds it and verifies the copy frame by frame (timing ±80 ms, easing fit, pixel mismatch) | The brief has a reference to study or the user's own animation to port; see `recipes/match-reference.md`. Needs Bun; upstream tested on macOS/Linux only (Windows: WSL or the umd fallback) | `npx skills add NiazMorshed2007/reanimate -g -a claude-code`, then `bash <skill>/scripts/setup.sh` on first use |
| echris6/motion-video-kit (MIT) | The source of `craft/motion-grammar.md`: notes on 28 launch films, critic prompts, product-hero realism for 3D devices, Three.js patterns, business offers and three worked case studies | Premium business commercials; read its case studies when a client pushes back after SHIP | `git clone https://github.com/echris6/motion-video-kit` then copy `business-motion-film` into `.claude/skills/` |
| Leonxlnx/cinetic (MIT) | Launch and update films in Remotion or HyperFrames: 34 prebuilt scenes, 7 film templates, a script check (the product named and explained by 3 s, 2 to 7 plain words a line), official integration logos with their source and trademark owner, music-led sound | You want a ready template (update video, UI walkthrough, social ad) rather than a film designed from scratch; needs Node 22, Python 3.11 and its `earshot` sound kit | `npx skills add Leonxlnx/cinetic` |
| edenfunf/reelmimic (MIT; bundled HeyGen skills Apache-2.0) | Remakes a reference video's style from a brief, with a "seam ledger" that checks each cut keeps moving in the same direction and speed | Matching a video reference closely, on HyperFrames; Python and librosa | see its README |
| lovisdotio/motion2code (MIT) | Rebuilds a reference motion video as looping SVG + GSAP and checks it frame by frame (frame diffs, loop seam, seek determinism) | Matching a reference animation; a second opinion on loops | see its README (`npx skills add lovisdotio/motion2code`) |
| bradautomates/claude-video (MIT) | `/watch`: downloads a video, extracts frames and a transcript for the agent to read | Studying a reference film, or letting the agent watch its own render beyond the contact sheet | see its README |
| EL4CTEO/blender-skills (MIT) | 28 Blender 5.2 workflows as skills: modelling, UVs, PBR, baking, rigging, animation, export, QA | Blender route, beyond umd's script template | `/plugin marketplace add EL4CTEO/blender-skills` then `/plugin install blender-agent-skills@blender-agent-skills` |
| AcademySoftwareFoundation/OpenRV (Apache-2.0) | A frame-accurate review player (shots side by side, wipes, annotations) | The user reviews renders like a studio; not driven by the agent | OpenRV releases or build from source |
| breakfastquay/rubberband (GPL-2.0, commercial licence available) | Time-stretches or pitch-shifts audio without artefacts, to fit a sound or a music edit to the cut | A track or a voice line must fit an exact length | call the `rubberband` binary (or FFmpeg's `rubberband` filter when built with it); never link it into a non-GPL product |
| kajisho5/ffmpeg-skill (MIT) | 42 FFmpeg recipes and a self-review of the cut | Heavy editing of existing footage | `npx skills add kajisho5/ffmpeg-skill` |
| Moh4696/cinematic-skill (MIT) | Narrated documentaries drawn in code (Skia, Python): one camera over one board of photos, maps and cards, each visual hit on the narrator's word | Archive and history films; source of the Commons fetcher idea (`umd commons`) | see its README |
| codepawl/creator-generalist (MIT) | 2D and 3D generalist skills (Blender rig, sculpt, edit, watch a video into a recipe) | Very young (2026-11); low priority | see its README |
| motionvideo.xyz MCP (repo MIT) | Gallery of AI motion videos with prompts, 120 named moves (bundled as `umd moves`), templates; free MCP at `https://mcp.motionvideo.xyz/mcp` | Looking for a reference video with its prompt; use only the free MCP and the open data | `claude mcp add --transport http motionvideo https://mcp.motionvideo.xyz/mcp` |

## MCP servers

| Server | Adds | Install when | Install |
| --- | --- | --- | --- |
| microsoft/playwright-mcp (Apache-2.0) | Browser driving, screenshots, page snapshots | Interactive checks of animated pages beyond `umd webperf`; umd already bundles Playwright for capture | `claude mcp add playwright npx @playwright/mcp@latest` |
| ChromeDevTools/chrome-devtools-mcp (Apache-2.0) | Performance traces, console, network, Lighthouse-style debugging, plus skills | Debugging dropped frames, long tasks, CLS on animated pages | `/plugin marketplace add ChromeDevTools/chrome-devtools-mcp` then `/plugin install chrome-devtools-mcp@chrome-devtools-plugins` |
| makehumancommunity/mpfb-mcp (GPL-3.0, beta) | 42 tools to create and shape MPFB characters in a live Blender 5.0+ | Exploring a cast interactively; batch work uses MPFB from Python (`umd characters info mpfb2`) | see its INSTALL.md (Blender 5.0 or later, MPFB installed) |
| ahujasid/mcp-for-blender (MIT; was blender-mcp) | Drives a live Blender: scene, materials, Python execution | Route R2 (Blender) only | install `uv` (official installer, not `pip install uv`), then `claude mcp add blender uvx mcp-for-blender` and `uvx mcp-for-blender install-addon`; enable "Interface: MCP for Blender" in Blender |
| magicuidesign/mcp (MIT) | Magic UI component registry lookup | React/Tailwind animated pages using Magic UI | `npx @magicuidesign/cli@latest install claude` |

Notes:
- Blender MCP's `execute_blender_code` runs arbitrary Python in Blender: save the file first. Telemetry is opt-in; set `DISABLE_TELEMETRY=true` in the server's environment to turn off even the anonymous usage record.
- Chrome DevTools MCP exposes the page to the agent; do not point it at pages with personal data.
- Prefer the plugin route when a vendor offers one: skills and MCP arrive together and update together.

## Which route needs what

| Route | Worth installing |
| --- | --- |
| R1 HTML/JS (HyperFrames, GSAP, Remotion) | the engine's skill; design-motion-principles; humanizer |
| R1 animated web page | gsap-skills or design-motion-principles; chrome-devtools-mcp while debugging performance |
| R2 Blender | mcp-for-blender (project scope) |
| R3 three.js single page | gsap-skills if GSAP drives the camera; chrome-devtools-mcp for frame drops |
| R4 narrated, many scenes | humanizer |
| Interactive vector (apps) | rive-app/skills, LottieFiles/motion-design-skill |
| Any route with a reference to match or an animation to port | reanimate |

## Pitfalls

- Installing every MCP "just in case": each one adds tool definitions to every turn of every session.
- Two skills that disagree (e.g. a playful lens and a restraint lens) loaded together: pick the lens from the brief.
- Skills from repositories without a licence (some popular promo or Remotion skill repos): reference, do not copy (`licenses.md`).
- Remotion skills inherit the Remotion licence question; raise it at kickoff.

## Checks

- LIC: companion licences fit the policy (`umd licenses`); Remotion eligibility confirmed.
- MOT/NAR: design-motion-principles audit and humanizer pass can serve as evidence for anti-slop criteria.

## Sources

- https://github.com/remotion-dev/skills, https://github.com/greensock/gsap-skills, https://github.com/heygen-com/hyperframes
- https://github.com/LottieFiles/motion-design-skill, https://github.com/kylezantos/design-motion-principles, https://github.com/blader/humanizer
- https://github.com/nextlevelbuilder/ui-ux-pro-max-skill, https://github.com/rive-app/skills
- https://github.com/microsoft/playwright-mcp, https://github.com/ChromeDevTools/chrome-devtools-mcp, https://github.com/ahujasid/mcp-for-blender, https://github.com/magicuidesign/mcp
- research_notes/Dépôts motion design pour agents/agent_skills_mcp.md
