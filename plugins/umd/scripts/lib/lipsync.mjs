// Lip sync with Rhubarb (MIT): a voice recording becomes mouth shapes A to H and X, per frame, in one JSON that
// templates/blender/character.py and templates/html/puppet.html read. Rhubarb is found through UMD_RHUBARB, the
// PATH, or ~/.umd/runtime/rhubarb (installed by `umd doctor --fix --rhubarb` from the official GitHub release).
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { join, basename, resolve, relative, extname } from "node:path";
import { platform } from "node:os";
import { RUNTIME_DIR } from "./playwright.mjs";
import { ff } from "./ffmpeg.mjs";

const OS = platform();
const EXE = OS === "win32" ? "rhubarb.exe" : "rhubarb";
export const RHUBARB_DIR = join(RUNTIME_DIR, "rhubarb");
export const RHUBARB_VERSION = "1.14.0";
const ASSET = { win32: "Windows", darwin: "macOS", linux: "Linux" };

// what each shape is, for the agent drawing or mapping mouths (Rhubarb's own definitions, shortened)
export const SHAPES = {
  A: "closed: P, B, M", B: "slightly open, teeth together: most consonants (K, S, T) and EE", C: "open: EH, AE", D: "wide open: AA",
  E: "slightly rounded: AO, ER", F: "puckered: UW, OW, W", G: "upper teeth on lower lip: F, V", H: "tongue up: long L", X: "rest, lips closed and relaxed",
};

function findIn(dir, depth = 3) {
  if (!existsSync(dir) || depth < 0) return null;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isFile() && e.name.toLowerCase() === EXE) return p;
    if (e.isDirectory()) { const f = findIn(p, depth - 1); if (f) return f; }
  }
  return null;
}

export function findRhubarb() {
  if (process.env.UMD_RHUBARB && existsSync(process.env.UMD_RHUBARB)) return process.env.UMD_RHUBARB;
  const local = findIn(RHUBARB_DIR);
  if (local) return local;
  const r = spawnSync(OS === "win32" ? "where" : "which", ["rhubarb"], { encoding: "utf8" });
  return r.status === 0 ? r.stdout.split(/\r?\n/)[0].trim() : null;
}

export function rhubarbVersion(bin) {
  const r = spawnSync(bin, ["--version"], { encoding: "utf8", timeout: 30000, windowsHide: true });
  return r.status === 0 ? (r.stdout || r.stderr).trim().split(/\r?\n/)[0] : null;
}

// official release only (DanielSWolf/rhubarb-lip-sync), extracted in the umd runtime: nothing in the project
export async function installRhubarb() {
  const name = `Rhubarb-Lip-Sync-${RHUBARB_VERSION}-${ASSET[OS] || "Linux"}.zip`;
  const url = `https://github.com/DanielSWolf/rhubarb-lip-sync/releases/download/v${RHUBARB_VERSION}/${name}`;
  mkdirSync(RHUBARB_DIR, { recursive: true });
  const zip = join(RHUBARB_DIR, name);
  const r = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(600000) });
  if (!r.ok) return { name: "rhubarb", ok: false, note: `${r.status} for ${url}` };
  writeFileSync(zip, Buffer.from(await r.arrayBuffer()));
  let x = spawnSync("tar", ["-xf", zip, "-C", RHUBARB_DIR], { encoding: "utf8" });
  if (x.status !== 0) x = spawnSync("unzip", ["-oq", zip, "-d", RHUBARB_DIR], { encoding: "utf8" });
  rmSync(zip, { force: true });
  const bin = findIn(RHUBARB_DIR);
  if (bin && OS !== "win32") spawnSync("chmod", ["+x", bin]);
  return { name: "rhubarb", ok: !!bin, note: bin || `extraction failed: ${(x.stderr || "").trim().slice(0, 120)}` };
}

// cues from Rhubarb's JSON ({ mouthCues: [{ start, end, value }] }) to one shape per frame
export function cuesToFrames(cues, fps, durationS = null) {
  const end = durationS ?? (cues.length ? cues[cues.length - 1].end : 0);
  const n = Math.round(end * fps);
  const frames = [];
  let i = 0;
  for (let f = 0; f < n; f++) {
    const t = (f + 0.5) / fps;
    while (i < cues.length - 1 && cues[i].end <= t) i++;
    frames.push(cues[i] && t >= cues[i].start ? cues[i].value : "X");
  }
  return frames;
}

export function lipsync(audio, { cwd = process.cwd(), text = null, fps = 30, out = null, language = "fr", recognizer = null } = {}) {
  const bin = findRhubarb();
  if (!bin) throw new Error("Rhubarb Lip Sync is not installed: umd doctor --fix --rhubarb (official release, about 85 MB in ~/.umd/runtime), or set UMD_RHUBARB to the executable.");
  let input = resolve(cwd, audio);
  if (!existsSync(input)) throw new Error(`No file ${audio}`);
  // Rhubarb reads WAV and Ogg Vorbis only: anything else goes through FFmpeg first
  let tmp = null;
  if (![".wav", ".ogg"].includes(extname(input).toLowerCase())) {
    tmp = join(cwd, ".motion", "lipsync", `${basename(input, extname(input))}.tmp.wav`);
    mkdirSync(join(cwd, ".motion", "lipsync"), { recursive: true });
    const c = ff(["-hide_banner", "-loglevel", "error", "-y", "-i", input, "-ac", "1", "-ar", "48000", tmp]);
    if (c.code !== 0) throw new Error(`Could not convert ${audio} to WAV`);
    input = tmp;
  }
  // the default recogniser knows English only; any other language uses the phonetic one (language-independent)
  const rec = recognizer || (/^en/i.test(language || "") ? "pocketSphinx" : "phonetic");
  const args = ["-f", "json", "--extendedShapes", "GHX", "-r", rec, "--machineReadable", "-q"];
  if (text) args.push("-d", resolve(cwd, text));
  args.push(input);
  const r = spawnSync(bin, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 30 * 60000, windowsHide: true });
  if (tmp) rmSync(tmp, { force: true });
  if (r.status !== 0) throw new Error(`Rhubarb failed: ${(r.stderr || r.error?.message || "").trim().split(/\r?\n/).slice(-3).join(" ")}`);
  const j = JSON.parse(r.stdout);
  const cues = (j.mouthCues || []).map((c) => ({ start: c.start, end: c.end, value: c.value }));
  const duration = j.metadata?.duration ?? (cues.length ? cues[cues.length - 1].end : 0);
  const frames = cuesToFrames(cues, fps, duration);
  const file = resolve(cwd, out || join(".motion", "lipsync", `${basename(audio, extname(audio))}.json`));
  mkdirSync(resolve(file, ".."), { recursive: true });
  writeFileSync(file, JSON.stringify({ source: relative(cwd, resolve(cwd, audio)).replace(/\\/g, "/"), recognizer: rec, fps, duration, shapes: SHAPES, cues, frames }, null, 1) + "\n");
  const used = [...new Set(cues.map((c) => c.value))].sort().join("");
  return { file: relative(cwd, file).replace(/\\/g, "/"), recognizer: rec, duration_s: Math.round(duration * 100) / 100, cues: cues.length, frames: frames.length, shapes_used: used,
    next: "templates/blender/character.py: mouth_from_lipsync(rig, profile, file, start_frame); templates/html/puppet.html: puppet.lipsync(json)" };
}
