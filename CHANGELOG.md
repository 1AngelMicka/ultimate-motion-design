# Changelog

## 0.1.0 — 2026-11-10

First version.

- Plugin `umd` with the commands kickoff, storyboard, build, render, audit, fix, deliver, doctor, tokens and handoff, plus the `motion` craft skill.
- Agents `auditor` (one per group, in parallel, evidence for every criterion) and `critic` (director's review of stills and drafts).
- Motion quality referential: 12 domains, 58 criteria, 7 profiles, scoring with blocker caps; 27 automatic criteria decided in code.
- Zero-dependency CLI `umd`: deterministic HTML-to-video capture on virtual time, key stills, render twice and compare, FFmpeg analysis (cuts, dead air, freezes, black frames, flashes, loudness, silences, contact sheet), VMAF/SSIM, mix with ducking and fades, loudness normalisation, word-timed captions (ASS karaoke/pop/line, SRT, VTT) and caption check, burn-in, motion lint, licence check, web performance and reduced-motion check, token report, guarded delivery.
- Hooks: short SessionStart context; PreToolUse licence guard on package installs.
- About fifty on-demand references: 6 routes, 13 recipes, 16 engines, audio, craft, assets, licences, companions, platforms.
- Catalogue of 1,072 verified GitHub repositories for agent-driven motion design.
