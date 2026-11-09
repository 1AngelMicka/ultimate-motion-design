---
name: tokens
description: "Show token use of this motion project per /umd command (input, output, cache), from the local Claude Code transcripts, plus tokens saved by compact outputs and how to spend less. FR : consommation de tokens, coût, budget."
disable-model-invocation: true
argument-hint: "[days]"
---

# /umd:tokens

1. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/umd.mjs" tokens --days <$ARGUMENTS or 30>` and show the table as is.
2. Below it, in 3 lines at most, in the user's language: which command used the most, why (renders and reviews with images, parallel auditors, reading references), and the one change that would save the most for this project, from:
   - `/umd:audit quick` or the default incremental audit instead of `full`;
   - `"audit_model": "sonnet"` in `.motion/project.json` (auditors on a cheaper model);
   - `umd render --draft` while iterating; contact sheet instead of individual frames;
   - fewer critic rounds once the look is validated;
   - a `token_budget` in project.json to track the share used.
3. Say that figures come from the transcripts on this machine (subagents included when their transcripts exist) and that cache reads cost a fraction of input tokens.
