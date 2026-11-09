# Companion skills, plugins and MCP servers

Optional official or well-maintained add-ons that deepen one route. umd works without any of them. Install commands are copied from each project's README (checked 2026-11-10).

## Cost rule

- **Skills** cost almost nothing until used: only their name and description sit in context; the body loads when invoked.
- **MCP servers** add their tool definitions to every session where they are enabled, whether used or not. Install them only for the routes that need them, at project scope (`claude mcp add --scope project …`), and remove them when the project ends.
- Third-party services (ElevenLabs API, Spline account) have their own terms and pricing.

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
| elevenlabs/skills (MIT; paid API) | TTS, STT, sound effects, music, dubbing, voice isolation via ElevenLabs | User accepts a cloud voice service; needs `ELEVENLABS_API_KEY` | `npx skills add elevenlabs/skills` (the old `elevenlabs-mcp` is archived) |
| rive-app/skills (MIT, official) | When and how to use Rive: state machines, runtimes | Interactive vector animation for apps and sites | `/plugin marketplace add rive-app/skills` then `/plugin install rive@rive` |
| splinetool/spline-skills (MIT, official) | Skill + hosted Spline MCP (`https://mcp.spline.design/mcp`); builds editable scenes in Spline's cloud editor | User wants an editable Spline 3D scene; requires a Spline account sign-in | `/plugin marketplace add splinetool/spline-skills` then `/plugin install spline@spline` |

## MCP servers

| Server | Adds | Install when | Install |
| --- | --- | --- | --- |
| microsoft/playwright-mcp (Apache-2.0) | Browser driving, screenshots, page snapshots | Interactive checks of animated pages beyond `umd webperf`; umd already bundles Playwright for capture | `claude mcp add playwright npx @playwright/mcp@latest` |
| ChromeDevTools/chrome-devtools-mcp (Apache-2.0) | Performance traces, console, network, Lighthouse-style debugging, plus skills | Debugging dropped frames, long tasks, CLS on animated pages | `/plugin marketplace add ChromeDevTools/chrome-devtools-mcp` then `/plugin install chrome-devtools-mcp@chrome-devtools-plugins` |
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
| R4 narrated, many scenes | humanizer; elevenlabs/skills only if cloud voice is accepted |
| Interactive vector (apps) | rive-app/skills, LottieFiles/motion-design-skill |
| Editable 3D for a designer | splinetool/spline-skills |

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
- https://github.com/nextlevelbuilder/ui-ux-pro-max-skill, https://github.com/elevenlabs/skills, https://github.com/rive-app/skills, https://github.com/splinetool/spline-skills
- https://github.com/microsoft/playwright-mcp, https://github.com/ChromeDevTools/chrome-devtools-mcp, https://github.com/ahujasid/mcp-for-blender, https://github.com/magicuidesign/mcp
- research_notes/Dépôts motion design pour agents/agent_skills_mcp.md
