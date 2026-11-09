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
import { countFlashes, deadAir } from "../plugins/umd/scripts/lib/analyze.mjs";
import { lint, parseStoryboard } from "../plugins/umd/scripts/lib/lint.mjs";
import { installTargets, classify, checkLicenses } from "../plugins/umd/scripts/lib/licenses.mjs";
import { groupCues, toAss, toSrt } from "../plugins/umd/scripts/lib/captions.mjs";
import { autocheck } from "../plugins/umd/scripts/lib/autocheck.mjs";
import { hasFfmpeg } from "../plugins/umd/scripts/lib/ffmpeg.mjs";
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

test("deterministic HTML capture", { skip: (!hasFfmpeg() || !resolvePlaywright(process.cwd())) && "ffmpeg or Playwright missing (umd doctor --fix)" }, () => {
  const d = tmp();
  const page = join(ROOT, "tests", "fixtures", "scene", "index.html");
  for (const n of ["a", "b"]) assert.equal(umd(["capture", page, "--out", join(d, `${n}.mp4`), "--width", "320", "--height", "180", "--duration", "1.5"], d).status, 0);
  const c = JSON.parse(umd(["compare", join(d, "a.mp4"), join(d, "b.mp4")], d).stdout);
  assert.equal(c.identical, true);
});
