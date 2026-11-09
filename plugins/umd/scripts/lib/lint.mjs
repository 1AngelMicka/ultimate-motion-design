// Static motion lint: hard-coded durations and easings, AI motion tells, layout-property animation,
// transition: all, reduced-motion support, font families, remote assets at render time, slop wording,
// engine determinism rules, storyboard completeness and stills. Regex-based, fast, no dependencies.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, extname, basename } from "node:path";

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "out", ".next", ".nuxt", ".svelte-kit", "coverage", "deliverables", "renders", "audits", ".cache", "__pycache__", "media", "vendor", ".venv", "venv"]);
const CODE = new Set([".html", ".htm", ".css", ".scss", ".sass", ".less", ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".vue", ".svelte", ".astro"]);
const TEXT = new Set([".md", ".txt", ".srt", ".vtt", ".ass"]);
const MAX_FILES = 3000;
const MAX_BYTES = 600 * 1024;

function walk(root) {
  const files = [];
  const rec = (dir) => {
    let entries = [];
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (files.length >= MAX_FILES) return;
      const p = join(dir, e.name);
      if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name) && !(e.name.startsWith(".") && e.name !== ".motion")) rec(p); }
      else if (e.isFile()) {
        const ext = extname(e.name).toLowerCase();
        if ((CODE.has(ext) || TEXT.has(ext) || ext === ".py") && !/\.min\.(js|css)$/.test(e.name)) {
          try { if (statSync(p).size <= MAX_BYTES) files.push(p); } catch { /* ignore */ }
        }
      }
    }
  };
  rec(root);
  return files;
}

const isTokenFile = (f) => /motion[-_.]?tokens|tokens?\.(css|scss|ts|js|json)$|[\\/]tokens[\\/]/i.test(f);

const RULES = {
  hardcoded_motion: [
    /\btransition(?:-duration)?\s*:\s*[^;{}]*?\b\d*\.?\d+m?s\b/g,
    /\banimation(?:-duration)?\s*:\s*[^;{}]*?\b\d*\.?\d+m?s\b/g,
    /\bduration\s*[:=]\s*\d*\.?\d+(?!\s*\*\s*fps)/g,
    /cubic-bezier\(\s*[\d.]+/g,
    /\bease\s*:\s*["'](?:power\d|back|elastic|expo|sine|circ|quad|cubic|quart|quint)[^"']*["']/g,
  ],
  ai_tells: {
    pulse_ping_bounce_classes: /\banimate-(?:pulse|ping|bounce)\b/g,
    infinite_decorative: /animation\s*:[^;]*\b(?:pulse|float|glow|bounce|breath|shimmer|wiggle)\w*[^;]*\binfinite\b|\b(?:repeat|iterations)\s*:\s*(?:-1|Infinity)\b/g,
    blur_entrance: /(?:initial|from|hidden|enter|fromTo\([^)]*)\s*[:=(]?\s*\{[^}]{0,160}filter\s*:\s*["']?blur\(/g,
    fade_up_entrance: /opacity\s*:\s*0\s*,\s*y\s*:\s*(?:1[6-9]|2\d|3\d|40|50)\b/g,
    spring_bounce: /\bbounce\s*:\s*0?\.(?:[4-9])\d*|\bstiffness\s*:\s*\d+\s*,\s*damping\s*:\s*(?:[0-9])\b/g,
    elastic_back: /["'](?:elastic|back)\.(?:out|in|inOut)/g,
  },
  linear_moves: /\bease\s*:\s*["'](?:none|linear)["']|\btransition\s*:\s*transform[^;]*\blinear\b/g,
  layout_props: /\btransition(?:-property)?\s*:\s*(?:width|height|top|left|right|bottom|margin|padding)\b|(?:gsap\.(?:to|from|fromTo)|animate\s*=\s*\{\{|\.animate\()[^;]{0,240}?\b(?:width|height|top|left|marginTop|marginLeft|padding)\s*:/g,
  transition_all: /\btransition\s*:\s*all\b|\btransition-all\b/g,
  will_change: /\bwill-change\s*:\s*(?!auto)/g,
  reduced_motion: /prefers-reduced-motion|useReducedMotion|useReducedMotionConfig|reducedMotion|motion-reduce:|motion-safe:/,
  remote_assets: /https?:\/\/(?:fonts\.googleapis\.com|fonts\.gstatic\.com|use\.typekit\.net|cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com)[^\s"')]*|https?:\/\/[^\s"')]+\.(?:png|jpe?g|webp|avif|gif|mp4|webm|mov|mp3|wav|woff2?|ttf|otf)(?:\?[^\s"')]*)?/g,
};

const ENGINE_RULES = {
  remotion: {
    random_or_clock: /\bMath\.random\(|\bDate\.now\(|\bnew Date\(\s*\)|\bperformance\.now\(/g,
    timers: /\bset(?:Timeout|Interval)\(/g,
    css_animation: /\b(?:transition|animation)\s*:\s*["'`][^"'`]*\d+m?s/g,
    raf: /\brequestAnimationFrame\(/g,
  },
  revideo: { random_or_clock: /\bMath\.random\(|\bDate\.now\(|\bperformance\.now\(/g },
  manim: { random_unseeded: /\brandom\.(?:random|uniform|randint|choice)\(/g },
};

function locate(text, re, file, root, limit, out) {
  re.lastIndex = 0;
  let m, n = 0;
  while ((m = re.exec(text))) {
    n++;
    if (out.length < limit) {
      const line = text.slice(0, m.index).split("\n").length;
      out.push(`${relative(root, file)}:${line} ${m[0].replace(/\s+/g, " ").slice(0, 70)}`);
    }
    if (m.index === re.lastIndex) re.lastIndex++;
  }
  return n;
}

function fontFamilies(text, set) {
  const generic = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-sans-serif|ui-serif|ui-monospace|inherit|initial|unset|-apple-system|blinkmacsystemfont|var\(.+|emoji|math)$/i;
  const re = /font-family\s*:\s*([^;}{]+)|fontFamily\s*:\s*["'`]([^"'`]+)["'`]/g;
  let m;
  while ((m = re.exec(text))) {
    const first = (m[1] || m[2]).split(",")[0].trim().replace(/^["']|["']$/g, "");
    if (first && !generic.test(first) && !first.includes("${")) set.add(first.toLowerCase());
  }
}

function slopScan(text, words, file, root, out) {
  const lower = text.toLowerCase();
  let count = 0;
  for (const w of words) {
    let i = lower.indexOf(w.toLowerCase());
    while (i !== -1) {
      const before = lower[i - 1], after = lower[i + w.length];
      if (!(before && /[a-zàâçéèêëîïôûùüÿñæœ]/.test(before)) && !(after && /[a-zàâçéèêëîïôûùüÿñæœ]/.test(after))) {
        count++;
        if (out.length < 12) out.push(`${relative(root, file)}:${text.slice(0, i).split("\n").length} "${w}"`);
      }
      i = lower.indexOf(w.toLowerCase(), i + w.length);
    }
  }
  return count;
}

// Storyboard table: | # | time or duration | shot | on-screen text | motion | sound | intent |
export function parseStoryboard(md) {
  const rows = md.split(/\r?\n/).filter((l) => /^\s*\|/.test(l)).map((l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
  if (!rows.length) return null;
  const header = rows[0].map((h) => h.toLowerCase());
  const col = (re) => header.findIndex((h) => re.test(h));
  const ci = { dur: col(/dur|time|temps|timing/), text: col(/text|texte/), intent: col(/intent|émotion|emotion|but|purpose|role/) };
  const beats = rows.slice(1).filter((r) => /^\d+[a-z]?$/i.test(r[0] || "")).map((r) => {
    const durCell = ci.dur >= 0 ? r[ci.dur] : "";
    let dur = null;
    const range = durCell.match(/(\d+(?:[.,]\d+)?)\s*(?:s)?\s*[-–→]\s*(\d+(?:[.,]\d+)?)/);
    const mmss = durCell.match(/(\d+):(\d+(?:[.,]\d+)?)\s*[-–→]\s*(\d+):(\d+(?:[.,]\d+)?)/);
    if (mmss) dur = (Number(mmss[3]) * 60 + Number(mmss[4].replace(",", "."))) - (Number(mmss[1]) * 60 + Number(mmss[2].replace(",", ".")));
    else if (range) dur = Number(range[2].replace(",", ".")) - Number(range[1].replace(",", "."));
    else { const s = durCell.match(/(\d+(?:[.,]\d+)?)\s*s/); if (s) dur = Number(s[1].replace(",", ".")); }
    const text = ci.text >= 0 ? (r[ci.text] || "").replace(/^[—–-]$/, "") : "";
    const intent = ci.intent >= 0 ? r[ci.intent] || "" : r[r.length - 1] || "";
    return { id: r[0], duration: dur, text, intent: intent.replace(/^[—–-]$/, "") };
  });
  return { beats, validated: /(?:stills?\s+validated|images?\s+fixes?\s+valid[ée]es?)\s*:?\s*\d{4}-\d{2}-\d{2}/i.test(md.replace(/<!--[\s\S]*?-->/g, "")) };
}

export function lint(root, { ref, project, thresholds: th = {} } = {}) {
  const files = walk(root);
  const res = { files_scanned: files.length };
  const add = (key) => (res[key] ||= { count: 0, at: [] });
  const fonts = new Set();
  let reduced = false;
  let animatedWeb = false;
  const engine = String(project?.engine || "").toLowerCase();
  const words = [...(ref?.slop?.fr || []), ...(ref?.slop?.en || [])];
  for (const f of files) {
    let text;
    try { text = readFileSync(f, "utf8"); } catch { continue; }
    const ext = extname(f).toLowerCase();
    const name = basename(f);
    if (CODE.has(ext)) {
      if (!isTokenFile(f)) {
        const r = add("hardcoded_motion");
        for (const re of RULES.hardcoded_motion) r.count += locate(text, re, f, root, 8, r.at);
      }
      const tells = add("ai_tells");
      tells.by = tells.by || {};
      for (const [k, re] of Object.entries(RULES.ai_tells)) {
        const n = locate(text, re, f, root, 10, tells.at);
        if (n) { tells.by[k] = (tells.by[k] || 0) + n; tells.count += n; }
      }
      for (const k of ["linear_moves", "layout_props", "transition_all", "will_change", "remote_assets"]) {
        const r = add(k);
        r.count += locate(text, RULES[k], f, root, 6, r.at);
      }
      if (RULES.reduced_motion.test(text)) reduced = true;
      if (/@keyframes|transition\s*:|gsap|framer-motion|motion\/react|animejs|lenis|\.animate\(/.test(text)) animatedWeb = true;
      fontFamilies(text, fonts);
      for (const [eng, rules] of Object.entries(ENGINE_RULES)) {
        if (!engine.includes(eng)) continue;
        const r = add("determinism");
        for (const [k, re] of Object.entries(rules)) {
          const n = locate(text, re, f, root, 8, r.at);
          if (n) { r.count += n; (r.by ||= {})[k] = (r.by[k] || 0) + n; }
        }
      }
      if (/\.(html?|vue|svelte|astro)$/.test(ext)) {
        const visible = text.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, " ");
        const s = add("slop");
        s.count += slopScan(visible, words, f, root, s.at);
      }
    } else if (ext === ".py") {
      for (const [eng, rules] of Object.entries(ENGINE_RULES)) {
        if (!engine.includes(eng)) continue;
        const r = add("determinism");
        for (const re of Object.values(rules)) r.count += locate(text, re, f, root, 8, r.at);
      }
    } else if (TEXT.has(ext) && !/^(readme|changelog|license|contributing)/i.test(name) && !relative(root, f).startsWith("references")) {
      const s = add("slop");
      s.count += slopScan(text, words, f, root, s.at);
    }
  }
  // Drop empty rules for compactness
  for (const k of Object.keys(res)) if (res[k] && typeof res[k] === "object" && res[k].count === 0) res[k] = { count: 0 };
  // Engines that read tokens differently (Remotion frames) still need durations in frames: keep the count but flag.
  res.fonts = { families: [...fonts].sort(), count: fonts.size };
  res.reduced_motion = { supported: reduced, animated_code: animatedWeb };
  // Storyboard and stills
  const sbFile = join(root, ".motion", "storyboard.md");
  if (existsSync(sbFile)) {
    const sb = parseStoryboard(readFileSync(sbFile, "utf8"));
    if (sb) {
      const minS = th.text_min_s ?? 1.2, wps = th.text_words_per_s ?? 3;
      const tooShort = sb.beats.filter((b) => b.text && b.duration != null && b.duration < Math.max(minS, b.text.split(/\s+/).filter(Boolean).length / wps + 0.5));
      res.storyboard = { beats: sb.beats.length, beats_missing_duration: sb.beats.filter((b) => b.duration == null).length,
        beats_missing_intent: sb.beats.filter((b) => !b.intent).length, text_too_short: tooShort.length,
        text_too_short_at: tooShort.slice(0, 6).map((b) => `beat ${b.id}: ${b.duration}s for "${b.text.slice(0, 40)}"`),
        total_s: Math.round(sb.beats.reduce((s, b) => s + (b.duration || 0), 0) * 10) / 10, stills_validated: sb.validated };
    }
  } else res.storyboard = null;
  const stillsDir = join(root, ".motion", "stills");
  const stillCount = existsSync(stillsDir) ? readdirSync(stillsDir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).length : 0;
  const needed = Math.min(8, res.storyboard?.beats || 1);
  res.stills = { count: stillCount, needed, ok: stillCount >= needed && !!res.storyboard?.stills_validated };
  return res;
}
