# Security

## Reporting a vulnerability

Please do not open a public issue. Use GitHub's private reporting instead: **Security** tab → **Report a vulnerability** on [1AngelMicka/ultimate-motion-design](https://github.com/1AngelMicka/ultimate-motion-design/security/advisories/new). You will get an answer within a week.

## Scope

- The hooks in `plugins/umd/scripts/hooks/` (they run on every session start and every Bash command in a umd project).
- The CLI in `plugins/umd/scripts/`: the local static server used for captures (bound to `127.0.0.1`, serves the project folder only), command execution in `umd run` and `umd render`, and file writes.
- The install flow of `umd doctor --fix`.

Out of scope: vulnerabilities in third-party tools the plugin calls (FFmpeg, Playwright, Chromium, engines, models). Report those to their maintainers.
