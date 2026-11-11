# For AI agents

You can hand installation and onboarding to your AI agent: just give it the repository link. Everything it needs is written for it.

## The sentence to copy

```
Install and set up this plugin for me, then guide me through my first project: https://github.com/1AngelMicka/ultimate-motion-design
```

## What the agent finds

| File | For |
| --- | --- |
| [AGENTS.md](AGENTS.md) | The guide written for an agent: install (two ways), checks, onboarding, rules to respect |
| [llms.txt](https://1angelmicka.github.io/ultimate-motion-design/llms.txt) | The summary and map of the docs, in the format agents read |
| [llms-full.txt](https://1angelmicka.github.io/ultimate-motion-design/llms-full.txt) | The whole documentation in one text file, to read in one go |

## What it will do

1. It will ask you to type the two `/plugin` commands in Claude Code. An agent cannot type a slash command for you. Alternatively, it writes the install into your project's `.claude/settings.json`, and you only need to restart Claude Code.
2. It will have you run `/umd:doctor`, which checks FFmpeg, Playwright and Chromium and offers to install them.
3. It will explain `/umd:go`, the one command to remember, and help you word your first brief.

It must never install anything system-wide without asking you, nor add a licence exception or lower a threshold on your behalf: those decisions stay yours.

## With an agent other than Claude Code

The plugin is built for Claude Code, but its engine is a zero-dependency Node CLI: any agent can use it to render an HTML page to video, analyse a video or check licences. The method's steps are plain Markdown files that anyone can read. Details in [AGENTS.md](AGENTS.md).

**The skill alone.** The [`skills/motion-design`](https://github.com/1AngelMicka/ultimate-motion-design/tree/main/skills/motion-design) folder is a standalone skill (one `SKILL.md` and its 55 guides): copy it into your agent's skills folder (`~/.claude/skills/`, `~/.codex/skills/`…), or install it with `npx skills add 1AngelMicka/ultimate-motion-design` and pick `motion-design`. It brings the method and the craft; the plugin adds reproducible rendering, the scored audit and the licence guard.
