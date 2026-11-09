#!/usr/bin/env node
// SessionStart: in a project that uses Ultimate Motion Design, add a short reminder to Claude's context
// (about 120 tokens). Silent everywhere else. Reads local files only.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const dir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const projectFile = join(dir, ".motion", "project.json");
if (!existsSync(projectFile)) process.exit(0);
let p;
try { p = JSON.parse(readFileSync(projectFile, "utf8")); } catch { process.exit(0); }

const audits = join(dir, ".motion", "audits");
const last = existsSync(audits) ? readdirSync(audits).filter((f) => /^\d{4}-\d{2}-\d{2}\.report\.json$/.test(f)).sort().pop() : null;
let auditLine = "No audit yet: /umd:audit once a final render exists.";
if (last) {
  try {
    const r = JSON.parse(readFileSync(join(audits, last), "utf8"));
    auditLine = `Last audit ${r.date}: ${r.global}/10, ${r.open_blockers} open blocker(s) (.motion/AUDIT.md; /umd:fix fixes by priority).`;
  } catch { /* ignore */ }
}
let renderLine = "";
try {
  const lr = JSON.parse(readFileSync(join(dir, ".motion", "renders", "latest.json"), "utf8"));
  renderLine = `Latest render: ${lr.output}${lr.draft ? " (draft)" : ""}.`;
} catch { /* none */ }
const extra = [];
const handoff = join(dir, ".motion", "handoff.md");
if (existsSync(handoff) && (Date.now() - statSync(handoff).mtimeMs) / 86400000 < 14) extra.push("A handoff note exists (.motion/handoff.md): read it before exploring.");
const f = p.format || {};
process.stdout.write([
  `Ultimate Motion Design project: profile ${p.profile}, route ${p.route}, engine ${p.engine}, ${f.width || "?"}x${f.height || "?"}@${f.fps || "?"} fps, ${p.duration_s || "?"} s, language ${p.language || "fr"}.`,
  "Brief: BRIEF.md · storyboard: .motion/storyboard.md · tokens: .motion/motion-tokens.json · assets: .motion/assets.lock.json (record every asset with its licence).",
  "When touching animation, follow the umd `motion` skill; durations and easings come from the motion tokens; time comes from the frame, never the clock.",
  [auditLine, renderLine].filter(Boolean).join(" "),
  ...extra,
].join("\n") + "\n");
