// Search the style and prompt libraries (references/styles/index.json) without reading them into context,
// and download one style prompt into the project when it is chosen.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { PLUGIN_ROOT } from "./ref.mjs";

// Each entry has a page on the docs site with its still or video and its prompt
const gallery = (id) => `https://1angelmicka.github.io/ultimate-motion-design/bibliotheque.html#${encodeURIComponent(id)}`;

const fold = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const SYN = {
  luxe: "luxury", luxueux: "luxury", premium: "luxury", sombre: "dark", noir: "dark", lumineux: "bright", ludique: "playful", fun: "playful",
  enfant: "kids", explication: "explainer", explicatif: "explainer", pedagogique: "explainer", produit: "product", lancement: "launch",
  donnees: "data", carte: "map", papier: "paper", aquarelle: "watercolor", encre: "ink", retro: "vintage", ancien: "vintage", futuriste: "sci-fi",
  logo: "logo", texte: "type", typo: "type", "3d": "3d", jeu: "game", musique: "music", voix: "voice", minimaliste: "minimal", epure: "minimal",
};

export function loadStyles() {
  return JSON.parse(readFileSync(join(PLUGIN_ROOT, "references", "styles", "index.json"), "utf8"));
}

export function searchStyles(query, { source = null, kind = null, limit = 8 } = {}) {
  const idx = loadStyles();
  const terms = fold(query).split(/[^a-z0-9-]+/).filter((t) => t.length > 1).map((t) => SYN[t] || t);
  const src = source ? { lemo: "lemo-opuscar", mg: "mg-styles-15", opus: "awesome-opus5-5-videos" }[source] || source : null;
  const scored = [];
  for (const e of idx.entries) {
    if (src && e.source !== src) continue;
    if (kind && e.kind !== kind) continue;
    const fields = [[e.name, 4], [e.category, 3], [(e.uses || []).join(" "), 3], [(e.tags || []).join(" "), 2], [e.line, 1], [e.film, 1]];
    let score = 0;
    for (const t of terms) for (const [f, w] of fields) if (fold(f).includes(t)) score += w;
    if (!terms.length) score = 1;
    if (score > 0) {
      if (e.kind === "style") score += 1.5; // full style prompts with a reference film beat one-off prompts
      if (e.jury_score) score += 0.5;
      scored.push({ e, score });
    }
  }
  scored.sort((a, b) => b.score - a.score || a.e.id.localeCompare(b.e.id));
  return {
    query, total: idx.entries.length, matches: scored.length,
    results: scored.slice(0, limit).map(({ e, score }) => ({
      id: e.id, name: e.name, category: e.category, line: e.line?.slice(0, 160), uses: e.uses?.length ? e.uses.join(", ") : undefined,
      tags: e.tags?.length ? e.tags.join(", ") : undefined, jury_score: e.jury_score ?? undefined, preview: gallery(e.id), film: e.film_url ?? e.preview_url, score: Math.round(score * 10) / 10,
    })),
    next: "umd styles get <id> downloads the prompt into the project",
  };
}

export async function getStyle(id, { cwd = process.cwd() } = {}) {
  const e = loadStyles().entries.find((x) => x.id === id);
  if (!e) throw new Error(`No style "${id}". Search first: umd styles <words>`);
  const res = await fetch(e.prompt_url);
  if (!res.ok) throw new Error(`Download failed (${res.status}) for ${e.prompt_url}`);
  const text = await res.text();
  const dir = existsSync(join(cwd, ".motion")) ? join(cwd, ".motion", "styles") : join(cwd, "styles");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${id.replace(/[^a-z0-9-]+/gi, "-")}.md`);
  const credit = e.source === "awesome-opus5-5-videos" ? `Prompt by ${e.name.split(" by ").pop()} (${e.post_url}), via yihui-dev/awesome-opus5-5-videos`
    : e.source === "lemo-opuscar" ? "Style prompt from lemomo-ai/lemo-opuscar (MIT) by LemoLab" : "Style prompt from Vincentwei1021/mg-styles-15 (MIT)";
  writeFileSync(file, `<!-- ${id} · ${credit} · ${e.prompt_url} -->\n\n${text}`);
  return { id, name: e.name, file: relative(cwd, file), bytes: text.length, approx_tokens: Math.ceil(text.length / 4), licence: e.licence, credit, preview: gallery(id), film: e.film_url ?? e.preview_url };
}
