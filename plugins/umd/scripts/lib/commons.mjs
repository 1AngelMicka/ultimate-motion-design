// Wikimedia Commons: search media under licences safe for commercial work, download one and record it in
// .motion/assets.lock.json with its author, licence and page. Idea from Moh4696/cinematic-skill (MIT).
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { join, relative, extname } from "node:path";

const API = "https://commons.wikimedia.org/w/api.php";
// Wikimedia asks automated clients for a descriptive User-Agent; this names the tool, not the user.
const UA = "umd-commons/1.0 (https://github.com/1AngelMicka/ultimate-motion-design)";

const strip = (html) => String(html || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/\s+/g, " ").trim();

// ok: no obligation beyond credit; sa: share-alike (adaptations under the same licence: ask before client work)
export function licenceClass(short) {
  const s = String(short || "").toLowerCase();
  if (/^(public domain|pd\b|pd-|cc0|cc-zero)/.test(s) || s.includes("public domain")) return "ok";
  if (/^cc[ -]by[ -]sa/.test(s)) return "sa";
  if (/^cc[ -]by(?![ -](nc|nd))/.test(s)) return "ok";
  return "refused";
}

async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: "json", formatversion: "2", ...params })}`;
  const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`Commons API ${r.status}`);
  return r.json();
}

function toItem(p) {
  const ii = p.imageinfo?.[0] || {};
  const m = ii.extmetadata || {};
  const licence = strip(m.LicenseShortName?.value);
  return {
    title: p.title, licence, class: licenceClass(licence), author: strip(m.Artist?.value) || "unknown",
    credit: strip(m.Credit?.value).slice(0, 160), mime: ii.mime, width: ii.width, height: ii.height,
    page: ii.descriptionurl, file_url: ii.url, thumb_url: ii.thumburl || null,
  };
}

export async function searchCommons(query, { limit = 12, allowSa = false, minWidth = 1280 } = {}) {
  const j = await api({ action: "query", generator: "search", gsrnamespace: "6", gsrsearch: `${query} filetype:bitmap|drawing`, gsrlimit: String(Math.min(50, limit * 3)),
    prop: "imageinfo", iiprop: "url|size|mime|extmetadata", iiurlwidth: "1920" });
  const all = (j.query?.pages || []).map(toItem);
  const keep = all.filter((x) => (x.class === "ok" || (allowSa && x.class === "sa")) && (x.width || 0) >= minWidth);
  return { query, found: all.length, kept: keep.length, refused: all.filter((x) => x.class === "refused").length, share_alike_hidden: allowSa ? 0 : all.filter((x) => x.class === "sa").length,
    results: keep.slice(0, limit).map(({ title, licence, author, width, height, page }) => ({ title, licence, author, size: `${width}x${height}`, page })) };
}

export async function getCommons(title, { cwd = process.cwd(), dir = "assets/commons", width = 1920, allowSa = false } = {}) {
  const t = title.startsWith("File:") ? title : `File:${title}`;
  const j = await api({ action: "query", titles: t, prop: "imageinfo", iiprop: "url|size|mime|extmetadata", iiurlwidth: String(width) });
  const p = j.query?.pages?.[0];
  if (!p || p.missing) throw new Error(`Not found on Commons: ${t}`);
  const it = toItem(p);
  if (it.class === "refused" || (it.class === "sa" && !allowSa))
    throw new Error(`${t} is under "${it.licence}": refused${it.class === "sa" ? " (share-alike: pass --allow-sa only if the user accepts it)" : " (only public domain, CC0, CC BY and, on request, CC BY-SA)"}`);
  const src = (it.width || 0) > width && it.thumb_url ? it.thumb_url : it.file_url;
  const r = await fetch(src, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(120000) });
  if (!r.ok) throw new Error(`Download failed: ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  const name = t.slice(5).replace(/[^\w.-]+/g, "_").replace(/_+/g, "_");
  const ext = extname(new URL(src).pathname) || extname(name) || ".jpg";
  const absDir = join(cwd, dir);
  mkdirSync(absDir, { recursive: true });
  const file = join(absDir, name.replace(/\.\w+$/, "") + ext);
  writeFileSync(file, buf);
  const rel = relative(cwd, file).replace(/\\/g, "/");
  const lockFile = join(cwd, ".motion", "assets.lock.json");
  let lock = { assets: [] };
  if (existsSync(lockFile)) {
    try { lock = JSON.parse(readFileSync(lockFile, "utf8")); }
    catch (e) { throw new Error(`${relative(cwd, lockFile)} is not valid JSON (${e.message}): fix it first, nothing was changed. The file was downloaded to ${rel}.`); }
  }
  const list = Array.isArray(lock) ? lock : (lock.assets ||= []);
  const entry = { path: rel, source: "Wikimedia Commons", url: it.page, license: it.licence, author: it.author, credit_line: `${t.slice(5)} by ${it.author}, ${it.licence}, via Wikimedia Commons`, ...(it.class === "sa" ? { note: "share-alike: adaptations must use the same licence" } : {}) };
  const i = list.findIndex((a) => a.path === rel);
  if (i >= 0) list[i] = entry; else list.push(entry);
  mkdirSync(join(cwd, ".motion"), { recursive: true });
  writeFileSync(lockFile, JSON.stringify(Array.isArray(lock) ? list : lock, null, 2) + "\n");
  return { file: rel, bytes: buf.length, ...entry, lock: relative(cwd, lockFile) };
}
