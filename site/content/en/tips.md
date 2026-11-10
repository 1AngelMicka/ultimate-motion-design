# Tips and prompts

What separates a decent video from one people share: a precise brief, a proven style, stills approved before anything moves, and a few rounds of demanding critique. It is all here, ready to copy.

## The recipe for a good brief

One sentence per point is enough. `/umd:go` asks what is missing, but the more you say up front, the fewer questions it asks.

| Point | Example |
| --- | --- |
| What | A launch video for Notio, our notes app |
| For whom, where | Freelancers scrolling LinkedIn, sound off by default |
| Format | 30 s, 16:9 plus a 9:16 version |
| What to remember | "Your notes file themselves" and the trial link |
| Mood, in words | Dark and precise, like a software keynote; short shots, the interface is the star |
| Constraints | Logo at `brand/logo.svg`, colour #3D5AFE, Inter font, no faces |
| Ambition | Agency level (target score 8) |

Describe references in your own words: shot length, camera position, how things enter the frame. Never ask to copy someone's video.

## Prompts ready to copy

Replace what is in brackets.

**Product launch**

```
/umd:go a 30-second launch video for [product], [what it does in one sentence]. Audience: [who]. Mood: dark and precise, the interface is the star, one hero moment when [the key feature] appears. End on the logo and [the call to action]. 16:9 and 9:16. Music, no voice.
```

**Company presentation video**

```
/umd:go a 60-second presentation video for [company]. Message: [the promise in one sentence]. Three parts: the problem, what we do, the proof ([real figures]). Calm English voice-over, burned-in captions, discreet music. Brand: [colours, font, logo].
```

**Explainer**

```
/umd:go a 45-second explainer of [the concept] for [audience]. One idea per shot, diagrams that build in front of the viewer, no on-screen text longer than 6 words. Voice-over and word-by-word captions.
```

**Vertical short for social media**

```
/umd:go a 20-second 9:16 short for [platform] about [topic]. Hook in the first second, new information every 2 seconds, karaoke captions inside the safe area, a looping end. Rhythmic music, cuts on the beats.
```

**Logo animation**

```
/umd:go a 4-second logo animation from [path to the SVG logo]. The logo builds from [a shape or idea tied to the brand], one gesture, a clean end, a short sound logo. Light and dark background versions, plus a transparent WebM.
```

**Data story**

```
/umd:go a 40-second video telling these figures: [data or CSV file]. A chart that draws itself, counting numbers, a handwritten note on the key figure. Data-journalism style.
```

**Animated web page or 3D hero**

```
/umd:go the animated hero section of [site] in [framework]. References: [2 or 3 sites described in words]. A subtle shader background, the title revealed word by word, 60 fps on mobile, prefers-reduced-motion respected.
```

**Short film**

```
/umd:go a 45-second animated short: [character] wants [something small], tries, [something unexpected happens], and ends looking at the camera. Style [chosen style]. Music and sound effects, no dialogue.
```

## Choose a style

Starting from a proven style is the shortest path to a high-end result. `/umd:storyboard` offers you three. To choose by eye, browse the [Style library](site:bibliotheque): each style has a preview of the result and its prompt. You can also search in a terminal, at no token cost:

```
node <plugin>/scripts/umd.mjs styles luxury dark launch
```

| Mood | Styles to try |
| --- | --- |
| Tech, software, keynote | `lemo:dark-keynote`, `mg:22-hud`, `lemo:swiss-motion` |
| Luxury, premium | `lemo:art-deco`, `lemo:glass-product` |
| Explaining, teaching | `lemo:whiteboard`, `lemo:dataviz`, `lemo:iso-infographic` |
| Playful, warm | `lemo:paper-popup`, `lemo:rubber-hose`, `mg:05-cel-boil` |
| Retro | `mg:10-synthwave`, `lemo:risograph`, `lemo:silent-film` |
| Organic, artistic | `mg:07-liquid`, `lemo:watercolor`, `lemo:ink-wash` |

Previews are in the [lemo-opuscar](https://lemomo-ai.github.io/lemo-opuscar/) and [mg-styles-15](https://vincentwei1021.github.io/mg-styles-15/) galleries. More than 700 other prompts are in [awesome-opus5-5-videos](https://github.com/yihui-dev/awesome-opus5-5-videos).

## During production: what to say

When `/umd:go` shows you stills or a draft, be precise: a moment, a problem, what you want.

- "At 2.4 s the title arrives with the image: bring the image in first, the title 8 frames later."
- "The hero moment is missing: I want a real high point when [X] appears."
- "Too tame: keep the style but push the contrast and the title size."
- "The accent colour is everywhere: keep it for the product."
- "One more round of critique, target 9."
- "It looks like a template: change style, show me three others."

For a precise correction, give four things: **where** (a moment or a frame), **what you see**, **the change**, **what must not move**. Claude then changes one thing and checks the frames around it.

```
At 7 s (frame 210) the cursor covers the file label.
Change only the cursor's path after the click: stop 24 px away from the label.
Keep the click at 6.5 s, the file reveal and the copy as they are.
```

## Beat the template look

What separates a launch film people share from a run of animated slides. The "Motion grammar" reference has the detail; the essentials:

- **One persistent actor**: a cursor, a card or a shape leads the eye from shot to shot.
- **Every action produces a result**: the start state, the cursor on the button, the press, the result, then time to read it.
- **The foreground carries the transition**: the title or logo travels through the camera while the next scene is already in place.
- **Speed changes**: an arrival that slows so you can read, a quick exit. Never a constant drift.
- **The subject fills 60 to 85 % of the frame** in product shots, and frame 0 is already a finished composition.
- **The music ends with the film**: its real ending lands on the end card (`umd mix --backtime`) instead of a fade or a cut.

## Sell a video

The plugin is enough to offer a small service. The simplest format to sell: a 20 s **launch clip** for one feature.

- **One** feature, **one** approved script, **one** square video (1080 × 1080), **one** cover image taken from the film, **one** revision round (timing, copy, sound).
- Make a complete sample first, with your own product or one whose owner agrees. Show it with its three key frames (opening, result, ending).
- Time the real job (preparation, feedback, rendering, delivery) before setting a price. Public anchors gathered in September 2026 by motion-video-kit: AI tools around $30, reels around $150, a 15 to 30 s product video around $455. Generic clips compete with AI tools; what sells is accuracy to the client's real product and quality control. Check your market.
- Before starting, agree in writing on: script, supplied files, date, payment, number of revisions, where the client may use the video and whether you may show it in your portfolio.
- During production: the three key frames to approve the direction, then the draft, then the final render. Feedback is given by moment ("at 7 s…"), which keeps the revision round clear.
- `.motion/LEDGER.md` (each critique round, what changed, the measures) and the audit report show the care taken: attach them to the delivery if the client values it.
- Another format that sells: a **series** with the same character and a short episode every day or week, sold monthly to an app or a brand (pilot of 3 to 5 episodes, then a subscription). The method is in the "A recurring animated series" reference: series bible, locked hero, episodes drawn from the product's reviews and releases, human approval before each post.
- Remotion, if you use it, needs a paid licence above 3 people in the company: `umd capture` and HyperFrames have no such limit.

## What gives away an AI-made video

| Tell | Instead |
| --- | --- |
| Everything fades in moving up 20 px | Varied entrances, tied to what each element is |
| Pulsing dots, things floating forever | Discreet life: breathing, light gliding |
| Bouncy springs everywhere | Springs only when something is thrown or caught |
| A blur on every entrance | Motion blur only on what moves fast |
| Purple gradient, glass cards, centred layout | The palette and grid of the chosen style |
| "Revolutionary", "effortless", "unlock your potential" | Concrete facts, plain verbs |

The automatic checks catch a good part of this (motion tells and hollow wording); the critic agent catches the rest.

## Spend fewer tokens

- Approve the look on stills before animating: one more round on stills costs far less than one on the video.
- While iterating, `/umd:render draft`: half resolution, 15 fps.
- `/umd:audit quick` between iterations; the full audit before delivery.
- Set `"audit_model": "sonnet"` in `.motion/project.json` for the auditors.
- Target 7 for everyday content, 8 for an ad, 9 only if it is worth the extra rounds.
- Check `/umd:tokens` after each big step.
- `/umd:go` states the cost of each step before running it and waits for your go-ahead on the expensive ones. Set a `token_budget` in `.motion/project.json` if you want a ceiling.

## A 20-minute real test

To check that everything works on your machine, end to end:

1. In a **new** folder, open a **new** Claude Code session and install the plugin (see [Install](site:installation)).
2. `/umd:doctor`: everything should be ready; otherwise accept the proposed install.
3. `/umd:go a 4-second logo animation for a made-up coffee roaster called Brûlerie, warm mood, with a sound logo`.
4. At the stills step, look at them and approve them.
5. Let `/umd:go` chain through to the audit, then read `.motion/AUDIT.md`.
6. `/umd:tokens` to see what each step cost.

If a step gets stuck, copy the error message and the output of `node <plugin>/scripts/umd.mjs next`, and open an issue on [GitHub](https://github.com/1AngelMicka/ultimate-motion-design/issues).
