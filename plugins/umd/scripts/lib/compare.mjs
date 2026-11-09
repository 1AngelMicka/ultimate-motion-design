// Compare two renders (determinism, regressions) and measure encode quality against a master.
import { resolve, relative } from "node:path";
import { ff, filters } from "./ffmpeg.mjs";

function frameHashes(abs) {
  const r = ff(["-hide_banner", "-nostdin", "-i", abs, "-map", "0:v:0", "-f", "framemd5", "-"]);
  if (r.code !== 0) throw new Error(`framemd5 failed: ${r.stderr.trim().split(/\r?\n/).slice(-2).join(" | ")}`);
  return r.stdout.split(/\r?\n/).filter((l) => l && !l.startsWith("#")).map((l) => l.split(",").pop().trim());
}

function ssim(a, b) {
  const r = ff(["-hide_banner", "-nostdin", "-i", a, "-i", b, "-lavfi", "[0:v][1:v]scale2ref[x][y];[x][y]ssim", "-f", "null", "-"]);
  const m = r.stderr.match(/SSIM [^\n]*All:([\d.]+)/);
  return m ? Number(m[1]) : null;
}

export function compareVideos(a, b, { cwd = process.cwd() } = {}) {
  const A = resolve(cwd, a), B = resolve(cwd, b);
  const ha = frameHashes(A), hb = frameHashes(B);
  let first = null;
  const n = Math.min(ha.length, hb.length);
  for (let i = 0; i < n; i++) if (ha[i] !== hb[i]) { first = i; break; }
  const identical = first === null && ha.length === hb.length;
  return { a: relative(cwd, A), b: relative(cwd, B), frames: [ha.length, hb.length], identical, first_diff_frame: identical ? null : first ?? n,
    differing_frames: ha.slice(0, n).filter((h, i) => h !== hb[i]).length, ssim: identical ? 1 : ssim(A, B) };
}

export function vmaf(encode, master, { cwd = process.cwd() } = {}) {
  const E = resolve(cwd, encode), M = resolve(cwd, master);
  const res = { encode: relative(cwd, E), master: relative(cwd, M), vmaf: null, ssim: null, psnr: null };
  if (filters().has("libvmaf")) {
    const r = ff(["-hide_banner", "-nostdin", "-i", E, "-i", M, "-lavfi", "[0:v][1:v]scale2ref=flags=bicubic[d][r];[d][r]libvmaf=n_threads=4", "-f", "null", "-"]);
    const m = r.stderr.match(/VMAF score[:=]\s*([\d.]+)/i);
    if (m) res.vmaf = Math.round(Number(m[1]) * 100) / 100;
  }
  res.ssim = ssim(E, M);
  const p = ff(["-hide_banner", "-nostdin", "-i", E, "-i", M, "-lavfi", "[0:v][1:v]scale2ref[x][y];[x][y]psnr", "-f", "null", "-"]);
  const pm = p.stderr.match(/PSNR [^\n]*average:([\d.]+|inf)/);
  if (pm) res.psnr = pm[1] === "inf" ? Infinity : Number(pm[1]);
  if (res.vmaf == null) res.note = "libvmaf not available in this FFmpeg build: SSIM and PSNR only";
  return res;
}
