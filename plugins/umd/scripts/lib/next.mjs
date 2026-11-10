// What should happen next in this project? Reads local files only (no browser launch, no FFmpeg run),
// so /umd:go can decide the next step for a few hundred tokens.
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve, dirname, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { loadProject, motionDir, projectFlags } from "./ref.mjs";
import { resolvePlaywright } from "./playwright.mjs";
import { parseStoryboard } from "./lint.mjs";
import { FFMPEG } from "./ffmpeg.mjs";

// Folders that hold outputs, caches or tools, never sources of the picture
const SKIP = new Set(["node_modules", ".git", "renders", "audits", "deliverables", "dist", "build", "out", ".next", "frames", "analysis", "logs",
  ".reanimate", "stills", "media", "__pycache__", ".claude", ".venv", "venv", ".cache", "_site", "umd-analysis"]);
// Inside .motion/ only these files change the picture; the rest (ledger, styles, audits, project settings) does not
const MOTION_SOURCES = /^(motion-tokens\.json|captions\.(ass|srt|vtt))$/;

function newestSource(root, extraSkip = []) {
  let newest = 0, file = null, count = 0;
  const skipPaths = new Set(extraSkip.map((x) => resolve(root, x)));
  const rec = (dir, depth) => {
    if (depth > 6) return;
    let entries = [];
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    const inMotion = relative(root, dir) === ".motion";
    for (const e of entries) {
      if (count > 5000) return;
      const p = join(dir, e.name);
      if (skipPaths.has(resolve(p))) continue;
      if (e.isDirectory()) { if (!SKIP.has(e.name) && !(inMotion)) rec(p, depth + 1); continue; }
      if (inMotion && !MOTION_SOURCES.test(e.name)) continue;
      if (!e.isFile() || /^\.DS_Store$|token-savings\.json$|latest\.json$|AUDIT\.md$|handoff\.md$|LEDGER\.md$/.test(e.name)) continue;
      count++;
      const m = statSync(p).mtimeMs;
      if (m > newest) { newest = m; file = p; }
    }
  };
  rec(root, 0);
  return { ms: newest, file: file ? relative(root, file) : null };
}

const readJson = (f) => { try { return JSON.parse(readFileSync(f, "utf8")); } catch { return null; } };

// The build is accepted when the critic said "ready" (or the user accepted the draft): a dated line in the ledger
function buildAccepted(md) {
  const f = join(md, "LEDGER.md");
  if (!existsSync(f)) return false;
  return /build accepted\s*:?\s*\d{4}-\d{2}-\d{2}/i.test(readFileSync(f, "utf8").replace(/<!--[\s\S]*?-->/g, ""));
}

// Fix cycles: fix → render → audit → fix never repeats the same step twice in a row, so count the cycles here and
// hand back to the user when two of them in a row did not raise the score.
function fixGuard(md, report) {
  const f = join(md, "state.json");
  const st = readJson(f) || {};
  const seen = st.fix_reports || [];
  const key = `${report.date}:${report.global}:${report.open_blockers}`;
  if (seen.at(-1)?.key !== key) seen.push({ key, score: report.global, blockers: report.open_blockers });
  const last = seen.slice(-3);
  const stuck = last.length === 3 && last[2].score <= last[0].score && last[2].blockers >= last[0].blockers;
  try { writeFileSync(f, JSON.stringify({ ...st, fix_reports: seen.slice(-10) }, null, 2)); } catch { /* read-only folder */ }
  return { cycles: seen.length, stuck };
}

function briefFilled(cwd) {
  const f = join(cwd, "BRIEF.md");
  if (!existsSync(f)) return false;
  const text = readFileSync(f, "utf8").replace(/<!--[\s\S]*?-->/g, "").replace(/^#.*$/gm, "").trim();
  return text.length > 40;
}

export function nextStep(cwd, ref) {
  const state = {};
  const ffmpegOk = spawnSync(FFMPEG, ["-hide_banner", "-version"], { encoding: "utf8" }).status === 0;
  const pw = resolvePlaywright(cwd);
  state.tools = { ffmpeg: ffmpegOk, playwright: !!pw };
  const project = loadProject(cwd);
  const done = (step, reason, extra = {}) => ({ step, command: step === "done" ? null : `/umd:${step}`, reason, ...extra, state });
  if (!ffmpegOk || !pw) return done("doctor", `missing: ${[!ffmpegOk && "FFmpeg", !pw && "Playwright"].filter(Boolean).join(", ")}`);
  if (!project) return done("kickoff", "no .motion/project.json in this folder");
  state.profile = project.profile;
  state.route = project.route;
  if (!briefFilled(cwd)) return done("kickoff", "BRIEF.md is missing or still the empty template");
  const fl = projectFlags(project, ref);
  const md = motionDir(cwd);
  const sbFile = join(md, "storyboard.md");
  const sb = existsSync(sbFile) ? parseStoryboard(readFileSync(sbFile, "utf8")) : null;
  const beatsOk = sb && sb.beats.length > 0 && sb.beats.every((b) => b.duration != null && b.intent);
  state.storyboard = sb ? { beats: sb.beats.length, complete: !!beatsOk, stills_validated: sb.validated } : null;
  if (!beatsOk) return done("storyboard", sb ? "storyboard beats are incomplete (duration or intent missing)" : "no storyboard yet");
  if (!sb.validated) return done("storyboard", "key stills are not validated yet (no dated \"Stills validated\" line)", { needs_user: true });

  const renderOut = project.render?.output ? [project.render.output, dirname(project.render.output) === "." ? null : dirname(project.render.output)].filter(Boolean) : [];
  const src = newestSource(cwd, renderOut);
  const lr = readJson(join(md, "renders", "latest.json"));
  const renderInfo = lr ? readJson(join(cwd, lr.dir, "render.json")) : null;
  const renderMs = Date.parse(renderInfo?.finished_at || renderInfo?.started_at || 0) || 0;
  state.latest_render = lr ? { id: lr.id, draft: lr.draft, output: lr.output } : null;
  const reports = existsSync(join(md, "audits")) ? readdirSync(join(md, "audits")).filter((f) => /\.report\.json$/.test(f)).sort() : [];
  const report = reports.length ? readJson(join(md, "audits", reports.at(-1))) : null;
  const audit = report ? readJson(join(md, "audits", `${report.date}.json`)) : null;
  const auditMs = audit?.created_at ? Date.parse(audit.created_at) : 0;
  state.last_audit = report ? { date: report.date, score: report.global, open_blockers: report.open_blockers, render: report.render_id || null,
    majors_open: report.issues.filter((i) => i.severity === "major" && i.status !== "unknown").length } : null;

  const isVideo = fl.has("is_video");
  if (isVideo) {
    if (!lr) return done("build", "storyboard validated, nothing rendered yet");
    if (lr.draft && !buildAccepted(md)) return done("build", "draft rounds are not finished: no \"Build accepted YYYY-MM-DD\" line in .motion/LEDGER.md yet");
    if (lr.draft) return done("render", "the build is accepted and the latest render is a draft: final render next");
    if (src.ms > renderMs + 1000) return done("render", `sources changed after the latest render (${src.file})`);
    if (!report || report.render_id !== lr.id) return done("audit", "the latest final render has not been audited");
  } else {
    if (!report) return done(project.url ? "audit" : "build", project.url ? "nothing audited yet" : "no page URL in project.json yet: build the page and set \"url\"");
    if (src.ms > auditMs + 1000) return done("audit", `files changed after the last audit (${src.file})`);
  }
  if (report.open_blockers > 0 || state.last_audit.majors_open > 0) {
    const g = fixGuard(md, report);
    state.fix_cycles = g.cycles;
    if (g.stuck) return done("fix", `fixes are not converging: ${g.cycles} audits, score ${report.global}/10 and ${report.open_blockers} blocker(s) unchanged over the last two cycles. Show the user what is left and ask how to proceed`, { needs_user: true });
  }
  if (report.open_blockers > 0) return done("fix", `${report.open_blockers} open blocker(s)`);
  if (state.last_audit.majors_open > 0) return done("fix", `${state.last_audit.majors_open} major issue(s) open (score ${report.global}/10)`, { optional: true });
  if (isVideo) {
    const delivered = existsSync(join(cwd, "deliverables")) && readdirSync(join(cwd, "deliverables")).filter((f) => f.endsWith(".manifest.json"))
      .some((f) => readJson(join(cwd, "deliverables", f))?.render === lr.id);
    if (!delivered) return done("deliver", `audit clean (${report.global}/10), ready to deliver`, { needs_user: true });
  }
  return done("done", isVideo ? "delivered: nothing left to do" : `audit clean (${report.global}/10)`);
}
