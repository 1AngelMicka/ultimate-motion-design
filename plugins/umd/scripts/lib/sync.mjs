// Sound against picture, measured: audio onsets, the storyboard's sound cues, and how far each hit lands from its event.
// Also the strong attacks near the end of a music file, to back-time it onto the end card.
import { resolve, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { FFMPEG, probe } from "./ffmpeg.mjs";
import { shown } from "./ref.mjs";

const HOP_S = 0.01; // 10 ms analysis frames
const round = (x, n = 3) => Math.round(x * 10 ** n) / 10 ** n;

// RMS envelope in dB, one value per 10 ms, mono 16 kHz
export function envelope(file, { cwd = process.cwd() } = {}) {
  const abs = resolve(cwd, file);
  const r = spawnSync(FFMPEG, ["-hide_banner", "-nostdin", "-v", "error", "-i", abs, "-map", "0:a:0", "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], { maxBuffer: 1024 * 1024 * 1024 });
  if (r.error) throw new Error(r.error.code === "ENOENT" ? `${FFMPEG} not found. Run: node umd.mjs doctor` : r.error.message);
  if (r.status !== 0) throw new Error(`No audio stream or ffmpeg error in ${shown(cwd, abs)}`);
  const buf = r.stdout;
  const n = Math.floor(buf.length / 2);
  const hop = 160;
  const env = new Float64Array(Math.floor(n / hop));
  for (let i = 0; i < env.length; i++) {
    let s = 0;
    for (let j = 0; j < hop; j++) { const v = buf.readInt16LE((i * hop + j) * 2) / 32768; s += v * v; }
    env[i] = 10 * Math.log10(s / hop + 1e-12);
  }
  return env;
}

const percentile = (arr, p) => { const a = [...arr].sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor((p / 100) * a.length))] ?? -120; };

// An onset: the level rises at least `rise` dB above the quietest of the previous 30 ms, and the attack's peak
// (within the next 50 ms) is not buried far below the body level. 60 ms refractory between onsets.
export function onsets(env, { rise = 6, below = 24 } = {}) {
  const body = percentile(env, 90);
  const out = [];
  for (let i = 3; i < env.length; i++) {
    const prevMin = Math.min(env[i - 1], env[i - 2], env[i - 3]);
    if (env[i] - prevMin < rise) continue;
    let peak = env[i];
    for (let k = i; k < Math.min(env.length, i + 6); k++) peak = Math.max(peak, env[k]);
    if (peak < body - below) continue;
    out.push({ t: round(i * HOP_S, 2), level_db: round(peak - body, 1) });
    i += 6;
  }
  return out;
}

// Cues from the storyboard's "## Sound cues" section. One per line:
//   - 6.5s click: cursor press        - f195 click: cursor press        - 00:06.50 reveal
export function parseCues(md, fps = 30) {
  const text = md.replace(/<!--[\s\S]*?-->/g, "");
  const m = text.match(/^##\s+(?:sound cues|cues sonores|cues)\b[^\n]*\n([\s\S]*?)(?=^##\s|(?![\s\S]))/im);
  if (!m) return [];
  const cues = [];
  for (const line of m[1].split(/\r?\n/)) {
    const l = line.replace(/^\s*[-*|]\s*/, "").trim();
    if (!l) continue;
    let t = null, rest = l, mm;
    if ((mm = l.match(/^f(?:rame)?\s*(\d+)\b\s*(.*)$/i))) { t = Number(mm[1]) / fps; rest = mm[2]; }
    else if ((mm = l.match(/^(\d+):(\d+(?:\.\d+)?)\b\s*(.*)$/))) { t = Number(mm[1]) * 60 + Number(mm[2]); rest = mm[3]; }
    else if ((mm = l.match(/^(\d+(?:[.,]\d+)?)\s*s\b\s*(.*)$/i))) { t = Number(mm[1].replace(",", ".")); rest = mm[2]; }
    if (t == null) continue;
    cues.push({ t: round(t, 3), label: rest.replace(/\s*\|.*$/, "").replace(/^[:\s-]+/, "").trim() || "cue" });
  }
  return cues;
}

// Cues from .motion/timing.json, the film's master clock: every event that has a sound, placed sound_offset_frames
// (default 1) after its picture event. Events are { name, frame } or { name, t } (seconds).
export function timingCues(json) {
  const j = typeof json === "string" ? JSON.parse(json) : json;
  const fps = Number(j.fps) || 30;
  const offset = Number(j.sound_offset_frames ?? 1) / fps;
  return (j.events || []).filter((e) => e.sound).map((e) => {
    const t = e.t != null ? Number(e.t) : Number(e.frame) / fps;
    return { t: round(t + offset, 3), label: `${e.sound}: ${e.name || "event"}` };
  }).filter((c) => Number.isFinite(c.t)).sort((a, b) => a.t - b.t);
}

// For each cue, the nearest onset within `window` s; offset > 0 means the sound comes after the picture
export function syncCues(file, cues, { cwd = process.cwd(), toleranceMs = 45, window = 0.25, fps = null } = {}) {
  const info = probe(resolve(cwd, file));
  const env = envelope(file, { cwd });
  const on = onsets(env);
  const frame = fps || info.fps || 30;
  const rows = cues.map((c) => {
    let best = null;
    for (const o of on) if (Math.abs(o.t - c.t) <= window && (!best || Math.abs(o.t - c.t) < Math.abs(best.t - c.t))) best = o;
    if (!best) return { ...c, status: "missing", offset_ms: null, note: `no hit within ${window * 1000} ms` };
    const off = Math.round((best.t - c.t) * 1000);
    return { ...c, hit_at: best.t, offset_ms: off, offset_frames: round(off / (1000 / frame), 1), status: Math.abs(off) <= toleranceMs ? "ok" : "off" };
  });
  return {
    file: shown(cwd, resolve(cwd, file)), fps: frame, tolerance_ms: toleranceMs, cues: rows.length,
    ok: rows.filter((r) => r.status === "ok").length, off: rows.filter((r) => r.status === "off").length, missing: rows.filter((r) => r.status === "missing").length,
    worst_ms: rows.reduce((w, r) => (r.offset_ms != null && Math.abs(r.offset_ms) > Math.abs(w) ? r.offset_ms : w), 0),
    rows, onsets_found: on.length,
  };
}

// Strong attacks in the last `search` s of a music file, with how much the level drops in the 1.5 s after each.
// The track's own ending ("button") is usually a loud attack followed by a big drop; confirm by ear.
export function finalHits(file, { cwd = process.cwd(), search = 20 } = {}) {
  const env = envelope(file, { cwd });
  const body = percentile(env, 90);
  const rows = [];
  for (let i = Math.max(3, env.length - Math.round(search / HOP_S)); i < env.length; i++) {
    if (env[i] - Math.min(env[i - 1], env[i - 2], env[i - 3]) <= 6) continue;
    let peak = env[i], pk = i;
    for (let k = i; k < Math.min(env.length, i + 6); k++) if (env[k] > peak) { peak = env[k]; pk = k; }
    if (peak < body - 9) continue;
    const later = Array.from(env.slice(pk + 5, pk + 150));
    const mean = later.length ? 10 * Math.log10(later.reduce((s, v) => s + 10 ** (v / 10), 0) / later.length) : -120;
    rows.push({ t: round(i * HOP_S, 2), level_db: round(peak - body, 1), drop_after_db: round(peak - mean, 1) });
    i += 6;
  }
  const best = [...rows].sort((a, b) => b.drop_after_db - a.drop_after_db)[0] || null;
  return { file: shown(cwd, resolve(cwd, file)), duration: round(env.length * HOP_S, 2), candidates: rows.slice(-12), likely_final_hit: best?.t ?? null,
    note: "Listen to the last candidates before choosing: a ring-out can hold later attacks with bigger drops." };
}
