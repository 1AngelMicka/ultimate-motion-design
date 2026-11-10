# First project

From install to a delivered video, with a single command: `/umd:go`. Allow five minutes to get started, then the render time.

## 1. Install

In Claude Code:

```
/plugin marketplace add 1AngelMicka/ultimate-motion-design
```
```
/plugin install umd@ultimate-motion-design
```

Restart Claude Code (or type `/reload-plugins`), then open an empty folder for your project. The details, team install included, are on the [Install](site:installation) page.

## 2. Say what you want

```
/umd:go a 30-second launch video for our notes app, 16:9, understated tone
```

`/umd:go` sees there is no project yet and starts with the **kickoff**:

- it asks a few questions: audience, platforms, look described in words, voice-over and music, commercial use;
- it picks the profile (here `promo`), the route (`html-video`) and the engine, and says why;
- it checks the tools (FFmpeg, Playwright, Chromium) and offers to install what is missing;
- it writes `BRIEF.md` and `.motion/project.json`.

## 3. Approve the look before anything moves

Type `/umd:go` again. It writes the **storyboard**: timed beats, one intent per beat, text that stays on screen long enough. Then it renders the **key stills** and has an "art director" agent review them, correcting over up to three rounds.

It then stops to show you the stills. If you like them, say so: it records the approval in the storyboard. Otherwise, say what is wrong.

## 4. Let it build, render and check

`/umd:go` again. This time it chains on its own:

1. **build**: the piece beat by beat, with voice, music and captions if the brief asks for them, and quick drafts reviewed;
2. **render**: the final render, done twice to prove it is reproducible, then analysed;
3. **audit**: the automatic measures, then the auditors in parallel, and a score out of 10 in `.motion/AUDIT.md`;
4. **fix** if a blocker is still open, then a new render and a new audit.

It stops when only minor or major issues are left for you to decide on, or when everything is ready.

## 5. Deliver

`/umd:go` offers delivery: the audited video goes to `deliverables/` with its manifest and the required credits. Ask for platform versions if you need them (vertical, GIF, WebM for the web).

## Where to look

| What | Where |
| --- | --- |
| The brief and storyboard | `BRIEF.md`, `.motion/storyboard.md` |
| The latest render and its contact sheet | `.motion/renders/<id>/video.mp4`, `sheet.jpg` |
| The score, blockers and fixes | `.motion/AUDIT.md` |
| The deliverables | `deliverables/` |
| Tokens used per step | `/umd:tokens` |

## Come back later

Close Claude Code whenever you like. When you come back, `/umd:go` reads the project's state and resumes at the right step. For a long break, `/umd:handoff` leaves a note that the next session reads first.
