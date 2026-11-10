#!/usr/bin/env node
// PreToolUse (Bash): in an Ultimate Motion Design project, refuse to install a package or model that the
// project's licence policy forbids (non-commercial weights in a commercial piece, Tencent models in the EU,
// AGPL/GPL code shipped in a web page…). Exits silently in about 30 ms for every other command.
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";

let input = "";
try { input = readFileSync(0, "utf8"); } catch { process.exit(0); }
let payload;
try { payload = JSON.parse(input); } catch { process.exit(0); }
const command = payload?.tool_input?.command || "";
if (!/\b(npm|pnpm|yarn|bunx?|npx|pip[\d.]*|pipx|uvx?|poetry)\b/.test(command)) process.exit(0);
// the shell may sit in a subfolder (web/, scenes/): walk up to the folder that holds .motion/project.json
function findProject(start) {
  let d = resolve(start);
  for (let i = 0; i < 12; i++) {
    if (existsSync(join(d, ".motion", "project.json"))) return d;
    const up = dirname(d);
    if (up === d) break;
    d = up;
  }
  return null;
}
const dir = findProject(payload.cwd || process.cwd()) || (process.env.CLAUDE_PROJECT_DIR ? findProject(process.env.CLAUDE_PROJECT_DIR) : null);
if (!dir) process.exit(0);

const { installTargets, classify } = await import("../lib/licenses.mjs");
const { loadReferential, loadProject, projectFlags } = await import("../lib/ref.mjs");
const targets = installTargets(command);
if (!targets.length) process.exit(0);
const ref = loadReferential();
// an unreadable project.json must not switch the guard off: fall back to the strictest policy
let project = null, fl = new Set(["commercial"]);
try { project = loadProject(dir); fl = projectFlags(project, ref); } catch { project = { license_policy: { commercial: true, region: "EU" } }; }
const pol = { commercial: fl.has("commercial"), region: "EU", allow: [], redistribute: fl.has("is_web"), service: false, resale: false, ...(project?.license_policy || {}) };
const allow = new Set((pol.allow || []).map((x) => String(x).toLowerCase()));
const blocked = [];
for (const t of targets) {
  const e = classify(t, ref.licenses);
  if (!e || allow.has(t.toLowerCase()) || allow.has(e.class)) continue;
  const why = (ref.licenses.classes[e.class]?.blocks || []).find((b) => (b === "commercial" && pol.commercial) || (b === "redistribute" && pol.redistribute)
    || (b === "service" && pol.service) || (b === "resale" && pol.resale) || (b.startsWith("region:") && String(pol.region).toUpperCase() === b.slice(7)));
  if (why) blocked.push(`${t}: ${ref.licenses.classes[e.class].en} (${e.note}; policy: ${why})`);
}
if (!blocked.length) process.exit(0);
process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: `Ultimate Motion Design licence guard: ${blocked.join("; ")}. Use a permissive alternative (see references/licenses.md), or, if the user explicitly accepts it, add the name to license_policy.allow in .motion/project.json.`,
  },
}));
