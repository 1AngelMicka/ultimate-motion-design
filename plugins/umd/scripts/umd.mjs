#!/usr/bin/env node
// Ultimate Motion Design CLI. Zero dependencies, Node 18+. Needs FFmpeg; Playwright for HTML capture and web checks.
//
// Setup
//   next                                The next step for this project (what /umd:go runs), from local files only
//   doctor [--fix]                     Check FFmpeg, Playwright, Chromium and the route's tools; --fix installs what it safely can
//   detect                              Guess engine, route and profile from the current folder
//   init [--force]                      Create .motion/ (project.json, storyboard, tokens, assets lock) and BRIEF.md from templates
//   rules [domain|group...]             Build rules of the domains that apply to this project (compact)
// Make
//   still <html|url> --at 0,1.5 [--out dir] [--width W --height H]      Key stills on virtual time
//   capture <html|url> --out f.mp4 [--fps 30] [--duration s] [--width 1920 --height 1080] [--from s]
//           [--draft] [--transparent] [--format mp4|webm|mov|gif|png] [--audio f] [--seed n]   Deterministic HTML → video
//   render [--draft] [--twice] [--no-analyze]                          Render the project (project.json "render"), then analyze
//   mix --voice v.wav --music m.wav [--sfx a.wav@1.2 ...] --out mix.wav [--duck 9] [--lufs -14] [--length s]  (length defaults to duration_s)
//   normalize <in> <out> [--lufs -14] [--tp -1]      loudness <file>
//   captions <words.json> --out subs.ass|srt|vtt [--style karaoke|pop|line] [--max-chars 32] [--width --height --font --color --highlight]
//   burn <video> <subs.ass> --out f.mp4             Burn captions in (libass)
// Check
//   analyze <video> [--out dir]                     Probe, cuts, freezes, dead air, black, flashes, loudness, contact sheet
//   frames <video> --at 1,2.5 | --every 2 [--out dir]
//   compare <a> <b>                                 Frame-hash equality + SSIM       vmaf <encode> <master>
//   lint [dir]   licenses   webperf <url>   captions-check <subs> <words.json>
//   evidence [--date D]                             All automatic checks for the audit + statuses of auto criteria
//   plan [scope...] [--incremental]                 Criteria left for the auditors      assemble [--date D]      status
// Deliver and account
//   deliver [--name n]                              Copy the audited render to deliverables/ (refused while a blocker is open)
//   tokens [--days 30] [--session id] [--json]      Token use per /umd:* command, from the session transcripts
//   run <label> "<command>"                         Run a command, keep the log on disk, print a compact summary
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, copyFileSync, statSync } from "node:fs";
import { join, relative, resolve, extname, basename } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { loadReferential, loadProject, motionDir, projectFlags, applies, allDomains, thresholds, today, stamp, PLUGIN_ROOT } from "./lib/ref.mjs";
import { compute, toMarkdown, grade } from "./lib/score.mjs";
import { estimateTokens, recordSavings } from "./lib/run.mjs";

const ref = loadReferential();
const cwd = process.cwd();
const argv = process.argv.slice(2);
const cmd = argv.shift();
const flags = new Set();
const opts = {};
const pos = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith("--")) {
    const k = a.slice(2);
    const v = argv[i + 1];
    if (v === undefined || v.startsWith("--")) flags.add(k);
    else { (opts[k] ??= []).push(v); i++; }
  } else pos.push(a);
}
const opt = (k, d = null) => (opts[k] ? opts[k][opts[k].length - 1] : d);
const list = (k) => (opts[k] || []).flatMap((x) => x.split(",")).map((x) => x.trim()).filter(Boolean);
const out = (obj) => {
  const text = JSON.stringify(obj, null, 2);
  process.stdout.write(text + "\n");
  return text;
};
const die = (msg) => { process.stderr.write(msg + "\n"); process.exit(1); };
const md = motionDir(cwd);
const auditsDir = () => join(md, "audits");
const statsFile = () => join(md, "token-savings.json");
const sha256 = (f) => createHash("sha256").update(readFileSync(f)).digest("hex").slice(0, 16);

function requireProject() {
  const p = loadProject(cwd);
  if (!p) die("No .motion/project.json here. Run /umd:kickoff (or: umd init) first.");
  if (!ref.profiles[p.profile]) die(`Unknown profile "${p.profile}" (${Object.keys(ref.profiles).join(", ")}).`);
  return p;
}

// Compact output for large results: full JSON on disk, summary on stdout.
function compact(label, full, summary, dir) {
  if (dir) { mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, `${label}.json`), JSON.stringify(full, null, 2)); }
  const shown = out(summary);
  if (existsSync(md)) recordSavings(statsFile(), estimateTokens(JSON.stringify(full, null, 2)), estimateTokens(shown));
}

function latestRender() {
  const f = join(md, "renders", "latest.json");
  return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : null;
}

function analysisSummary(a) {
  if (!a) return null;
  return {
    file: a.file, duration: a.probe?.duration, size: a.probe?.width ? `${a.probe.width}x${a.probe.height}@${a.probe.fps}` : null,
    scenes: a.scenes?.count, dead_air: a.dead_air, freezes: (a.freezes || []).filter((x) => x.duration >= 1), black: a.black,
    flashes_max_per_s: a.flashes?.max_per_s, loudness: a.loudness ? { lufs: a.loudness.integrated, true_peak: a.loudness.true_peak } : null,
    abrupt_end: a.audio_end?.abrupt, motion_mean: a.motion?.mean, sheet: a.sheet ? `${a.sheet.file} (${a.sheet.layout}, times ${a.sheet.times.join(" ")})` : null,
  };
}

// ---------- audit pipeline ----------
function auditFiles() {
  if (!existsSync(auditsDir())) return [];
  return readdirSync(auditsDir()).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
}
const loadAudit = (date) => { const f = join(auditsDir(), `${date}.json`); return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : null; };

function changedSince(ms) {
  const changed = [];
  const skip = new Set(["node_modules", ".git", "renders", "audits", "deliverables", "dist", "build", "out", ".next"]);
  const rec = (dir) => {
    let entries = [];
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (changed.length > 300) return;
      const p = join(dir, e.name);
      if (e.isDirectory()) { if (!skip.has(e.name)) rec(p); }
      else if (e.isFile() && statSync(p).mtimeMs > ms && !/token-savings\.json$/.test(e.name)) changed.push(relative(cwd, p));
    }
  };
  rec(cwd);
  return changed;
}

async function evidence() {
  const project = requireProject();
  const date = opt("date", today());
  const dir = join(auditsDir(), date);
  mkdirSync(join(dir, "parts"), { recursive: true });
  const fl = projectFlags(project, ref);
  const th = thresholds(project, ref);
  const ev = {};
  const notes = [];
  const lr = latestRender();
  if (lr) {
    const af = join(cwd, lr.dir, "analysis.json");
    if (existsSync(af)) ev.analysis = JSON.parse(readFileSync(af, "utf8"));
    const df = join(cwd, lr.dir, "determinism.json");
    if (existsSync(df)) ev.determinism = JSON.parse(readFileSync(df, "utf8"));
    if (lr.draft) notes.push("The latest render is a draft: render without --draft before a final audit.");
  } else if (fl.has("is_video")) notes.push("No render yet: run /umd:render first, video criteria stay unknown.");
  const { lint } = await import("./lib/lint.mjs");
  ev.lint = lint(cwd, { ref, project, thresholds: th });
  const { checkLicenses } = await import("./lib/licenses.mjs");
  ev.licenses = checkLicenses(cwd, { ref, project, flags: fl });
  if (fl.has("has_captions") && project.captions?.file && project.captions?.words) {
    try { const { checkCaptions } = await import("./lib/captions.mjs"); ev.captions = checkCaptions(project.captions.file, project.captions.words, { cwd }); }
    catch (e) { notes.push(`captions-check failed: ${e.message}`); }
  }
  if (fl.has("is_web") && project.url) {
    try { const { webperf } = await import("./lib/webperf.mjs"); ev.webperf = await webperf(project.url, { cwd }); }
    catch (e) { notes.push(`webperf failed: ${e.message.split("\n")[0]}`); }
  }
  if (fl.has("has_master") && project.master && lr?.output) {
    try { const { vmaf } = await import("./lib/compare.mjs"); ev.vmaf = vmaf(lr.output, project.master, { cwd }); }
    catch (e) { notes.push(`vmaf failed: ${e.message.split("\n")[0]}`); }
  }
  const { autocheck } = await import("./lib/autocheck.mjs");
  const planned = new Set(allDomains(ref).filter((d) => (ref.profiles[project.profile].weights[d.id] ?? 0) > 0 && applies(d, fl))
    .flatMap((d) => d.criteria.filter((c) => applies(c, fl)).map((c) => c.id)));
  const all = autocheck(ev, th, project);
  const results = Object.fromEntries(Object.entries(all).filter(([id]) => planned.has(id)));
  writeFileSync(join(dir, "evidence.json"), JSON.stringify({ date, render: lr, ...ev }, null, 2));
  writeFileSync(join(dir, "parts", "auto.json"), JSON.stringify({ group: "auto", render: lr?.id || null, results }, null, 2));
  const counts = {};
  for (const r of Object.values(results)) counts[r.status] = (counts[r.status] || 0) + 1;
  const summary = { date, out_dir: relative(cwd, dir), render: lr ? `${lr.output}${lr.draft ? " (draft)" : ""}` : null, auto_criteria: Object.keys(results).length, counts,
    not_passing: Object.entries(results).filter(([, r]) => r.status !== "pass").map(([id, r]) => `${id} ${r.status}: ${r.evidence}`.slice(0, 220)),
    sheet: ev.analysis?.sheet?.file || null, notes };
  compact("evidence-summary", { ...summary, evidence: ev }, summary, null);
}

function plan(scope, incremental) {
  const project = requireProject();
  const date = opt("date", today());
  const dir = join(auditsDir(), date);
  mkdirSync(join(dir, "parts"), { recursive: true });
  const fl = projectFlags(project, ref);
  const profile = ref.profiles[project.profile];
  let autoDone = {};
  try { autoDone = JSON.parse(readFileSync(join(dir, "parts", "auto.json"), "utf8")).results || {}; } catch { /* evidence not run */ }
  const tokens = new Set(scope.map((s) => s.toLowerCase()));
  const quick = tokens.delete("quick");
  tokens.delete("full");
  let mode = quick ? "quick" : tokens.size ? "scoped" : "full";
  let inc = null;
  const files = auditFiles();
  const prev = files.length ? JSON.parse(readFileSync(join(auditsDir(), files.at(-1)), "utf8")) : null;
  if (incremental && !quick && prev) {
    const lastFull = prev.last_full || prev.date;
    if (prev.pack_version !== ref.version) inc = { forced_full: `plugin updated (${prev.pack_version} → ${ref.version})` };
    else if ((Date.parse(today()) - Date.parse(lastFull)) / 86400000 > 30) inc = { forced_full: `last full audit older than 30 days (${lastFull})` };
    else {
      const changed = changedSince(Date.parse(prev.created_at || prev.date));
      const renderChanged = (latestRender()?.id || null) !== (prev.render || null);
      mode = "incremental";
      inc = { since: prev.date, changed_files: changed.slice(0, 100), changed_count: changed.length, render_changed: renderChanged, no_changes: changed.length === 0 && !renderChanged };
    }
  } else if (incremental && !prev) inc = { forced_full: "no previous audit" };
  const inScope = (g, d, c) => !tokens.size || tokens.has(g.group) || tokens.has(d.id) || tokens.has(d.code.toLowerCase()) || tokens.has(c.id.toLowerCase()) || (tokens.has("blockers") && c.severity === "blocker");
  const groups = [];
  let count = 0, auto = 0;
  for (const g of ref.groups) {
    const domains = [];
    for (const d of g.domains) {
      if (!((profile.weights[d.id] ?? 0) > 0) || !applies(d, fl)) continue;
      const criteria = [];
      for (const c of d.criteria) {
        if (!applies(c, fl) || !inScope(g, d, c)) continue;
        if (autoDone[c.id]) { auto++; continue; }
        if (quick) continue; // quick: automatic results only
        const item = { id: c.id, severity: c.severity, label: c.label.en, verify: c.verify.en, method: c.check.method };
        const p = prev?.results?.[c.id];
        if (mode === "incremental" && p) item.previous = { status: p.status, evidence: String(p.evidence || "").slice(0, 160) };
        criteria.push(item);
        count++;
      }
      if (criteria.length) domains.push({ id: d.id, code: d.code, label: d.label.en, criteria });
    }
    if (domains.length) groups.push({ group: g.group, label: g.label.en, domains });
  }
  const result = { date, out_dir: relative(cwd, dir), umd_cli: fileURLToPath(import.meta.url), plugin_root: PLUGIN_ROOT, project: project.name, profile: project.profile,
    language: project.language || "fr", flags: [...fl].sort(), mode, incremental: inc, audit_model: project.audit_model || "inherit",
    render: latestRender(), auto_decided: auto, criteria_for_auditors: count, groups };
  writeFileSync(join(dir, "plan.json"), JSON.stringify(result, null, 2));
  const lr = result.render;
  const summary = { ...result, render: lr ? { id: lr.id, output: lr.output, draft: lr.draft } : null, groups: groups.map((g) => ({ group: g.group, criteria: g.domains.flatMap((d) => d.criteria.map((c) => c.id)) })) };
  compact("plan-summary", result, summary, null);
}

function assemble() {
  const project = requireProject();
  const date = opt("date", today());
  const dir = join(auditsDir(), date);
  const partsDir = join(dir, "parts");
  if (!existsSync(partsDir)) die(`No ${relative(cwd, partsDir)}: run umd evidence first.`);
  const known = new Map(allDomains(ref).flatMap((d) => d.criteria.map((c) => [c.id, c])));
  const results = {};
  const warnings = [];
  const returned = new Set();
  let autoChecked = 0;
  let renderId = null;
  for (const f of readdirSync(partsDir).filter((x) => x.endsWith(".json")).sort((a, b) => (a === "auto.json" ? -1 : b === "auto.json" ? 1 : a.localeCompare(b)))) {
    let part;
    try { part = JSON.parse(readFileSync(join(partsDir, f), "utf8")); } catch (e) { warnings.push(`${f}: invalid JSON (${e.message})`); continue; }
    if (f === "auto.json") renderId = part.render || null;
    for (const [id, r] of Object.entries(part.results || {})) {
      if (!known.has(id)) { warnings.push(`${f}: unknown criterion ${id}`); continue; }
      returned.add(id);
      if (r.status === "carry") continue;
      if (!["pass", "partial", "fail", "unknown", "na"].includes(r.status)) { warnings.push(`${f}: ${id} has invalid status "${r.status}"`); continue; }
      if (r.status === "pass" && !String(r.evidence || "").trim()) { warnings.push(`${f}: ${id} passed without evidence, counted as unknown`); r.status = "unknown"; }
      if (f === "auto.json") autoChecked++;
      results[id] = { status: r.status, evidence: r.evidence || "", fix: r.fix || "", ...(f === "auto.json" ? { auto: true } : {}) };
    }
  }
  const files = auditFiles();
  const sameDay = loadAudit(date);
  const prevFile = files.filter((f) => f < `${date}.json`).pop();
  const previous = prevFile ? JSON.parse(readFileSync(join(auditsDir(), prevFile), "utf8")) : null;
  const base = sameDay || previous;
  let carried = 0;
  if (base) for (const [id, r] of Object.entries(base.results || {})) if (!(id in results)) { results[id] = { ...r, carried_from: r.carried_from || base.date }; carried++; }
  let planInfo = {};
  try { planInfo = JSON.parse(readFileSync(join(dir, "plan.json"), "utf8")); } catch { /* no plan */ }
  const planned = (planInfo.groups || []).flatMap((g) => g.domains.flatMap((d) => d.criteria.map((c) => c.id)));
  const missing = planned.filter((id) => !returned.has(id));
  if (missing.length && !planInfo.incremental?.no_changes) warnings.push(`${missing.length} planned criteria not returned by the auditors: ${missing.slice(0, 15).join(", ")}`);
  const mode = planInfo.mode || "full";
  const lastFull = mode === "full" ? date : base?.last_full || base?.date || null;
  let tokenSavings = null;
  try { tokenSavings = JSON.parse(readFileSync(statsFile(), "utf8")); } catch { /* none */ }
  const audit = { date, created_at: new Date().toISOString(), project: project.name, profile: project.profile, flags: [...projectFlags(project, ref)],
    pack_version: ref.version, mode, render: renderId, last_full: lastFull, token_savings: tokenSavings, results };
  writeFileSync(join(auditsDir(), `${date}.json`), JSON.stringify(audit, null, 2));
  const lang = opt("lang", project.language || "fr");
  const report = compute(audit, ref);
  Object.assign(report, { mode, token_savings: tokenSavings, auto_checked: autoChecked, render: latestRender()?.output || null, render_id: renderId });
  const prevReport = previous ? compute(previous, ref) : null;
  const mdText = toMarkdown(report, ref, lang, prevReport);
  writeFileSync(join(auditsDir(), `${date}.md`), mdText);
  writeFileSync(join(md, "AUDIT.md"), mdText);
  writeFileSync(join(auditsDir(), `${date}.report.json`), JSON.stringify(report, null, 2));
  out({ date, global: report.global, grade: report.global == null ? null : grade(report.global, ref, lang), global_capped: report.global_capped,
    previous_global: prevReport?.global ?? null, open_blockers: report.open_blockers, counts: report.counts, auto_checked: autoChecked, mode, carried_forward: carried,
    token_savings: tokenSavings?.saved ?? null, warnings, report: relative(cwd, join(md, "AUDIT.md")),
    top_issues: report.issues.slice(0, 10).map((i) => ({ id: i.id, severity: i.severity, status: i.status, label: i.label[lang], fix: i.fix })) });
}

function deliver() {
  const project = requireProject();
  const reports = existsSync(auditsDir()) ? readdirSync(auditsDir()).filter((f) => /\.report\.json$/.test(f)).sort() : [];
  if (!reports.length) die("No audit yet: run /umd:audit before delivering.");
  const report = JSON.parse(readFileSync(join(auditsDir(), reports.at(-1)), "utf8"));
  const lr = latestRender();
  if (!lr) die("No render to deliver: run /umd:render.");
  if (lr.draft) die("The latest render is a draft. Run /umd:render (final), then /umd:audit, then deliver.");
  if (report.render_id && report.render_id !== lr.id) die(`The latest render (${lr.id}) was not audited (audit covered ${report.render_id}). Run /umd:audit again.`);
  if (report.open_blockers > 0) {
    const b = report.issues.filter((i) => i.severity === "blocker").map((i) => `${i.id} (${i.status}): ${i.fix || i.label.en}`);
    process.stderr.write(`Delivery refused: ${report.open_blockers} open blocker(s).\n- ${b.join("\n- ")}\nFix them with /umd:fix, then render and audit again.\n`);
    process.exit(2);
  }
  const src = resolve(cwd, lr.output);
  const ext = extname(src);
  const name = (opt("name") || project.name || "motion").toString().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const p = lr.probe || {};
  const dest = join(cwd, "deliverables", `${name}-${p.width || ""}x${p.height || ""}-${today()}${ext}`.replace("-x-", "-"));
  mkdirSync(join(cwd, "deliverables"), { recursive: true });
  copyFileSync(src, dest);
  const lockF = join(md, "assets.lock.json");
  let lock = [];
  try { const j = JSON.parse(readFileSync(lockF, "utf8")); lock = Array.isArray(j) ? j : j.assets || []; } catch { /* none */ }
  const credits = lock.filter((a) => a.attribution_required || /^cc-by/i.test(a.license || "")).map((a) => `${a.path} — ${a.author || "unknown author"} — ${a.license} — ${a.url || a.source}`);
  if (credits.length) writeFileSync(join(cwd, "deliverables", "credits.txt"), credits.join("\n") + "\n");
  const manifest = { file: relative(cwd, dest), sha256: sha256(dest), render: lr.id, audit: report.date, score: report.global, profile: report.profile, delivered_at: new Date().toISOString(), credits: credits.length };
  writeFileSync(dest + ".manifest.json", JSON.stringify(manifest, null, 2));
  out(manifest);
}

async function render() {
  const project = requireProject();
  const r = project.render || {};
  const draft = flags.has("draft");
  const id = `${stamp()}${draft ? "-draft" : ""}`;
  const dir = join(md, "renders", id);
  mkdirSync(dir, { recursive: true });
  const fmt = project.format || {};
  const info = { id, draft, started_at: new Date().toISOString() };
  const doRender = async (suffix) => {
    if (r.capture) {
      const { capture } = await import("./lib/capture.mjs");
      const c = r.capture;
      const format = c.format || "mp4";
      const file = join(dir, `video${suffix}.${format === "png" ? "frames" : format}`);
      const res = await capture(c.entry || "index.html", { cwd, out: file, fps: c.fps || fmt.fps || 30, duration: c.duration || project.duration_s, width: c.width || fmt.width, height: c.height || fmt.height,
        draft, transparent: !!c.transparent, format, audio: r.audio || c.audio || null, seed: c.seed ?? 42 });
      return { output: res.out, capture: res };
    }
    if (r.command) {
      const { runCommand } = await import("./lib/run.mjs");
      const command = (draft && r.draft_command) || r.command;
      const res = runCommand(`render${suffix}`, command, { cwd, logDir: join(dir, "logs"), statsFile: statsFile() });
      if (res.exit_code !== 0) return { error: res };
      const output = r.output;
      if (!output || !existsSync(resolve(cwd, output))) return { error: { ...res, note: `render.output "${output}" not found after the command` } };
      const keep = join(dir, `video${suffix}${extname(output)}`);
      copyFileSync(resolve(cwd, output), keep);
      if (r.audio && !/\.(gif|png)$/i.test(output)) {
        const { ffOk } = await import("./lib/ffmpeg.mjs");
        const muxed = keep.replace(/(\.\w+)$/, ".mux$1");
        ffOk(["-i", keep, "-i", resolve(cwd, r.audio), "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest", "-movflags", "+faststart", muxed]);
        copyFileSync(muxed, keep);
      }
      return { output: relative(cwd, keep), command: { exit_code: res.exit_code, duration_s: res.duration_s, log: res.log, signal_lines: res.signal_lines.slice(0, 8) } };
    }
    die('project.json has no "render": set render.capture {entry} or render.command + render.output (see the route reference).');
  };
  const t0 = Date.now();
  const a = await doRender("");
  if (a.error) { writeFileSync(join(dir, "render.json"), JSON.stringify({ ...info, error: a.error }, null, 2)); out({ id, ok: false, error: a.error }); process.exit(1); }
  Object.assign(info, a, { seconds: Math.round((Date.now() - t0) / 100) / 10, sha256: existsSync(resolve(cwd, a.output)) && statSync(resolve(cwd, a.output)).isFile() ? sha256(resolve(cwd, a.output)) : null });
  let determinism = null;
  if (flags.has("twice")) {
    const b = await doRender("-b");
    if (!b.error) {
      const { compareVideos } = await import("./lib/compare.mjs");
      determinism = compareVideos(a.output, b.output, { cwd });
      writeFileSync(join(dir, "determinism.json"), JSON.stringify(determinism, null, 2));
    }
  }
  let analysis = null;
  if (!flags.has("no-analyze") && !/\.frames$/.test(a.output)) {
    const { analyze } = await import("./lib/analyze.mjs");
    analysis = analyze(a.output, { cwd, outDir: dir, thresholds: thresholds(project, ref) });
    info.probe = analysis.probe;
  }
  writeFileSync(join(dir, "render.json"), JSON.stringify(info, null, 2));
  writeFileSync(join(md, "renders", "latest.json"), JSON.stringify({ id, dir: relative(cwd, dir), output: a.output, draft, probe: info.probe || null }, null, 2));
  out({ id, ok: true, output: a.output, seconds: info.seconds, page_errors: a.capture?.page_errors?.length ? a.capture.page_errors : undefined,
    determinism: determinism ? { identical: determinism.identical, ssim: determinism.ssim } : undefined, analysis: analysisSummary(analysis) });
}

function initProject() {
  const files = [
    ["project.json", join(md, "project.json")], ["storyboard.md", join(md, "storyboard.md")], ["motion-tokens.json", join(md, "motion-tokens.json")],
    ["assets.lock.json", join(md, "assets.lock.json")], ["BRIEF.md", join(cwd, "BRIEF.md")],
  ];
  mkdirSync(join(md, "stills"), { recursive: true });
  const created = [], kept = [];
  const name = basename(cwd);
  for (const [tpl, dest] of files) {
    if (existsSync(dest) && !flags.has("force")) { kept.push(relative(cwd, dest)); continue; }
    let txt = readFileSync(join(PLUGIN_ROOT, "templates", tpl), "utf8").replaceAll("{{name}}", name);
    if (tpl === "project.json") { const j = JSON.parse(txt); j.name = name; txt = JSON.stringify(j, null, 2) + "\n"; }
    writeFileSync(dest, txt);
    created.push(relative(cwd, dest));
  }
  const gi = join(cwd, ".gitignore");
  const lines = [".motion/renders/", ".motion/audits/*/logs/", ".motion/token-savings.json"];
  const cur = existsSync(gi) ? readFileSync(gi, "utf8") : "";
  const add = lines.filter((l) => !cur.includes(l));
  if (add.length) writeFileSync(gi, cur + (cur && !cur.endsWith("\n") ? "\n" : "") + "# Ultimate Motion Design\n" + add.join("\n") + "\n");
  out({ created, kept, gitignore: add.length ? add : "unchanged" });
}

function detect() {
  const pkgs = new Set();
  try { const j = JSON.parse(readFileSync(join(cwd, "package.json"), "utf8")); for (const k of ["dependencies", "devDependencies"]) Object.keys(j[k] || {}).forEach((x) => pkgs.add(x)); } catch { /* none */ }
  const top = existsSync(cwd) ? readdirSync(cwd) : [];
  const has = (re) => [...pkgs].some((p) => re.test(p));
  const engines = [];
  if (has(/^remotion$|^@remotion\//)) engines.push("remotion");
  if (has(/hyperframes/)) engines.push("hyperframes");
  if (has(/^@revideo\/|^@motion-canvas\//)) engines.push("revideo");
  if (has(/^gsap$|^@gsap\//)) engines.push("gsap");
  if (has(/^motion$|^framer-motion$|^motion-v$/)) engines.push("motion");
  if (has(/^three$|^@react-three\//)) engines.push("threejs");
  if (has(/lottie/)) engines.push("lottie");
  if (has(/^@rive-app\//)) engines.push("rive");
  if (has(/^p5$|^pixi\.js$|^two\.js$|^paper$/)) engines.push("canvas-2d");
  if (has(/^lenis$|^@studio-freight\/lenis$/)) engines.push("lenis");
  if (top.some((f) => f.endsWith(".blend"))) engines.push("blender");
  if (top.some((f) => f.endsWith(".py") && /from manim import|import manim/.test(readFileSync(join(cwd, f), "utf8")))) engines.push("manim");
  const web = has(/^next$|^vite$|^astro$|^nuxt$|^@sveltejs\/kit$|^react-dom$/);
  const htmlEntry = top.find((f) => /^index\.html?$/.test(f)) || null;
  const route = engines.includes("blender") ? "blender" : engines.includes("manim") ? "explainer" : engines.includes("threejs") && !web ? "threejs-film" : web ? "web-page" : "html-video";
  const engine = engines.find((e) => ["remotion", "hyperframes", "revideo", "manim", "blender"].includes(e)) || (route === "web-page" ? engines[0] || "css" : "umd-capture");
  out({ engines, web_framework: web, html_entry: htmlEntry, suggested: { route, engine, profile: route === "web-page" ? "web" : null }, project_exists: existsSync(join(md, "project.json")) });
}

function rules(scope) {
  const project = loadProject(cwd);
  const lang = project?.language || "fr";
  const fl = project ? projectFlags(project, ref) : null;
  const profile = project ? ref.profiles[project.profile] : null;
  const want = new Set(scope.map((s) => s.toLowerCase()));
  const lines = [];
  for (const g of ref.groups) for (const d of g.domains) {
    if (want.size && !want.has(d.id) && !want.has(g.group) && !want.has(d.code.toLowerCase())) continue;
    if (profile && (!((profile.weights[d.id] ?? 0) > 0) || !applies(d, fl))) continue;
    lines.push(`## ${d.code} ${d.label[lang]}`, ...d.build.map((b) => `- ${b[lang]}`));
  }
  process.stdout.write(lines.join("\n") + "\n");
}

async function main() {
  switch (cmd) {
    case "doctor": {
      const { doctor } = await import("./lib/doctor.mjs");
      const r = await doctor({ cwd, project: loadProject(cwd), fix: flags.has("fix") });
      if (flags.has("json")) return out(r);
      return out({ ok: r.ok, os: r.os, ready: r.checks.filter((c) => c.ok).map((c) => c.name),
        missing: r.checks.filter((c) => !c.ok).map(({ name, optional, note, fix }) => ({ name, optional: !!optional, note: note || undefined, fix })),
        fixed: r.fixed.length ? r.fixed : undefined, runtime_dir: r.runtime_dir });
    }
    case "detect": return detect();
    case "init": return initProject();
    case "rules": return rules(pos);
    case "still": {
      if (!pos[0]) die("Usage: umd still <html|url> --at 0,1.5 [--out dir]");
      const { stills } = await import("./lib/capture.mjs");
      const p = loadProject(cwd);
      return out(await stills(pos[0], { cwd, at: list("at").map(Number), out: opt("out", ".motion/stills"), width: opt("width", p?.format?.width), height: opt("height", p?.format?.height), prefix: opt("prefix", "still") }));
    }
    case "capture": {
      if (!pos[0]) die("Usage: umd capture <html|url> --out f.mp4 [--fps 30] [--duration s]");
      const { capture } = await import("./lib/capture.mjs");
      const p = loadProject(cwd);
      return out(await capture(pos[0], { cwd, out: opt("out", "out.mp4"), fps: opt("fps", p?.format?.fps), duration: opt("duration"), width: opt("width", p?.format?.width), height: opt("height", p?.format?.height),
        from: opt("from"), draft: flags.has("draft"), transparent: flags.has("transparent"), format: opt("format"), audio: opt("audio"), seed: opt("seed") }));
    }
    case "render": return render();
    case "analyze": {
      if (!pos[0]) die("Usage: umd analyze <video> [--out dir]");
      const { analyze } = await import("./lib/analyze.mjs");
      const p = loadProject(cwd);
      const dir = opt("out") ? resolve(cwd, opt("out")) : join(existsSync(md) ? join(md, "analysis") : join(cwd, "umd-analysis"), basename(pos[0]).replace(/\W+/g, "-"));
      const a = analyze(pos[0], { cwd, outDir: dir, thresholds: thresholds(p, ref) });
      return compact("analysis-full", a, { ...analysisSummary(a), motion_timeline: a.motion?.timeline, full: relative(cwd, join(dir, "analysis.json")) }, null);
    }
    case "frames": {
      if (!pos[0]) die("Usage: umd frames <video> --at 1,2.5 | --every 2 [--out dir]");
      const { frames, contactSheet } = await import("./lib/analyze.mjs");
      const dir = resolve(cwd, opt("out", join(existsSync(md) ? ".motion" : ".", "frames", basename(pos[0]).replace(/\W+/g, "-"))));
      if (flags.has("sheet")) { const { probe } = await import("./lib/ffmpeg.mjs"); mkdirSync(dir, { recursive: true }); const s = contactSheet(resolve(cwd, pos[0]), probe(resolve(cwd, pos[0])), join(dir, "sheet.jpg")); return out({ ...s, file: relative(cwd, s.file) }); }
      return out(frames(pos[0], { cwd, at: list("at").map(Number), every: opt("every") ? Number(opt("every")) : null, outDir: dir, width: Number(opt("width", 960)) }));
    }
    case "compare": {
      if (pos.length < 2) die("Usage: umd compare <a> <b>");
      const { compareVideos } = await import("./lib/compare.mjs");
      return out(compareVideos(pos[0], pos[1], { cwd }));
    }
    case "vmaf": {
      if (pos.length < 2) die("Usage: umd vmaf <encode> <master>");
      const { vmaf } = await import("./lib/compare.mjs");
      return out(vmaf(pos[0], pos[1], { cwd }));
    }
    case "loudness": {
      if (!pos[0]) die("Usage: umd loudness <file>");
      const { loudness } = await import("./lib/audio.mjs");
      return out(loudness(pos[0], { cwd }));
    }
    case "normalize": {
      if (pos.length < 2) die("Usage: umd normalize <in> <out> [--lufs -14] [--tp -1]");
      const { normalize } = await import("./lib/audio.mjs");
      return out(normalize(pos[0], pos[1], { cwd, lufs: Number(opt("lufs", -14)), tp: Number(opt("tp", -1)) }));
    }
    case "mix": {
      const { mix } = await import("./lib/audio.mjs");
      if (!opt("out")) die("Usage: umd mix --voice v.wav --music m.wav [--sfx a.wav@1.2] --out mix.wav [--duck 9]");
      return out(mix({ cwd, voice: opt("voice"), music: opt("music"), sfx: opts.sfx || [], out: opt("out"), duck: Number(opt("duck", 9)), musicGainDb: Number(opt("music-gain", -6)), lufs: Number(opt("lufs", -14)), tp: Number(opt("tp", -1)), length: opt("length", loadProject(cwd)?.duration_s ?? null) }));
    }
    case "captions": {
      if (!pos[0] || !opt("out")) die("Usage: umd captions <words.json> --out subs.ass [--style karaoke|pop|line]");
      const { makeCaptions } = await import("./lib/captions.mjs");
      const p = loadProject(cwd);
      return out(makeCaptions(pos[0], opt("out"), { cwd, style: opt("style", "karaoke"), maxChars: Number(opt("max-chars", (p?.format?.height || 1080) > (p?.format?.width || 1920) ? 20 : 32)),
        width: Number(opt("width", p?.format?.width || 1920)), height: Number(opt("height", p?.format?.height || 1080)), font: opt("font", "Inter"), color: opt("color", "#FFFFFF"), highlight: opt("highlight", "#FFD400") }));
    }
    case "captions-check": {
      if (pos.length < 2) die("Usage: umd captions-check <subs> <words.json>");
      const { checkCaptions } = await import("./lib/captions.mjs");
      return out(checkCaptions(pos[0], pos[1], { cwd }));
    }
    case "burn": {
      if (pos.length < 2 || !opt("out")) die("Usage: umd burn <video> <subs.ass> --out f.mp4");
      const { ffOk } = await import("./lib/ffmpeg.mjs");
      const subs = resolve(cwd, pos[1]);
      const subsDir = resolve(subs, "..");
      ffOk(["-i", resolve(cwd, pos[0]), "-vf", `subtitles=${basename(subs)}`, "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", resolve(cwd, opt("out"))], { cwd: subsDir });
      return out({ output: opt("out") });
    }
    case "lint": {
      const { lint } = await import("./lib/lint.mjs");
      const p = loadProject(cwd);
      const r = lint(resolve(cwd, pos[0] || "."), { ref, project: p, thresholds: thresholds(p, ref) });
      return compact("lint", r, r, null);
    }
    case "licenses": {
      const { checkLicenses } = await import("./lib/licenses.mjs");
      const p = loadProject(cwd);
      return out(checkLicenses(cwd, { ref, project: p, flags: p ? projectFlags(p, ref) : new Set() }));
    }
    case "webperf": {
      if (!pos[0]) die("Usage: umd webperf <url>");
      const { webperf } = await import("./lib/webperf.mjs");
      return out(await webperf(pos[0], { cwd, seconds: Number(opt("seconds", 5)) }));
    }
    case "evidence": return evidence();
    case "plan": return plan(pos.filter((x) => x !== "incremental"), flags.has("incremental"));
    case "assemble": return assemble();
    case "next": {
      const { nextStep } = await import("./lib/next.mjs");
      return out(nextStep(cwd, ref));
    }
    case "status": {
      const files = auditFiles();
      const p = loadProject(cwd);
      const lr = latestRender();
      if (!files.length) return process.stdout.write(`No audit yet.${lr ? ` Latest render: ${lr.output}${lr.draft ? " (draft)" : ""}.` : ""}\n`);
      const r = compute(JSON.parse(readFileSync(join(auditsDir(), files.at(-1)), "utf8")), ref);
      return process.stdout.write(`Last audit ${r.date}: ${r.global}/10, ${r.open_blockers} open blocker(s), ${r.issues.length} open issue(s). Profile ${p?.profile}. Latest render: ${lr ? lr.output : "none"}.\n`);
    }
    case "deliver": return deliver();
    case "tokens": {
      const { tokenReport } = await import("./lib/tokens.mjs");
      const r = tokenReport(cwd, { days: Number(opt("days", 30)), session: opt("session") });
      let saved = null;
      try { saved = JSON.parse(readFileSync(statsFile(), "utf8")); } catch { /* none */ }
      if (flags.has("json") || !r.available) return out({ ...r, compact_output_savings: saved });
      const n = (x) => x.toLocaleString("en-US");
      const rows = r.by_command.map((x) => `| ${x.command} | ${n(x.input)} | ${n(x.output)} | ${n(x.cache_write)} | ${n(x.cache_read)} | ${n(x.total)} | ${x.turns} |`);
      const budget = loadProject(cwd)?.token_budget;
      return process.stdout.write([`Token use, last ${r.days} days, ${r.sessions} session(s) in this folder`, "",
        "| Command | Input | Output | Cache write | Cache read | Total | Turns |", "| --- | --- | --- | --- | --- | --- | --- |", ...rows,
        `| **Total** | ${n(r.total.input)} | ${n(r.total.output)} | ${n(r.total.cache_write)} | ${n(r.total.cache_read)} | ${n(r.total.total)} | ${r.total.turns} |`, "",
        saved ? `Compact outputs avoided ~${n(saved.saved)} tokens over ${saved.commands} command(s).` : "",
        budget ? `Budget: ${n(budget)} tokens; used ${Math.round((r.total.total / budget) * 100)}%.` : "", r.note].filter((x) => x !== "").join("\n") + "\n");
    }
    case "run": {
      const { runCommand } = await import("./lib/run.mjs");
      const [label, ...rest] = pos;
      if (!label || !rest.length) die('Usage: umd run <label> "<command>"');
      return out(runCommand(label, rest.join(" "), { cwd, logDir: join(existsSync(md) ? md : cwd, "logs"), statsFile: existsSync(md) ? statsFile() : null }));
    }
    case "version": return out({ version: ref.version });
    default:
      process.stdout.write(readFileSync(new URL(import.meta.url), "utf8").split("\n").filter((l) => l.startsWith("//")).join("\n").replace(/^\/\/ ?/gm, "") + "\n");
  }
}

main().catch((e) => die(e.stack && process.env.UMD_DEBUG ? e.stack : `umd ${cmd}: ${e.message}`));
