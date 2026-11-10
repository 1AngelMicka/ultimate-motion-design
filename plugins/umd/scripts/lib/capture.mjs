// Deterministic HTML → video. The page runs on virtual time: Date, performance.now, requestAnimationFrame,
// timers and Math.random (seeded) are replaced before any page script runs, every CSS/WAAPI animation and
// <video> is paused and seeked to the frame time, and rAF-driven libraries (GSAP, three.js, Lottie, p5…)
// advance one tick per frame. A page that defines window.umdRender(t) gets it called for every frame.
// Frames are screenshotted and piped to FFmpeg, so the same page always gives the same frames.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, join, extname, relative, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { loadChromium, launch } from "./playwright.mjs";
import { ffPipe, writeFrame, encoders } from "./ffmpeg.mjs";
import { openInput } from "./serve.mjs";

function virtualTime(seed) {
  if (window.__umd) return;
  const EPOCH = 1767225600000; // 2026-01-01T00:00:00Z, fixed so Date-based code is reproducible
  let now = 0;
  const RealDate = Date;
  // Callable like the real Date: `new Date()` gives the virtual time, `Date()` (no new) its string
  function VDate(...a) {
    if (!new.target) return new RealDate(EPOCH + now).toString();
    return a.length === 0 ? new RealDate(EPOCH + now) : new RealDate(...a);
  }
  VDate.prototype = RealDate.prototype;
  VDate.now = () => EPOCH + now;
  VDate.parse = RealDate.parse;
  VDate.UTC = RealDate.UTC;
  window.Date = VDate;
  try { Object.defineProperty(performance, "now", { value: () => now, configurable: true }); } catch { /* ignore */ }
  try { Object.defineProperty(performance, "timeOrigin", { value: EPOCH, configurable: true }); } catch { /* ignore */ }
  const prng = (seed0) => { let s = seed0 >>> 0; return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  Math.random = prng(seed);
  // crypto randomness is seeded too (a separate stream), so ids and noise built on it repeat; Web Workers are not covered
  const cryptoRand = prng(seed ^ 0x9e3779b9);
  try {
    const fill = (arr) => { const b = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength); for (let i = 0; i < b.length; i++) b[i] = Math.floor(cryptoRand() * 256); return arr; };
    Object.defineProperty(crypto, "getRandomValues", { value: fill, configurable: true });
    Object.defineProperty(crypto, "randomUUID", { value: () => { const b = fill(new Uint8Array(16)); b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80; const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join(""); return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`; }, configurable: true });
  } catch { /* ignore */ }
  const realRaf = window.requestAnimationFrame.bind(window);
  const realSetTimeout = window.setTimeout.bind(window);
  const within = (p, ms) => Promise.race([p, new Promise((r) => realSetTimeout(() => r("timeout"), ms))]);
  const mediaWarnings = new Set();
  let rafs = [], rafId = 0;
  window.requestAnimationFrame = (cb) => { const id = ++rafId; rafs.push({ id, cb }); return id; };
  window.cancelAnimationFrame = (id) => { rafs = rafs.filter((r) => r.id !== id); };
  const timers = new Map();
  let tid = 0;
  window.setTimeout = (fn, ms = 0, ...args) => { const id = ++tid; timers.set(id, { fn, at: now + Math.max(0, Number(ms) || 0), args, every: null }); return id; };
  window.setInterval = (fn, ms = 0, ...args) => { const id = ++tid; const every = Math.max(1, Number(ms) || 0); timers.set(id, { fn, at: now + every, args, every }); return id; };
  window.clearTimeout = window.clearInterval = (id) => { timers.delete(id); };
  const births = new WeakMap();
  const run = (fn, args) => { try { typeof fn === "function" ? fn(...(args || [])) : (0, eval)(String(fn)); } catch (e) { console.error(e); } };
  window.__umd = {
    get now() { return now / 1000; },
    async seek(sec) {
      const target = Math.max(now, sec * 1000);
      for (let guard = 0; guard < 10000; guard++) {
        let next = null;
        for (const [id, t] of timers) if (t.at <= target && (!next || t.at < next[1].at)) next = [id, t];
        if (!next) break;
        const [id, t] = next;
        now = Math.max(now, t.at);
        if (t.every) t.at += t.every; else timers.delete(id);
        run(t.fn, t.args);
        await Promise.resolve();
      }
      now = target;
      const due = rafs; rafs = [];
      for (const r of due) { try { r.cb(now); } catch (e) { console.error(e); } }
      for (const a of document.getAnimations()) {
        if (!births.has(a)) births.set(a, now);
        try { a.pause(); a.currentTime = now - births.get(a); } catch { /* finished or invalid */ }
      }
      // <video>: load metadata first (preload="none" never fires seeked), skip broken sources, never wait forever
      const vids = [...document.querySelectorAll("video")];
      await Promise.all(vids.map(async (v) => {
        v.pause();
        if (v.error || v.networkState === 3) { mediaWarnings.add(`video skipped (cannot load): ${v.currentSrc || v.src}`); return; }
        if (v.readyState === 0) {
          v.preload = "auto";
          if (v.networkState === 0) v.load();
          const r = await within(new Promise((res) => { v.addEventListener("loadedmetadata", res, { once: true }); v.addEventListener("error", res, { once: true }); }), 5000);
          if (r === "timeout" || v.error) { mediaWarnings.add(`video skipped (no metadata in 5 s): ${v.currentSrc || v.src}`); return; }
        }
        const t = Math.min(now / 1000, (v.duration || Infinity) - 0.001);
        if (Math.abs(v.currentTime - t) < 0.0005) return;
        const done = new Promise((res) => v.addEventListener("seeked", res, { once: true }));
        v.currentTime = t;
        realRaf(() => {}); // keep the compositor alive
        if ((await within(done, 5000)) === "timeout") mediaWarnings.add(`video seek timed out at ${t.toFixed(2)}s: ${v.currentSrc || v.src}`);
      }));
      if (typeof window.umdRender === "function") await window.umdRender(now / 1000);
      await new Promise((r) => realRaf(() => realRaf(r)));
      return now / 1000;
    },
    warnings() { return [...mediaWarnings]; },
    finiteDuration() {
      let end = 0;
      for (const a of document.getAnimations()) {
        const t = a.effect?.getComputedTiming?.();
        if (t && Number.isFinite(t.endTime)) end = Math.max(end, t.endTime);
      }
      return end / 1000;
    },
  };
}

const toUrl = (input, cwd) => (/^https?:\/\//.test(input) || input.startsWith("file:") ? input : pathToFileURL(resolve(cwd, input)).href);

async function openPage(input, { cwd, width, height, transparent, seed, scale = 1 }) {
  const { chromium } = await loadChromium(cwd);
  const served = await openInput(input, cwd);
  const browser = await launch(chromium);
  const origClose = browser.close.bind(browser);
  browser.close = async () => { await origClose(); await served.close(); };
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, reducedMotion: "no-preference" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e.message || e).slice(0, 300)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 300)); });
  await page.addInitScript(virtualTime, seed);
  await page.goto(served.url, { waitUntil: "load" });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {}); // module graphs, fonts, JSON
  await page.evaluate(async () => {
    await document.fonts?.ready;
    await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))));
  });
  if (transparent) await page.evaluate(() => { document.documentElement.style.background = "transparent"; document.body.style.background = "transparent"; });
  return { browser, page, errors };
}

function encodeArgs(format, { fps, out, draft, audio, transparent, enc, seconds }) {
  const input = ["-f", "image2pipe", "-framerate", String(fps), "-i", "-"];
  const aIn = audio ? ["-i", audio] : [];
  // the picture sets the length: a shorter soundtrack is padded with silence, a longer one is cut (never -shortest)
  const aMap = audio ? ["-map", "0:v", "-map", "1:a", "-af", "apad", "-t", String(seconds)] : [];
  switch (format) {
    case "webm": return [...input, ...aIn, ...aMap, "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", draft ? "40" : "28", "-row-mt", "1", "-deadline", draft ? "realtime" : "good",
      "-pix_fmt", transparent ? "yuva420p" : "yuv420p", ...(audio ? ["-c:a", "libopus", "-b:a", "160k"] : []), out];
    case "mov": return [...input, ...aIn, ...aMap, "-c:v", "prores_ks", "-profile:v", transparent ? "4444" : "3", "-pix_fmt", transparent ? "yuva444p10le" : "yuv422p10le",
      ...(audio ? ["-c:a", "pcm_s16le"] : []), out];
    case "gif": return [...input, "-vf", "split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=sierra2_4a", "-loop", "0", out];
    default: {
      const x264 = enc.has("libx264");
      return [...input, ...aIn, ...aMap, ...(x264 ? ["-c:v", "libx264", "-preset", draft ? "veryfast" : "slow", "-crf", draft ? "24" : "16", "-profile:v", "high"] : ["-c:v", "mpeg4", "-q:v", "2"]),
        "-pix_fmt", "yuv420p", "-r", String(fps), "-movflags", "+faststart", ...(audio ? ["-c:a", "aac", "-b:a", "192k", "-ar", "48000"] : []), out];
    }
  }
}

export async function capture(input, opts = {}) {
  const cwd = opts.cwd || process.cwd();
  const draft = !!opts.draft;
  let width = Number(opts.width || 1920), height = Number(opts.height || 1080);
  let fps = Number(opts.fps || 30);
  if (draft) { width = Math.round(width / 2); height = Math.round(height / 2); fps = Math.min(fps, 15); }
  width -= width % 2; height -= height % 2;
  const out = resolve(cwd, opts.out || "out.mp4");
  const format = (opts.format || extname(out).slice(1) || "mp4").toLowerCase();
  const transparent = !!opts.transparent;
  if (transparent && format === "mp4") throw new Error("MP4/H.264 has no alpha: use --format webm or mov with --transparent.");
  mkdirSync(dirname(out), { recursive: true });
  const started = Date.now();
  const { browser, page, errors } = await openPage(input, { cwd, width, height, transparent, seed: Number(opts.seed ?? 42) });
  try {
    await page.evaluate(() => window.__umd.seek(0));
    let duration = Number(opts.duration || 0);
    if (!duration) duration = await page.evaluate(() => Number(window.umdDuration) || window.__umd.finiteDuration());
    if (!duration || !Number.isFinite(duration)) throw new Error(`Unknown duration: pass --duration, or set window.umdDuration in the page.${errors.length ? ` Page errors: ${[...new Set(errors)].slice(0, 3).join(" | ")}` : ""}`);
    const from = Number(opts.from || 0);
    const total = Math.round(duration * fps);
    const shot = { type: transparent ? "png" : (draft ? "jpeg" : "png"), ...(draft && !transparent ? { quality: 85 } : {}), omitBackground: transparent, animations: "allow", caret: "hide" };
    let ff;
    if (format === "png") mkdirSync(out, { recursive: true });
    else ff = ffPipe(encodeArgs(format, { fps, out, draft, audio: opts.audio ? resolve(cwd, opts.audio) : null, transparent, enc: encoders(), seconds: total / fps }), { cwd });
    for (let i = 0; i < total; i++) {
      const t = from + i / fps;
      await page.evaluate((x) => window.__umd.seek(x), t);
      const buf = await page.screenshot(shot);
      if (format === "png") writeFileSync(join(out, `frame-${String(i).padStart(5, "0")}.png`), buf);
      else await writeFrame(ff.stdin, buf);
      if (opts.onProgress && i % 30 === 0) opts.onProgress(i, total);
    }
    if (ff) { ff.stdin.end(); await ff.done; }
    const warnings = await page.evaluate(() => window.__umd.warnings());
    return { out: relative(cwd, out), format, width, height, fps, duration, frames: total, draft, transparent,
      seconds: Math.round((Date.now() - started) / 100) / 10, page_errors: [...new Set([...warnings, ...errors])].slice(0, 10) };
  } finally {
    await browser.close();
  }
}

export async function stills(input, opts = {}) {
  const cwd = opts.cwd || process.cwd();
  const width = Number(opts.width || 1920), height = Number(opts.height || 1080);
  const outDir = resolve(cwd, opts.out || ".motion/stills");
  mkdirSync(outDir, { recursive: true });
  const times = [...(opts.at || [0])].map(Number).sort((a, b) => a - b);
  const { browser, page, errors } = await openPage(input, { cwd, width, height, transparent: false, seed: Number(opts.seed ?? 42) });
  const prefix = opts.prefix || "still";
  const files = [];
  try {
    for (const t of times) {
      await page.evaluate((x) => window.__umd.seek(x), t);
      const f = join(outDir, `${prefix}-${String(t.toFixed(2)).replace(".", "_")}s.png`);
      await page.screenshot({ path: f, type: "png", animations: "allow", caret: "hide" });
      files.push({ t, file: relative(cwd, f) });
    }
  } finally {
    await browser.close();
  }
  return { input, width, height, stills: files, page_errors: [...new Set(errors)].slice(0, 10) };
}

export { virtualTime, toUrl };
