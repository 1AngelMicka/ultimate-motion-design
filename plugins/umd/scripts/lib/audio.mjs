// Loudness measure (EBU R128), two-pass normalisation, and voice/music/SFX mix with sidechain ducking.
import { resolve, relative, dirname } from "node:path";
import { mkdirSync, rmSync } from "node:fs";
import { ff, ffOk, probe } from "./ffmpeg.mjs";
import { shown } from "./ref.mjs";

export function loudness(file, { cwd = process.cwd() } = {}) {
  const abs = resolve(cwd, file);
  const r = ff(["-hide_banner", "-nostdin", "-i", abs, "-map", "0:a:0", "-af", "ebur128=peak=true:framelog=quiet", "-f", "null", "-"]);
  if (r.code !== 0) throw new Error(`No audio or ffmpeg error: ${r.stderr.trim().split(/\r?\n/).slice(-2).join(" | ")}`);
  const s = r.stderr.slice(r.stderr.lastIndexOf("Summary:"));
  const pick = (re) => { const m = s.match(re); return m && m[1] !== "-inf" ? Number(m[1]) : null; };
  return { file: shown(cwd, abs), integrated_lufs: pick(/I:\s*(-?[\d.]+|-inf)\s*LUFS/), lra_lu: pick(/LRA:\s*(-?[\d.]+)\s*LU/), true_peak_dbtp: pick(/Peak:\s*(-?[\d.]+|-inf)\s*dBFS/) };
}

function loudnormMeasure(abs, I, TP, LRA) {
  const r = ff(["-hide_banner", "-nostdin", "-i", abs, "-map", "0:a:0", "-af", `loudnorm=I=${I}:TP=${TP}:LRA=${LRA}:print_format=json`, "-f", "null", "-"]);
  const m = r.stderr.match(/\{[\s\S]*?"input_i"[\s\S]*?\}/);
  if (!m) throw new Error("loudnorm measurement failed");
  return JSON.parse(m[0]);
}

export function normalize(input, output, { lufs = -14, tp = -1, lra = 11, cwd = process.cwd() } = {}) {
  const abs = resolve(cwd, input), out = resolve(cwd, output);
  mkdirSync(dirname(out), { recursive: true });
  const m = loudnormMeasure(abs, lufs, tp, lra);
  if (!Number.isFinite(Number(m.input_i))) throw new Error(`${shown(cwd, abs)} is silent (integrated loudness -inf): nothing to normalise. Check the mix inputs.`);
  const filter = `loudnorm=I=${lufs}:TP=${tp}:LRA=${lra}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
  const info = probe(abs);
  const isVideo = !!info.width;
  const aCodec = /\.webm$/i.test(out) ? ["-c:a", "libopus", "-b:a", "160k"] : /\.(wav)$/i.test(out) ? ["-c:a", "pcm_s24le"] : ["-c:a", "aac", "-b:a", "192k"];
  ffOk(["-i", abs, ...(isVideo ? ["-map", "0:v:0", "-c:v", "copy"] : []), "-map", "0:a:0", "-af", filter, "-ar", "48000", ...aCodec, ...(isVideo && /\.mp4$/i.test(out) ? ["-movflags", "+faststart"] : []), out]);
  return { output: shown(cwd, out), before: { integrated_lufs: Number(m.input_i), true_peak_dbtp: Number(m.input_tp) }, after: loudness(out, { cwd }) };
}

// sfx entries: "file.wav@1.25" (start in seconds) or {file, at, gain_db}
// musicStart: the second of the music file heard at film 0. Back-timing sets it so the track's own ending (or a chosen
// final hit) lands on the end card, and the music plays as one continuous piece: nothing cut, looped or spliced.
export function backtimeStart({ music, length, hit = null, card = null, cwd = process.cwd() }) {
  const dur = probe(resolve(cwd, music)).duration;
  if (hit != null && card != null) return Math.round((Number(hit) - Number(card)) * 1000) / 1000;
  return Math.round((dur - Number(length)) * 1000) / 1000;
}

export function mix({ voice, music, sfx = [], out, duck = 9, musicGainDb = -6, lufs = -14, tp = -1, length = null, musicStart = 0, cwd = process.cwd() }) {
  if (!voice && !music) throw new Error("mix needs --voice and/or --music");
  const inputs = [];
  const parts = [];
  let idx = 0;
  const vIdx = voice ? idx++ : null;
  if (voice) inputs.push("-i", resolve(cwd, voice));
  const mIdx = music ? idx++ : null;
  if (music) inputs.push(...(musicStart > 0 ? ["-ss", String(musicStart)] : []), "-i", resolve(cwd, music));
  const mDelay = musicStart < 0 ? `,adelay=${Math.round(-musicStart * 1000)}|${Math.round(-musicStart * 1000)}` : "";
  const mFade = musicStart > 0 ? ",afade=t=in:d=0.04" : "";
  const fx = sfx.map((s) => (typeof s === "string" ? { file: s.split("@")[0], at: Number(s.split("@")[1] || 0) } : s));
  const fxIdx = fx.map((s) => { inputs.push("-i", resolve(cwd, s.file)); return idx++; });
  const fmt = "aformat=sample_rates=48000:channel_layouts=stereo";
  const labels = [];
  if (voice) parts.push(`[${vIdx}:a]${fmt},asplit=2[v][vsc]`);
  if (music && voice) {
    // ratio from the requested ducking depth; threshold low enough that speech always triggers it
    const ratio = Math.max(2, Math.min(20, Math.round(10 ** (duck / 20) * 2)));
    parts.push(`[${mIdx}:a]${fmt}${mDelay}${mFade},volume=${musicGainDb}dB[m]`);
    parts.push(`[m][vsc]sidechaincompress=threshold=0.02:ratio=${ratio}:attack=15:release=350:makeup=1[md]`);
    labels.push("[v]", "[md]");
  } else if (music) { parts.push(`[${mIdx}:a]${fmt}${mDelay}${mFade},volume=${musicGainDb}dB[md]`); labels.push("[md]"); }
  else labels.push("[v]");
  if (voice && !music) parts.push("[vsc]anullsink");
  fx.forEach((s, i) => {
    const ms = Math.round(s.at * 1000);
    parts.push(`[${fxIdx[i]}:a]${fmt},volume=${s.gain_db ?? 0}dB,adelay=${ms}|${ms}[fx${i}]`);
    labels.push(`[fx${i}]`);
  });
  // total length = longest input (SFX counted from their start) → short fade-in and a 0.5 s fade-out, so the end is never cut
  const lengths = [voice].filter(Boolean).map((f) => probe(resolve(cwd, f)).duration)
    .concat(music ? [probe(resolve(cwd, music)).duration - musicStart] : [])
    .concat(fx.map((s) => s.at + probe(resolve(cwd, s.file)).duration));
  const total = length ? Number(length) : Math.max(...lengths);
  const fadeOut = Math.min(0.5, total / 4);
  const fit = length ? `,apad,atrim=0:${total}` : "";
  parts.push(`${labels.join("")}amix=inputs=${labels.length}:duration=longest:normalize=0${fit},alimiter=limit=0.95,afade=t=in:d=0.02,afade=t=out:st=${(total - fadeOut).toFixed(3)}:d=${fadeOut}[mix]`);
  const outAbs = resolve(cwd, out);
  mkdirSync(dirname(outAbs), { recursive: true });
  const tmp = outAbs.replace(/(\.\w+)$/, ".premix.wav");
  ffOk([...inputs, "-filter_complex", parts.join(";"), "-map", "[mix]", "-c:a", "pcm_s24le", "-ar", "48000", tmp]);
  const n = normalize(tmp, outAbs, { lufs, tp, cwd });
  try { rmSync(tmp); } catch { /* keep */ }
  return { output: shown(cwd, outAbs), voice: voice || null, music: music || null, music_start_s: musicStart, sfx: fx, duck_db: duck, loudness: n.after };
}
