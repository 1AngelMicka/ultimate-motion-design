// Characters: a catalogue of free sources usable in commercial work (references/characters/catalog.json) plus
// three live lists read at search time (Mesh2Motion rigs and clips, KayKit packs, Open Source Avatars). Search
// costs no tokens; `get` downloads into assets/characters/ and records licence, author and credit in
// .motion/assets.lock.json; `add` records a file the user downloaded by hand from a source that has no direct link.
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, rmSync, readdirSync } from "node:fs";
import { join, relative, basename, extname, resolve } from "node:path";
import { homedir } from "node:os";
import { spawnSync } from "node:child_process";
import { PLUGIN_ROOT, today } from "./ref.mjs";
import { recordAsset } from "./commons.mjs";
import { fold } from "./facets.mjs";

const UA = "umd-characters/1.0 (https://github.com/1AngelMicka/ultimate-motion-design)";
const CACHE = join(homedir(), ".umd", "cache", "characters");
const WEEK = 7 * 24 * 3600 * 1000;
const M2M = "https://raw.githubusercontent.com/Mesh2Motion/mesh2motion-app/main/static/assets/";
const OSA = "https://raw.githubusercontent.com/ToxSam/open-source-avatars/main/data/";
const SAFE_LICENCES = /^(cc0|cc-by(-[34]\.0)?)$/i;

// French and loose words to the catalogue's vocabulary
const SYN = {
  realiste: "realistic", realisme: "realistic", photoreal: "realistic", film: "film", pixar: "film", cinema: "film", dessin: "hand-drawn", dessine: "hand-drawn",
  manga: "anime", anime: "anime", kawaii: "chibi", mignon: "chibi", cute: "chibi", lowpoly: "low-poly", "low": "low-poly", poly: "low-poly", cube: "blocky", lego: "blocky",
  plat: "flat", vectoriel: "flat", vector: "flat", "2d": "2d", "3d": "3d", pixel: "pixel", retro: "pixel", animal: "creature", animaux: "creature", creature: "creature",
  monstre: "creature", monster: "creature", dragon: "creature", robot: "robot", fantasy: "fantasy", fantastique: "fantasy", chevalier: "fantasy", mascotte: "cartoon", mascot: "cartoon",
  bebe: "baby", baby: "baby", enfant: "child", enfants: "child", kid: "child", kids: "child", ado: "teen", adolescent: "teen", teen: "teen", adulte: "adult", adult: "adult",
  vieux: "senior", senior: "senior", personne: "adult", famille: "family", family: "family", parle: "visemes", parler: "visemes", dialogue: "visemes", talk: "visemes",
  lipsync: "visemes", bouche: "visemes", visage: "face", face: "face", marche: "walk", courir: "run", danse: "dance", foule: "crowd", crowd: "crowd", avatar: "avatar",
  mouvement: "motion", mocap: "motion", anim: "motion", personnage: "", personnages: "", character: "", characters: "",
};
const STOP = new Set("un une des les le la pour avec dans sur qui que est pas plus the and for with from that this".split(" "));
// each word keeps itself and its synonym: "dragon" finds the dragon rig and the creature entries
const words = (q) => fold(q).split(/[^a-z0-9-]+/).filter((w) => w && !STOP.has(w) && SYN[w] !== "").map((w) => [...new Set([w, SYN[w]].filter(Boolean))]);
const has = (t, g) => g.some((w) => t.includes(w));

export function loadCatalog() {
  return JSON.parse(readFileSync(join(PLUGIN_ROOT, "references", "characters", "catalog.json"), "utf8"));
}

async function getJson(url) {
  const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(60000) });
  if (!r.ok) throw new Error(`${r.status} for ${url}`);
  return r.json();
}
// a week of cache: the live lists change rarely and search must stay fast
async function cached(name, fn) {
  const f = join(CACHE, `${name}.json`);
  if (existsSync(f) && Date.now() - statSync(f).mtimeMs < WEEK) { try { return JSON.parse(readFileSync(f, "utf8")); } catch { /* refetch */ } }
  const v = await fn();
  mkdirSync(CACHE, { recursive: true });
  writeFileSync(f, JSON.stringify(v));
  return v;
}

const slug = (s) => fold(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// ---- live lists, each item shaped like a catalogue entry with its own download
async function liveM2M(parent) {
  const m = await cached("mesh2motion", () => getJson(`${M2M}manifest.json`));
  const out = [];
  for (const [rig, r] of Object.entries(m.rigs || {})) {
    out.push({ id: `m2m:${rig}`, name: `Mesh2Motion ${rig} (rigged model)`, kind: "rig", parent: "mesh2motion", dims: "3d", styles: rig === "human" ? ["low-poly", "realistic"] : ["creature", "low-poly"],
      ages: rig === "human" ? ["adult"] : [], face: "none", rigged: true, formats: ["glb"], routes: ["blender", "threejs"], tags: rig,
      animations: `${(r.animations || []).length} clips: umd characters ${rig} clip`, files: [{ url: M2M + r.model.file, name: basename(r.model.file) }], ...licenceOf(parent) });
    for (const a of r.animations || []) {
      out.push({ id: `m2m:${rig}/${slug(a.name)}`, name: `${a.name} (${rig} clip)`, kind: "motion", parent: "mesh2motion-clips", dims: "3d", styles: [], ages: [], face: "none", formats: ["glb"],
        routes: ["blender", "threejs"], tags: `${rig} clip ${(a.tags || []).join(" ")} ${a.loop ? "loop" : ""}`, seconds: a.duration ? Math.round(a.duration * 10) / 10 : undefined,
        files: [{ url: M2M + a.file, name: `${rig}-${basename(a.file)}` }], ...licenceOf(parent), note: (a.tags || []).includes("quaternius") ? "tagged quaternius in the Mesh2Motion manifest" : undefined });
    }
  }
  return out;
}

async function liveKayKit(entry) {
  const tree = await cached(`kaykit-${slug(entry.get.repo)}`, () => getJson(`https://api.github.com/repos/${entry.get.repo}/git/trees/HEAD?recursive=1`));
  return (tree.tree || []).filter((t) => t.path.startsWith(entry.get.dir) && /\.glb$/i.test(t.path)).map((t) => {
    const n = basename(t.path, ".glb");
    return { id: `kaykit:${slug(n)}`, name: `${n.replace(/_/g, " ")} (${entry.name})`, kind: "pack", parent: entry.id, dims: "3d", styles: entry.styles, ages: entry.ages, face: entry.face, rigged: true,
      formats: ["glb"], routes: entry.routes, tags: n, animations: entry.animations, files: [{ url: `https://raw.githubusercontent.com/${entry.get.repo}/HEAD/${t.path}`, name: basename(t.path) }],
      size_mb: t.size ? Math.round(t.size / 1e5) / 10 : undefined, ...licenceOf(entry) };
  });
}

async function liveOSA() {
  const projects = await cached("osa-projects", () => getJson(`${OSA}projects.json`));
  const out = [];
  for (const p of projects) {
    const lic = String(p.license || "").toLowerCase().replace(/\s+/g, "-");
    if (!SAFE_LICENCES.test(lic) || !p.avatar_data_file) continue; // only CC0 and CC BY collections
    let list = [];
    try { const j = await cached(`osa-${p.id}`, () => getJson(`${OSA}${p.avatar_data_file}`)); list = Array.isArray(j) ? j : j.avatars || []; } catch { continue; }
    const by = lic.startsWith("cc-by");
    const original = p.source_type === "original";
    for (const a of list) {
      if (!a.model_file_url || a.is_public === false || a.is_draft) continue;
      const alt = a.metadata?.alternateModels || {};
      out.push({ id: `osa:${slug(p.id)}/${slug(a.name)}${a.metadata?.number ? `-${a.metadata.number}` : ""}`, name: `${a.name} (${p.name})`, kind: "avatars", parent: original ? "100avatars" : "osa-collections",
        dims: "3d", styles: original ? ["low-poly", "cartoon"] : ["anime", "chibi", "cartoon"], ages: [], face: original ? "visemes" : "expressions", rigged: true, formats: ["vrm", ...(alt.fbx ? ["fbx"] : [])],
        routes: ["blender", "threejs"], tags: `${a.description || ""} ${p.name}`.slice(0, 160), preview: a.thumbnail_url,
        files: [{ url: a.model_file_url, name: `${slug(a.name)}.vrm` }], note: alt.fbx ? "the VRM carries the textures; the FBX alternative (--format fbx) does not" : undefined, alt: alt.fbx ? { fbx: alt.fbx, voxel_vrm: alt.voxel_vrm, voxel_fbx: alt.voxel_fbx } : undefined,
        licence: by ? "CC-BY-4.0" : "CC0-1.0", licence_url: "https://github.com/ToxSam/open-source-avatars/blob/main/data/projects.json",
        author: p.creator_id || null, credit: by ? `"${a.name}" from ${p.name} by ${p.creator_id}, CC BY` : null, source: `Open Source Avatars (${p.name})` });
    }
  }
  return out;
}

const SPDX = (l) => (/^cc0/i.test(l) ? "CC0-1.0" : /cc by 4/i.test(l) ? "CC-BY-4.0" : /cc by 3/i.test(l) ? "CC-BY-3.0" : l);
function licenceOf(e) {
  return { licence: SPDX(e.licence), licence_url: e.licence_url, credit: e.credit && !/^(optional|per )/i.test(e.credit) ? e.credit : null, author: e.credit?.replace(/^optional:\s*/i, "") || null, source: e.name };
}

async function liveItems(catalog, which) {
  const byId = Object.fromEntries(catalog.entries.map((e) => [e.id, e]));
  const jobs = [];
  if (which.has("m2m")) jobs.push(liveM2M(byId["mesh2motion"]));
  if (which.has("kaykit")) for (const e of catalog.entries.filter((x) => x.get?.live === "kaykit")) jobs.push(liveKayKit(e));
  if (which.has("osa")) jobs.push(liveOSA());
  const errors = [];
  const lists = await Promise.all(jobs.map((j) => j.catch((e) => { errors.push(e.message); return []; })));
  return { items: lists.flat(), errors };
}

const text = (e) => fold([e.id, e.name, e.kind, e.dims, ...(e.styles || []), ...(e.ages || []), e.face, e.face === "visemes" || e.face === "full" ? "visemes face talk" : "",
  e.skeleton, e.animations, e.use, e.tags, ...(e.routes || []), ...(e.formats || [])].filter(Boolean).join(" "));

const LIVE_HINT = { m2m: "umd characters fox | dragon | horse | human walk | human dance…", kaykit: "umd characters knight | mage | skeleton…", osa: "umd characters avatar <words> (robot, animal, chibi, voxel…)" };
function card(e) {
  const g = e.get || {};
  return { id: e.id, name: e.name, kind: e.kind, dims: e.dims, styles: (e.styles || []).join(", ") || undefined, ages: (e.ages || []).join(", ") || undefined, face: e.face,
    rigged: e.rigged, formats: (e.formats || []).join(", ") || undefined, routes: (e.routes || []).join(", ") || undefined, quality: e.quality, licence: e.licence,
    credit: e.credit || undefined, use: e.use, caution: e.caution || undefined, seconds: e.seconds, preview: e.preview,
    get: e.files || g.zip ? `umd characters get ${e.id}` : g.live ? `live list: ${LIVE_HINT[g.live]}` : g.template ? g.template : g.install || g.how || g.page,
    page: g.page };
}

// filters are exact facet values; words rank by how many of them an entry holds (all words first)
export async function searchCharacters(query = "", { dims = null, style = null, age = null, face = null, kind = null, route = null, limit = 12, live = true } = {}) {
  const cat = loadCatalog();
  const ws = words(query);
  const want = new Set(ws.flat());
  const which = new Set();
  if (live) {
    if (["walk", "run", "dance", "motion", "clip", "idle", "jump", "sit", "creature", "fox", "horse", "dragon", "shark", "spider", "snake", "bird", "kaiju", "human"].some((w) => want.has(w)) || kind === "motion") which.add("m2m");
    if (["fantasy", "chibi", "knight", "mage", "rogue", "barbarian", "skeleton", "kaykit"].some((w) => want.has(w))) which.add("kaykit");
    if (["avatar", "vrm", "crowd", "voxel", "anime", "chibi", "robot", "low-poly", "halloween", "christmas"].some((w) => want.has(w))) which.add("osa");
  }
  const { items, errors } = which.size ? await liveItems(cat, which) : { items: [], errors: [] };
  const all = [...cat.entries, ...items];
  const quality = Object.fromEntries(cat.entries.map((x) => [x.id, x.quality]));
  const ok = (e) => (!dims || e.dims === dims) && (!style || (e.styles || []).includes(style)) && (!age || (e.ages || []).includes(age))
    && (!face || ["none", "painted", "blink", "expressions", "visemes", "full"].indexOf(e.face) >= ["none", "painted", "blink", "expressions", "visemes", "full"].indexOf(face))
    && (!kind || e.kind === kind) && (!route || (e.routes || []).includes(route));
  const scored = all.filter(ok).map((e) => {
    const t = text(e);
    const hit = ws.filter((g) => has(t, g)).length;
    // a word in the name counts more (a "dragon" query wants the dragon first); shorter live names are the plain version ("Walk" before "Pistol Walk")
    const n = fold(e.name);
    const named = ws.filter((g) => has(n, g)).length;
    const q = e.quality ?? quality[e.parent] ?? 2;
    return { e, hit, s: hit * 10 + named * 4 + q + (e.kind === "rig" ? 1 : 0) - (e.parent ? n.length / 100 : 0) };
  }).filter((x) => !ws.length || x.hit > 0).sort((a, b) => (b.hit === ws.length) - (a.hit === ws.length) || b.s - a.s);
  return {
    query, words: ws.length ? ws.map((g) => g.join("|")) : undefined, found: scored.length, live_lists: which.size ? [...which] : undefined, live_errors: errors.length ? errors : undefined,
    results: scored.slice(0, limit).map((x) => card(x.e)),
    next: "umd characters get <id> downloads into assets/characters/ and records the licence; umd characters info <id> shows everything about an entry",
    excluded: !ws.length ? cat.excluded.map((x) => `${x.name}: ${x.why}`) : undefined,
  };
}

async function findItem(id) {
  const cat = loadCatalog();
  const e = cat.entries.find((x) => x.id === id);
  if (e) return e;
  const which = new Set([id.split(":")[0]].filter((x) => ["m2m", "kaykit", "osa"].includes(x)));
  if (!which.size) return null;
  return (await liveItems(cat, which)).items.find((x) => x.id === id) || null;
}

export async function infoCharacter(id) {
  const e = await findItem(id);
  if (!e) throw new Error(`No character entry "${id}": search with umd characters <words>`);
  return e;
}

function extract(zip, dir) {
  // bsdtar (Windows 10+, macOS) reads zip; GNU tar does not, so Linux falls back to unzip
  let r = spawnSync("tar", ["-xf", zip, "-C", dir], { encoding: "utf8" });
  if (r.status !== 0) r = spawnSync("unzip", ["-oq", zip, "-d", dir], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`Could not extract ${zip}: ${(r.stderr || r.error?.message || "").trim()}`);
}

async function download(url, file) {
  const r = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow", signal: AbortSignal.timeout(900000) });
  if (!r.ok) throw new Error(`Download failed: ${r.status} for ${url}`);
  const buf = Buffer.from(await r.arrayBuffer());
  writeFileSync(file, buf);
  return buf.length;
}

function lockEntry(e, path, url, extra = {}) {
  const lic = e.licence || SPDX(e.licence || "");
  const by = /by/i.test(lic) && !/cc0/i.test(lic);
  return { path, kind: "character", source: e.source || e.name, url, page: e.get?.page || e.licence_url, license: lic, license_url: e.licence_url, author: e.author || null,
    credit_line: e.credit || null, ...(by ? { attribution_required: true, note: "CC BY: put the credit line in the end credits or the description" } : {}),
    commercial_ok: true, downloaded: today(), ...extra };
}

// files: one per live item; zip: extracted into its own folder, recorded as one folder entry (path ends with /)
export async function getCharacter(id, { cwd = process.cwd(), dir = "assets/characters", format = null } = {}) {
  const e = await findItem(id);
  if (!e) throw new Error(`No character entry "${id}": search with umd characters <words>`);
  const base = join(cwd, dir, slug(id.replace(/[:/]/g, "-")));
  if (e.files) {
    const files = format && e.alt?.[format] ? [{ url: e.alt[format], name: `${slug(e.name)}.${format.replace(/^voxel_/, "")}` }] : e.files;
    mkdirSync(base, { recursive: true });
    const got = [];
    for (const f of files) {
      const p = join(base, f.name);
      const bytes = await download(f.url, p);
      const path = relative(cwd, p).replace(/\\/g, "/");
      recordAsset(cwd, lockEntry({ ...e, licence: e.licence }, path, f.url));
      got.push({ file: path, bytes });
    }
    return { id, files: got, licence: e.licence, credit: e.credit || undefined, lock: ".motion/assets.lock.json", next: nextFor(e, files.map((x) => x.name)) };
  }
  if (e.get?.zip) {
    mkdirSync(base, { recursive: true });
    const zip = join(base, "download.zip");
    const bytes = await download(e.get.zip, zip);
    extract(zip, base);
    rmSync(zip, { force: true });
    const path = `${relative(cwd, base).replace(/\\/g, "/")}/`;
    recordAsset(cwd, lockEntry({ ...e, ...licenceOf(e) }, path, e.get.zip, { folder: true }));
    const blends = [];
    const walk = (d) => { for (const x of readdirSync(d, { withFileTypes: true })) { const p = join(d, x.name); if (x.isDirectory()) walk(p); else if (/\.(blend|glb|fbx|vrm|bvh)$/i.test(x.name)) blends.push(relative(cwd, p).replace(/\\/g, "/")); } };
    walk(base);
    return { id, folder: path, bytes, main_files: blends.slice(0, 12), licence: e.licence, credit: e.credit || undefined, lock: ".motion/assets.lock.json", next: nextFor(e) };
  }
  const g = e.get || {};
  return { id, download: "manual", how: g.how || g.install || (g.template ? `copy ${g.template}` : null), page: g.page, licence: e.licence,
    then: g.how || g.page ? `umd characters add <file or folder> --id ${id}` : undefined };
}

function nextFor(e, names = []) {
  if (e.kind === "motion") return "Retarget it on your character: templates/blender/character.py (retarget) or play it as is in three.js";
  if (names.length ? names.some((n) => /.vrm$/i.test(n)) : (e.formats || []).includes("vrm")) return "Blender needs the VRM add-on (umd characters info vrm-addon); then templates/blender/character.py loads it and lists the gestures it can do";
  return "templates/blender/character.py loads it, maps its bones and writes the profile of what it can do (look, blink, mouth, gestures)";
}

// a file downloaded by hand: licence from the catalogue entry unless given
export async function addCharacter(file, { cwd = process.cwd(), id = null, licence = null, author = null, url = null, credit = null } = {}) {
  const abs = resolve(cwd, file);
  if (!existsSync(abs)) throw new Error(`No file or folder ${file}`);
  const e = id ? await findItem(id) : null;
  if (id && !e) throw new Error(`No character entry "${id}"`);
  const lic = licence || e?.licence && SPDX(e.licence);
  if (!lic || /per (model|asset|file|collection)/i.test(lic)) throw new Error(`Give the file's own licence: --licence "CC0-1.0" or "CC-BY-4.0" (the entry ${id || ""} has one licence per file)`);
  if (/nc|non.?commercial|nd\b|sa\b|agpl/i.test(lic)) throw new Error(`${lic} is refused for client work (non-commercial, no-derivatives, share-alike or AGPL)`);
  const isDir = statSync(abs).isDirectory();
  const path = relative(cwd, abs).replace(/\\/g, "/") + (isDir ? "/" : "");
  const entry = lockEntry({ ...(e || { name: "manual" }), ...(e ? licenceOf(e) : {}), licence: lic, author: author || (e && licenceOf(e).author), credit: credit || (e && licenceOf(e).credit) }, path, url || e?.get?.page || null, isDir ? { folder: true } : {});
  if (/by/i.test(lic) && !/cc0/i.test(lic) && !entry.credit_line) entry.credit_line = author ? `${basename(file)} by ${author}, ${lic}` : null;
  return { recorded: path, licence: entry.license, credit: entry.credit_line || undefined, lock: recordAsset(cwd, entry), missing: /by/i.test(lic) && !entry.credit_line ? "CC BY needs the author: --author name" : undefined };
}
