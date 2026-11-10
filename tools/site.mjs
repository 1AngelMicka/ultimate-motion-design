#!/usr/bin/env node
// Build the documentation site (GitHub Pages) into _site/. Zero dependencies.
//
//   node tools/site.mjs            build _site/ (French at /, English at /en/)
//
// Sources, so the site can never drift from the plugin:
//   README.md / README.en.md        sections become pages (both READMEs have the same section order)
//   site/content/{fr,en}/*.md       pages that are not in the README (first project, for AI agents)
//   plugins/umd/referential/*.json  the full quality referential
//   plugins/umd/references/**       the index of routes, recipes and engines
//   plugins/umd/skills/*/SKILL.md   the command list
//   AGENTS.md, llms.txt             copied to the site root; llms-full.txt is assembled here
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, copyFileSync, cpSync, rmSync, statSync } from "node:fs";
import { join, dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "_site");
const REPO = "https://github.com/1AngelMicka/ultimate-motion-design";
const SITE = "https://1angelmicka.github.io/ultimate-motion-design";
const VERSION = readFileSync(join(ROOT, "VERSION"), "utf8").trim();
const read = (p) => readFileSync(join(ROOT, p), "utf8");
const readJson = (p) => JSON.parse(read(p));

// ---------------------------------------------------------------- markdown → HTML (the subset our docs use)
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const slugify = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/<[^>]+>/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function inline(text, ctx) {
  const codes = [];
  let s = text.replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(esc(c)) - 1}\u0000`);
  s = esc(s);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => `<a href="${ctx.link(href)}"${/^https?:/.test(ctx.link(href)) && !ctx.link(href).startsWith(SITE) ? ' rel="noopener"' : ""}>${label}</a>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/(^|[\s(])_([^_]+)_(?=[\s).,;:]|$)/g, "$1<em>$2</em>");
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[i]}</code>`);
}

function markdown(src, ctx) {
  const lines = src.replace(/\r/g, "").split("\n");
  const out = [];
  const toc = [];
  let i = 0;
  const isTable = (l) => /^\s*\|.*\|\s*$/.test(l);
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    let m;
    if ((m = l.match(/^```(\w*)/))) {
      const buf = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) buf.push(lines[i++]);
      i++;
      out.push(`<div class="code"><pre><code${m[1] ? ` data-lang="${m[1]}"` : ""}>${esc(buf.join("\n"))}</code></pre><button class="copy" type="button" aria-label="${ctx.lang === "fr" ? "Copier" : "Copy"}">${ctx.lang === "fr" ? "Copier" : "Copy"}</button></div>`);
      continue;
    }
    if ((m = l.match(/^(#{2,4})\s+(.*)$/))) {
      const level = m[1].length;
      const text = inline(m[2], ctx);
      const id = slugify(m[2]);
      if (level <= 3) toc.push({ level, id, text: text.replace(/<[^>]+>/g, "") });
      out.push(`<h${level} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true" tabindex="-1">#</a>${text}</h${level}>`);
      i++;
      continue;
    }
    if (isTable(l) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      const row = (r) => r.trim().replace(/^\||\|$/g, "").split(/(?<!\\)\|/).map((c) => inline(c.trim().replace(/\\\|/g, "|"), ctx));
      const head = row(l);
      i += 2;
      const body = [];
      while (i < lines.length && isTable(lines[i])) body.push(row(lines[i++]));
      out.push(`<div class="table"><table><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
      continue;
    }
    if (/^\s*([-*]|\d+\.)\s+/.test(l)) {
      // nested lists by indentation (2 spaces per level)
      const items = [];
      while (i < lines.length && (/^\s*([-*]|\d+\.)\s+/.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) {
        const mm = lines[i].match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
        if (mm) items.push({ depth: Math.floor(mm[1].length / 2), ordered: /\d/.test(mm[2]), text: mm[3] });
        else items[items.length - 1].text += " " + lines[i].trim();
        i++;
      }
      let html = "";
      const stack = [];
      for (const it of items) {
        while (stack.length > it.depth + 1) html += `</li></${stack.pop()}>`;
        if (stack.length === it.depth + 1) html += "</li>";
        while (stack.length < it.depth + 1) { const tag = it.ordered ? "ol" : "ul"; html += `<${tag}>`; stack.push(tag); }
        html += `<li>${inline(it.text, ctx)}`;
      }
      while (stack.length) html += `</li></${stack.pop()}>`;
      out.push(html);
      continue;
    }
    if (l.startsWith(">")) {
      const buf = [];
      while (i < lines.length && lines[i].startsWith(">")) buf.push(lines[i++].replace(/^>\s?/, ""));
      out.push(`<blockquote>${markdown(buf.join("\n"), ctx).html}</blockquote>`);
      continue;
    }
    if (/^<!--/.test(l)) { while (i < lines.length && !lines[i].includes("-->")) i++; i++; continue; }
    const buf = [];
    while (i < lines.length && lines[i].trim() && !/^(#{2,4}\s|```|\s*([-*]|\d+\.)\s|>)/.test(lines[i]) && !isTable(lines[i])) buf.push(lines[i++].trim());
    out.push(`<p>${inline(buf.join(" "), ctx)}</p>`);
  }
  return { html: out.join("\n"), toc };
}

// ---------------------------------------------------------------- content model
const LANGS = {
  fr: { readme: "README.md", base: "", other: "en", label: "Français", switchLabel: "English", on: "Sur cette page", edit: "Modifier sur GitHub", menu: "Menu", theme: "Thème", skip: "Aller au contenu", tagline: "Motion design de haute qualité avec Claude Code, vérifié image par image." },
  en: { readme: "README.en.md", base: "en/", other: "fr", label: "English", switchLabel: "Français", on: "On this page", edit: "Edit on GitHub", menu: "Menu", theme: "Theme", skip: "Skip to content", tagline: "High-end motion design with Claude Code, checked frame by frame." },
};

// README sections, by position (both READMEs share the same order)
const SECTION = { principle: 0, install: 1, commands: 2, routes: 3, checks: 4, licences: 5, tokens: 6, companions: 7, files: 8, trouble: 9, privacy: 10, contrib: 11, credits: 12 };

const PAGES = [
  { slug: "index", nav: { fr: "Accueil", en: "Home" }, sections: ["intro", "principle"], hero: true },
  { slug: "installation", nav: { fr: "Installation", en: "Install" }, sections: ["install"] },
  { slug: "premier-projet", nav: { fr: "Premier projet", en: "First project" }, content: "first-project.md" },
  { slug: "astuces", nav: { fr: "Astuces et prompts", en: "Tips and prompts" }, content: "tips.md" },
  { slug: "bibliotheque", nav: { fr: "Bibliothèque de styles", en: "Style library" }, content: "library.md", wide: true },
  { slug: "commandes", nav: { fr: "Commandes", en: "Commands" }, sections: ["commands", "files"], extra: "cli" },
  { slug: "routes", nav: { fr: "Routes et technos", en: "Routes and tech" }, sections: ["routes"], extra: "references" },
  { slug: "qualite", nav: { fr: "Contrôle qualité", en: "Quality checks" }, sections: ["checks"], extra: "referential" },
  { slug: "licences", nav: { fr: "Licences", en: "Licences" }, sections: ["licences"] },
  { slug: "tokens", nav: { fr: "Économie de tokens", en: "Token economy" }, sections: ["tokens"] },
  { slug: "compagnons", nav: { fr: "Outils compagnons", en: "Companion tools" }, sections: ["companions"] },
  { slug: "depannage", nav: { fr: "Dépannage et sécurité", en: "Troubleshooting" }, sections: ["trouble", "privacy"] },
  { slug: "agents", nav: { fr: "Pour les agents IA", en: "For AI agents" }, content: "agents.md" },
  { slug: "contribuer", nav: { fr: "Contribuer", en: "Contributing" }, sections: ["contrib", "credits"] },
];
const ANCHORS = { "économie-de-tokens": "tokens", "token-economy": "tokens", "outils-compagnons": "compagnons", "companion-tools": "compagnons" };

function splitReadme(file) {
  const text = read(file).replace(/\r/g, "");
  const parts = text.split(/^## /m);
  const intro = parts[0].replace(/^# .*\n/, "").replace(/^\[!\[.*\n/gm, "").replace(/^\*\*[^\n]*·[^\n]*\n/m, "").replace(/^\[[^\n]*·[^\n]*\n/m, "").trim();
  const sections = parts.slice(1).map((p) => `## ${p}`.trim());
  return { intro, sections };
}

function linker(lang, pagePath) {
  const depth = pagePath.split("/").length - 1;
  const up = "../".repeat(depth);
  return (href) => {
    if (/^(https?:|mailto:)/.test(href)) return href;
    if (href.startsWith("#")) {
      const key = decodeURIComponent(href.slice(1));
      if (ANCHORS[key]) return `${up}${LANGS[lang].base}${ANCHORS[key]}.html`;
      return href;
    }
    if (/^README(\.en)?\.md$/.test(href)) return `${up}${href.includes(".en") ? "en/" : ""}index.html`;
    if (href.startsWith("site:")) return `${up}${LANGS[lang].base}${href.slice(5)}.html`;
    return `${REPO}/blob/main/${href.replace(/^\.\//, "")}`;
  };
}

// ---------------------------------------------------------------- generated sections
function cliSection(lang) {
  const head = read("plugins/umd/scripts/umd.mjs").split("\n").filter((l) => l.startsWith("//")).map((l) => l.replace(/^\/\/ ?/, ""));
  const body = head.slice(1).join("\n").trim();
  return lang === "fr"
    ? `## La CLI \`umd\`\n\nToutes les commandes s'appuient sur \`node <plugin>/scripts/umd.mjs\`, sans dépendance. Tu peux la lancer toi-même ; c'est aussi ce que les agents utilisent.\n\n\`\`\`text\n${body}\n\`\`\``
    : `## The \`umd\` CLI\n\nEvery command relies on \`node <plugin>/scripts/umd.mjs\`, with no dependency. You can run it yourself; it is also what the agents use.\n\n\`\`\`text\n${body}\n\`\`\``;
}

function referencesSection(lang) {
  const base = "plugins/umd/references";
  const groups = [
    ["routes", { fr: "Routes", en: "Routes" }], ["recipes", { fr: "Recettes", en: "Recipes" }], ["engines", { fr: "Moteurs", en: "Engines" }],
    ["craft", { fr: "Métier", en: "Craft" }], ["audio", { fr: "Audio", en: "Audio" }], ["", { fr: "Pratique", en: "Practical" }],
  ];
  const L = [lang === "fr" ? "## Tous les guides\n\nChaque guide est lu par Claude seulement quand il sert. Ils sont en anglais, la langue la plus économe en tokens." : "## Every guide\n\nClaude reads each guide only when it needs it. They are in English, the most token-efficient language."];
  for (const [dir, label] of groups) {
    const abs = join(ROOT, base, dir);
    const files = readdirSync(abs).filter((f) => f.endsWith(".md")).sort();
    L.push(`\n### ${label[lang]}\n`, `| ${lang === "fr" ? "Guide" : "Guide"} | ${lang === "fr" ? "En une ligne" : "In one line"} |`, "| --- | --- |");
    for (const f of files) {
      const txt = readFileSync(join(abs, f), "utf8").split("\n");
      const title = (txt.find((x) => x.startsWith("# ")) || f).replace(/^# /, "");
      const line = (txt.slice(1).find((x) => x.trim() && !x.startsWith("#")) || "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\|/g, "\\|").slice(0, 220);
      L.push(`| [${title}](${base}/${dir ? `${dir}/` : ""}${f}) | ${line} |`);
    }
  }
  return L.join("\n");
}

function referentialSection(lang) {
  const scoring = readJson("plugins/umd/referential/scoring.json");
  const dir = join(ROOT, "plugins/umd/referential/domains");
  const groups = readdirSync(dir).filter((f) => f.endsWith(".json")).sort().map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")));
  const sev = lang === "fr" ? { blocker: "bloquant", major: "majeur", minor: "mineur" } : { blocker: "blocker", major: "major", minor: "minor" };
  const t = lang === "fr" ? { title: "Le référentiel complet", rules: "Règles de construction", cols: "| ID | Vérification | Sévérité | Méthode | Comment |", profiles: "Profils et poids", th: "Seuils par défaut", auto: "automatique", inspect: "auditeur" }
    : { title: "The full referential", rules: "Build rules", cols: "| ID | Check | Severity | Method | How |", profiles: "Profiles and weights", th: "Default thresholds", auto: "automatic", inspect: "auditor" };
  const domains = groups.flatMap((g) => g.domains);
  const L = [`## ${t.title}`, "", `### ${t.profiles}`, "", `| | ${domains.map((d) => d.code).join(" | ")} |`, `| --- | ${domains.map(() => "---").join(" | ")} |`];
  for (const [k, p] of Object.entries(scoring.profiles)) L.push(`| \`${k}\` ${p.label[lang]} | ${domains.map((d) => p.weights[d.id] || "·").join(" | ")} |`);
  L.push("", `### ${t.th}`, "", "| | |", "| --- | --- |");
  for (const [k, v] of Object.entries(scoring.thresholds)) if (k !== "_note") L.push(`| \`${k}\` | ${v} |`);
  for (const g of groups) for (const d of g.domains) {
    L.push("", `### ${d.code} · ${d.label[lang]}`, "", d.summary[lang], "", `**${t.rules}**`, "", ...d.build.map((b) => `- ${b[lang]}`), "", t.cols, "| --- | --- | --- | --- | --- |");
    for (const c of d.criteria) L.push(`| ${c.id} | ${c.label[lang]} | ${sev[c.severity]} | ${c.check.method === "auto" ? t.auto : t.inspect} | ${c.verify[lang].replace(/\|/g, "\\|")} |`);
  }
  return L.join("\n");
}

// ---------------------------------------------------------------- page shell
function shell({ lang, page, title, html, toc, pagePath }) {
  const T = LANGS[lang];
  const up = "../".repeat(pagePath.split("/").length - 1);
  const otherPath = `${LANGS[T.other].base}${page.slug}.html`;
  const nav = PAGES.map((p) => `<a href="${up}${T.base}${p.slug}.html"${p.slug === page.slug ? ' aria-current="page"' : ""}>${p.nav[lang]}</a>`).join("");
  const tocHtml = !page.wide && toc.filter((x) => x.level === 2).length > 1
    ? `<nav class="toc" aria-label="${T.on}"><p>${T.on}</p>${toc.filter((x) => x.level === 2).map((x) => `<a href="#${x.id}">${x.text}</a>`).join("")}</nav>` : "";
  const desc = lang === "fr" ? "Plugin Claude Code pour produire et auditer du motion design de haute qualité : vidéos, pages animées, 3D. Rendu déterministe, contrôle qualité noté sur 10, licences, tokens." : "Claude Code plugin to make and audit high-end motion design: videos, animated pages, 3D. Deterministic rendering, quality checks scored out of 10, licences, tokens.";
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="alternate" hreflang="${T.other}" href="${SITE}/${otherPath}">
<link rel="alternate" type="text/plain" title="llms.txt" href="${up}llms.txt">
<meta name="color-scheme" content="light dark">
<link rel="icon" href="${up}assets/icon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${up}assets/site.css?v=${VERSION}">
<script>try{const t=localStorage.getItem("umd-theme");if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
</head>
<body${page.hero ? ' class="home"' : page.wide ? ' class="wide"' : ""}>
<a class="skip" href="#main">${T.skip}</a>
<header class="top">
  <a class="brand" href="${up}${T.base}index.html"><svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><rect x="2" y="5" width="20" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="8" cy="12" r="2.5" fill="var(--rec)"/><path d="M13 9.5h6M13 12h4M13 14.5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span class="long">Ultimate Motion Design</span><span class="short">UMD</span></a>
  <span class="version">v${VERSION}</span>
  <div class="top-actions">
    <a class="lang" href="${up}${otherPath}" hreflang="${T.other}">${T.switchLabel}</a>
    <button class="theme" type="button" aria-label="${T.theme}"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z" fill="currentColor"/></svg></button>
    <a class="gh" href="${REPO}" rel="noopener" aria-label="GitHub"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5z"/></svg></a>
  </div>
</header>
<div class="layout">
  <details class="side"${page.hero ? "" : ""}>
    <summary>${T.menu}</summary>
    <nav aria-label="Documentation">${nav}</nav>
  </details>
  <main id="main">
    <article>
${html}
    </article>
    <footer class="foot"><span>MIT · <a href="${REPO}" rel="noopener">GitHub</a> · <a href="${up}llms.txt">llms.txt</a></span><a href="${REPO}/edit/main/${page.content ? `site/content/${lang}/${page.content}` : T.readme}" rel="noopener">${T.edit}</a></footer>
  </main>
  ${tocHtml}
</div>
<script src="${up}assets/site.js?v=${VERSION}"></script>${page.wide ? `
<script src="${up}assets/library.js?v=${VERSION}"></script>` : ""}
</body>
</html>
`;
}

function heroHtml(lang) {
  const fr = lang === "fr";
  return `<section class="hero">
  <div class="hero-text">
    <h1>Ultimate Motion Design</h1>
    <p class="lead">${LANGS[lang].tagline}</p>
    <p class="hero-sub">${fr ? "Un plugin pour Claude Code : vidéos promo, présentations, explainers, shorts, logos animés, pages web et 3D. Rendu déterministe, contrôle qualité noté sur 10, licences surveillées, tokens comptés." : "A plugin for Claude Code: promo videos, presentations, explainers, shorts, logo animations, web pages and 3D. Deterministic rendering, quality checks scored out of 10, licences watched, tokens counted."}</p>
    <div class="code install"><pre><code>/plugin marketplace add 1AngelMicka/ultimate-motion-design
/plugin install umd@ultimate-motion-design
/umd:go ${fr ? "une vidéo de lancement de 30 s pour notre app" : "a 30-second launch video for our app"}</code></pre><button class="copy" type="button">${fr ? "Copier" : "Copy"}</button></div>
    <p class="hero-links"><a class="primary" href="installation.html">${fr ? "Installer" : "Install"}</a><a href="premier-projet.html">${fr ? "Premier projet en 5 minutes" : "First project in 5 minutes"}</a><a href="agents.html">${fr ? "Envoyer le lien à ton agent IA" : "Send the link to your AI agent"}</a></p>
  </div>
  <figure class="hero-media">
    <video src="${fr ? "" : "../"}assets/demo.mp4" poster="${fr ? "" : "../"}assets/demo.jpg" autoplay muted loop playsinline width="1280" height="720"></video>
    <figcaption>${fr ? "Une page HTML rendue par <code>umd capture</code> : un acteur (le point rouge) porte chaque transition, le storyboard se rend sous la tête de lecture, le plan fort s'ouvre sur le film (shader WebGL), l'audit se dessine par-dessus. Passe nos propres contrôles ; deux rendus, images identiques à l'octet près." : "An HTML page rendered by <code>umd capture</code>: one actor (the red dot) carries every transition, the storyboard renders under the playhead, the hero shot opens into the film (WebGL shader), the audit draws over it. Passes our own checks; two renders, byte-identical frames."}</figcaption>
  </figure>
</section>`;
}

function galleryHtml(lang) {
  const fr = lang === "fr";
  const idx = readJson("plugins/umd/references/styles/index.json");
  const n = idx.counts;
  const src = [
    ["all", fr ? "Tout" : "All", idx.entries.length],
    ["lemo-opuscar", fr ? "Styles de film" : "Film styles", n["lemo-opuscar"]],
    ["mg-styles-15", fr ? "Motion graphics notés" : "Scored motion graphics", n["mg-styles-15"]],
    ["awesome-opus5-5-videos", fr ? "Prompts de créateurs" : "Creators' prompts", n["awesome-opus5-5-videos"]],
  ];
  return `<div class="lib" data-src="${lang === "fr" ? "" : "../"}assets/library.json">
  <div class="lib-bar" role="search">
    <label class="lib-search"><span class="sr">${fr ? "Rechercher" : "Search"}</span><input type="search" placeholder="${fr ? "Rechercher : néon, papier, keynote, logo, 3D…" : "Search: neon, paper, keynote, logo, 3D…"}" autocomplete="off"></label>
    <div class="lib-src" role="group" aria-label="${fr ? "Source" : "Source"}">${src.map(([k, l, c], i) => `<button type="button" data-src="${k}" aria-pressed="${i === 0}">${l} <span>${c}</span></button>`).join("")}</div>
    <label class="lib-cat"><span class="sr">${fr ? "Catégorie" : "Category"}</span><select><option value="">${fr ? "Toutes les catégories" : "All categories"}</option></select></label>
  </div>
  <p class="lib-count" aria-live="polite"></p>
  <ul class="lib-grid"></ul>
  <p class="lib-more-wrap"><button type="button" class="lib-more" hidden>${fr ? "Afficher plus" : "Show more"}</button></p>
  <noscript><p>${fr ? "La bibliothèque a besoin de JavaScript. Sans lui : <code>umd styles &lt;mots&gt;</code> dans un terminal." : "The library needs JavaScript. Without it: <code>umd styles &lt;words&gt;</code> in a terminal."}</p></noscript>
</div>
<dialog class="lib-dlg" aria-labelledby="lib-dlg-title">
  <div class="lib-dlg-head"><h2 id="lib-dlg-title"></h2><button type="button" class="lib-close" aria-label="${fr ? "Fermer" : "Close"}">×</button></div>
  <div class="lib-dlg-body"></div>
</dialog>`;
}

// ---------------------------------------------------------------- build
rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, "assets"), { recursive: true });
mkdirSync(join(OUT, "en"), { recursive: true });
cpSync(join(ROOT, "site", "assets"), join(OUT, "assets"), { recursive: true });
// Gallery data: the style index, trimmed to what a card needs; site-hosted previews become relative paths
{
  const idx = readJson("plugins/umd/references/styles/index.json");
  const rel = (u) => (u && u.startsWith(SITE + "/") ? u.slice(SITE.length + 1) : u || null);
  const items = idx.entries.map((e) => ({
    id: e.id, s: e.source, k: e.kind, n: e.name, c: e.category, l: e.line, f: e.film || null, d: e.duration_s || null, j: e.jury_score || null,
    a: e.author || null, t: e.tags || e.uses || [], pp: !!e.partial, p: rel(e.poster_url), v: rel(e.clip_url), w: e.film_url || e.preview_url,
    g: e.preview_url, x: e.post_url || null, u: e.prompt_url,
  }));
  writeFileSync(join(OUT, "assets", "library.json"), JSON.stringify({ generated: idx.generated, items }));
}
let pageCount = 0;
const fullText = { fr: [], en: [] };
for (const lang of ["fr", "en"]) {
  const T = LANGS[lang];
  const { intro, sections } = splitReadme(T.readme);
  for (const page of PAGES) {
    const pagePath = `${T.base}${page.slug}.html`;
    const ctx = { lang, link: linker(lang, pagePath) };
    let src = "";
    if (page.content) src = readFileSync(join(ROOT, "site", "content", lang, page.content), "utf8").replace(/^# .*\n/, "");
    else src = page.sections.map((s) => (s === "intro" ? intro : sections[SECTION[s]])).join("\n\n");
    // the page title (h1) replaces the first README heading, so it is not shown twice
    if (!page.hero && !page.content) src = src.replace(/^## [^\n]*\n+/, "");
    if (page.extra === "cli") src += "\n\n" + cliSection(lang);
    if (page.extra === "references") src += "\n\n" + referencesSection(lang);
    if (page.extra === "referential") src += "\n\n" + referentialSection(lang);
    let { html, toc } = markdown(src, ctx);
    if (page.wide) html = html.replace("<p>@@GALLERY@@</p>", galleryHtml(lang));
    const h1 = page.hero ? "" : `<h1>${page.nav[lang]}</h1>\n`;
    const body = page.hero ? heroHtml(lang) + "\n" + html : h1 + html;
    const title = page.hero ? `Ultimate Motion Design — ${T.tagline}` : `${page.nav[lang]} · Ultimate Motion Design`;
    writeFileSync(join(OUT, pagePath), shell({ lang, page, title, html: body, toc, pagePath }));
    fullText[lang].push(`# ${page.nav[lang]}\n\n${src.trim()}\n`);
    pageCount++;
  }
}
// Agent-facing files
copyFileSync(join(ROOT, "llms.txt"), join(OUT, "llms.txt"));
copyFileSync(join(ROOT, "AGENTS.md"), join(OUT, "AGENTS.md"));
writeFileSync(join(OUT, "llms-full.txt"), [
  `# Ultimate Motion Design — full documentation (v${VERSION})`, "",
  `> Claude Code plugin to make and audit high-end motion design. Source: ${REPO}. Site: ${SITE}/`, "",
  read("AGENTS.md"), "", ...fullText.en,
].join("\n"));
writeFileSync(join(OUT, ".nojekyll"), "");
writeFileSync(join(OUT, "404.html"), shell({ lang: "en", page: { slug: "404", nav: { en: "Not found" } }, title: "Not found · Ultimate Motion Design", toc: [], pagePath: "404.html",
  html: `<h1>Not found</h1><p>This page does not exist. <a href="index.html">Documentation home</a> · <a href="en/index.html">English</a></p>` }));
const kb = (f) => Math.round(statSync(join(OUT, f)).size / 1024);
console.log(`site: ${pageCount} pages (fr + en) in _site/, llms-full.txt ${kb("llms-full.txt")} KB, v${VERSION}`);
