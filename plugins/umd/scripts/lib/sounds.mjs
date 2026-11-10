// Free sound effects and music through Openverse (Freesound, Wikimedia Commons audio, Jamendo): search under
// licences safe for commercial work only (CC0, CC BY, public domain), download one, convert it to 48 kHz WAV and
// record it in .motion/assets.lock.json with its author, licence, page and ready credit line.
import { writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { join, relative } from "node:path";
import { recordAsset } from "./commons.mjs";
import { ff } from "./ffmpeg.mjs";

const API = "https://api.openverse.org/v1/audio/";
// a descriptive User-Agent names the tool, not the user
const UA = "umd-sounds/1.0 (https://github.com/1AngelMicka/ultimate-motion-design)";
const SAFE = "cc0,by,pdm"; // never NC, ND or SA: client work must stay clean

const licenceName = (r) => (r.license === "cc0" ? "CC0 1.0" : r.license === "pdm" ? "Public Domain Mark" : `CC ${String(r.license).toUpperCase()} ${r.license_version || ""}`.trim());
const okLicence = (l) => ["cc0", "by", "pdm"].includes(String(l).toLowerCase());

async function api(path, params = {}) {
  const url = `${API}${path}${Object.keys(params).length ? `?${new URLSearchParams(params)}` : ""}`;
  const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`Openverse ${r.status} for ${url}`);
  return r.json();
}

export async function searchSounds(query, { music = false, limit = 10, maxSeconds = null, minSeconds = null, cc0 = false } = {}) {
  const max = maxSeconds ?? (music ? null : 10);
  // 20 per page is the anonymous maximum (more answers 401); a second page fills the list when the length filter drops many
  const params = { q: query, license: cc0 ? "cc0" : SAFE, source: music ? "jamendo" : "freesound,wikimedia_audio", page_size: "20", mature: "false" };
  const j = await api("", params);
  if ((j.page_count || 1) > 1) j.results = [...(j.results || []), ...((await api("", { ...params, page: "2" }).catch(() => ({}))).results || [])];
  // Openverse needs every word; when that finds nothing, ask word by word and keep first what holds the most words
  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  let broadened = false;
  if (!j.result_count && words.length > 1) {
    broadened = true;
    const seen = new Map();
    for (const w of words.slice(0, 3)) for (const r of (await api("", { ...params, q: w }).catch(() => ({}))).results || []) if (!seen.has(r.id)) seen.set(r.id, r);
    const hits = (r) => words.filter((w) => `${r.title} ${(r.tags || []).map((t) => t.name).join(" ")} ${(r.genres || []).join(" ")}`.toLowerCase().includes(w)).length;
    j.results = [...seen.values()].sort((a, b) => hits(b) - hits(a));
    j.result_count = j.results.length;
  }
  const all = (j.results || []).filter((r) => okLicence(r.license));
  const keep = all.filter((r) => {
    const s = (r.duration || 0) / 1000;
    return (!max || s <= max) && (!minSeconds || s >= minSeconds);
  });
  return {
    query, kind: music ? "music" : "sound effects", found: j.result_count, kept: keep.length, broadened: broadened ? "no result with every word: searched word by word" : undefined,
    results: keep.slice(0, limit).map((r) => ({
      id: r.id, title: r.title, licence: licenceName(r), author: r.creator || "unknown", seconds: Math.round((r.duration || 0) / 100) / 10,
      source: r.source, tags: (r.tags || []).slice(0, 6).map((t) => t.name).join(", ") || undefined, listen: r.url, page: r.foreign_landing_url,
    })),
    next: "umd sounds get <id> downloads it as 48 kHz WAV into assets/audio and records it in .motion/assets.lock.json",
    note: music ? "CC BY music needs its credit line in the description or the end credits." : undefined,
  };
}

export async function getSound(id, { cwd = process.cwd(), dir = "assets/audio", name = null } = {}) {
  const r = await api(`${encodeURIComponent(id)}/`);
  if (!okLicence(r.license)) throw new Error(`${r.title} is under ${licenceName(r)}: refused (only CC0, CC BY and public domain)`);
  const res = await fetch(r.url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(180000) });
  if (!res.ok) throw new Error(`Download failed: ${res.status} for ${r.url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const base = (name || `${r.title}-${r.creator || "unknown"}`).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w.-]+/g, "_").replace(/_+/g, "_").slice(0, 60);
  const absDir = join(cwd, dir);
  mkdirSync(absDir, { recursive: true });
  const ext = (r.filetype || "mp3").replace(/[^a-z0-9]/gi, "").slice(0, 5) || "mp3";
  const original = join(absDir, `${base}.orig.${ext}`);
  writeFileSync(original, buf);
  // every source becomes 48 kHz stereo WAV: umd mix and the sync check expect one rate
  const wav = join(absDir, `${base}.wav`);
  const conv = ff(["-hide_banner", "-loglevel", "error", "-y", "-i", original, "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le", wav]);
  const file = conv.code === 0 && existsSync(wav) ? wav : original;
  if (file === wav) rmSync(original, { force: true }); // keep one file per sound: the WAV is what gets mixed and listed
  const path = relative(cwd, file).replace(/\\/g, "/");
  const entry = {
    path, source: `Openverse (${r.source})`, url: r.foreign_landing_url, license: licenceName(r), license_url: r.license_url, author: r.creator || "unknown",
    credit_line: r.attribution || `"${r.title}" by ${r.creator}, ${licenceName(r)}`, ...(r.license === "by" ? { note: "CC BY: put the credit line in the description or the end credits" } : {}),
  };
  const lock = recordAsset(cwd, entry);
  return { file: path, seconds: Math.round((r.duration || 0) / 100) / 10, bytes: buf.length, ...entry, lock };
}
