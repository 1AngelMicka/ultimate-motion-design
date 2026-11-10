#!/usr/bin/env node
// Build plugins/umd/references/styles/index.json from local clones of the style and prompt libraries.
// Maintainer tool, run when the libraries change:
//
//   git clone --depth 1 https://github.com/lemomo-ai/lemo-opuscar
//   git clone --depth 1 --filter=blob:limit=2m https://github.com/Vincentwei1021/mg-styles-15
//   git clone --depth 1 https://github.com/yihui-dev/awesome-opus5-5-videos
//   node tools/styles-index.mjs <folder containing the three clones> [--media]
//
// The index stores names, short descriptions and links only (no prompt bodies): `umd styles get` downloads
// a prompt when a project needs it, so the plugin stays small and every prompt is read from its source.
// --media also writes the gallery previews of the docs site (needs ffmpeg) into site/assets/library/:
// LemoLab stills resized (CC BY 4.0, credit kept on the page), mg-styles-15 posters and muted 480 px loops (MIT).
// Community prompts keep their poster on skillry.dev, linked, not copied.
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// Each prompt is pinned to the commit that was reviewed, with the sha256 of its exact bytes (read from git, not
// from the working tree, so line-ending conversion cannot change it). `umd styles get` refuses a file that differs.
const git = (repo, ...a) => execFileSync("git", ["-C", repo, ...a], { maxBuffer: 64 * 1024 * 1024 });
const pin = (repo) => (existsSync(join(repo, ".git")) ? git(repo, "rev-parse", "HEAD").toString().trim() : "main");
const blobHash = (repo, path) => { try { return createHash("sha256").update(git(repo, "show", `HEAD:${path}`)).digest("hex"); } catch { return null; } };
const args = process.argv.slice(2);
const LIBS = resolve(args.find((a) => !a.startsWith("--")) || ".");
const MEDIA = args.includes("--media");
const LEMO_REPO = join(LIBS, "lemo-opuscar"), MG_REPO = join(LIBS, "mg-styles-15"), OPUS_REPO = join(LIBS, "awesome-opus5-5-videos");
const [LEMO_SHA, MG_SHA, OPUS_SHA] = [LEMO_REPO, MG_REPO, OPUS_REPO].map((r) => (existsSync(r) ? pin(r) : "main"));
const SITE = "https://1angelmicka.github.io/ultimate-motion-design";
const LIB_OUT = join(ROOT, "site", "assets", "library");
const ff = (...a) => execFileSync("ffmpeg", ["-v", "error", "-y", ...a], { stdio: "inherit" });
const clip = (s, n = 200) => { const t = String(s || "").replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n - 1).replace(/\s\S*$/, "") + "…" : t; };
const entries = [];

// 1. lemo-opuscar: one STYLE.md (style prompt) + style.json per style
const lemo = join(LIBS, "lemo-opuscar", "styles");
if (existsSync(lemo)) {
  for (const slug of readdirSync(lemo).sort()) {
    if (slug.startsWith("_")) continue;
    const sj = join(lemo, slug, "style.json");
    if (!existsSync(sj)) continue;
    const s = JSON.parse(readFileSync(sj, "utf8"));
    const md = existsSync(join(lemo, slug, "STYLE.md")) ? readFileSync(join(lemo, slug, "STYLE.md"), "utf8") : "";
    const essence = (md.match(/^>\s*(.+)$/m) || [])[1] || "";
    const still = join(LIBS, "lemo-opuscar", "docs", "frames", `${slug}.jpg`);
    if (MEDIA && existsSync(still)) {
      mkdirSync(join(LIB_OUT, "lemo"), { recursive: true });
      ff("-i", still, "-vf", "scale=480:-2", "-q:v", "5", join(LIB_OUT, "lemo", `${slug}.jpg`));
    }
    entries.push({
      id: `lemo:${slug}`, source: "lemo-opuscar", kind: "style", name: s.en, category: s.category_en || null,
      line: clip(essence || s.line, 220), film: s.film ? `${s.film}: ${clip(s.line, 140)}` : null, uses: s.uses || [],
      duration_s: s.dur || null,
      prompt_url: `https://raw.githubusercontent.com/lemomo-ai/lemo-opuscar/${LEMO_SHA}/styles/${slug}/STYLE.md`, sha256: blobHash(LEMO_REPO, `styles/${slug}/STYLE.md`),
      preview_url: "https://lemomo-ai.github.io/lemo-opuscar/",
      poster_url: `${SITE}/assets/library/lemo/${slug}.jpg`,
      film_url: `https://github.com/lemomo-ai/lemo-opuscar/releases/download/films/${slug}.mp4`,
      licence: "style prompt MIT; demo films CC BY 4.0 (credit LemoLab); your films are yours",
    });
  }
}

// 2. mg-styles-15: one prompt per style + a 10 s reference film with sound
const mg = join(LIBS, "mg-styles-15", "prompts");
if (existsSync(mg)) {
  for (const f of readdirSync(mg).filter((x) => x.endsWith(".md")).sort()) {
    const n = f.replace(/\.md$/, "");
    const md = readFileSync(join(mg, f), "utf8");
    const title = (md.match(/^#\s+(.+)$/m) || [])[1] || n;
    const en = title.split(/[　-鿿＀-￯]+/).pop().trim() || title;
    const score = (md.match(/终评\s*([\d.]+)\s*\/\s*10/) || [])[1];
    const seed = (md.match(/# Creative seed\s*\n([^\n]+)/) || [])[1] || "";
    const sig = (md.match(/# Signature features[^\n]*\n([^\n]+)/) || [])[1] || "";
    const film = join(LIBS, "mg-styles-15", "videos", `${n}.mp4`);
    if (MEDIA && existsSync(film)) {
      mkdirSync(join(LIB_OUT, "mg"), { recursive: true });
      const fit = "scale='if(gt(iw,ih),480,-2)':'if(gt(iw,ih),-2,480)'";
      ff("-ss", "4", "-i", film, "-frames:v", "1", "-vf", fit, "-q:v", "5", join(LIB_OUT, "mg", `${n}.jpg`));
      ff("-i", film, "-an", "-vf", `${fit},fps=30`, "-c:v", "libx264", "-preset", "slow", "-crf", "30", "-pix_fmt", "yuv420p", "-movflags", "+faststart", join(LIB_OUT, "mg", `${n}.mp4`));
    }
    entries.push({
      id: `mg:${n}`, source: "mg-styles-15", kind: "style", name: en, category: "Motion graphics",
      line: clip(seed.replace(/[「」]/g, "").replace(/^[　-鿿\s]+/, "") || sig, 220), jury_score: score ? Number(score) : null, uses: [],
      duration_s: 10,
      prompt_url: `https://raw.githubusercontent.com/Vincentwei1021/mg-styles-15/${MG_SHA}/prompts/${f}`, sha256: blobHash(MG_REPO, `prompts/${f}`),
      preview_url: `https://vincentwei1021.github.io/mg-styles-15/#${n}`,
      poster_url: `${SITE}/assets/library/mg/${n}.jpg`,
      clip_url: `${SITE}/assets/library/mg/${n}.mp4`,
      film_url: `https://github.com/Vincentwei1021/mg-styles-15/raw/main/videos/${n}.mp4`,
      licence: "MIT",
    });
  }
}

// 3. awesome-opus5-5-videos: prompts creators shared with their films
const op = join(LIBS, "awesome-opus5-5-videos", "data", "videos.json");
if (existsSync(op)) {
  for (const v of JSON.parse(readFileSync(op, "utf8"))) {
    entries.push({
      id: `opus:${v.slug}`, source: "awesome-opus5-5-videos", kind: "prompt", name: `${v.category} by ${v.author}`, category: v.category,
      line: clip(v.prompt, 220), tags: v.tech_tags || [], partial: !!v.prompt_partial,
      prompt_url: `https://raw.githubusercontent.com/yihui-dev/awesome-opus5-5-videos/${OPUS_SHA}/prompts/${v.slug}.md`, sha256: blobHash(OPUS_REPO, `prompts/${v.slug}.md`),
      preview_url: v.skillry_url || v.post_url, post_url: v.post_url, author: v.author,
      poster_url: v.poster_url || null, film_url: v.skillry_url || v.post_url,
      licence: "index MIT; the prompt belongs to its author: credit the post when you reuse it",
    });
  }
}

const out = join(ROOT, "plugins", "umd", "references", "styles", "index.json");
mkdirSync(dirname(out), { recursive: true });
const counts = entries.reduce((c, e) => ((c[e.source] = (c[e.source] || 0) + 1), c), {});
writeFileSync(out, JSON.stringify({ generated: new Date().toISOString().slice(0, 10), counts, entries }, null, 0) + "\n");
console.log(`styles index: ${entries.length} entries ${JSON.stringify(counts)} → ${out}`);
