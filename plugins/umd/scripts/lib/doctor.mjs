// Environment check and guided install: what umd needs, what the project's route needs, and the exact
// command to get each missing piece on this OS. `--fix` runs the safe installs (Playwright runtime and
// Chromium in ~/.umd/runtime; FFmpeg through winget or Homebrew when available).
import { spawnSync } from "node:child_process";
import { mkdirSync, existsSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { platform, tmpdir } from "node:os";
import { ff, filters, encoders, FFMPEG } from "./ffmpeg.mjs";
import { resolvePlaywright, RUNTIME_DIR, loadChromium, launch } from "./playwright.mjs";

const OS = platform();
const winQuote = (a) => (/^[\w@%+=:,./\\-]+$/.test(a) ? a : `"${String(a).replace(/"/g, '\\"')}"`);
const sh = (cmd, args, opts = {}) => {
  // Windows needs a shell for .cmd shims (npm, npx); build the command line ourselves so "C:\Users\Jean Dupont" survives
  const r = OS === "win32"
    ? spawnSync([cmd, ...args].map(winQuote).join(" "), { encoding: "utf8", shell: true, ...opts })
    : spawnSync(cmd, args, { encoding: "utf8", ...opts });
  return { ok: r.status === 0, out: `${r.stdout || ""}${r.stderr || ""}`.trim(), missing: r.error?.code === "ENOENT" };
};
const has = (cmd) => { const r = sh(OS === "win32" ? "where" : "which", [cmd]); return r.ok; };
const firstLine = (s) => (s || "").split(/\r?\n/)[0].slice(0, 120);

const FFMPEG_INSTALL = {
  win32: has("winget") ? "winget install --id Gyan.FFmpeg -e --accept-source-agreements --accept-package-agreements" : "choco install ffmpeg-full (or download a build from https://www.gyan.dev/ffmpeg/builds/ and add it to PATH)",
  darwin: "brew install ffmpeg",
  linux: "sudo apt install -y ffmpeg   (Fedora: sudo dnf install ffmpeg)",
};

const ROUTE_TOOLS = {
  blender: [{ name: "blender", cmd: "blender", args: ["--version"], fix: { win32: "winget install --id BlenderFoundation.Blender -e", darwin: "brew install --cask blender", linux: "sudo snap install blender --classic" }, note: "Route R2 (Python + Blender). The Blender MCP is optional: scripts are enough (references/engines/blender.md)." }],
  manim: [{ name: "manim", cmd: "manim", args: ["--version"], fix: { all: "uv tool install manim   (or pipx install manim; needs a LaTeX distribution for MathTex)" }, note: "Explainer route with Manim." }],
  remotion: [{ name: "remotion (project)", cmd: "npx", args: ["--no-install", "remotion", "--version"], fix: { all: "npx create-video@latest   (or npm i remotion @remotion/cli in the project)" }, note: "Remotion licence: free up to 3 employees, company licence above." }],
  hyperframes: [{ name: "hyperframes", cmd: "npx", args: ["--no-install", "hyperframes", "--version"], fix: { all: "see references/engines/hyperframes.md for the install command" }, note: "HyperFrames engine." }],
  voice: [{ name: "python", cmd: OS === "win32" ? "python" : "python3", args: ["--version"], fix: { win32: "winget install Python.Python.3.12", darwin: "brew install python", linux: "sudo apt install -y python3 python3-pip" }, note: "Local TTS, alignment and music models are Python tools (see references/audio/)." }],
};

// Blender is rarely on the PATH on Windows and macOS: look in the usual install folders too (newest first)
export function findBlender() {
  if (process.env.UMD_BLENDER && existsSync(process.env.UMD_BLENDER)) return process.env.UMD_BLENDER;
  if (has("blender")) return "blender";
  const dirs = OS === "win32" ? [process.env.ProgramFiles || "C:\\Program Files", process.env["ProgramFiles(x86)"]].filter(Boolean).map((p) => join(p, "Blender Foundation")) : [];
  for (const d of dirs) {
    if (!existsSync(d)) continue;
    const versions = readdirSync(d).filter((x) => /^Blender/.test(x)).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    for (const v of versions) { const exe = join(d, v, "blender.exe"); if (existsSync(exe)) return exe; }
  }
  if (OS === "darwin" && existsSync("/Applications/Blender.app/Contents/MacOS/Blender")) return "/Applications/Blender.app/Contents/MacOS/Blender";
  return null;
}

// which GPU backends and devices Cycles sees on this machine (a few seconds: Blender starts headless once)
function cyclesDevices(bin) {
  const py = join(tmpdir(), "umd-cycles-devices.py");
  writeFileSync(py, [
    "import bpy",
    "p = bpy.context.preferences.addons['cycles'].preferences",
    "found = []",
    "for k in ('OPTIX', 'CUDA', 'HIP', 'METAL', 'ONEAPI'):",
    "    try:",
    "        p.compute_device_type = k",
    "    except TypeError:",
    "        continue",
    "    p.refresh_devices()",
    "    found += [k + ': ' + d.name for d in p.devices if d.type == k]",
    "print('UMD_GPU ' + (' | '.join(found) or 'none'))",
  ].join("\n"));
  const r = spawnSync(bin, ["-b", "--factory-startup", "--python", py], { encoding: "utf8", timeout: 120000, windowsHide: true });
  const m = `${r.stdout || ""}`.match(/UMD_GPU (.*)/);
  return m ? m[1].trim() : null;
}

export async function doctor({ cwd = process.cwd(), project = null, fix = false, blender = false } = {}) {
  const checks = [];
  const fixed = [];
  const add = (c) => checks.push(c);

  const nodeMajor = Number(process.versions.node.split(".")[0]);
  add({ name: "node", ok: nodeMajor >= 18, version: process.versions.node, fix: nodeMajor >= 18 ? null : "Install Node.js 18 or newer from https://nodejs.org" });

  // FFmpeg
  let ffv = null;
  try { const r = ff(["-hide_banner", "-version"]); ffv = r.code === 0 ? firstLine(r.stdout) : null; } catch { ffv = null; }
  if (!ffv && fix && (OS === "win32" ? has("winget") : OS === "darwin" ? has("brew") : false)) {
    const r = OS === "win32" ? sh("winget", ["install", "--id", "Gyan.FFmpeg", "-e", "--accept-source-agreements", "--accept-package-agreements"]) : sh("brew", ["install", "ffmpeg"]);
    fixed.push({ name: "ffmpeg", ok: r.ok, note: r.ok ? "installed: open a new terminal (PATH refresh) and run doctor again" : firstLine(r.out) });
  }
  add({ name: "ffmpeg", ok: !!ffv, version: ffv, fix: ffv ? null : FFMPEG_INSTALL[OS] || FFMPEG_INSTALL.linux, bin: FFMPEG });
  if (ffv) {
    const f = filters(), e = encoders();
    const need = ["ebur128", "loudnorm", "freezedetect", "blackdetect", "signalstats", "tile", "sidechaincompress", "silencedetect", "astats", "palettegen"];
    const missing = need.filter((x) => !f.has(x));
    add({ name: "ffmpeg filters", ok: !missing.length, note: missing.length ? `missing: ${missing.join(", ")}` : "analysis, loudness and mix filters present", fix: missing.length ? "Use a full FFmpeg build (gyan.dev full on Windows, Homebrew ffmpeg on macOS)" : null });
    add({ name: "libass (burned captions)", ok: f.has("subtitles"), optional: true, fix: f.has("subtitles") ? null : "FFmpeg build with libass" });
    add({ name: "libvmaf (REN-03)", ok: f.has("libvmaf"), optional: true, note: f.has("libvmaf") ? null : "umd vmaf falls back to SSIM/PSNR", fix: null });
    const enc = ["libx264", "libvpx-vp9", "prores_ks", "libopus", "aac"].filter((x) => !e.has(x));
    add({ name: "encoders", ok: !enc.includes("libx264"), optional: enc.length > 0 && !enc.includes("libx264"), note: enc.length ? `missing: ${enc.join(", ")}` : "H.264, VP9, ProRes, Opus, AAC", fix: enc.length ? "Use a full FFmpeg build" : null });
  }

  // Playwright + Chromium
  let pw = resolvePlaywright(cwd);
  if (!pw && fix) {
    mkdirSync(RUNTIME_DIR, { recursive: true });
    if (!existsSync(join(RUNTIME_DIR, "package.json"))) writeFileSync(join(RUNTIME_DIR, "package.json"), JSON.stringify({ name: "umd-runtime", private: true }, null, 2));
    const r = sh("npm", ["install", "--prefix", RUNTIME_DIR, "--no-audit", "--no-fund", "playwright@1"]);
    fixed.push({ name: "playwright (umd runtime)", ok: r.ok, note: r.ok ? RUNTIME_DIR : firstLine(r.out.split("\n").filter((l) => /err/i.test(l)).join("\n") || r.out) });
    pw = resolvePlaywright(cwd);
  }
  let chromiumOk = false, chromiumNote = null;
  if (pw) {
    try {
      const { chromium } = await loadChromium(cwd);
      const b = await launch(chromium);
      await b.close();
      chromiumOk = true;
    } catch (e) {
      chromiumNote = firstLine(e.message);
      if (fix) {
        const cli = join(pw.path.replace(/[\\/](index|test)\.(m?js)$/, ""), "cli.js");
        const r = existsSync(cli) ? sh("node", [cli, "install", "chromium"]) : sh("npx", ["--yes", "playwright", "install", "chromium"], { cwd: pw.from === "project" ? cwd : RUNTIME_DIR });
        fixed.push({ name: "chromium", ok: r.ok, note: firstLine(r.out) });
        if (r.ok) { chromiumOk = true; chromiumNote = null; }
      }
    }
  }
  add({ name: "playwright", ok: !!pw, version: pw ? `${pw.name} (${pw.from})` : null, fix: pw ? null : "node umd.mjs doctor --fix   (installs Playwright in ~/.umd/runtime, nothing in your project)" });
  add({ name: "chromium", ok: chromiumOk, note: chromiumNote, fix: chromiumOk ? null : "node umd.mjs doctor --fix   (or: npx playwright install chromium)" });

  // Route-specific tools
  const wanted = new Set();
  const route = String(project?.route || ""), engine = String(project?.engine || "");
  const wantBlender = blender || /blender|r2/i.test(route + engine);
  if (/manim/i.test(engine)) wanted.add("manim");
  if (/remotion/i.test(engine)) wanted.add("remotion");
  if (/hyperframes/i.test(engine)) wanted.add("hyperframes");
  if ((project?.flags || []).includes("has_voice")) wanted.add("voice");
  for (const key of wanted) for (const t of ROUTE_TOOLS[key] || []) {
    const r = sh(t.cmd, t.args, { cwd });
    add({ name: t.name, ok: r.ok, optional: true, version: r.ok ? firstLine(r.out) : null, note: t.note, fix: r.ok ? null : (t.fix[OS] || t.fix.all) });
  }
  if (wantBlender) {
    const bin = findBlender();
    const v = bin ? spawnSync(bin, ["--version"], { encoding: "utf8", timeout: 60000, windowsHide: true }) : null;
    const version = v?.status === 0 ? firstLine(v.stdout) : null;
    const gpu = version ? cyclesDevices(bin) : null;
    const t = ROUTE_TOOLS.blender[0];
    add({ name: "blender", ok: !!version, optional: true, version, path: bin && bin !== "blender" ? bin : undefined,
      note: version ? `Cycles sees: ${gpu === "none" ? "no GPU, renders on the CPU" : gpu || "unknown (probe failed)"}. Call setup_gpu() in your script: references/engines/blender.md` : t.note,
      fix: version ? null : `${t.fix[OS] || t.fix.linux}   (or set UMD_BLENDER to blender's path)` });
  }
  const required = checks.filter((c) => !c.optional);
  return { ok: required.every((c) => c.ok), os: OS, checks, fixed, runtime_dir: RUNTIME_DIR };
}
