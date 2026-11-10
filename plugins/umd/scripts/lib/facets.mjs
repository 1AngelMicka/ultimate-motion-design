// Shared vocabulary of the style library: what a piece is for (use), how it feels (mood), what it looks like
// (medium), its format and its technology. The index builder tags every entry with it, the library page filters
// on it, and `umd styles match` maps a project's brief onto it. Keywords are matched on word starts, in English
// and French, accents ignored.

export const FACETS = {
  use: {
    launch: { fr: "Lancement, promo", en: "Launch, promo", k: ["launch", "promo", "commercial", "ad ", "ads", "advert", "teaser", "trailer", "announce", "release", "lancement", "pub", "publicite", "annonce", "bande-annonce"] },
    demo: { fr: "Démo produit, interface", en: "Product demo, UI", k: ["product demo", "product-demo", "demo", "walkthrough", "app", "saas", "dashboard", "screen", "ui ", "mock-ui", "cursor", "onboarding", "feature", "interface", "ecran", "fonctionnalite", "produit", "logiciel"] },
    explainer: { fr: "Explainer, pédagogie", en: "Explainer", k: ["explainer", "explain", "how it works", "tutorial", "education", "science", "lesson", "diagram", "process", "pedagog", "explication", "tutoriel", "comment ca marche", "cours", "schema"] },
    data: { fr: "Données, chiffres", en: "Data, numbers", k: ["data", "chart", "graph", "statistic", "number", "counter", "metric", "kpi", "infographic", "map", "ranking", "race", "donnees", "chiffre", "graphique", "carte", "statistique", "infographie"] },
    brand: { fr: "Logo, identité", en: "Logo, brand", k: ["logo", "logotype", "branding", "brand identity", "brand reveal", "identity", "ident ", "idents", "sting", "logo reveal", "brand mark", "wordmark", "brand stor", "brand heritage", "brand history", "identity film", "opener", "title sequence", "outro", "end card", "marque", "identite", "generique"] },
    social: { fr: "Réseaux, vertical", en: "Social, vertical", k: ["social", "vertical", "reel", "reels", "tiktok", "shorts", "stories", "instagram story", "9:16", "instagram", "linkedin", "reseaux", "short "] },
    type: { fr: "Typographie animée", en: "Kinetic type", k: ["typograph", "kinetic", "type ", "text", "title", "caption", "subtitle", "lettering", "font", "end card", "title card", "texte", "titre", "sous-titre", "lettrage", "generique", "carton"] },
    story: { fr: "Récit, court métrage", en: "Story, short film", k: ["story", "narrative", "film", "character", "short film", "documentary", "archive", "cinema", "scene", "plot", "recit", "histoire", "court metrage", "personnage", "documentaire"] },
    presentation: { fr: "Présentation, keynote", en: "Presentation, keynote", k: ["presentation", "keynote", "slide", "deck", "pitch", "conference", "talk", "diapo", "pitch deck"] },
    background: { fr: "Fond, texture", en: "Background, texture", k: ["background", "texture", "backdrop", "ambient", "loop", "wallpaper", "fond", "boucle", "ambiance"] },
    transition: { fr: "Transition", en: "Transition", k: ["transition", "wipe", "cut", "morph", "swipe", "zoom-through", "match cut", "fondu", "enchainement"] },
    web: { fr: "Page web, UI animée", en: "Web page, animated UI", k: ["web ", "website", "web page", "webpage", "web hero", "product page", "ui-props", "ui props", "landing", "hero section", "homepage", "scroll-driven", "scrolltrigger", "on scroll", "button", "hover", "micro-interaction", "site web", "page web", "page d'accueil", "bouton", "survol"] },
  },
  mood: {
    dark: { fr: "Sombre", en: "Dark", k: ["dark", "night", "noir", "black background", "moody", "low-key", "sombre", "nuit", "obscur", "fond noir"] },
    light: { fr: "Clair", en: "Light", k: ["light mode", "light theme", "light background", "bright", "white background", "off-white", "airy", "pastel", "clair", "lumineux", "fond blanc"] },
    playful: { fr: "Ludique", en: "Playful", k: ["playful", "fun", "cute", "toy", "cartoon", "kids", "bouncy", "whimsical", "joyful", "ludique", "drole", "enfant", "joyeux", "mignon"] },
    premium: { fr: "Premium, élégant", en: "Premium, elegant", k: ["premium", "luxury", "elegant", "refined", "gold", "editorial", "sophisticated", "luxe", "elegant", "raffine", "haut de gamme", "chic"] },
    retro: { fr: "Rétro, vintage", en: "Retro, vintage", k: ["retro", "vintage", "80s", "70s", "90s", "y2k", "synthwave", "vhs", "crt", "film grain", "old", "classic", "nostalg", "ancien", "annees"] },
    minimal: { fr: "Minimal", en: "Minimal", k: ["minimal", "clean", "simple", "swiss", "sober", "quiet", "sobre", "epure", "minimaliste"] },
    bold: { fr: "Audacieux, énergique", en: "Bold, energetic", k: ["bold", "energetic", "punchy", "loud", "vibrant", "dynamic", "fast", "explosive", "audacieux", "energique", "dynamique", "percutant", "vif"] },
    organic: { fr: "Organique, fait main", en: "Organic, handmade", k: ["organic", "handmade", "natural", "craft", "paper", "ink", "watercolor", "clay", "organique", "fait main", "naturel", "artisanal"] },
    tech: { fr: "Tech, futuriste", en: "Tech, futuristic", k: ["tech", "futur", "sci-fi", "cyber", "hud", "hologram", "neon", "digital", "ai ", "terminal", "code", "futuriste", "numerique"] },
    cinematic: { fr: "Cinématique", en: "Cinematic", k: ["cinematic", "cinema", "film", "epic", "dramatic", "anamorphic", "lens", "cinematographique", "epique", "dramatique"] },
    calm: { fr: "Calme, doux", en: "Calm, soft", k: ["calm", "soft", "gentle", "serene", "slow", "dreamy", "aurora", "calme", "doux", "serein", "lent", "reveur"] },
  },
  medium: {
    flat: { fr: "2D vectoriel", en: "Flat 2D", k: ["flat", "vector", "2d", "geometric", "shape", "bauhaus", "isometric", "vectoriel", "geometrique", "forme"] },
    "3d": { fr: "3D", en: "3D", k: ["3d", "render", "cgi", "three", "webgl", "webgpu", "blender", "clay", "isometric 3d", "volum", "rendu 3d"] },
    drawn: { fr: "Dessin, peinture", en: "Drawn, painted", k: ["hand-drawn", "drawn", "sketch", "painting", "watercolor", "ink", "illustr", "chalk", "crayon", "cel ", "anime style", "manga", "dessin", "peinture", "aquarelle", "encre", "croquis"] },
    print: { fr: "Papier, imprimé", en: "Paper, print", k: ["paper", "collage", "cutout", "print", "poster", "woodcut", "silkscreen", "screenprint", "risograph", "halftone", "engraving", "newsprint", "papier", "affiche", "gravure", "serigraphie"] },
    photo: { fr: "Photo, archive", en: "Photo, footage", k: ["photo", "footage", "archive", "documentary", "camera", "film still", "photograph", "image", "video", "archive"] },
    ui: { fr: "Écrans, UI", en: "Screens, UI", k: ["ui", "screen", "app", "dashboard", "interface", "mock", "browser", "phone", "desktop", "ecran", "telephone"] },
    dataviz: { fr: "Data-visualisation", en: "Data viz", k: ["chart", "graph", "data", "map", "diagram", "infographic", "bar", "pie", "graphique", "carte", "schema"] },
    pixel: { fr: "Pixel, jeu", en: "Pixel, game", k: ["pixel", "8-bit", "16-bit", "game", "arcade", "voxel", "lowpoly", "low-poly", "jeu"] },
    shader: { fr: "Shader, abstrait", en: "Shader, abstract", k: ["shader", "gradient", "abstract", "particle", "noise", "fluid", "glow", "aurora", "glass", "webgpu", "degrade", "abstrait", "particule"] },
  },
  format: {
    "16:9": { fr: "16:9", en: "16:9", k: ["16:9", "1920x1080", "landscape", "widescreen", "paysage"] },
    "9:16": { fr: "9:16 vertical", en: "9:16 vertical", k: ["9:16", "1080x1920", "vertical", "portrait", "reel", "tiktok", "shorts"] },
    "1:1": { fr: "1:1 carré", en: "1:1 square", k: ["1:1", "1080x1080", "square", "carre"] },
  },
  tech: {
    css: { fr: "HTML/CSS", en: "HTML/CSS", k: ["css", "html"] },
    gsap: { fr: "GSAP", en: "GSAP", k: ["gsap"] },
    svg: { fr: "SVG", en: "SVG", k: ["svg"] },
    canvas: { fr: "Canvas", en: "Canvas", k: ["canvas"] },
    three: { fr: "three.js", en: "three.js", k: ["three", "threejs", "three.js"] },
    webgl: { fr: "WebGL/WebGPU", en: "WebGL/WebGPU", k: ["webgl", "webgpu", "shader", "glsl", "wgsl"] },
    hyperframes: { fr: "HyperFrames", en: "HyperFrames", k: ["hyperframes"] },
  },
};

// The project types the plugin is made for: the same keys as the profiles in referential/scoring.json, plus 3D shots.
// Derived from the other facets, so one entry can serve several project types.
export const PROJECTS = {
  promo: { fr: "Promo, lancement produit", en: "Promo, product launch" },
  presentation: { fr: "Présentation", en: "Presentation" },
  explainer: { fr: "Explainer", en: "Explainer" },
  social: { fr: "Short vertical", en: "Vertical short" },
  logo: { fr: "Animation de logo", en: "Logo animation" },
  film: { fr: "Court métrage animé", en: "Animated short film" },
  web: { fr: "Page web animée", en: "Animated web page" },
  "3d": { fr: "Plan 3D", en: "3D shot" },
};

export function projectTypes(f, { kind = null, source = null } = {}) {
  const u = new Set(f.use || []), m = new Set(f.medium || []), out = [];
  if (u.has("launch") || u.has("demo")) out.push("promo");
  if (u.has("presentation") || u.has("demo") || (u.has("brand") && u.has("type"))) out.push("presentation");
  if (u.has("explainer") || u.has("data")) out.push("explainer");
  if (u.has("social") || (f.format || []).includes("9:16")) out.push("social");
  if (u.has("brand")) out.push("logo");
  if (u.has("story") || source === "lemo-opuscar") out.push("film");
  // a HyperFrames component is a piece of HTML/CSS/JS animation: it drops into a web page as well as into a video
  if (u.has("web") || kind === "component") out.push("web");
  if (m.has("3d")) out.push("3d");
  if (!out.length) out.push(u.has("transition") || u.has("background") || u.has("type") ? "promo" : "film");
  return out;
}

export const KINDS = {
  style: { fr: "Style complet", en: "Full style" },
  block: { fr: "Bloc prêt à l'emploi", en: "Ready block" },
  component: { fr: "Composant", en: "Component" },
  prompt: { fr: "Prompt de créateur", en: "Creator prompt" },
};

export const TIERS = {
  3: { fr: "Référence", en: "Reference" },
  2: { fr: "Pro", en: "Pro" },
  1: { fr: "Inspiration", en: "Inspiration" },
};

export const fold = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// facet values whose keywords appear in a text (word-start matching), at most `max` per facet
// min: distinct keywords needed before a value counts (2 for long prompt bodies, where one stray word misleads)
export function tagText(text, { max = 4, only = null, min = 1 } = {}) {
  const t = ` ${fold(text).replace(/[^a-z0-9:+\-x. ']+/g, " ")} `;
  const out = {};
  for (const [facet, values] of Object.entries(FACETS)) {
    if (only && !only.includes(facet)) continue;
    const hits = [];
    for (const [v, def] of Object.entries(values)) {
      let n = 0;
      for (const k of def.k) { const kk = fold(k); if (t.includes(` ${kk}`) || (kk.endsWith(" ") && t.includes(` ${kk.trim()} `))) n++; }
      if (n >= min) hits.push([v, n]);
    }
    out[facet] = hits.sort((a, b) => b[1] - a[1]).slice(0, max).map(([v]) => v);
  }
  return out;
}
