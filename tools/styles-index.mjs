#!/usr/bin/env node
// Build plugins/umd/references/styles/index.json from local clones of the style and prompt libraries.
// Maintainer tool, run when the libraries change:
//
//   git clone --depth 1 https://github.com/lemomo-ai/lemo-opuscar
//   git clone --depth 1 --filter=blob:limit=2m https://github.com/Vincentwei1021/mg-styles-15
//   git clone --depth 1 https://github.com/yihui-dev/awesome-opus5-5-videos
//   git clone --depth 1 --filter=blob:none --sparse https://github.com/heygen-com/hyperframes && git -C hyperframes sparse-checkout set registry
//   node tools/styles-index.mjs <folder containing the four clones> [--media]
//
// Sources: lemo-opuscar (66 styles + the 98 OPUSCAR film styles, prompts MIT, stills CC BY 4.0), mg-styles-15 (MIT),
// awesome-opus5-5-videos (MIT index; prompts belong to their authors), HyperFrames registry (Apache-2.0 blocks and
// components; items ported from transitions.dev are left out: that collection may not be repackaged).
// Every entry is tagged with the shared facets (lib/facets.mjs) and a quality tier (3 reference, 2 pro, 1 inspiration).
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
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { tagText, projectTypes } = await import(pathToFileURL(join(ROOT, "plugins", "umd", "scripts", "lib", "facets.mjs")).href);
// Each prompt is pinned to the commit that was reviewed, with the sha256 of its exact bytes (read from git, not
// from the working tree, so line-ending conversion cannot change it). `umd styles get` refuses a file that differs.
const git = (repo, ...a) => execFileSync("git", ["-C", repo, ...a], { maxBuffer: 64 * 1024 * 1024 });
const pin = (repo) => (existsSync(join(repo, ".git")) ? git(repo, "rev-parse", "HEAD").toString().trim() : "main");
const blobHash = (repo, path) => { try { return createHash("sha256").update(git(repo, "show", `HEAD:${path}`)).digest("hex"); } catch { return null; } };
const args = process.argv.slice(2);
const LIBS = resolve(args.find((a) => !a.startsWith("--")) || ".");
const MEDIA = args.includes("--media");
const LEMO_REPO = join(LIBS, "lemo-opuscar"), MG_REPO = join(LIBS, "mg-styles-15"), OPUS_REPO = join(LIBS, "awesome-opus5-5-videos"), HF_REPO = join(LIBS, "hyperframes");
const [LEMO_SHA, MG_SHA, OPUS_SHA, HF_SHA] = [LEMO_REPO, MG_REPO, OPUS_REPO, HF_REPO].map((r) => (existsSync(r) ? pin(r) : "main"));
const extra = new Map(); // id → text used for tagging only (prompt bodies, descriptions), not stored
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

// 1b. OPUSCAR 98: one style per Best Picture winner, its prompt embedded (MIT), a still from the film (CC BY 4.0)
const oscarFile = join(LEMO_REPO, "styleboard", "opuscar98_styles.json");
if (existsSync(oscarFile)) {
  const o = JSON.parse(readFileSync(oscarFile, "utf8"));
  const slugify = (x) => x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  for (const m of o.films) {
    const nn = String(m.no).padStart(2, "0");
    const still = join(LEMO_REPO, "styleboard", "img", "opuscar98", `${nn}.jpg`);
    if (MEDIA && existsSync(still)) {
      mkdirSync(join(LIB_OUT, "oscar"), { recursive: true });
      ff("-i", still, "-vf", "scale=480:-2", "-q:v", "5", join(LIB_OUT, "oscar", `${nn}.jpg`));
    }
    const id = `oscar:${nn}-${slugify(m.style_en)}`;
    extra.set(id, `${m.desc_en} ${m.prompt_en} ${(m.blend_en || []).join(" ")}`);
    entries.push({
      id, source: "lemo-opuscar", collection: "OPUSCAR 98", kind: "style", name: m.style_en, category: `Film styles · ${m.render}`,
      line: clip(m.desc_en, 220), film: `${m.year} · ${m.title}`, uses: (m.blend_en || []).slice(0, 3), duration_s: m.dur || null, render: m.render,
      prompt: m.prompt_en,
      preview_url: "https://lemomo-ai.github.io/lemo-opuscar/opuscar98/#styles",
      poster_url: `${SITE}/assets/library/oscar/${nn}.jpg`,
      film_url: `https://github.com/lemomo-ai/lemo-opuscar/releases/download/films/opuscar98.mp4#t=${m.t0}`,
      licence: "style prompt MIT; stills and film CC BY 4.0 (credit LemoLab); your films are yours",
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
      line: clip(seed.replace(/「/g, "").replace(/」\s*/g, ": ").replace(/^[　-鿿\s:]+/, "") || sig, 220), jury_score: score ? Number(score) : null, uses: [],
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
    extra.set(`opus:${v.slug}`, v.prompt);
    entries.push({ added: v.added || null, remake: !!v.has_remake, prompt_chars: (v.prompt || "").length,
      id: `opus:${v.slug}`, source: "awesome-opus5-5-videos", kind: "prompt", name: `${v.category} by ${v.author}`, category: v.category,
      line: clip(v.prompt, 220), tags: v.tech_tags || [], partial: !!v.prompt_partial,
      prompt_url: `https://raw.githubusercontent.com/yihui-dev/awesome-opus5-5-videos/${OPUS_SHA}/prompts/${v.slug}.md`, sha256: blobHash(OPUS_REPO, `prompts/${v.slug}.md`),
      preview_url: v.skillry_url || v.post_url, post_url: v.post_url, author: v.author,
      poster_url: v.poster_url || null, film_url: v.skillry_url || v.post_url,
      licence: "index MIT; the prompt belongs to its author: credit the post when you reuse it",
    });
  }
}

// 4. HyperFrames registry: ready-made blocks and components, installable with one command
const hfDir = join(HF_REPO, "registry");
if (existsSync(hfDir)) {
  for (const type of ["examples", "blocks", "components"]) {
    const d = join(hfDir, type);
    if (!existsSync(d)) continue;
    for (const n of readdirSync(d).sort()) {
      const f = join(d, n, "registry-item.json");
      if (!existsSync(f)) continue;
      const it = JSON.parse(readFileSync(f, "utf8"));
      const tags = it.tags || [];
      if (tags.includes("transitions-dev-port")) continue; // transitions.dev terms: no repackaging
      const lic = it.license || "Apache-2.0";
      if (!/^(Apache-2\.0|MIT|OFL-1\.1)( AND (Apache-2\.0|MIT|OFL-1\.1))*$/.test(lic)) continue;
      const w = it.dimensions?.width, h = it.dimensions?.height;
      entries.push({
        id: `hf:${n}`, source: "hyperframes", kind: type === "components" ? "component" : type === "examples" ? "style" : "block",
        name: it.title || n, category: `HyperFrames ${type.replace(/s$/, "")}`, line: clip(it.description, 220), tags,
        duration_s: it.duration || null, size: w && h ? `${w}x${h}` : null,
        install: `npx hyperframes add ${n}`,
        prompt_url: `https://raw.githubusercontent.com/heygen-com/hyperframes/${HF_SHA}/registry/${type}/${n}/registry-item.json`,
        preview_url: `https://github.com/heygen-com/hyperframes/tree/${HF_SHA}/registry/${type}/${n}`,
        poster_url: it.preview?.poster || null, clip_url: it.preview?.video || null, film_url: it.preview?.video || null,
        licence: `${lic} (HyperFrames registry, HeyGen)`,
      });
    }
  }
}

// 5. facets and quality tier for every entry
const ASPECT = (sz) => { if (!sz) return null; const [w, h] = sz.split("x").map(Number); const r = w / h; return r > 1.4 ? "16:9" : r < 0.75 ? "9:16" : "1:1"; };
for (const e of entries) {
  // the card's own words count once; a long prompt body only where it insists (two keywords for one value)
  const core = tagText([e.name, e.category, e.line, e.film, ...(e.uses || []), ...(e.tags || [])].join(" "));
  const deep = tagText(extra.get(e.id) || "", { min: 2 });
  const t = Object.fromEntries(Object.keys(core).map((k) => [k, [...new Set([...core[k], ...deep[k]])].slice(0, 4)]));
  if (e.kind === "style" && !t.use.length) t.use.push("story");
  const fmt = ASPECT(e.size) || (e.id === "mg:18-hanazi" ? "9:16" : null) || (e.source === "awesome-opus5-5-videos" ? t.format[0] : null) || (e.source === "hyperframes" ? null : "16:9"); // curated films are 16:9
  t.format = fmt ? [fmt] : [];
  if (e.source === "hyperframes") t.tech = [...new Set(["hyperframes", ...t.tech])];
  if (e.render === "3D" && !t.medium.includes("3d")) t.medium.unshift("3d");
  e.facets = { project: projectTypes(t, e), ...t };
  e.tier = e.source === "lemo-opuscar" || (e.source === "mg-styles-15" && (e.jury_score || 0) >= 7.6) || (e.source === "hyperframes" && e.kind === "style") ? 3
    : e.source === "mg-styles-15" || (e.source === "hyperframes" && e.clip_url) || (e.source === "awesome-opus5-5-videos" && e.remake && !e.partial && e.prompt_chars >= 600) ? 2 : 1;
}

const out = join(ROOT, "plugins", "umd", "references", "styles", "index.json");
mkdirSync(dirname(out), { recursive: true });
const counts = entries.reduce((c, e) => ((c[e.source] = (c[e.source] || 0) + 1), c), {});
writeFileSync(out, JSON.stringify({ generated: new Date().toISOString().slice(0, 10), counts, entries }, null, 0) + "\n");
console.log(`styles index: ${entries.length} entries ${JSON.stringify(counts)} → ${out}`);
