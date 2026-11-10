// Licence check of dependencies, declared models and assets against the registry and the project policy.
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";

const MEDIA = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".svg", ".mp4", ".webm", ".mov", ".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac", ".woff", ".woff2", ".ttf", ".otf", ".lottie", ".riv", ".glb", ".gltf", ".hdr", ".exr", ".blend"]);
const ASSET_DIRS = ["public", "assets", "static", "src/assets", "media/assets", "audio", "fonts", ".motion/assets"];

function deps(root) {
  const out = [];
  const visit = (dir, depth) => {
    if (depth < 0) return;
    let entries = [];
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) visit(p, depth - 1);
      else if (e.name === "package.json") {
        try {
          const j = JSON.parse(readFileSync(p, "utf8"));
          for (const k of ["dependencies", "devDependencies", "optionalDependencies"]) for (const n of Object.keys(j[k] || {})) out.push({ name: n, from: relative(root, p), dev: k === "devDependencies" });
        } catch { /* ignore */ }
      } else if (/^requirements.*\.txt$/.test(e.name)) {
        for (const l of readFileSync(p, "utf8").split(/\r?\n/)) { const m = l.trim().match(/^([A-Za-z0-9_.\-]+)/); if (m && !l.trim().startsWith("#")) out.push({ name: m[1], from: relative(root, p) }); }
      } else if (e.name === "pyproject.toml") {
        const txt = readFileSync(p, "utf8");
        const block = txt.match(/dependencies\s*=\s*\[([\s\S]*?)\]/);
        if (block) for (const m of block[1].matchAll(/["']([A-Za-z0-9_.\-]+)/g)) out.push({ name: m[1], from: relative(root, p) });
      }
    }
  };
  visit(root, 3);
  return out;
}

const norm = (s) => String(s || "").toLowerCase().trim();
function matches(pattern, name) {
  const p = norm(pattern), n = norm(name);
  if (p.endsWith("/*")) return n.startsWith(p.slice(0, -1));
  return p === n || n.endsWith(`/${p}`);
}

export function classify(name, registry) {
  for (const e of registry.entries) if (e.match.some((m) => matches(m, name))) return e;
  return null;
}

function listMedia(root) {
  const files = [];
  for (const d of ASSET_DIRS) {
    const base = join(root, d);
    if (!existsSync(base)) continue;
    const rec = (dir) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, e.name);
        if (e.isDirectory()) rec(p);
        else if (MEDIA.has(extname(e.name).toLowerCase()) && statSync(p).size > 0) files.push(relative(root, p).replace(/\\/g, "/"));
      }
    };
    rec(base);
  }
  return files;
}

export function checkLicenses(root, { ref, project, flags = new Set() } = {}) {
  const reg = ref.licenses;
  const pol = { commercial: flags.has("commercial"), region: "EU", allow: [], redistribute: flags.has("is_web"), service: false, resale: false, remotion: "unknown", ...(project?.license_policy || {}) };
  const allow = new Set((pol.allow || []).map(norm));
  const blocked = (cls) => {
    const b = reg.classes[cls]?.blocks || [];
    return b.some((x) => (x === "commercial" && pol.commercial) || (x === "redistribute" && pol.redistribute) || (x === "service" && pol.service)
      || (x === "resale" && pol.resale) || (x.startsWith("region:") && norm(pol.region) === norm(x.slice(7))));
  };
  const violations = [];
  const warnings = [];
  const seen = new Set();
  const consider = (name, kind, from) => {
    const key = `${kind}:${norm(name)}`;
    if (seen.has(key)) return;
    seen.add(key);
    const e = classify(name, reg);
    if (!e || e.class === "ok" || e.class === "remotion") return;
    const item = { name, kind, class: e.class, note: e.note, from };
    if (allow.has(norm(name)) || allow.has(e.class)) return;
    if (blocked(e.class)) violations.push(item); else warnings.push(item);
  };
  const ds = deps(root);
  for (const d of ds) consider(d.name, "dependency", d.from);
  for (const m of project?.models || []) consider(typeof m === "string" ? m : m.name, "model", ".motion/project.json");
  for (const t of project?.tools || []) consider(typeof t === "string" ? t : t.name, "tool", ".motion/project.json");

  // Remotion
  const usesRemotion = ds.some((d) => matches("remotion", d.name) || matches("@remotion/*", d.name)) || /remotion/i.test(project?.engine || "");
  const remotion = { used: usesRemotion, declared: pol.remotion, ok: !usesRemotion || ["individual", "small-company", "non-profit", "company-license", "evaluation"].includes(pol.remotion) };

  // Assets
  const lockFile = join(root, ".motion", "assets.lock.json");
  let lock = [];
  try { if (existsSync(lockFile)) { const j = JSON.parse(readFileSync(lockFile, "utf8")); lock = Array.isArray(j) ? j : j.assets || []; } } catch (e) { warnings.push({ name: "assets.lock.json", kind: "file", class: "invalid", note: e.message }); }
  const al = reg.asset_licenses;
  const incomplete = [];
  const attribution = [];
  for (const a of lock) {
    const lic = norm(a.license);
    if (!a.source || !a.license) incomplete.push(a.path || "(no path)");
    if (a.commercial_ok === false && pol.commercial) violations.push({ name: a.path, kind: "asset", class: "nc", note: `declared commercial_ok: false (${a.license || "?"})` });
    else if (al.nc.includes(lic) && pol.commercial && !allow.has(norm(a.path))) violations.push({ name: a.path, kind: "asset", class: "nc", note: a.license });
    else if (al["no-license"].includes(lic) && !allow.has(norm(a.path))) violations.push({ name: a.path, kind: "asset", class: "no-license", note: a.source || "" });
    if (a.attribution_required || al.attribution.includes(lic)) attribution.push({ path: a.path, author: a.author || null, license: a.license });
    if (a.model) consider(a.model, "model", `assets.lock.json (${a.path})`);
  }
  const listed = new Set(lock.map((a) => String(a.path || "").replace(/\\/g, "/")));
  const unlisted = listMedia(root).filter((f) => !listed.has(f));
  return { policy: pol, dependencies_checked: ds.length, assets_listed: lock.length, violations, warnings, remotion,
    unlisted_assets: unlisted.length, unlisted_sample: unlisted.slice(0, 10), incomplete_assets: incomplete.slice(0, 10), incomplete_count: incomplete.length,
    attribution_required: attribution };
}

// Package names from an install command line (npm/pnpm/yarn/bun add|install|i, pip/uv/pipx install|add).
export function installTargets(cmd) {
  const out = [];
  const TOOL = /^(npm|pnpm|yarn|bun|npx|bunx|pip(?:\d+(?:\.\d+)?)?|uv|uvx|pipx|poetry)$/;
  const push = (raw) => {
    const a = raw.replace(/^(['"])|(['"])$/g, "");
    if (!a || a.startsWith("-") || /^[A-Za-z_][A-Za-z0-9_]*=(?!=)/.test(a)) return; // flags, env assignments
    const gh = a.match(/github\.com[/:]([^/\s]+\/[^/\s#@?]+?)(?:\.git)?(?:[#@?/].*)?$/) || a.match(/^github:([^/\s]+\/[^/\s#@]+)/);
    if (gh) { out.push(gh[1]); return; }
    if (/^(git\+|https?:|file:|\.|\/|~)/.test(a)) return; // other URLs and local paths
    const name = a.replace(/(?<=.)@[^/]*$/, "").replace(/\[.*?\]/, "").replace(/\s*[=<>~!;].*$/, "");
    if (name && !name.includes(":")) out.push(name);
  };
  for (const seg of String(cmd).split(/&&|\|\||;|\|/)) {
    const t = seg.trim().split(/\s+/);
    // python -m pip install … behaves like pip install …
    const m = t.findIndex((x, k) => x === "-m" && /^pip/.test(t[k + 1] || ""));
    if (m !== -1) t.splice(m - 1, 2);
    const i = t.findIndex((x) => TOOL.test(x));
    if (i === -1) continue;
    const tool = t[i], verb = t[i + 1];
    let args = [];
    if (/^(npm|pnpm|bun)$/.test(tool) && /^(i|install|add)$/.test(verb)) args = t.slice(i + 2);
    else if (tool === "yarn" && verb === "add") args = t.slice(i + 2);
    else if (/^(npx|bunx|uvx)$/.test(tool)) { const first = t.slice(i + 1).find((x) => !x.startsWith("-")); args = first ? [first] : []; }
    else if (/^(pip|pipx)/.test(tool) && verb === "install") args = t.slice(i + 2);
    else if (tool === "uv" && (verb === "add" || (verb === "pip" && t[i + 2] === "install") || (verb === "tool" && t[i + 2] === "install"))) args = t.slice(i + (verb === "add" ? 2 : 3));
    else if (tool === "poetry" && verb === "add") args = t.slice(i + 2);
    for (const a of args) push(a);
  }
  return out;
}
