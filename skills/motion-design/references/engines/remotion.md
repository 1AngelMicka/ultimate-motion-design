# Remotion

React components rendered to video frame by frame: every visual is a function of `useCurrentFrame()`. Pick it for React teams, data-driven or templated videos, word-timed captions and the official templates.

## Use when / avoid when

| Use when | Avoid when |
| --- | --- |
| The team writes React and wants typed props, Zod schemas, a Studio | Company above 3 employees with no Remotion licence budget → HyperFrames, Revideo, plain `umd capture` |
| Parameterised videos at scale (`--props`, Lambda) | A one-file HTML piece: `umd capture` is faster to iterate |
| TikTok-style captions, audiograms, Code Hike code videos (official templates) | The animation is mostly CSS keyframes or transitions (Remotion ignores CSS time) |
| 3D via `@remotion/three`, GSAP via `@remotion/gsap` | |

## Setup

- ⚠️ **Licence**: free for individuals, non-profits and companies up to 3 employees (and for evaluation); companies above that need a paid Company License; reselling a Remotion derivative is forbidden. Everything built on Remotion inherits this, even MIT add-ons (snapcn, RenderComp). Record the decision at kickoff; `umd licenses` checks it (LIC).
- New project: `npx create-video@latest` (pick a template). Version line: `remotion`, `@remotion/*` 4.0.x (4.0.542 in Nov 2026); keep every `@remotion/*` package on the exact same version.
- Studio: `npx remotion studio`. Agent skills: `npx skills add remotion-dev/skills` (official, Remotion licence).
- Useful official templates (`remotion-dev/template-*`): `tiktok` (Whisper captions), `audiogram`, `code-hike`, `three` (MIT), `still`, `overlay`, `music-visualization`, `prompt-to-video`, `render-server`. Archived, do not start from: `template-next-app-dir`, `template-next-pages-dir`, `template-tailwind`.

## Core patterns

**1. Register compositions** in `src/Root.tsx`; time is in frames.

```tsx
import { Composition } from "remotion";
import { Promo } from "./Promo";
export const RemotionRoot = () => (
  <Composition id="Promo" component={Promo} durationInFrames={450} fps={30}
    width={1920} height={1080} defaultProps={{ title: "Ship faster" }} />
);
```

**2. Drive everything from the frame.** `interpolate` with clamping and an explicit easing; `spring` with high damping for UI-grade motion (no wobble unless the brief wants it).

```tsx
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
export const Promo = ({ title }: { title: string }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const y = interpolate(frame, [10, 28], [40, 0], {
    easing: Easing.bezier(0.2, 0, 0, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const s = spring({ frame: frame - 20, fps, config: { damping: 200 } });
  return <AbsoluteFill style={{ transform: `translateY(${y}px) scale(${0.9 + 0.1 * s})` }}>{title}</AbsoluteFill>;
};
```

**3. Structure time with `Sequence` / `Series`.** `<Sequence from={30} durationInFrames={60}>` shifts `useCurrentFrame()` to 0 at its start; `<Series>` + `<Series.Sequence durationInFrames={…}>` chains beats back to back. One `Sequence` per storyboard beat.

**4. Scene transitions** with `@remotion/transitions`: `TransitionSeries`, `TransitionSeries.Sequence`, `TransitionSeries.Transition` with a presentation (`fade()` from `@remotion/transitions/fade`, also `/slide`, `/wipe`, `/cube`…) and a timing (`linearTiming({ durationInFrames: 15 })` or `springTiming(...)`). Transitions overlap scenes, so total length shrinks by each transition's duration: recompute `durationInFrames`.

**5. Captions** with `@remotion/captions`: `Caption` = `{ text, startMs, endMs, timestampMs, confidence }`; `parseSrt`, `parseVtt`, `serializeSrt`; `createTikTokStyleCaptions({ captions, combineTokensWithinMilliseconds: 1200 })` returns `pages[]` with word `tokens` (`fromMs`, `toMs`) for karaoke highlighting. Feed it forced-alignment word timings, not guessed times (CAP).

**6. GSAP inside Remotion**: `useGsapTimeline` from `@remotion/gsap` (4.0.517+) builds a paused timeline seeked to the current frame; returns a ref for the scope element.

**7. Assets**: `staticFile("logo.svg")` for files in `public/`; `<Img>`, `<Audio>`, `<OffthreadVideo>` (they wait for loading); fonts via `@remotion/google-fonts/<Family>` `loadFont()` or a local `@font-face`. Never fetch at render time without `delayRender()` / `continueRender()`.

**8. 3D**: `@remotion/three` `<ThreeCanvas>`; read `useCurrentFrame()` inside, never `useFrame` deltas; render with `--gl=angle` if frames are black.

## Rendering to video with umd

```json
{ "render": { "command": "npx remotion render src/index.ts Promo out/promo.mp4 --codec h264 --crf 18", "output": "out/promo.mp4" } }
```

| Need | Flags (all verified in the CLI docs) |
| --- | --- |
| Draft | `--scale 0.5` or `--frames 0-149` or `--every-nth-frame 2` |
| Props | `--props ./props.json` |
| Speed | `--concurrency 4`, `--hardware-acceleration if-possible` (keep it off when comparing two renders) |
| Transparent overlay | `--codec prores --prores-profile 4444 --pixel-format yuva444p10le --image-format png` |
| Stills / thumbnails | `npx remotion still src/index.ts Thumb out/thumb.png --frame 45` |
| 3D blank frames | `--gl angle` |

`umd render` runs the command then `umd analyze`. Render twice and `umd compare` for REN.

## Pitfalls

| Breaks | Fix |
| --- | --- |
| `Math.random()`, `Date.now()`, `new Date()` in a component | `random("seed-1")` from `remotion` (same value every render) |
| CSS `transition`/`@keyframes`, `setTimeout`, `useEffect` timers | Compute from `frame` with `interpolate`/`spring`; `umd lint` flags them |
| Unclamped `interpolate` overshooting | `extrapolateLeft/Right: "clamp"` |
| `spring` default bounce on UI elements | `config: { damping: 200 }` or `durationInFrames` |
| Version mismatch between `remotion` and `@remotion/*` | Pin all to one exact version |
| Remote fonts/images loaded late → fallback in early frames | `staticFile` + local fonts; `delayRender` until ready |
| Team over 3 people discovers the licence at delivery | Decide at kickoff (LIC blocker) |

## Checks

- **REN**: two renders identical (`umd compare`), output spec matches the brief, fonts local.
- **MOT**: easings and durations come from motion tokens, not literals (`umd lint`).
- **CAP**: `umd captions-check` against the word timings fed to `createTikTokStyleCaptions`.
- **LIC**: Remotion licence fits the team size; template code respects the Remotion licence.

## Sources

- https://github.com/remotion-dev/remotion (LICENSE.md, `packages/captions`, `packages/transitions`, `packages/docs/docs/cli/render.mdx`, `docs/gsap/use-gsap-timeline.mdx`)
- https://github.com/remotion-dev/skills · https://www.remotion.dev/docs
- https://github.com/remotion-dev/template-tiktok · https://github.com/remotion-dev/template-code-hike
- research_notes/…/programmatic_video.md
