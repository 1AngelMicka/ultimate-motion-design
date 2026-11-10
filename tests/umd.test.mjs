// node --test tests/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { loadReferential } from "../plugins/umd/scripts/lib/ref.mjs";
import { compute } from "../plugins/umd/scripts/lib/score.mjs";
import { countFlashes, deadAir, stillness, seams } from "../plugins/umd/scripts/lib/analyze.mjs";
import { licenceClass } from "../plugins/umd/scripts/lib/commons.mjs";
import { searchMoves } from "../plugins/umd/scripts/lib/moves.mjs";
import { parseCues, onsets, syncCues } from "../plugins/umd/scripts/lib/sync.mjs";
import { lint, parseStoryboard } from "../plugins/umd/scripts/lib/lint.mjs";
import { installTargets, classify, checkLicenses } from "../plugins/umd/scripts/lib/licenses.mjs";
import { groupCues, toAss, toSrt } from "../plugins/umd/scripts/lib/captions.mjs";
import { autocheck } from "../plugins/umd/scripts/lib/autocheck.mjs";
import { hasFfmpeg, filters } from "../plugins/umd/scripts/lib/ffmpeg.mjs";
import { resolvePlaywright } from "../plugins/umd/scripts/lib/playwright.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CLI = join(ROOT, "plugins", "umd", "scripts", "umd.mjs");
const ref = loadReferential();
const tmp = () => mkdtempSync(join(tmpdir(), "umd-"));
const umd = (args, cwd) => spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: "utf8" });

test("referential builds and validates", () => {
  const r = spawnSync(process.execPath, [join(ROOT, "tools", "build.mjs"), "--check"], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
});

test("a failed blocker caps the domain at 3 and the global score at 5.9", () => {
  const results = {};
  for (const g of ref.groups) for (const d of g.domains) for (const c of d.criteria) results[c.id] = { status: "pass", evidence: "x" };
  results["TXT-01"] = { status: "fail", evidence: "beat 3 text shown 0.8 s" };
  const r = compute({ profile: "promo", results }, ref);
  const text = r.domains.find((d) => d.id === "text");
  assert.equal(text.score, 3);
  assert.equal(text.capped, true);
  assert.equal(r.global, 5.9);
  assert.equal(r.open_blockers, 1);
});

test("unknown counts as fail", () => {
  const r = compute({ profile: "logo", results: {} }, ref);
  assert.equal(r.global <= 5.9, true);
});

test("flash counter: 5 Hz strobe is flagged, slow fade is not", () => {
  const strobe = Array.from({ length: 60 }, (_, i) => ({ t: i / 30, yavg: Math.floor(i / 3) % 2 ? 235 : 16 }));
  assert.ok(countFlashes(strobe).max_per_s > 3);
  const fade = Array.from({ length: 60 }, (_, i) => ({ t: i / 30, yavg: 16 + i * 3 }));
  assert.equal(countFlashes(fade).max_per_s, 0);
});

test("dead air detection", () => {
  const tl = [2, 2, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 2];
  assert.deepEqual(deadAir(tl, 0.5, 0.4, 3), [{ start: 1, end: 4.5, duration: 3.5 }]);
});

test("stillness: near-still buckets per 30 s, end card excluded", () => {
  const t = [2, 2, 0.1, 0.1, 0.1, 2, 2, 2, 2, 2, 2, 2, 0.1, 0.1, 0.1, 0.1]; // 8 s, last 2 s still (end card)
  const s = stillness(t, 0.5, 0.4, 2);
  assert.equal(s.still_s, 1.5);
  assert.equal(s.longest_s, 1.5);
  assert.equal(s.longest_at, 1);
  assert.equal(s.per_30s, 7.5);
});

test("seams: a cut between two parked shots is flagged, a cut on motion is not", () => {
  const frames = Array.from({ length: 120 }, (_, i) => ({ t: i / 30, ydif: i < 60 ? 0.05 : 3 }));
  const s = seams(frames, [{ t: 1 }, { t: 3 }], { floor: 0.4 });
  assert.deepEqual(s.rows.map((r) => r.parked), [true, false]);
  assert.equal(s.parked, 1);
});

test("commons licences and the moves glossary", () => {
  assert.equal(licenceClass("Public domain"), "ok");
  assert.equal(licenceClass("CC BY 4.0"), "ok");
  assert.equal(licenceClass("CC BY-SA 3.0"), "sa");
  assert.equal(licenceClass("CC BY-NC 2.0"), "refused");
  assert.equal(licenceClass("CC BY-ND 4.0"), "refused");
  const m = searchMoves("whip pan");
  assert.ok(m.results.length && /whip/i.test(m.results[0].name));
});

test("sound cues: storyboard parsing and onset detection", () => {
  const md = ["## Sound cues", "<!-- 9s ignored -->", "- 6.5s click: press", "- f210 reveal", "- 00:14.40 settle", "## Stills", "- 3s not a cue"].join("\n");
  assert.deepEqual(parseCues(md, 30).map((c) => c.t), [6.5, 7, 14.4]);
  const env = new Float64Array(300).fill(-60);
  for (const at of [50, 120, 200]) for (let i = at; i < at + 8; i++) env[i] = -20;
  assert.deepEqual(onsets(env).map((o) => o.t), [0.5, 1.2, 2]);
});

test("lint finds hard-coded motion, AI tells, layout props and slop", () => {
  const d = tmp();
  writeFileSync(join(d, "a.css"), ".x{transition: all 0.3s ease;} .y{animation: pulse 2s infinite;} .z{transition: width 200ms}");
  writeFileSync(join(d, "b.tsx"), `<div className="animate-pulse" /><motion.div initial={{opacity: 0, y: 20}} />`);
  writeFileSync(join(d, "c.html"), `<h1>A revolutionary, seamless experience</h1><link href="https://fonts.googleapis.com/css2?family=Inter">`);
  const r = lint(d, { ref });
  assert.ok(r.hardcoded_motion.count >= 2);
  assert.ok(r.ai_tells.count >= 2);
  assert.ok(r.layout_props.count >= 1);
  assert.ok(r.transition_all.count >= 1);
  assert.ok(r.slop.count >= 2);
  assert.ok(r.remote_assets.count >= 1);
});

test("storyboard parser reads durations, intents and validation date", () => {
  const sb = parseStoryboard("| # | Time | Shot | On-screen text | Motion | Sound | Intent |\n|---|---|---|---|---|---|---|\n| 1 | 0–2s | wide | Hello there friends | in | whoosh | curiosity |\n| 2 | 2.5s | close | | | | |\nStills validated 2026-11-10");
  assert.equal(sb.beats.length, 2);
  assert.equal(sb.beats[0].duration, 2);
  assert.equal(sb.beats[1].intent, "");
  assert.equal(sb.validated, true);
  assert.equal(parseStoryboard("|#|Time|Intent|\n|1|1s|x|\n<!-- Stills validated YYYY-MM-DD -->").validated, false);
});

test("licence guard parses install commands and classifies traps", () => {
  assert.deepEqual(installTargets("npm i -D gsap@3 @remotion/cli && pip install audiocraft==1.3 'rembg[gpu]'"), ["gsap", "@remotion/cli", "audiocraft", "rembg"]);
  assert.equal(classify("audiocraft", ref.licenses).class, "nc");
  assert.equal(classify("@remotion/player", ref.licenses).class, "remotion");
  assert.equal(classify("HunyuanVideo-Foley", ref.licenses).class, "tencent-eu");
  assert.equal(classify("gsap", ref.licenses), null);
});

test("licence check: NC dependency and unlisted asset in a commercial project", () => {
  const d = tmp();
  writeFileSync(join(d, "package.json"), JSON.stringify({ dependencies: { "f5-tts": "1", gsap: "3" } }));
  mkdirSync(join(d, "public"));
  writeFileSync(join(d, "public", "song.mp3"), "x");
  const r = checkLicenses(d, { ref, project: {}, flags: new Set(["commercial"]) });
  assert.equal(r.violations.length, 1);
  assert.equal(r.unlisted_assets, 1);
});

test("captions: cues respect max chars and serialise", () => {
  const words = "This is a fairly long sentence that should be split into readable caption cues.".split(" ").map((w, i) => ({ word: w, start: i * 0.3, end: i * 0.3 + 0.25 }));
  const cues = groupCues(words, { maxChars: 20 });
  assert.ok(cues.length > 1);
  assert.ok(cues.every((c) => c.lines.every((l) => l.length <= 20 || !l.includes(" "))));
  assert.match(toAss(cues), /\{\\k\d+\}/);
  assert.match(toSrt(cues), /00:00:00,000 --> /);
});

test("autocheck decides auto criteria from evidence", () => {
  const th = { ...ref.thresholds };
  const ev = {
    analysis: { file: "v.mp4", probe: { width: 1920, height: 1080, fps: 30, cfr: true, pix_fmt: "yuv420p", container: "mov,mp4", duration: 30, audio: { codec: "aac", sample_rate: 48000, channels: 2, bitrate_kbps: 192 } },
      dead_air: [], freezes: [{ start: 28, end: 30, duration: 2 }], black: [], flashes: { max_per_s: 0 }, loudness: { integrated: -14.3, true_peak: -1.5 }, silence: { leading_s: 0 }, audio_end: { abrupt: false } },
  };
  const r = autocheck(ev, th, { duration_s: 30, format: { width: 1920, height: 1080, fps: 30 } });
  assert.equal(r["LIF-01"].status, "fail");
  assert.equal(r["AUD-01"].status, "pass");
  assert.equal(r["REN-02"].status, "pass");
  assert.equal(r["REN-01"].status, "unknown");
});

test("next step follows the project state", () => {
  const d = tmp();
  const step = () => JSON.parse(umd(["next"], d).stdout).step;
  umd(["init"], d);
  if (!JSON.parse(umd(["next"], d).stdout).state.tools.ffmpeg) return; // doctor first on machines without FFmpeg
  assert.equal(step(), "kickoff");
  writeFileSync(join(d, "BRIEF.md"), "# Brief\n\n## Goal\nA short clip for the docs, three words over a knot.\n");
  assert.equal(step(), "storyboard");
  writeFileSync(join(d, ".motion", "storyboard.md"), "| # | Time | Shot | On-screen text | Motion | Sound | Intent |\n|---|---|---|---|---|---|---|\n| 1 | 0-2s | a | Hi | in | - | joy |\nStills validated 2026-11-10\n");
  assert.equal(step(), "build");
});

test("style search ranks full styles for a mood query", () => {
  const r = JSON.parse(umd(["styles", "luxe", "sombre", "lancement", "--limit", "3"], tmp()).stdout);
  assert.ok(r.total > 700);
  assert.ok(r.results.length === 3 && r.results[0].id.startsWith("lemo:"));
});

test("CLI: init, rules, deliver refused without audit", () => {
  const d = tmp();
  assert.equal(umd(["init"], d).status, 0);
  assert.match(umd(["rules", "MOT"], d).stdout, /MOT/);
  assert.notEqual(umd(["deliver"], d).status, 0);
});

test("FFmpeg analysis of a synthetic clip", { skip: !hasFfmpeg() && "ffmpeg not installed" }, () => {
  const d = tmp();
  const f = join(d, "clip.mp4");
  // 2 s moving test pattern, then 2 s frozen frame, with a 440 Hz tone
  spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i", "testsrc2=size=320x180:rate=30:duration=2", "-f", "lavfi", "-i", "sine=f=440:d=4",
    "-filter_complex", "[0:v]tpad=stop_mode=clone:stop_duration=2[v]", "-map", "[v]", "-map", "1:a", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", f]);
  const r = umd(["analyze", f, "--out", join(d, "an")], d);
  assert.equal(r.status, 0, r.stderr);
  const s = JSON.parse(r.stdout);
  assert.ok(s.freezes.some((x) => x.start >= 1.9 && x.duration >= 1.5));
  assert.ok(s.loudness.lufs < -5);
});

test("umd sync measures cues on a synthetic clip", { skip: !hasFfmpeg() && "ffmpeg not installed" }, () => {
  const dir = mkdtempSync(join(tmpdir(), "umd-sync-"));
  const f = join(dir, "beeps.mp4");
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", "color=black:s=320x180:r=30:d=4", "-f", "lavfi", "-i", "anoisesrc=a=0.01:d=4", "-f", "lavfi", "-i", "sine=f=880:d=0.08",
    "-filter_complex", "[2:a]asplit=2[a][b];[a]adelay=1000|1000[a1];[b]adelay=2530|2530[b1];[1:a][a1][b1]amix=inputs=3:normalize=0[o]", "-map", "0:v", "-map", "[o]", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", f]);
  assert.equal(r.status, 0);
  const res = syncCues(f, [{ t: 1, label: "press" }, { t: 2.5, label: "reveal" }, { t: 3.4, label: "none" }], { cwd: dir });
  assert.deepEqual(res.rows.map((x) => x.status), ["ok", "ok", "missing"]);
  assert.ok(Math.abs(res.rows[1].offset_ms - 30) <= 15);
});

test("deterministic HTML capture", { skip: (!hasFfmpeg() || !resolvePlaywright(process.cwd())) && "ffmpeg or Playwright missing (umd doctor --fix)" }, () => {
  const d = tmp();
  const page = join(ROOT, "tests", "fixtures", "scene", "index.html");
  for (const n of ["a", "b"]) assert.equal(umd(["capture", page, "--out", join(d, `${n}.mp4`), "--width", "320", "--height", "180", "--duration", "1.5"], d).status, 0);
  const c = JSON.parse(umd(["compare", join(d, "a.mp4"), join(d, "b.mp4")], d).stdout);
  assert.equal(c.identical, true);
});

// ---------------------------------------------------------------- regressions from the 0.6.0 review
test("next: draft rounds gate the final render, outputs and ledger never ask for a re-render", () => {
  const d = tmp();
  umd(["init"], d);
  if (!JSON.parse(umd(["next"], d).stdout).state.tools.ffmpeg) return;
  writeFileSync(join(d, "BRIEF.md"), "# Brief\n\n## Goal\nA short clip for the docs, three words over a knot.\n");
  writeFileSync(join(d, ".motion", "storyboard.md"), "| # | Time | Shot | On-screen text | Motion | Sound | Intent |\n|---|---|---|---|---|---|---|\n| 1 | 0-2s | a | Hi | in | - | joy |\nStills validated 2026-11-10\n");
  const r = join(d, ".motion", "renders", "r1");
  mkdirSync(r, { recursive: true });
  const now = new Date(Date.now() + 5000).toISOString();
  writeFileSync(join(r, "render.json"), JSON.stringify({ id: "r1", draft: true, started_at: now, finished_at: now }));
  writeFileSync(join(d, ".motion", "renders", "latest.json"), JSON.stringify({ id: "r1", dir: ".motion/renders/r1", output: ".motion/renders/r1/video.mp4", draft: true }));
  assert.equal(JSON.parse(umd(["next"], d).stdout).step, "build"); // no "Build accepted" line yet
  writeFileSync(join(d, ".motion", "LEDGER.md"), "| Round | Render | Top findings | Changes | Measured |\n\nBuild accepted 2026-11-10\n");
  assert.equal(JSON.parse(umd(["next"], d).stdout).step, "render");
  // a final render, then files written after it that are not sources
  writeFileSync(join(r, "render.json"), JSON.stringify({ id: "r1", draft: false, started_at: now, finished_at: new Date(Date.now() + 60000).toISOString() }));
  writeFileSync(join(d, ".motion", "renders", "latest.json"), JSON.stringify({ id: "r1", dir: ".motion/renders/r1", output: ".motion/renders/r1/video.mp4", draft: false }));
  mkdirSync(join(d, "media", "videos"), { recursive: true });
  writeFileSync(join(d, "media", "videos", "Main.mp4"), "x");
  mkdirSync(join(d, ".motion", "styles"), { recursive: true });
  writeFileSync(join(d, ".motion", "styles", "lemo-x.md"), "x");
  assert.equal(JSON.parse(umd(["next"], d).stdout).step, "audit");
});

test("deliver refuses a render that the last audit did not cover", () => {
  const d = tmp();
  umd(["init"], d);
  mkdirSync(join(d, ".motion", "renders", "r2"), { recursive: true });
  writeFileSync(join(d, ".motion", "renders", "r2", "video.mp4"), "x");
  writeFileSync(join(d, ".motion", "renders", "latest.json"), JSON.stringify({ id: "r2", dir: ".motion/renders/r2", output: ".motion/renders/r2/video.mp4", draft: false }));
  mkdirSync(join(d, ".motion", "audits"), { recursive: true });
  writeFileSync(join(d, ".motion", "audits", "2026-11-10.report.json"), JSON.stringify({ date: "2026-11-10", render_id: null, open_blockers: 0, issues: [], global: 9 }));
  const r = umd(["deliver"], d);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr + r.stdout, /not audited/);
});

test("CLI: a boolean flag before the input does not swallow it", () => {
  const r = umd(["capture", "--draft", "missing-page.html", "--out", "x.mp4"], tmp());
  assert.doesNotMatch(r.stderr + r.stdout, /Usage: umd capture/);
});

test("licence guard: version specifiers, git URLs, python -m pip, npx", () => {
  assert.deepEqual(installTargets("pip install 'audiocraft>=1'"), ["audiocraft"]);
  assert.deepEqual(installTargets("pip install git+https://github.com/facebookresearch/audiocraft"), ["facebookresearch/audiocraft"]);
  assert.deepEqual(installTargets("python -m pip install yue==1.0"), ["yue"]);
  assert.deepEqual(installTargets("pip3.11 install f5-tts"), ["f5-tts"]);
  assert.deepEqual(installTargets("npx -y hunyuan3d"), ["hunyuan3d"]);
});

test("licence guard hook: works from a subfolder and with a broken project.json", () => {
  const d = tmp();
  mkdirSync(join(d, ".motion"), { recursive: true });
  mkdirSync(join(d, "web"), { recursive: true });
  writeFileSync(join(d, ".motion", "project.json"), "{ broken");
  const hook = join(ROOT, "plugins", "umd", "scripts", "hooks", "license-guard.mjs");
  const r = spawnSync(process.execPath, [hook], { input: JSON.stringify({ tool_input: { command: "pip install 'audiocraft>=1'" }, cwd: join(d, "web") }), encoding: "utf8" });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /"permissionDecision":"deny"/);
});

test("static server: bad ranges get 416, suffix ranges work, traversal is refused", async () => {
  const { serveFile } = await import("../plugins/umd/scripts/lib/serve.mjs");
  const d = tmp();
  writeFileSync(join(d, "page.html"), "<p>hello world 17</p>");
  const s = await serveFile("page.html", d);
  try {
    const base = s.url.replace(/page\.html$/, "");
    assert.equal((await fetch(s.url, { headers: { Range: "bytes=500-" } })).status, 416);
    const tail = await fetch(s.url, { headers: { Range: "bytes=-4" } });
    assert.equal(tail.status, 206);
    assert.equal(await tail.text(), "</p>");
    assert.equal((await fetch(`${base}..%2F..%2Fsecret`)).status, 403);
  } finally { await s.close(); }
});

test("burn: a subtitle file name with commas and quotes works", { skip: (!hasFfmpeg() || !filters().has("subtitles")) && "ffmpeg without libass (no subtitles filter)" }, () => {
  const d = tmp();
  const v = spawnSync("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", "color=black:s=320x180:r=25:d=1", "-c:v", "libx264", "-pix_fmt", "yuv420p", join(d, "in.mp4")]);
  if (v.status !== 0) return;
  writeFileSync(join(d, "it's, v2.srt"), "1\n00:00:00,000 --> 00:00:00,900\nHello\n");
  const r = umd(["burn", "in.mp4", "it's, v2.srt", "--out", "out.mp4"], d);
  assert.equal(r.status, 0, r.stderr);
});

test("capture: the picture sets the length when the soundtrack is shorter", { skip: (!hasFfmpeg() || !resolvePlaywright(process.cwd())) && "ffmpeg or Playwright missing" }, () => {
  const d = tmp();
  writeFileSync(join(d, "p.html"), "<body style='background:#123'><script>window.umdDuration=2; Date(); new Date();</script></body>");
  spawnSync("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", "sine=f=440:d=0.5", join(d, "a.wav")]);
  const r = umd(["capture", "p.html", "--out", "o.mp4", "--fps", "10", "--width", "320", "--height", "180", "--audio", "a.wav"], d);
  assert.equal(r.status, 0, r.stderr);
  const p = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", join(d, "o.mp4")], { encoding: "utf8" });
  assert.ok(Math.abs(Number(p.stdout) - 2) < 0.15, `duration ${p.stdout}`);
});

test("cost: expensive steps ask first, budgets are honoured, measured runs replace the estimate", async () => {
  const { estimateCost } = await import("../plugins/umd/scripts/lib/cost.mjs");
  const p = { duration_s: 30 };
  assert.equal(estimateCost("render", p, {}).confirm, false);
  assert.equal(estimateCost("build", p, { storyboard: { beats: 12 } }).confirm, true);
  assert.equal(estimateCost("build", { ...p, cost_confirm: "never" }, {}).confirm, false);
  assert.equal(estimateCost("fix", { token_budget: 100000 }, { tokens_used: 95000 }).confirm, true);
  const m = estimateCost("audit", p, {}, [{ command: "umd:audit", total: 40000, runs: 2 }]);
  assert.match(m.source, /measured/);
  assert.equal(m.level, "low");
  const next = JSON.parse(umd(["next"], tmp()).stdout);
  assert.ok(next.cost === undefined || next.cost.tokens);
});

test("run: a timeout kills the whole process tree, not only the shell", async () => {
  const { runCommand } = await import("../plugins/umd/scripts/lib/run.mjs");
  const { existsSync } = await import("node:fs");
  const d = tmp();
  // the shell starts node, which would write alive.txt after 4 s: if only the shell dies, the file appears
  writeFileSync(join(d, "sleeper.js"), "setTimeout(() => require('fs').writeFileSync('alive.txt', 'x'), 4000);");
  const r = runCommand("sleep", `"${process.execPath}" sleeper.js`, { cwd: d, logDir: join(d, "logs"), timeoutMs: 1500 });
  assert.equal(r.timed_out, true);
  assert.ok(r.duration_s < 4, `returned after ${r.duration_s} s`);
  await new Promise((res) => setTimeout(res, 4500));
  assert.equal(existsSync(join(d, "alive.txt")), false, "a descendant survived the timeout");
  const ok = runCommand("echo", `"${process.execPath}" -e "console.log('hello'); process.exit(3)"`, { cwd: d, logDir: join(d, "logs") });
  assert.equal(ok.exit_code, 3);
  assert.equal(ok.timed_out, false);
  assert.ok(ok.last_lines.includes("hello"));
});
