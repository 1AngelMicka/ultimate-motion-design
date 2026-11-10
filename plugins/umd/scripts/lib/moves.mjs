// 120 named motion techniques ("moves"): a shared vocabulary for storyboards and critiques, searched locally.
// Source: motionvideohq/motionvideo.xyz moves.json (MIT, Copyright (c) 2026 Aniket Pawar).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PLUGIN_ROOT } from "./ref.mjs";

const fold = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const SYN = { transition: "transitions", texte: "type", typo: "type", camera: "camera", son: "sound", donnees: "data", graphique: "data", interface: "ui", vecteur: "vector",
  texture: "texture", rythme: "timing", coupe: "cut", zoom: "zoom", fondu: "dissolve", glitch: "glitch", particules: "particles", curseur: "cursor", logo: "logo" };

let cache = null;
export function loadMoves() {
  cache ||= JSON.parse(readFileSync(join(PLUGIN_ROOT, "references", "moves", "index.json"), "utf8"));
  return cache;
}

export function searchMoves(query, { family = null, limit = 8 } = {}) {
  const idx = loadMoves();
  const words = fold(query).split(/\s+/).filter(Boolean).map((w) => SYN[w] || w);
  const scored = idx.moves
    .filter((m) => !family || m.family === family)
    .map((m) => {
      const name = fold(`${m.name} ${m.aka.join(" ")}`), body = fold(`${m.summary} ${m.good_for.join(" ")} ${m.family}`);
      const score = words.reduce((s, w) => s + (name.includes(w) ? 3 : 0) + (body.includes(w) ? 1 : 0), 0);
      return { m, score };
    })
    .filter((x) => !words.length || x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return {
    query, families: [...new Set(idx.moves.map((m) => m.family))], matches: scored.length,
    results: scored.map(({ m }) => ({ name: m.name, family: m.family, summary: m.summary, good_for: m.good_for, related: m.related, page: idx.page.replace("<family>", m.family) })),
    credit: "Moves glossary from motionvideo.xyz (MIT).",
  };
}
