---
name: handoff
description: "Write a short handoff note so the next session resumes the motion project without re-exploring it. FR : note de passation, reprendre plus tard."
disable-model-invocation: true
---

# /umd:handoff

Write `.motion/handoff.md` (under 40 lines, in the project's language), then show its path:

```
# Handoff — <date>
Step: kickoff | storyboard | build | render | audit | fix | deliver
Done this session: <3–6 bullets, with file paths>
Current state: latest render <path, draft or final>, last audit <score, open blockers>
Decisions taken: <route/engine, look, music, licence choices — one line each>
Next: <the exact next command and what it should achieve>
Open questions for the user: <if any>
Files that matter: <5–10 paths with a few words each>
```

The SessionStart hook points the next session to this file for 14 days. Do not paste code or logs into it.
