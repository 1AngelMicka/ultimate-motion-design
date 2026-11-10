# A recurring animated series

A series with the same hero, the same world and a new short episode on a schedule, for a brand or an app. One clip gets a view; a recurring character builds an audience, which is what a business pays for every month. Method after @bonsaixbt's "Cartoon Retainer" article (X, 2026-11-06), rewritten.

## Use when / avoid when

- Use for daily or weekly shorts for an app, a shop or a channel, explainers with a mascot, onboarding tips told by a character.
- Avoid for a one-off launch film (`routes/promo.md`) or when the client cannot review each episode.

## Setup

- A series bible: `.motion/series-bible.md`, read before every episode. Hero (what they want, how they speak), world, tone, one running gag, what never happens, how the product appears. The product is never the punchline: the hero's problem is.
- A locked hero: one canonical image plus a character sheet (front, side, three expressions) in `assets/hero/`, attached to every generated scene; or one rigged model (Rive, Spine, Blender, three.js) reused in every episode. A hero that drifts from one episode to the next is what makes AI series look like slop. Never borrow a famous character's look.
- Episodes in code (route `film` or `explainer`, `umd capture`), or generated frames with the sheet as reference; voice from a TTS with commercial rights (`audio/voice.md`); captions with `umd captions`.

## Core patterns

1. **Interview, then the bible.** Claude asks the owner about ten questions, then writes `series-bible.md`. The owner approves it once.
2. **Product data becomes premises.** A folder of recent reviews, release notes and support questions: each item is an episode. A one-star review about a confusing button becomes the hero fighting that button and winning; a new feature becomes the hero discovering it.
3. **One run per episode**, from premise to finished file: storyboard (3 to 6 beats), scenes, voice, music back-timed (`umd mix --backtime`), captions, cover frame and post text. Each episode goes through `/umd:audit quick` (the automatic checks, no agent).
4. **A human approves every episode** before it is posted. Scheduling (Claude Code routines, cron) prepares; it never publishes alone.
5. **Keep the episodes comparable**: same format, same hero sheet, same token file, same sound family. Record each episode in `.motion/LEDGER.md` with its scores.

## Selling it

- Offer a paid pilot of 3 to 5 episodes, then a monthly fee for a set number of episodes.
- The client compares you with a studio (thousands per finished minute, weeks of production) and with UGC creators (around $100 to $1,200 per video, per the article's 2026 figures), not with your costs. Sell consistency and output, never a number of views.
- Agree on who approves, the posting rhythm, the rights to the hero (who owns the character) and the portfolio use before episode 1.

## Checks

- The hero matches the sheet in every episode (critic: style_fidelity); no new face.
- NAR-04: each episode is understandable with the sound off; captions pass CAP-01.
- LIC: TTS, music and any generated image recorded in `assets.lock.json` with a commercial licence.

## Sources

- @bonsaixbt, "Claude Just Killed the $15,000 Animation Studio" (X article, 2026-11-06): https://x.com/bonsaixbt/status/2118711268475392443
