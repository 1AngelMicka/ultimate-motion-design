// Search the style library (references/styles/index.json) without reading it into context, match it to a
// project's brief, and copy one chosen style into the project.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { PLUGIN_ROOT } from "./ref.mjs";
import { fold, tagText, PROJECTS } from "./facets.mjs";

// Each entry has a card on the library page with its still or video and its prompt
const SITE = "https://1angelmicka.github.io/ultimate-motion-design";
const gallery = (id) => `${SITE}/library/#${encodeURIComponent(id)}`;

const SYN = {
  luxe: "luxury", luxueux: "luxury", premium: "luxury", sombre: "dark", noir: "dark", lumineux: "bright", ludique: "playful", fun: "playful",
  enfant: "kids", explication: "explainer", explicatif: "explainer", pedagogique: "explainer", produit: "product", lancement: "launch",
  donnees: "data", carte: "map", papier: "paper", aquarelle: "watercolor", encre: "ink", retro: "vintage", ancien: "vintage", futuriste: "sci-fi",
  texte: "type", verre: "glass", conte: "tale", contes: "tale", boulangerie: "food", cafe: "food", restaurant: "food", architecture: "architecture", typo: "type", jeu: "game", musique: "music", voix: "voice", minimaliste: "minimal", epure: "minimal",
};
const STOP = new Set("une des les pour avec dans court metrage page sur qui que est pas plus son ses aux the and for with from that this our your video videos animation anime animee motion design style faire make want".split(" "));
const SOURCES = { lemo: "lemo-opuscar", oscar: "lemo-opuscar", mg: "mg-styles-15", opus: "awesome-opus5-5-videos", hf: "hyperframes", hyperframes: "hyperframes" };

export function loadStyles() {
  return JSON.parse(readFileSync(join(PLUGIN_ROOT, "references", "styles", "index.json"), "utf8"));
}

const card = (e, extra = {}) => ({
  id: e.id, name: e.name, kind: e.kind, tier: e.tier, category: e.category, line: e.line?.slice(0, 160),
  project: e.facets?.project?.join(", "), mood: e.facets?.mood?.join(", ") || undefined, medium: e.facets?.medium?.join(", ") || undefined,
  format: e.facets?.format?.join(", ") || undefined, install: e.install, preview: gallery(e.id), film: e.film_url ?? e.preview_url, ...extra,
});

// facet filters shared by search and match: { project, mood, medium, format, tech, use } values, all must hold
function passes(e, { source, kind, tier, ...facets }) {
  if (source && e.source !== (SOURCES[source] || source)) return false;
  if (source === "oscar" && e.collection !== "OPUSCAR 98") return false; // same repository, two collections
  if (source === "lemo" && e.collection) return false;
  if (kind && e.kind !== kind) return false;
  if (tier && (e.tier || 1) < Number(tier)) return false;
  for (const [f, v] of Object.entries(facets)) if (v && !(e.facets?.[f] || []).includes(v)) return false;
  return true;
}

export function searchStyles(query, { limit = 8, ...filters } = {}) {
  const idx = loadStyles();
  const terms = fold(query).split(/[^a-z0-9:-]+/).filter((t) => t.length > 1).map((t) => SYN[t] || t);
  const scored = [];
  for (const e of idx.entries) {
    if (!passes(e, filters)) continue;
    const fields = [[e.name, 4], [e.category, 3], [(e.uses || []).join(" "), 3], [(e.tags || []).join(" "), 2], [Object.values(e.facets || {}).flat().join(" "), 2], [e.line, 1], [e.film, 1]];
    let score = 0;
    for (const t of terms) for (const [f, w] of fields) if (fold(f).includes(t)) score += w;
    if (!terms.length) score = 1;
    if (score > 0) scored.push({ e, score: score + (e.tier || 1) * 1.2 });
  }
  scored.sort((a, b) => b.score - a.score || a.e.id.localeCompare(b.e.id));
  return {
    query, filters: Object.fromEntries(Object.entries(filters).filter(([, v]) => v)), total: idx.entries.length, matches: scored.length,
    results: scored.slice(0, limit).map(({ e, score }) => card(e, { score: Math.round(score * 10) / 10 })),
    next: "umd styles get <id> copies the prompt into the project; umd styles match ranks the library against the brief",
  };
}

// Read what the project needs: profile, format, ambition, engine, and the words of the brief
export function readNeeds(cwd, words = "") {
  const read = (f) => { try { return readFileSync(join(cwd, f), "utf8"); } catch { return ""; } };
  let p = {};
  try { p = JSON.parse(read(".motion/project.json") || "{}"); } catch { /* broken project.json: brief only */ }
  const brief = read("BRIEF.md");
  const text = `${brief}\n${words}`;
  const t = tagText(text, { max: 3 });
  const aspect = p.format?.aspect || t.format[0] || null;
  const project = new Set([p.profile].filter(Boolean));
  if (t.medium.includes("3d") && /\b(3d|three|plan 3d|3d shot)\b/i.test(fold(text))) project.add("3d");
  if (!p.profile) for (const [k, v] of [["launch", "promo"], ["explainer", "explainer"], ["presentation", "presentation"], ["social", "social"], ["brand", "logo"], ["story", "film"], ["web", "web"]]) if (t.use.includes(k)) project.add(v);
  return {
    from: [p.profile ? ".motion/project.json" : null, brief ? "BRIEF.md" : null, words ? "your words" : null].filter(Boolean),
    project: [...project], aspect, mood: t.mood, medium: t.medium, use: t.use, tech: t.tech,
    quality_target: p.quality_target ?? 8, engine: p.engine || null, terms: fold(words).split(/[^a-z0-9-]+/).filter((x) => x.length > 2 && !STOP.has(x)).map((x) => SYN[x] || x).filter((x, i, a) => a.indexOf(x) === i),
  };
}

// Rank the whole library against the project's needs, with the reasons for each pick
export function matchStyles(cwd, { words = "", limit = 6, ...filters } = {}) {
  const need = readNeeds(cwd, words);
  if (!need.project.length && !need.mood.length && !need.medium.length && !need.terms.length)
    return { error: "Nothing to match: no .motion/project.json, no BRIEF.md and no words. Run /umd:go first, or: umd styles match <a few words>" };
  const hfEngine = /hyperframes/i.test(need.engine || "");
  const ranked = [];
  for (const e of loadStyles().entries) {
    if (!passes(e, filters)) continue;
    const f = e.facets || {}, why = [];
    let s = 0;
    const proj = need.project.filter((x) => f.project?.includes(x));
    if (proj.length) { s += 6; why.push(`made for ${proj.map((x) => PROJECTS[x].en.toLowerCase()).join(" and ")}`); }
    else if (need.project.length) s -= 3;
    if (need.aspect && f.format?.length) { if (f.format.includes(need.aspect)) { s += 2; why.push(need.aspect); } else s -= e.kind === "block" || e.kind === "component" ? 4 : 1; } // a block is built for its size; a style prompt adapts
    const mood = need.mood.filter((x) => f.mood?.includes(x)); s += mood.length * 2.5; if (mood.length) why.push(`mood ${mood.join(", ")}`);
    const med = need.medium.filter((x) => f.medium?.includes(x)); s += med.length * 2; if (med.length) why.push(`look ${med.join(", ")}`);
    s += need.use.filter((x) => f.use?.includes(x)).length;
    const hay = ` ${fold([e.name, e.category, e.line, ...(e.tags || []), ...(e.uses || [])].join(" ")).replace(/[^a-z0-9]+/g, " ")}`;
    const hit = need.terms.filter((t) => hay.includes(` ${t}`)); // word starts: "conte" must not hit "content"
    s += hit.length * 1.5; if (hit.length) why.push(`mentions ${hit.slice(0, 3).join(", ")}`);
    s += (e.tier || 1) * 1.5;
    if (need.quality_target >= 8 && (e.tier || 1) === 1) s -= 1.5;
    if (e.source === "hyperframes" && e.kind !== "style") s += hfEngine ? 1.5 : -1;
    if (s <= 3) continue;
    why.push(["", "inspiration", "pro quality", "reference quality"][e.tier || 1]);
    ranked.push({ e, s, why });
  }
  ranked.sort((a, b) => b.s - a.s || a.e.id.localeCompare(b.e.id));
  // variety: at most 2 picks from one collection among the looks, so the shortlist offers real alternatives
  const pick = (pred, n) => {
    const out = [], per = {};
    for (const r of ranked) {
      if (!pred(r.e)) continue;
      const c = r.e.collection || r.e.source;
      if ((per[c] = (per[c] || 0) + 1) > 2) continue;
      out.push(card(r.e, { score: Math.round(r.s * 10) / 10, why: r.why.join("; ") }));
      if (out.length >= n) break;
    }
    return out;
  };
  return {
    needs: { from: need.from, project: need.project, aspect: need.aspect, mood: need.mood, medium: need.medium, quality_target: need.quality_target },
    looks: pick((e) => e.kind === "style" || e.kind === "prompt", limit),
    blocks: pick((e) => e.kind === "block" || e.kind === "component", 4),
    next: "Show the user the first 3 looks with their preview links; take #1 if they leave the choice to you. Then: umd styles get <id>",
  };
}

const CREDIT = {
  "awesome-opus5-5-videos": (e) => `Prompt by ${e.name.split(" by ").pop()} (${e.post_url}), via yihui-dev/awesome-opus5-5-videos`,
  "lemo-opuscar": (e) => (e.collection === "OPUSCAR 98" ? "Style prompt from lemomo-ai/lemo-opuscar OPUSCAR 98 (prompt MIT, stills CC BY 4.0), by LemoLab" : "Style prompt from lemomo-ai/lemo-opuscar (MIT) by LemoLab"),
  "mg-styles-15": () => "Style prompt from Vincentwei1021/mg-styles-15 (MIT)",
  hyperframes: (e) => `HyperFrames registry item ${e.id.slice(3)} (${e.licence})`,
};

export async function getStyle(id, { cwd = process.cwd() } = {}) {
  const e = loadStyles().entries.find((x) => x.id === id);
  if (!e) throw new Error(`No style "${id}". Search first: umd styles <words>, or umd styles match`);
  let text;
  if (e.prompt) text = e.prompt; // embedded in the index (OPUSCAR 98): nothing to download
  else {
    const res = await fetch(e.prompt_url, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`Download failed (${res.status}) for ${e.prompt_url}`);
    text = await res.text();
    // the index pins each prompt to a commit and a hash: refuse a file that changed since it was reviewed
    if (e.sha256) {
      const { createHash } = await import("node:crypto");
      const got = createHash("sha256").update(text, "utf8").digest("hex");
      if (got !== e.sha256) throw new Error(`${id}: the downloaded prompt does not match the reviewed version (sha256 ${got.slice(0, 12)}… ≠ ${e.sha256.slice(0, 12)}…). Not written.`);
    }
    if (e.source === "hyperframes") {
      const it = JSON.parse(text);
      text = [`# ${it.title || e.name}`, "", it.description || "", "", `Install into a HyperFrames project: \`${e.install}\``, "",
        it.variables?.length ? `Variables: ${it.variables.map((v) => `${v.name} (${v.type}${v.default !== undefined ? `, default ${JSON.stringify(v.default)}` : ""})`).join("; ")}` : "",
        `Size ${e.size || "any"}, ${e.duration_s ? `${e.duration_s} s` : "any length"}. Preview: ${e.clip_url || e.preview_url}`].join("\n");
    }
  }
  const dir = existsSync(join(cwd, ".motion")) ? join(cwd, ".motion", "styles") : join(cwd, "styles");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${id.replace(/[^a-z0-9-]+/gi, "-")}.md`);
  const credit = (CREDIT[e.source] || (() => e.licence))(e);
  writeFileSync(file, `<!-- ${id} · ${credit} · ${e.prompt_url || e.preview_url} -->\n\n${text}`);
  return { id, name: e.name, file: relative(cwd, file), bytes: text.length, approx_tokens: Math.ceil(text.length / 4), licence: e.licence, credit, install: e.install, preview: gallery(id), film: e.film_url ?? e.preview_url };
}
