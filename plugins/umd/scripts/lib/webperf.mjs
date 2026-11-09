// Animated page checks with Playwright: frame pacing under a 4× CPU throttle while scrolling,
// layout shift (CLS), and what still moves when prefers-reduced-motion is set to reduce.
import { loadChromium, launch } from "./playwright.mjs";
import { openInput } from "./serve.mjs";

function clsObserver() {
  window.__umdCls = 0;
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) window.__umdCls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
  } catch { /* unsupported */ }
}

async function activity(page) {
  return page.evaluate(() => {
    const running = document.getAnimations().filter((a) => a.playState === "running").length;
    let gsapActive = 0;
    try { if (window.gsap) gsapActive = window.gsap.globalTimeline.getChildren(true, true, false).filter((t) => t.isActive()).length; } catch { /* ignore */ }
    return { running, gsap_active: gsapActive };
  });
}

export async function webperf(url, { cwd = process.cwd(), seconds = 5, width = 1440, height = 900, throttle = 4 } = {}) {
  const { chromium } = await loadChromium(cwd);
  const served = await openInput(url, cwd);
  const browser = await launch(chromium);
  const target = served.url;
  const res = { url: /^https?:\/\/127\.0\.0\.1/.test(target) ? url : target, throttle };
  try {
    // 1. Normal motion, throttled CPU, scripted scroll
    const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: "no-preference" });
    const page = await ctx.newPage();
    await page.addInitScript(clsObserver);
    const cdp = await ctx.newCDPSession(page);
    await page.goto(target, { waitUntil: "load" });
    await page.waitForTimeout(500);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle });
    const normal = await activity(page);
    const frames = await page.evaluate(async (ms) => {
      const deltas = [];
      let last = performance.now();
      const end = last + ms;
      const step = Math.max(1, (document.documentElement.scrollHeight - innerHeight) / (ms / 16.7));
      await new Promise((done) => {
        const tick = (t) => {
          deltas.push(t - last); last = t;
          window.scrollBy(0, step);
          if (t < end) requestAnimationFrame(tick); else done();
        };
        requestAnimationFrame(tick);
      });
      return deltas.slice(1);
    }, seconds * 1000);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    const budget = 1000 / 60 * 1.5;
    // time-weighted: share of the measured time spent in frames that met the 60 fps budget (×1.5),
    // so a headless browser that ticks faster than 60 Hz cannot inflate the ratio with many tiny frames
    const totalMs = frames.reduce((s, d) => s + d, 0);
    const smoothMs = frames.filter((d) => d <= budget).reduce((s, d) => s + d, 0);
    res.frames = { count: frames.length, janky: frames.filter((d) => d > budget).length, long_frames: frames.filter((d) => d > 50).length, worst_ms: Math.round(Math.max(0, ...frames)) };
    res.smooth_ratio = totalMs ? Math.round((smoothMs / totalMs) * 1000) / 1000 : null;
    res.cls = Math.round((await page.evaluate(() => window.__umdCls || 0)) * 1000) / 1000;
    res.activity_normal = normal;
    await ctx.close();

    // 2. Reduced motion: does the page calm down?
    const rctx = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
    const rpage = await rctx.newPage();
    await rpage.goto(target, { waitUntil: "load" });
    await rpage.waitForTimeout(800);
    const reduced = await activity(rpage);
    const a = await rpage.screenshot({ type: "png" });
    await rpage.waitForTimeout(1000);
    const b = await rpage.screenshot({ type: "png" });
    const still = a.equals(b);
    const busyNormal = normal.running + normal.gsap_active;
    const busyReduced = reduced.running + reduced.gsap_active;
    res.reduced_motion = { activity: reduced, static_after_1s: still,
      respected: still || busyReduced === 0 || (busyNormal > 0 && busyReduced <= Math.floor(busyNormal * 0.2)) };
    await rctx.close();
  } finally {
    await browser.close();
    await served.close();
  }
  return res;
}
