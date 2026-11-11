#!/usr/bin/env node
// Ultimate Motion Design CLI. Zero dependencies, Node 18+. Needs FFmpeg; Playwright for HTML capture and web checks.
//
// Setup
//   next                                The next step for this project (what /umd:go runs), from local files only
//   doctor [--fix] [--blender] [--rhubarb]         Check FFmpeg, Playwright, Chromium and the route's tools (--blender: Blender and the GPU Cycles sees); --fix installs what it safely can
//   detect                              Guess engine, route and profile from the current folder
//   init [--force]                      Create .motion/ (project.json, storyboard, tokens, assets lock) and BRIEF.md from templates
//   rules [domain|group...]             Build rules of the domains that apply to this project (compact)
// Make
//   styles match [words] [--project p] [--limit 6]    Rank the library against BRIEF.md and project.json: looks and blocks, with reasons
//   styles <words> [--project promo|presentation|explainer|social|logo|film|web|3d] [--mood m] [--medium m] [--format 9:16]
//          [--tier 2] [--kind style|prompt|block|component] [--source lemo|oscar|mg|opus|hf]   Search 1323 styles, prompts and blocks (no tokens)
//   styles get <id>                                   Copy that style prompt (or block card) into .motion/styles/
//   moves <words> [--family transitions|camera|type|...]   120 named motion techniques (match cut, whip pan, split-flap…)
//   commons <words> [--allow-sa] [--limit 12]         Wikimedia Commons media under PD, CC0 or CC BY (BY-SA on request)
//   commons get "File:Name.jpg" [--dir assets/commons] [--width 1920]   Download it and record it in assets.lock.json
//   still <html|url> --at 0,1.5 [--out dir] [--width W --height H] [--hero "#tv"] [--hero-min 170] [--seek-check]
//         Key stills on virtual time; measures the hero's width (an element, or window.umdHero(t) for canvas/WebGL) and
//         checks that each frame drawn cold equals the same frame drawn in sequence
//   capture <html|url> --out f.mp4 [--fps 30] [--duration s] [--width 1920 --height 1080] [--from s]
//           [--draft] [--transparent] [--format mp4|webm|mov|gif|png] [--audio f] [--seed n] [--subframes 16 --shutter 0.5]
//           Deterministic HTML → video; --subframes averages that many sub-frames per frame over the shutter (motion blur)
//   adopt <video> [--draft]                         Make a video rendered by your own pipeline the latest render (analysis, audit, deliver apply)
//   render [--draft] [--twice] [--no-analyze] [--engine eevee|cycles]  Render the project (project.json "render"), then analyze; --engine reaches a
//           Blender command as UMD_ENGINE (default: render.engine)
//   mix --voice v.wav --music m.wav [--sfx a.wav@1.2 ...] --out mix.wav [--duck 9] [--lufs -14] [--length s]  (length defaults to duration_s)
//       [--backtime | --hit s --card s | --music-start s]   Back-time the music: its own ending lands on the end card, one continuous piece
//   hits <music>                                    Strong attacks near the end of a track (candidates for its final hit)
//   sounds <words> [--music] [--max 8] [--cc0]      Free sound effects (Freesound, Wikimedia) or music (Jamendo) via Openverse: CC0, CC BY, public domain only
//   sounds get <id> [--dir assets/audio]            Download as 48 kHz WAV, record author, licence and credit line in assets.lock.json
//   characters [words] [--dims 3d|2d] [--style anime|film|low-poly|flat…] [--age child|senior…] [--face visemes|full] [--kind pack|avatars|generator|rig|motion|kit2d|code|tool] [--route blender|threejs|html]
//              Free characters, rigs, animation clips and 2D kits for commercial work (catalogue + live lists: Mesh2Motion, KayKit, Open Source Avatars)
//   characters get <id> | info <id> | add <file> --id <entry> [--licence --author --url]   Download (or record a manual download) with its licence in assets.lock.json
//   lipsync <voice.wav> [--text script.txt] [--fps 30]   Mouth shapes A–H, X per frame (Rhubarb, MIT) for character.py and the 2D puppet
//   sfx [<kind>] [--dur s] [--seed n] [--gain dB]   Synthesise an effect (whoosh, swipe, riser, impact, subdrop, click, tick, pop, chime, shimmer, glitch, roomtone)
//   normalize <in> <out> [--lufs -14] [--tp -1]      loudness <file>
//   captions <words.json> --out subs.ass|srt|vtt [--style karaoke|pop|line] [--max-chars 32] [--width --height --font --color --highlight]
//   burn <video> <subs.ass> --out f.mp4             Burn captions in (libass)
// Check
//   analyze <video> [--out dir] [--loop]            Probe, cuts, freezes, dead air, black, flashes, loudness, contact sheet; --loop checks the seam
//   frames <video> --at 1,2.5 | --every 2 | --cuts | --sheet [--out dir] [--width 960]   (--cuts: 12 frames around each cut)
//   sync <video> [--timing timing.json | --cues storyboard.md] [--tolerance-ms 45]   Do the sound hits land on their visual events?
//        (.motion/timing.json, the master clock, when it exists; else the storyboard's "## Sound cues")
//   compare <a> <b>                                 Frame-hash equality + SSIM       vmaf <encode> <master>
//   lint [dir]   licenses   webperf <url>   captions-check <subs> <words.json>
//   evidence [--date D]                             All automatic checks for the audit + statuses of auto criteria
//   plan [scope...] [--incremental]                 Criteria left for the auditors      assemble [--date D]      status
// Deliver and account
//   deliver [--name n]                              Copy the audited render to deliverables/ (refused while a blocker is open)
//   tokens [--days 30] [--session id] [--json]      Token use per /umd:* command, from the session transcripts
//   run <label> "<command>"                         Run a command, keep the log on disk, print a compact summary
//   estimate --frames N [--parallel P] -- <command rendering one frame>   Time one frame, multiply: render time before committing
//   version                                         Plugin version
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, copyFileSync, statSync } from "node:fs";
import { join, relative, resolve, extname, basename, isAbsolute } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { loadReferential, loadProject, motionDir, projectFlags, applies, allDomains, thresholds, today, stamp, PLUGIN_ROOT } from "./lib/ref.mjs";
import { compute, toMarkdown, grade } from "./lib/score.mjs";
import { estimateTokens, recordSavings } from "./lib/run.mjs";

const ref = loadReferential();
const cwd = process.cwd();
// a path to show: relative inside the project, absolute outside it (never ......AppData…)
const rel = (p) => { const r = relative(cwd, p); return !r ? "." : r.startsWith("..") || isAbsolute(r) ? resolve(p) : r; };
const argv = process.argv.slice(2);
const cmd = argv.shift();
// everything after a lone "--" is a command line for umd estimate, never parsed as options
const dashdash = argv.indexOf("--");
const tailCommand = dashdash >= 0 ? argv.splice(dashdash).slice(1) : [];
const flags = new Set();
const opts = {};
const pos = [];
// boolean flags never take a value, so `umd capture --draft page.html` keeps page.html as the input
// "music" is a switch only for `umd sounds --music`; `umd mix --music file.wav` takes a file
const BOOL = new Set(["allow-sa", "backtime", "blender", "rhubarb", "no-live", "cc0", "cuts", "loop", "seek-check", "draft", "fix", "force", "incremental", "json", "no-analyze", "sheet", "transparent", "twice",
  ...(cmd === "sounds" ? ["music"] : [])]);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith("--")) {
    const k = a.slice(2);
    const v = argv[i + 1];
    if (BOOL.has(k) || v === undefined || v.startsWith("--")) flags.add(k);
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

// the per-second motion timeline stays in analysis.json; stdout gets its shape
function motionSummary(m, th) {
  if (!m?.timeline?.length) return null;
  const t = [...m.timeline].sort((a, b) => a - b), floor = th?.motion_floor ?? 0.4;
  const low = m.timeline.flatMap((v, i) => (v < floor ? [Math.round(i * m.bucket_s * 10) / 10] : []));
  return { mean: m.mean, min: t[0], median: t[Math.floor(t.length / 2)], below_floor_s: Math.round(low.length * m.bucket_s * 10) / 10, below_floor_at: low.slice(0, 12) };
}

function analysisSummary(a) {
  if (!a) return null;
  return {
    file: a.file, duration: a.probe?.duration, size: a.probe?.width ? `${a.probe.width}x${a.probe.height}@${a.probe.fps}` : null,
    scenes: a.scenes?.count, dead_air: a.dead_air, freezes: (a.freezes || []).filter((x) => x.duration >= 1), slow_moves: a.slow_moves?.length ? a.slow_moves : undefined, black: a.black,
    flashes_max_per_s: a.flashes?.max_per_s, stillness: a.stillness ? `${a.stillness.per_30s}s per 30 s, longest ${a.stillness.longest_s}s` : null, loudness: a.loudness ? { lufs: a.loudness.integrated, true_peak: a.loudness.true_peak, lra: a.loudness.lra } : null,
    abrupt_end: a.audio_end?.abrupt, loop_seam: a.loop_seam || undefined, motion_mean: a.motion?.mean, sheet: a.sheet ? `${a.sheet.file} (${a.sheet.layout}, times ${a.sheet.times.join(" ")})` : null,
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
      else if (e.isFile() && statSync(p).mtimeMs > ms && !/token-savings\.json$/.test(e.name)) changed.push(rel(p));
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
  const sbf = join(cwd, ".motion", "storyboard.md");
  if (lr?.output && ev.analysis?.probe?.audio && existsSync(sbf)) {
    try {
      const { parseCues, syncCues } = await import("./lib/sync.mjs");
      const cues = parseCues(readFileSync(sbf, "utf8"), project.format?.fps || 30);
      if (cues.length) ev.sync = syncCues(lr.output, cues, { cwd, fps: project.format?.fps, toleranceMs: th.sync_tolerance_ms ?? 45 });
    } catch (e) { notes.push(`sync failed: ${e.message.split(/\r?\n/)[0]}`); }
  }
  const { autocheck } = await import("./lib/autocheck.mjs");
  const planned = new Set(allDomains(ref).filter((d) => (ref.profiles[project.profile].weights[d.id] ?? 0) > 0 && applies(d, fl))
    .flatMap((d) => d.criteria.filter((c) => applies(c, fl)).map((c) => c.id)));
  ev.flags = [...fl];
  const all = autocheck(ev, th, project);
  const results = Object.fromEntries(Object.entries(all).filter(([id]) => planned.has(id)));
  writeFileSync(join(dir, "evidence.json"), JSON.stringify({ date, render: lr, ...ev }, null, 2));
  writeFileSync(join(dir, "parts", "auto.json"), JSON.stringify({ group: "auto", render: lr?.id || null, results }, null, 2));
  const counts = {};
  for (const r of Object.values(results)) counts[r.status] = (counts[r.status] || 0) + 1;
  const summary = { date, out_dir: rel(dir), render: lr ? `${lr.output}${lr.draft ? " (draft)" : ""}` : null, auto_criteria: Object.keys(results).length, counts,
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
  const result = { date, out_dir: rel(dir), umd_cli: fileURLToPath(import.meta.url), plugin_root: PLUGIN_ROOT, project: project.name, profile: project.profile,
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
  if (!existsSync(partsDir)) die(`No ${rel(partsDir)}: run umd evidence first.`);
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
    token_savings: tokenSavings?.saved ?? null, warnings, report: rel(join(md, "AUDIT.md")),
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
  if (report.render_id !== lr.id) die(`The latest render (${lr.id}) was not audited (${report.render_id ? `audit covered ${report.render_id}` : "the last audit ran before any render"}). Run /umd:audit again.`);
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
  const manifest = { file: rel(dest), sha256: sha256(dest), render: lr.id, audit: report.date, score: report.global, profile: report.profile, delivered_at: new Date().toISOString(), credits: credits.length };
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
  // 3D engine for command routes (Blender): passed to the command as UMD_ENGINE; --engine wins over render.engine
  const ENGINE_IDS = { eevee: "BLENDER_EEVEE", cycles: "CYCLES" };
  const engineName = String(opt("engine") || r.engine || "").toLowerCase() || null;
  if (engineName && !ENGINE_IDS[engineName]) die(`--engine must be eevee or cycles (got "${engineName}")`);
  const info = { id, draft, engine: engineName || undefined, started_at: new Date().toISOString() };
  const doRender = async (suffix) => {
    if (r.capture) {
      const { capture } = await import("./lib/capture.mjs");
      const c = r.capture;
      const format = c.format || "mp4";
      const file = join(dir, `video${suffix}.${format === "png" ? "frames" : format}`);
      const res = await capture(c.entry || "index.html", { cwd, out: file, fps: c.fps || fmt.fps || 30, duration: c.duration || project.duration_s, width: c.width || fmt.width, height: c.height || fmt.height,
        draft, transparent: !!c.transparent, format, audio: r.audio || c.audio || null, seed: c.seed ?? 42, subframes: opt("subframes", c.subframes), shutter: opt("shutter", c.shutter) });
      return { output: res.out, capture: res };
    }
    if (r.command) {
      const { runCommand } = await import("./lib/run.mjs");
      const command = (draft && r.draft_command) || r.command;
      const res = runCommand(`render${suffix}`, command, { cwd, logDir: join(dir, "logs"), statsFile: statsFile(), env: engineName ? { UMD_ENGINE: ENGINE_IDS[engineName] } : {} });
      if (res.exit_code !== 0) return { error: res };
      const output = r.output;
      if (!output || !existsSync(resolve(cwd, output))) return { error: { ...res, note: `render.output "${output}" not found after the command` } };
      const keep = join(dir, `video${suffix}${extname(output)}`);
      copyFileSync(resolve(cwd, output), keep);
      if (r.audio && !/\.(gif|png)$/i.test(output)) {
        const { ffOk } = await import("./lib/ffmpeg.mjs");
        const muxed = keep.replace(/(\.\w+)$/, ".mux$1");
        const { probe } = await import("./lib/ffmpeg.mjs");
        const vlen = probe(keep).duration; // the picture sets the length: pad a short soundtrack, cut a long one
        ffOk(["-i", keep, "-i", resolve(cwd, r.audio), "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-af", "apad", "-t", String(vlen), "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", muxed]);
        copyFileSync(muxed, keep);
      }
      return { output: rel(keep), command: { exit_code: res.exit_code, duration_s: res.duration_s, log: res.log, signal_lines: res.signal_lines.slice(0, 8) } };
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
    analysis = analyze(a.output, { cwd, outDir: dir, thresholds: thresholds(project, ref), loop: !!(project.loop || project.format?.loop) });
    info.probe = analysis.probe;
  }
  info.finished_at = new Date().toISOString();
  const posix = (x) => String(x).split("\\").join("/"); // portable between Windows, macOS and Linux
  info.output = posix(info.output);
  writeFileSync(join(dir, "render.json"), JSON.stringify(info, null, 2));
  writeFileSync(join(md, "renders", "latest.json"), JSON.stringify({ id, dir: posix(rel(dir)), output: posix(a.output), draft, engine: engineName || undefined, probe: info.probe || null }, null, 2));
  out({ id, ok: true, output: a.output, engine: engineName || undefined, seconds: info.seconds, page_errors: a.capture?.page_errors?.length ? a.capture.page_errors : undefined,
    determinism: determinism ? { identical: determinism.identical, ssim: determinism.ssim } : undefined, analysis: analysisSummary(analysis) });
}

// A film rendered outside umd (the project's own scripts, Blender, After Effects…) becomes the project's latest render,
// so analyze, the audit and deliver judge it like any other. It never replaces the checks: it lets them run.
async function adopt(file) {
  if (!file || !existsSync(resolve(cwd, file))) die("Usage: umd adopt <video> [--draft]   (a video rendered by your own pipeline)");
  if (!existsSync(join(md, "project.json"))) die("No .motion/project.json: run umd init (or /umd:kickoff) first, then umd adopt <video>.");
  const project = loadProject(cwd);
  const draft = flags.has("draft");
  const id = `${stamp()}-adopted${draft ? "-draft" : ""}`;
  const dir = join(md, "renders", id);
  mkdirSync(dir, { recursive: true });
  const keep = join(dir, `video${extname(file) || ".mp4"}`);
  copyFileSync(resolve(cwd, file), keep);
  const { analyze } = await import("./lib/analyze.mjs");
  const analysis = analyze(keep, { cwd, outDir: dir, thresholds: thresholds(project, ref), loop: !!(project.loop || project.format?.loop) });
  const posix = (x) => String(x).split("\\").join("/");
  const info = { id, draft, adopted_from: posix(rel(resolve(cwd, file))), output: posix(rel(keep)), sha256: sha256(keep), probe: analysis.probe, adopted_at: new Date().toISOString() };
  writeFileSync(join(dir, "render.json"), JSON.stringify(info, null, 2));
  writeFileSync(join(md, "renders", "latest.json"), JSON.stringify({ id, dir: posix(rel(dir)), output: info.output, draft, adopted: true, probe: analysis.probe || null }, null, 2));
  out({ id, ok: true, output: info.output, adopted_from: info.adopted_from, analysis: analysisSummary(analysis),
    next: "Now the checks apply: umd evidence, then /umd:audit (or /umd:audit quick), then umd deliver. Re-adopt after every new render." });
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
    if (existsSync(dest) && !flags.has("force")) { kept.push(rel(dest)); continue; }
    let txt = readFileSync(join(PLUGIN_ROOT, "templates", tpl), "utf8").replaceAll("{{name}}", name);
    if (tpl === "project.json") { const j = JSON.parse(txt); j.name = name; txt = JSON.stringify(j, null, 2) + "\n"; }
    writeFileSync(dest, txt);
    created.push(rel(dest));
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
      const r = await doctor({ cwd, project: loadProject(cwd), fix: flags.has("fix"), blender: flags.has("blender"), rhubarb: flags.has("rhubarb") });
      if (flags.has("json")) return out(r);
      return out({ ok: r.ok, os: r.os, ready: r.checks.filter((c) => c.ok).map((c) => c.name),
        missing: r.checks.filter((c) => !c.ok).map(({ name, optional, note, fix }) => ({ name, optional: !!optional, note: note || undefined, fix })),
        fixed: r.fixed.length ? r.fixed : undefined, runtime_dir: r.runtime_dir,
        blender: (({ ok, version, path, note } = {}) => (ok ? { version, path, note } : undefined))(r.checks.find((c) => c.name === "blender")) });
    }
    case "detect": return detect();
    case "init": return initProject();
    case "rules": return rules(pos);
    case "still": {
      if (!pos[0]) die("Usage: umd still <html|url> --at 0,1.5 [--out dir]");
      const { stills } = await import("./lib/capture.mjs");
      const p = loadProject(cwd);
      const hero = opt("hero", p?.hero || null);
      // the minimum applies to any hero measured (an element, or window.umdHero in the page); project.json "hero" sets the selector
      const heroMin = Number(opt("hero-min") ?? thresholds(p, ref).hero_min_px ?? 170);
      return out(await stills(pos[0], { cwd, at: list("at").map(Number), out: opt("out", ".motion/stills"), width: opt("width", p?.format?.width), height: opt("height", p?.format?.height), prefix: opt("prefix", "still"),
        hero, heroMin, seekCheck: flags.has("seek-check") }));
    }
    case "capture": {
      if (!pos[0]) die("Usage: umd capture <html|url> --out f.mp4 [--fps 30] [--duration s]");
      const { capture } = await import("./lib/capture.mjs");
      const p = loadProject(cwd);
      return out(await capture(pos[0], { cwd, out: opt("out", "out.mp4"), fps: opt("fps", p?.format?.fps), duration: opt("duration"), width: opt("width", p?.format?.width), height: opt("height", p?.format?.height),
        from: opt("from"), draft: flags.has("draft"), transparent: flags.has("transparent"), format: opt("format"), audio: opt("audio"), seed: opt("seed"),
        subframes: opt("subframes", p?.render?.capture?.subframes), shutter: opt("shutter", p?.render?.capture?.shutter) }));
    }
    case "render": return render();
    case "adopt": return adopt(pos[0]);
    case "analyze": {
      if (!pos[0]) die("Usage: umd analyze <video> [--out dir]");
      const { analyze } = await import("./lib/analyze.mjs");
      const p = loadProject(cwd);
      const dir = opt("out") ? resolve(cwd, opt("out")) : join(existsSync(md) ? join(md, "analysis") : join(cwd, "umd-analysis"), basename(pos[0]).replace(/\W+/g, "-"));
      const a = analyze(pos[0], { cwd, outDir: dir, thresholds: thresholds(p, ref), loop: flags.has("loop") || !!(p?.loop || p?.format?.loop) });
      return compact("analysis-full", a, { ...analysisSummary(a), motion: motionSummary(a.motion, thresholds(p, ref)), full: rel(join(dir, "analysis.json")) }, null);
    }
    case "frames": {
      if (!pos[0]) die("Usage: umd frames <video> --at 1,2.5 | --every 2 [--out dir]");
      const { frames, contactSheet } = await import("./lib/analyze.mjs");
      const dir = resolve(cwd, opt("out", join(existsSync(md) ? ".motion" : ".", "frames", basename(pos[0]).replace(/\W+/g, "-"))));
      if (flags.has("cuts")) {
        const { analyze: an, cutStrips } = await import("./lib/analyze.mjs");
        const cuts = (an(pos[0], { cwd, sheet: false }).scenes?.cuts || []).map((c) => c.t ?? c.time ?? c);
        return out(cutStrips(pos[0], { cwd, cuts, outDir: dir }));
      }
      if (flags.has("sheet")) { const { probe } = await import("./lib/ffmpeg.mjs"); mkdirSync(dir, { recursive: true }); const s = contactSheet(resolve(cwd, pos[0]), probe(resolve(cwd, pos[0])), join(dir, "sheet.jpg")); return out({ ...s, file: rel(s.file) }); }
      return out(frames(pos[0], { cwd, at: list("at").map(Number), every: opt("every") ? Number(opt("every")) : null, outDir: dir, width: Number(opt("width", 960)) }));
    }
    case "sync": {
      if (!pos[0]) die("Usage: umd sync <video|audio> [--cues .motion/storyboard.md] [--tolerance-ms 45]");
      const { parseCues, syncCues, timingCues } = await import("./lib/sync.mjs");
      const p = loadProject(cwd);
      // the master clock wins when it exists: .motion/timing.json (or --timing file)
      const tf = resolve(cwd, opt("timing", join(".motion", "timing.json")));
      if (!opt("cues") && existsSync(tf)) {
        const tc = timingCues(readFileSync(tf, "utf8"));
        if (!tc.length) die(`No event with a "sound" in ${rel(tf)}.`);
        return out({ cues_from: rel(tf), ...syncCues(pos[0], tc, { cwd, fps: p?.format?.fps, toleranceMs: Number(opt("tolerance-ms", thresholds(p, ref).sync_tolerance_ms ?? 45)) }) });
      }
      const sbf = resolve(cwd, opt("cues", join(".motion", "storyboard.md")));
      if (!existsSync(sbf)) die(`No ${rel(sbf)}: list the cues under "## Sound cues" (one per line: "6.5s click: cursor press" or "f195 click").`);
      const cues = parseCues(readFileSync(sbf, "utf8"), p?.format?.fps || 30);
      if (!cues.length) die(`No cue in ${rel(sbf)}: add a "## Sound cues" section (one per line: "6.5s click: cursor press").`);
      return out(syncCues(pos[0], cues, { cwd, fps: p?.format?.fps, toleranceMs: Number(opt("tolerance-ms", thresholds(p, ref).sync_tolerance_ms ?? 45)) }));
    }
    case "moves": {
      const { searchMoves } = await import("./lib/moves.mjs");
      return out(searchMoves(pos.join(" "), { family: opt("family"), limit: Number(opt("limit", 8)) }));
    }
    case "commons": {
      const c = await import("./lib/commons.mjs");
      if (pos[0] === "get") {
        if (!pos[1]) die('Usage: umd commons get "File:Name.jpg" [--dir assets/commons] [--width 1920] [--allow-sa]');
        return out(await c.getCommons(pos.slice(1).join(" "), { cwd, dir: opt("dir", "assets/commons"), width: Number(opt("width", 1920)), allowSa: flags.has("allow-sa") }));
      }
      if (!pos.length) die("Usage: umd commons <words> [--allow-sa] [--limit 12]   |   umd commons get \"File:…\"");
      return out(await c.searchCommons(pos.join(" "), { limit: Number(opt("limit", 12)), allowSa: flags.has("allow-sa") }));
    }
    case "sounds": {
      const so = await import("./lib/sounds.mjs");
      if (pos[0] === "get") {
        if (!pos[1]) die("Usage: umd sounds get <id> [--dir assets/audio] [--name file-name]");
        return out(await so.getSound(pos[1], { cwd, dir: opt("dir", "assets/audio"), name: opt("name") }));
      }
      if (!pos.length) die("Usage: umd sounds <words> [--music] [--max 8] [--min 1] [--cc0] [--limit 10]   |   umd sounds get <id>");
      return out(await so.searchSounds(pos.join(" "), { music: flags.has("music"), limit: Number(opt("limit", 10)), maxSeconds: opt("max") ? Number(opt("max")) : null,
        minSeconds: opt("min") ? Number(opt("min")) : null, cc0: flags.has("cc0") }));
    }
    case "characters": {
      const ch = await import("./lib/characters.mjs");
      if (pos[0] === "get") {
        if (!pos[1]) die("Usage: umd characters get <id> [--dir assets/characters] [--format fbx|voxel_vrm]");
        return out(await ch.getCharacter(pos[1], { cwd, dir: opt("dir", "assets/characters"), format: opt("format") }));
      }
      if (pos[0] === "info") { if (!pos[1]) die("Usage: umd characters info <id>"); return out(await ch.infoCharacter(pos[1])); }
      if (pos[0] === "add") {
        if (!pos[1]) die("Usage: umd characters add <file|folder> --id <catalogue id> [--licence CC0-1.0|CC-BY-4.0] [--author name] [--url page] [--credit line]");
        return out(await ch.addCharacter(pos[1], { cwd, id: opt("id"), licence: opt("licence", opt("license")), author: opt("author"), url: opt("url"), credit: opt("credit") }));
      }
      return out(await ch.searchCharacters(pos.join(" "), { dims: opt("dims"), style: opt("style"), age: opt("age"), face: opt("face"), kind: opt("kind"), route: opt("route"),
        limit: Number(opt("limit", 12)), live: !flags.has("no-live") }));
    }
    case "lipsync": {
      if (!pos[0]) die("Usage: umd lipsync <voice.wav> [--text script.txt] [--fps 30] [--out .motion/lipsync/x.json] [--recognizer phonetic|pocketSphinx]");
      const { lipsync } = await import("./lib/lipsync.mjs");
      const p = loadProject(cwd);
      return out(lipsync(pos[0], { cwd, text: opt("text"), fps: Number(opt("fps", p?.format?.fps || 30)), out: opt("out"), language: p?.language || "fr", recognizer: opt("recognizer") }));
    }
    case "sfx": {
      const { KINDS, makeSfx } = await import("./lib/sfx.mjs");
      if (!pos[0]) return out({ kinds: Object.fromEntries(Object.entries(KINDS).map(([k, v]) => [k, `${v.d} s: ${v.use}`])), usage: "umd sfx <kind> [--out assets/audio/sfx-<kind>.wav] [--dur s] [--seed n] [--gain dB]" });
      return out(makeSfx(pos[0], { cwd, out: opt("out"), dur: opt("dur") ? Number(opt("dur")) : null, seed: Number(opt("seed", 7)), gainDb: Number(opt("gain", 0)) }));
    }
    case "hits": {
      if (!pos[0]) die("Usage: umd hits <music>");
      const { finalHits } = await import("./lib/sync.mjs");
      return out(finalHits(pos[0], { cwd }));
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
      const length = opt("length", loadProject(cwd)?.duration_s ?? null);
      let musicStart = Number(opt("music-start", 0));
      if (opt("music") && (flags.has("backtime") || opt("hit"))) {
        if (!opt("hit") && !length) die("--backtime needs the film length: --length s or duration_s in project.json");
        const { backtimeStart } = await import("./lib/audio.mjs");
        musicStart = backtimeStart({ cwd, music: opt("music"), length, hit: opt("hit"), card: opt("card", opt("hit") ? (length ?? null) : null) });
      }
      return out(mix({ cwd, voice: opt("voice"), music: opt("music"), sfx: opts.sfx || [], out: opt("out"), duck: Number(opt("duck", 9)), musicGainDb: Number(opt("music-gain", -6)), lufs: Number(opt("lufs", -14)), tp: Number(opt("tp", -1)), length, musicStart }));
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
      { const { filters } = await import("./lib/ffmpeg.mjs"); if (!filters().has("subtitles")) die("This FFmpeg build has no libass (no \"subtitles\" filter), so it cannot burn captions. Install a full build (Windows: winget Gyan.FFmpeg; macOS: brew install ffmpeg-full or a static build; Linux: the distribution's ffmpeg), or deliver the .srt/.vtt as a sidecar file."); }
      // libass reads the file name inside a filtergraph: copy it under a safe name so commas, quotes or colons
      // in the user's file name can neither break nor inject filters
      const { mkdtempSync } = await import("node:fs");
      const { tmpdir } = await import("node:os");
      const subsDir = mkdtempSync(join(tmpdir(), "umd-burn-"));
      const safe = `subs${extname(pos[1]).toLowerCase().replace(/[^.\w]/g, "") || ".ass"}`;
      copyFileSync(resolve(cwd, pos[1]), join(subsDir, safe));
      ffOk(["-i", resolve(cwd, pos[0]), "-vf", `subtitles=${safe}`, "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", resolve(cwd, opt("out"))], { cwd: subsDir });
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
    case "styles": {
      const { searchStyles, getStyle } = await import("./lib/styles.mjs");
      if (pos[0] === "get") {
        if (!pos[1]) die("Usage: umd styles get <id>");
        return out(await getStyle(pos[1], { cwd }));
      }
      const filters = Object.fromEntries(["source", "kind", "tier", "project", "mood", "medium", "format", "tech", "use"].map((k) => [k, opt(k)]));
      if (pos[0] === "match") {
        const { matchStyles } = await import("./lib/styles.mjs");
        return out(matchStyles(cwd, { words: pos.slice(1).join(" "), limit: Number(opt("limit", 6)), ...filters }));
      }
      return out(searchStyles(pos.join(" "), { limit: Number(opt("limit", 8)), ...filters }));
    }
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
    case "estimate": {
      // render one frame with the user's command, time it, multiply by the frame count (process start included: a ceiling)
      const frames = Number(opt("frames"));
      const command = tailCommand.length ? tailCommand.map((a) => (/\s/.test(a) ? `"${a}"` : a)).join(" ") : pos.join(" ");
      if (!frames || !command) die('Usage: umd estimate --frames 570 [--parallel 1] -- <command that renders ONE frame>   (or the command as one quoted string)');
      const { runCommand } = await import("./lib/run.mjs");
      const r = runCommand("estimate", command, { cwd, logDir: join(existsSync(md) ? md : cwd, "logs"), timeoutMs: Number(opt("timeout", 1800)) * 1000 });
      const par = Math.max(1, Number(opt("parallel", 1)));
      const total = (r.duration_s * frames) / par;
      const hm = (x) => (x >= 3600 ? `${Math.floor(x / 3600)} h ${Math.round((x % 3600) / 60)} min` : x >= 60 ? `${Math.round(x / 60)} min` : `${Math.round(x)} s`);
      return out({ ok: r.exit_code === 0, per_frame_s: r.duration_s, frames, parallel: par, total_s: Math.round(total), total: hm(total),
        note: r.exit_code === 0 ? "One process per frame, start-up included: a ceiling. Rendering all frames in one process (-a) is usually faster." : "The test frame failed: fix it before estimating (see the log).",
        log: r.log, signal_lines: r.exit_code === 0 ? undefined : r.signal_lines?.slice(0, 8) });
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
