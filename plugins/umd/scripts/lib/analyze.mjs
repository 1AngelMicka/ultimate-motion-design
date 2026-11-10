// Video analysis with FFmpeg only: probe, scene cuts, frozen and black segments, motion timeline,
// full-frame flash count (WCAG 2.3.1 approximation), loudness (EBU R128), silences, contact sheet.
// One video pass + one audio pass; the output is compact JSON meant to be read by Claude.
import { mkdirSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { ff, ffOk, probe } from "./ffmpeg.mjs";

const round = (x, d = 2) => (x == null || Number.isNaN(x) ? null : Math.round(x * 10 ** d) / 10 ** d);

function videoPass(file, info) {
  // scale down for speed; analysis values are relative so resolution barely matters
  const graph = [
    "[0:v]scale=320:-2,format=yuv420p,split=3[a][b][c]",
    "[a]freezedetect=n=0.001:d=0.5,nullsink",
    "[b]blackdetect=d=0.04:pix_th=0.10,nullsink",
    "[c]signalstats,metadata=print:key=lavfi.signalstats.YAVG,metadata=print:key=lavfi.signalstats.YDIF,select='gt(scene\\,0.3)',metadata=print:key=lavfi.scene_score[out]",
  ].join(";");
  const r = ff(["-hide_banner", "-nostdin", "-i", file, "-filter_complex", graph, "-map", "[out]", "-an", "-f", "null", "-"]);
  if (r.code !== 0) throw new Error(`ffmpeg analysis failed: ${r.stderr.trim().split(/\r?\n/).slice(-4).join(" | ")}`);
  const frames = []; // {t, yavg, ydif}
  const scenes = [];
  const freezes = [];
  const black = [];
  let t = null;
  let cur = null;
  let freezeStart = null;
  for (const line of r.stderr.split(/\r?\n/)) {
    let m;
    if ((m = line.match(/frame:\s*\d+\s+pts:\s*-?\d+\s+pts_time:\s*([\d.]+)/))) { t = Number(m[1]); continue; }
    if ((m = line.match(/lavfi\.signalstats\.YAVG=([\d.]+)/))) { cur = { t, yavg: Number(m[1]), ydif: 0 }; frames.push(cur); continue; }
    if ((m = line.match(/lavfi\.signalstats\.YDIF=([\d.]+)/))) { if (cur && cur.t === t) cur.ydif = Number(m[1]); continue; }
    if ((m = line.match(/lavfi\.scene_score=([\d.]+)/))) { scenes.push({ t: round(t), score: round(Number(m[1])) }); continue; }
    if ((m = line.match(/freeze_start:\s*([\d.]+)/))) { freezeStart = Number(m[1]); continue; }
    if ((m = line.match(/freeze_end:\s*([\d.]+)/)) && freezeStart != null) {
      freezes.push({ start: round(freezeStart), end: round(Number(m[1])), duration: round(Number(m[1]) - freezeStart) });
      freezeStart = null; continue;
    }
    if ((m = line.match(/black_start:\s*([\d.]+)\s+black_end:\s*([\d.]+)\s+black_duration:\s*([\d.]+)/))) {
      black.push({ start: round(Number(m[1])), end: round(Number(m[2])), duration: round(Number(m[3])) });
    }
  }
  if (freezeStart != null) freezes.push({ start: round(freezeStart), end: info.duration, duration: round(info.duration - freezeStart), until_end: true });
  return { frames, scenes, freezes, black };
}

// WCAG-style flash count on full-frame relative luminance: a flash is a pair of opposing changes of at
// least `delta` where the darker state is below 0.8. Counted in a sliding 1 s window.
export function countFlashes(frames, delta = 0.1) {
  const L = frames.map((f) => ({ t: f.t, l: Math.min(1, Math.max(0, (f.yavg - 16) / 219)) }));
  const transitions = [];
  if (!L.length) return { max_per_s: 0, at: null, transitions: 0 };
  let ext = L[0];
  let dir = 0;
  for (const p of L.slice(1)) {
    const d = p.l - ext.l;
    if (Math.abs(d) >= delta && Math.min(p.l, ext.l) < 0.8) {
      const nd = Math.sign(d);
      if (nd !== dir) transitions.push({ t: p.t, dir: nd });
      dir = nd;
      ext = p;
    } else if ((dir >= 0 && p.l > ext.l) || (dir <= 0 && p.l < ext.l)) {
      ext = p; // extend the current extreme
    }
  }
  let max = 0, at = null;
  for (let i = 0; i < transitions.length; i++) {
    let j = i;
    while (j < transitions.length && transitions[j].t - transitions[i].t < 1) j++;
    const flashes = Math.floor((j - i) / 2);
    if (flashes > max) { max = flashes; at = round(transitions[i].t); }
  }
  return { max_per_s: max, at, transitions: transitions.length };
}

export function motionTimeline(frames, bucket = 0.5) {
  const buckets = [];
  for (const f of frames) {
    const i = Math.floor(f.t / bucket);
    (buckets[i] ||= []).push(f.ydif);
  }
  return Array.from(buckets, (b) => (b && b.length ? round(b.reduce((s, x) => s + x, 0) / b.length, 1) : 0));
}

export function deadAir(timeline, bucket, floor, minS) {
  const out = [];
  let start = null;
  timeline.forEach((v, i) => {
    if (v < floor) { if (start == null) start = i; }
    else if (start != null) { if ((i - start) * bucket >= minS) out.push({ start: round(start * bucket), end: round(i * bucket), duration: round((i - start) * bucket) }); start = null; }
  });
  if (start != null && (timeline.length - start) * bucket >= minS) out.push({ start: round(start * bucket), end: round(timeline.length * bucket), duration: round((timeline.length - start) * bucket) });
  return out;
}

function audioPass(file, info) {
  const r = ff(["-hide_banner", "-nostdin", "-i", file, "-map", "0:a:0", "-af", "ebur128=peak=true:framelog=quiet,silencedetect=n=-50dB:d=0.3", "-f", "null", "-"]);
  if (r.code !== 0) return { error: r.stderr.trim().split(/\r?\n/).slice(-2).join(" | ") };
  const s = r.stderr;
  const num = (re) => { const m = s.match(re); return m ? Number(m[1]) : null; };
  const summary = s.slice(s.lastIndexOf("Summary:"));
  const loudness = {
    integrated: (() => { const m = summary.match(/I:\s*(-?[\d.]+|-inf)\s*LUFS/); return m && m[1] !== "-inf" ? Number(m[1]) : null; })(),
    lra: (() => { const m = summary.match(/LRA:\s*(-?[\d.]+)\s*LU/); return m ? Number(m[1]) : null; })(),
    true_peak: (() => { const m = summary.match(/Peak:\s*(-?[\d.]+|-inf)\s*dBFS/); return m && m[1] !== "-inf" ? Number(m[1]) : null; })(),
  };
  const silences = [];
  let st = null;
  for (const line of s.split(/\r?\n/)) {
    let m;
    if ((m = line.match(/silence_start:\s*(-?[\d.]+)/))) st = Math.max(0, Number(m[1]));
    else if ((m = line.match(/silence_end:\s*([\d.]+)/)) && st != null) { silences.push({ start: round(st), end: round(Number(m[1])) }); st = null; }
  }
  if (st != null) silences.push({ start: round(st), end: info.duration });
  const leading = silences.find((x) => x.start <= 0.05);
  const trailing = silences.find((x) => x.end >= info.duration - 0.05);
  // abrupt end: loud last 100 ms (no fade, no tail)
  let tailRms = null;
  const t = ff(["-hide_banner", "-nostdin", "-sseof", "-0.1", "-i", file, "-map", "0:a:0", "-af", "astats=metadata=1:reset=0", "-f", "null", "-"]);
  const m = t.stderr.match(/RMS level dB:\s*(-?[\d.]+|-inf)/);
  if (m && m[1] !== "-inf") tailRms = Number(m[1]);
  void num;
  return {
    loudness,
    silence: { leading_s: leading ? round(leading.end - leading.start) : 0, trailing_s: trailing ? round(trailing.end - trailing.start) : 0, segments: silences.slice(0, 20) },
    audio_end: { tail_rms_db: tailRms, abrupt: tailRms != null && tailRms > -30 },
  };
}

// Near-still time: 0.5 s buckets below the motion floor, the last `endCard` seconds excluded (an end card may hold)
export function stillness(timeline, bucket, floor, endCard = 2) {
  const keep = Math.max(0, timeline.length - Math.round(endCard / bucket));
  let total = 0, run = 0, longest = 0, at = null, runStart = 0;
  for (let i = 0; i < keep; i++) {
    if (timeline[i] < floor) { if (!run) runStart = i; run++; total++; if (run > longest) { longest = run; at = round(runStart * bucket); } }
    else run = 0;
  }
  const span = keep * bucket;
  return { still_s: round(total * bucket), per_30s: span ? round((total * bucket * 30) / span, 2) : 0, longest_s: round(longest * bucket), longest_at: at, end_card_excluded_s: endCard };
}

export function contactSheet(file, info, outFile, n = 16) {
  const portrait = info.width && info.height && info.height > info.width;
  const cols = portrait ? 8 : 4;
  const rows = Math.ceil(n / cols);
  const cellW = Math.floor(1536 / cols / 2) * 2;
  const dur = Math.max(info.duration, 0.1);
  const times = Array.from({ length: n }, (_, i) => round((dur * (i + 0.5)) / n));
  ffOk(["-i", file, "-vf", `fps=${n}/${dur},scale=${cellW}:-2,tile=${cols}x${rows}:padding=4:color=black`, "-frames:v", "1", "-q:v", "4", outFile]);
  return { file: outFile, layout: `${cols}x${rows}`, order: "row-major", times };
}

export function analyze(file, { outDir, thresholds = {}, sheet = true, cwd = process.cwd() } = {}) {
  const abs = resolve(cwd, file);
  const info = probe(abs);
  info.file = relative(cwd, abs);
  const res = { file: info.file, probe: info };
  if (info.width) {
    const v = videoPass(abs, info);
    const bucket = 0.5;
    const timeline = motionTimeline(v.frames, bucket);
    res.scenes = { count: v.scenes.length, cuts: v.scenes.slice(0, 40) };
    res.freezes = v.freezes;
    res.black = v.black;
    res.flashes = countFlashes(v.frames, thresholds.flash_delta ?? 0.1);
    res.motion = { bucket_s: bucket, timeline, mean: round(timeline.reduce((s, x) => s + x, 0) / (timeline.length || 1), 1) };
    res.dead_air = deadAir(timeline, bucket, thresholds.motion_floor ?? 0.4, thresholds.dead_air_s ?? 3);
    res.stillness = stillness(timeline, bucket, thresholds.motion_floor ?? 0.4, thresholds.end_card_s ?? 2);
    res.first_frame_black = v.black.some((b) => b.start <= 0.04);
  }
  if (info.audio) Object.assign(res, audioPass(abs, info));
  if (outDir) {
    mkdirSync(outDir, { recursive: true });
    if (sheet && info.width) {
      const s = contactSheet(abs, info, join(outDir, "sheet.jpg"));
      res.sheet = { ...s, file: relative(cwd, s.file) };
    }
    writeFileSync(join(outDir, "analysis.json"), JSON.stringify(res, null, 2));
  }
  return res;
}

export function frames(file, { at = [], every = null, outDir, cwd = process.cwd(), width = 960 } = {}) {
  const abs = resolve(cwd, file);
  const info = probe(abs);
  mkdirSync(outDir, { recursive: true });
  let times = at;
  if (every) times = Array.from({ length: Math.floor(info.duration / every) + 1 }, (_, i) => round(i * every)).filter((x) => x < info.duration);
  const out = [];
  for (const t of times) {
    const f = join(outDir, `frame-${String(t.toFixed(2)).replace(".", "_")}s.jpg`);
    ffOk(["-ss", String(t), "-i", abs, "-frames:v", "1", "-vf", `scale=${width}:-2`, "-q:v", "3", f]);
    out.push({ t, file: relative(cwd, f) });
  }
  return { video: relative(cwd, abs), frames: out };
}

// Dense frames around each cut: one strip per cut, 12 frames from 0.2 s before to 0.2 s after (text over text,
// splices and pops hide in transitions, not on settled frames)
export function cutStrips(file, { cuts, outDir, cwd = process.cwd(), max = 12, width = 320 } = {}) {
  const abs = resolve(cwd, file);
  const info = probe(abs);
  mkdirSync(outDir, { recursive: true });
  const list = (cuts || []).map((c) => (typeof c === "number" ? c : c.t ?? c.time ?? c)).filter((t) => t > 0.2 && t < info.duration - 0.2).slice(0, max);
  const out = [];
  for (const t of list) {
    const f = join(outDir, `cut-${String(t.toFixed(2)).replace(".", "_")}s.jpg`);
    ffOk(["-ss", String(Math.max(0, t - 0.2)), "-t", "0.4", "-i", abs, "-vf", `fps=30,scale=${width}:-2,tile=6x2:padding=2:color=black`, "-frames:v", "1", "-q:v", "4", f]);
    out.push({ cut: round(t), from: round(Math.max(0, t - 0.2)), to: round(t + 0.2), file: relative(cwd, f), layout: "6x2 row-major, 1/30 s apart" });
  }
  return { video: relative(cwd, abs), strips: out, skipped: Math.max(0, (cuts || []).length - out.length) };
}

