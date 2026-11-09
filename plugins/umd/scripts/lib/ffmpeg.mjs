// FFmpeg / ffprobe helpers. Uses the binaries on PATH, or UMD_FFMPEG / UMD_FFPROBE.
import { spawnSync, spawn } from "node:child_process";
import { existsSync } from "node:fs";

export const FFMPEG = process.env.UMD_FFMPEG || "ffmpeg";
export const FFPROBE = process.env.UMD_FFPROBE || "ffprobe";

export function ff(args, { cwd, bin = FFMPEG, input } = {}) {
  const r = spawnSync(bin, args, { cwd, encoding: "utf8", maxBuffer: 512 * 1024 * 1024, input });
  if (r.error) {
    if (r.error.code === "ENOENT") throw new Error(`${bin} not found. Run: node umd.mjs doctor`);
    throw r.error;
  }
  return { code: r.status, stdout: r.stdout || "", stderr: r.stderr || "" };
}

export function ffOk(args, opts) {
  const r = ff(["-hide_banner", "-nostdin", "-y", ...args], opts);
  if (r.code !== 0) {
    const tail = r.stderr.trim().split(/\r?\n/).slice(-6).join("\n");
    throw new Error(`ffmpeg failed (exit ${r.code}):\n${tail}`);
  }
  return r;
}

export function hasFfmpeg() {
  try { return ff(["-hide_banner", "-version"]).code === 0; } catch { return false; }
}

export function filters() {
  try {
    const out = ff(["-hide_banner", "-filters"]).stdout;
    return new Set(out.split(/\r?\n/).map((l) => l.trim().split(/\s+/)[1]).filter(Boolean));
  } catch { return new Set(); }
}

export function encoders() {
  try {
    const out = ff(["-hide_banner", "-encoders"]).stdout;
    return new Set(out.split(/\r?\n/).map((l) => l.trim().split(/\s+/)[1]).filter(Boolean));
  } catch { return new Set(); }
}

const ratio = (s) => {
  if (!s || s === "0/0") return null;
  const [a, b] = s.split("/").map(Number);
  return b ? a / b : a;
};

export function probe(file) {
  if (!existsSync(file)) throw new Error(`File not found: ${file}`);
  const r = ff(["-v", "error", "-show_streams", "-show_format", "-of", "json", file], { bin: FFPROBE });
  if (r.code !== 0) throw new Error(`ffprobe failed: ${r.stderr.trim().slice(0, 300)}`);
  const j = JSON.parse(r.stdout);
  const v = j.streams.find((s) => s.codec_type === "video");
  const a = j.streams.find((s) => s.codec_type === "audio");
  const duration = Number(j.format.duration || v?.duration || a?.duration || 0);
  const out = { file, duration: Math.round(duration * 1000) / 1000, size_bytes: Number(j.format.size || 0),
    bitrate_kbps: Math.round(Number(j.format.bit_rate || 0) / 1000), container: j.format.format_name };
  if (v) {
    const r1 = ratio(v.r_frame_rate), avg = ratio(v.avg_frame_rate);
    Object.assign(out, { width: v.width, height: v.height, fps: r1 ? Math.round(r1 * 1000) / 1000 : null,
      cfr: r1 && avg ? Math.abs(r1 - avg) < 0.01 : null, vcodec: v.codec_name, profile: v.profile || null, pix_fmt: v.pix_fmt,
      frames: v.nb_frames ? Number(v.nb_frames) : null, has_alpha: /yuva|rgba|argb|gbrap/.test(v.pix_fmt || "") });
  }
  out.audio = a ? { codec: a.codec_name, sample_rate: Number(a.sample_rate), channels: a.channels,
    bitrate_kbps: a.bit_rate ? Math.round(Number(a.bit_rate) / 1000) : null } : null;
  return out;
}

// Spawn ffmpeg reading frames from stdin. Returns { stdin, done: Promise }.
export function ffPipe(args, { cwd } = {}) {
  const p = spawn(FFMPEG, ["-hide_banner", "-nostdin", "-loglevel", "error", "-y", ...args].filter((x) => x !== "-nostdin"), { cwd, stdio: ["pipe", "ignore", "pipe"] });
  let err = "";
  p.stderr.on("data", (d) => { err += d; });
  const done = new Promise((resolve, reject) => {
    p.on("error", (e) => reject(e.code === "ENOENT" ? new Error("ffmpeg not found. Run: node umd.mjs doctor") : e));
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}: ${err.trim().slice(-600)}`))));
  });
  return { stdin: p.stdin, done };
}

export async function writeFrame(stdin, buf) {
  if (!stdin.write(buf)) await new Promise((r) => stdin.once("drain", r));
}
