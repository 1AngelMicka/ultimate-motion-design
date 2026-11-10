// Style library page (/library/): project types, faceted filters with live counts, search, sort, URL state,
// cards with previews, and a detail panel with the prompt or the install command.
// Every third-party string goes in through textContent, never innerHTML.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "text") n.textContent = v; else if (k === "class") n.className = v; else if (k.startsWith("on")) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v === true ? "" : v);
    }
    for (const k of kids) if (k != null && k !== false && k !== "") n.append(k);
    return n;
  };
  const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } } };
  const params = new URLSearchParams(location.search);
  let lang = params.get("lang") || store.get("umd-lang") || ((navigator.language || "").toLowerCase().startsWith("fr") ? "fr" : "en");
  if (lang !== "fr" && lang !== "en") lang = "en";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fold = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  const S = {
    fr: {
      skip: "Aller aux résultats", title: "Bibliothèque", search: "Rechercher", searchPh: "Rechercher : néon, papier, keynote, verre…", docs: "Documentation", theme: "Thème",
      typesLabel: "Type de projet", filters: "Filtres", filtersLabel: "Filtres de style", close: "Fermer", sortBy: "Trier par", none: "Rien ne correspond à ces filtres.", reset: "Tout effacer",
      autoHint: "Pendant /umd:go, ton agent choisit seul dans cette bibliothèque : umd styles match la classe d'après ton brief.",
      all: "Tout", results: (n) => `${n.toLocaleString("fr-FR")} résultat${n > 1 ? "s" : ""}`, apply: (n) => `Voir ${n.toLocaleString("fr-FR")} résultat${n > 1 ? "s" : ""}`,
      sort: { quality: "Qualité", recent: "Ajout récent", name: "Nom", short: "Durée courte" },
      groups: { tier: "Qualité", kind: "Nature", mood: "Ambiance", medium: "Rendu", format: "Format", tech: "Technologie", origin: "Source" },
      more: "Voir tout", less: "Réduire", clear: "Effacer", open: "Ouvrir", by: "par", s: "s",
      useIt: "L'utiliser dans ton projet", useHint: "Ou dis simplement « prends ce style » pendant /umd:go.", install: "L'installer (projet HyperFrames)", prompt: "Prompt", copy: "Copier", copied: "Copié",
      loading: "Lecture du prompt à la source…", failed: "Impossible de lire le prompt ici. Ouvre-le à la source :", partial: "Prompt partiel : l'auteur n'a pas tout partagé.",
      film: "Voir le film", clip: "Voir l'aperçu", post: "Post original", source: "Source", gallery: "Galerie d'origine", licence: "Licence", madeFor: "Pour", jury: "Note du jury", error: "La bibliothèque n'a pas pu se charger.",
      blockNote: "Un bloc HyperFrames prêt à l'emploi : on l'installe, puis on change ses variables (textes, couleurs, données).",
    },
    en: {
      skip: "Skip to results", title: "Library", search: "Search", searchPh: "Search: neon, paper, keynote, glass…", docs: "Documentation", theme: "Theme",
      typesLabel: "Project type", filters: "Filters", filtersLabel: "Style filters", close: "Close", sortBy: "Sort by", none: "Nothing matches these filters.", reset: "Clear all",
      autoHint: "During /umd:go your agent picks from this library on its own: umd styles match ranks it against your brief.",
      all: "All", results: (n) => `${n.toLocaleString("en-US")} result${n > 1 ? "s" : ""}`, apply: (n) => `Show ${n.toLocaleString("en-US")} result${n > 1 ? "s" : ""}`,
      sort: { quality: "Quality", recent: "Recently added", name: "Name", short: "Shortest" },
      groups: { tier: "Quality", kind: "Kind", mood: "Mood", medium: "Look", format: "Format", tech: "Technology", origin: "Source" },
      more: "Show all", less: "Show less", clear: "Clear", open: "Open", by: "by", s: "s",
      useIt: "Use it in your project", useHint: "Or just say \"use this style\" during /umd:go.", install: "Install it (HyperFrames project)", prompt: "Prompt", copy: "Copy", copied: "Copied",
      loading: "Reading the prompt from its source…", failed: "Could not read the prompt here. Open it at the source:", partial: "Partial prompt: the author did not share all of it.",
      film: "Watch the film", clip: "Watch the preview", post: "Original post", source: "Source", gallery: "Original gallery", licence: "Licence", madeFor: "For", jury: "Jury score", error: "The library could not load.",
      blockNote: "A ready-made HyperFrames block: install it, then change its variables (copy, colours, data).",
    },
  };
  const SYN = { neon: "neon", papier: "paper", encre: "ink", bois: "wood", verre: "glass", carte: "map", donnees: "data", sombre: "dark", lancement: "launch", produit: "product",
    typo: "type", typographie: "type", dessin: "drawn", aquarelle: "watercolor", peinture: "paint", jeu: "game", jeux: "game", espace: "space", ville: "city", luxe: "luxury",
    lumiere: "light", graphique: "chart", ecran: "screen", eau: "water", feu: "fire", argile: "clay", telephone: "phone", sous: "caption", texte: "text", fond: "background" };
  const ICON = {
    "": "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
    promo: "M4 10v4h3l6 4V6L7 10zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11",
    presentation: "M3 4h18M5 4v10h14V4M12 14v4M8 20l4-2 4 2",
    explainer: "M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z",
    social: "M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2",
    logo: "M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z",
    film: "M3 5h18v14H3zM7 5v14M17 5v14M3 9h4M3 15h4M17 9h4M17 15h4",
    web: "M3 5h18v14H3zM3 9h18M6 7h.01M8.5 7h.01",
    "3d": "M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5",
  };
  const GROUPS = [
    ["tier", (it) => [String(it.q)]], ["kind", (it) => [it.k]], ["mood", (it) => it.M], ["medium", (it) => it.D],
    ["format", (it) => it.F], ["tech", (it) => it.T], ["origin", (it) => [it.o]],
  ];
  const OPEN_BY_DEFAULT = new Set(["tier", "mood", "medium", "format"]);
  const SHOW = 8; // values shown per group before "show all"
  const PAGE = 48;

  const state = { type: params.get("type") || "", q: params.get("q") || "", sort: params.get("sort") || "quality", sel: {} };
  for (const [g] of GROUPS) state.sel[g] = new Set((params.get(g) || "").split(",").filter(Boolean));
  const expanded = new Set();
  let data, items = [], results = [], limit = PAGE;
  const T = () => S[lang];
  const L = (group, key) => { const v = data.labels[group]?.[key]; return v ? v[lang] || v.en : key; };

  const input = $("#q"), sortSel = $("#sort"), grid = $("#grid"), count = $(".lt-count"), chips = $(".lt-chips"), types = $(".lt-types"),
    groupsBox = $(".lt-groups"), aside = $(".lt-filters"), scrim = $(".lt-scrim"), openBtn = $(".lt-open-filters"), applyBtn = $(".lt-apply"),
    empty = $(".lt-empty"), panel = $(".lt-panel"), panelTitle = $("#panel-title"), panelBody = $(".lt-panel-body");

  // ---------------------------------------------------------------- language and theme
  function applyLang() {
    document.documentElement.lang = lang;
    for (const n of document.querySelectorAll("[data-t]")) n.textContent = T()[n.dataset.t];
    for (const n of document.querySelectorAll("[data-al]")) n.setAttribute("aria-label", T()[n.dataset.al]);
    for (const n of document.querySelectorAll("[data-ph]")) n.placeholder = T()[n.dataset.ph];
    for (const n of document.querySelectorAll("[data-en-href]")) { n.dataset.frHref ||= n.getAttribute("href"); n.setAttribute("href", lang === "en" ? n.dataset.enHref : n.dataset.frHref); }
    const auto = $(".lt-auto"); const [a, b] = T().autoHint.split("umd styles match");
    auto.replaceChildren(a, el("code", { text: "umd styles match" }), b);
    $(".lt-lang").textContent = lang === "fr" ? "EN" : "FR";
    $(".lt-lang").setAttribute("aria-label", lang === "fr" ? "English" : "Français");
    document.title = `${T().title} · Ultimate Motion Design`;
    sortSel.replaceChildren(...Object.entries(T().sort).map(([k, v]) => el("option", { value: k, text: v })));
    sortSel.value = state.sort;
  }
  $(".lt-lang").addEventListener("click", () => { lang = lang === "fr" ? "en" : "fr"; store.set("umd-lang", lang); applyLang(); update(false); });
  $(".lt-theme").addEventListener("click", () => {
    const cur = document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next; store.set("umd-theme", next);
  });

  // ---------------------------------------------------------------- filtering
  const words = () => fold(state.q).split(/\s+/).filter(Boolean);
  const passQuery = (it, w) => w.every((x) => it._h.includes(x) || (SYN[x] && it._h.includes(SYN[x])));
  const passGroup = (it, g, get) => !state.sel[g].size || get(it).some((v) => state.sel[g].has(v));
  const passGroups = (it, skip) => GROUPS.every(([g, get]) => g === skip || passGroup(it, g, get));
  const passType = (it) => !state.type || it.P.includes(state.type);

  const SORTS = {
    quality: (a, b) => b.q - a.q || (b.v ? 1 : 0) - (a.v ? 1 : 0) || (b.j || 0) - (a.j || 0) || a._o - b._o || a.n.localeCompare(b.n),
    recent: (a, b) => String(b.ad || "").localeCompare(String(a.ad || "")) || b.q - a.q,
    name: (a, b) => a._name.localeCompare(b._name, lang),
    short: (a, b) => (a.d || 999) - (b.d || 999) || b.q - a.q,
  };

  function update(resetLimit = true) {
    const w = words();
    const base = items.filter((it) => passQuery(it, w));
    results = base.filter((it) => passType(it) && passGroups(it)).sort(SORTS[state.sort] || SORTS.quality);
    if (resetLimit) limit = PAGE;
    renderTypes(base); renderGroups(base); renderChips(); renderGrid(); syncURL();
  }

  function renderTypes(base) {
    const inGroups = base.filter((it) => passGroups(it));
    const keys = ["", ...Object.keys(data.labels.project)];
    types.replaceChildren(...keys.map((k) => {
      const n = k ? inGroups.filter((it) => it.P.includes(k)).length : inGroups.length;
      const b = el("button", { type: "button", class: "lt-type", "aria-pressed": String(state.type === k), "data-k": k || "all", onclick: () => { state.type = state.type === k ? "" : k; update(); } },
        svg(ICON[k]), el("span", { class: "lt-type-label", text: k ? L("project", k) : T().all }), el("span", { class: "lt-type-n", text: n.toLocaleString(lang) }));
      if (!n && state.type !== k) b.disabled = true;
      return b;
    }));
  }

  function svg(d) {
    const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("width", "18"); s.setAttribute("height", "18"); s.setAttribute("aria-hidden", "true");
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", d || ""); p.setAttribute("fill", "none"); p.setAttribute("stroke", "currentColor"); p.setAttribute("stroke-width", "1.8"); p.setAttribute("stroke-linejoin", "round"); p.setAttribute("stroke-linecap", "round");
    s.append(p); return s;
  }

  function renderGroups(base) {
    const scoped = base.filter(passType);
    const open = new Set([...groupsBox.querySelectorAll("details[open]")].map((d) => d.dataset.g));
    const first = !groupsBox.children.length;
    groupsBox.replaceChildren(...GROUPS.map(([g, get]) => {
      const counts = new Map();
      for (const it of scoped) if (passGroups(it, g)) for (const v of get(it)) counts.set(v, (counts.get(v) || 0) + 1);
      let keys = Object.keys(data.labels[g]);
      if (g === "tier") keys = ["3", "2", "1"];
      keys = keys.filter((k) => counts.get(k) || state.sel[g].has(k));
      if (g !== "tier" && g !== "format") keys.sort((a, b) => (counts.get(b) || 0) - (counts.get(a) || 0));
      const long = keys.length > SHOW + 1 && !expanded.has(g);
      const shown = long ? keys.slice(0, SHOW) : keys;
      const list = el("ul", { class: "lt-opts", "data-deslop-ignore": "checkbox rows, not headings" }, ...shown.map((k) => {
        const id = `f-${g}-${k}`.replace(/[^a-z0-9-]/gi, "_");
        const cb = el("input", { type: "checkbox", id, checked: state.sel[g].has(k), onchange: (e) => { e.target.checked ? state.sel[g].add(k) : state.sel[g].delete(k); update(); } });
        return el("li", {}, cb, el("label", { for: id }, g === "tier" ? el("span", { class: `lt-tier t${k}`, "aria-hidden": "true" }) : null, el("span", { class: "lt-opt-label", text: L(g, k) }), el("span", { class: "lt-opt-n", text: (counts.get(k) || 0).toLocaleString(lang) })));
      }));
      const nSel = state.sel[g].size;
      const d = el("details", { "data-g": g, open: first ? OPEN_BY_DEFAULT.has(g) || nSel > 0 : open.has(g) },
        el("summary", {}, el("span", { text: T().groups[g] }), nSel ? el("span", { class: "lt-gsel", text: String(nSel) }) : null),
        list,
        keys.length > SHOW + 1 ? el("button", { type: "button", class: "lt-more", text: expanded.has(g) ? T().less : `${T().more} (${keys.length})`, onclick: () => { expanded.has(g) ? expanded.delete(g) : expanded.add(g); renderGroups(items.filter((it) => passQuery(it, words()))); } }) : null);
      return d;
    }));
    const nAll = GROUPS.reduce((n, [g]) => n + state.sel[g].size, 0);
    $(".lt-nsel").textContent = nAll ? String(nAll) : "";
    applyBtn.textContent = T().apply(results.length);
  }

  function renderChips() {
    const list = [];
    if (state.type) list.push([L("project", state.type), () => { state.type = ""; }]);
    if (state.q) list.push([`“${state.q}”`, () => { state.q = ""; input.value = ""; }]);
    for (const [g] of GROUPS) for (const k of state.sel[g]) list.push([`${T().groups[g]} : ${L(g, k)}`.replace(" : ", lang === "fr" ? " : " : ": "), () => state.sel[g].delete(k)]);
    chips.replaceChildren(...list.map(([label, drop]) => el("button", { type: "button", class: "lt-chip", "aria-label": `${T().clear} ${label}`, onclick: () => { drop(); update(); } }, el("span", { text: label }), el("span", { "aria-hidden": "true", text: "×" }))),
      list.length > 1 ? el("button", { type: "button", class: "lt-chip-clear", text: T().reset, onclick: reset }) : "");
    chips.hidden = !list.length;
  }

  function reset() {
    state.type = ""; state.q = ""; input.value = ""; for (const [g] of GROUPS) state.sel[g].clear(); update();
  }
  $(".lt-reset").addEventListener("click", reset);

  // ---------------------------------------------------------------- cards
  const media = (p) => p || null;
  const title = (it) => (it.o === "opus" && it.a ? `@${it.a}` : it.n);
  const sub = (it) => [it.o === "opus" ? it.c : L("origin", it.o), it.d ? `${Math.round(it.d)} ${T().s}` : null, it.F[0] || null].filter(Boolean).join(" · ");

  function card(it) {
    const img = it.p ? el("img", { src: media(it.p), alt: "", loading: "lazy", decoding: "async", width: 480, height: 270, onerror: (e) => e.target.replaceWith(ph(it)) }) : ph(it);
    const fig = el("div", { class: "lt-media" + (it.F[0] === "9:16" ? " tall" : "") }, img,
      el("span", { class: `lt-badge t${it.q}`, text: L("tier", String(it.q)) }),
      it.k !== "style" ? el("span", { class: "lt-kind", text: L("kind", it.k) }) : null);
    const btn = el("button", { type: "button", class: "lt-card-btn", "data-deslop-ignore": "stretched over the whole card", onclick: () => show(it) }, el("span", { text: title(it) }));
    const li = el("li", { class: "lt-card" }, fig,
      el("div", { class: "lt-card-body" },
        el("h3", {}, btn),
        el("p", { class: "lt-sub", text: sub(it) }),
        it.l ? el("p", { class: "lt-line", text: it.l }) : null,
        el("p", { class: "lt-tags" }, ...it.P.slice(0, 3).map((p) => el("span", { text: L("project", p) })))));
    if (it.v && !reduce) {
      let vid;
      li.addEventListener("pointerenter", (e) => {
        if (e.pointerType !== "mouse") return;
        if (!vid) { vid = el("video", { src: media(it.v), muted: true, loop: true, playsinline: true, preload: "auto", "aria-hidden": "true" }); vid.muted = true; fig.prepend(vid); }
        vid.hidden = false; vid.play().catch(() => {});
      });
      li.addEventListener("pointerleave", () => { if (vid) { vid.pause(); vid.hidden = true; } });
    }
    return li;
  }
  const ph = (it) => el("span", { class: "lt-ph" }, svg(ICON[it.P[0]] || ICON[""]), el("span", { text: it.c || "" }));

  function renderGrid() {
    grid.replaceChildren(...results.slice(0, limit).map(card));
    count.textContent = T().results(results.length);
    empty.hidden = results.length > 0;
  }
  new IntersectionObserver((e) => {
    if (e[0].isIntersecting && results.length > limit) { const from = limit; limit += PAGE; grid.append(...results.slice(from, limit).map(card)); }
  }, { rootMargin: "800px" }).observe($(".lt-sentinel"));

  // ---------------------------------------------------------------- detail panel
  const prompts = new Map();
  async function promptText(it) {
    if (it.pr) return it.pr;
    if (prompts.has(it.u)) return prompts.get(it.u);
    const r = await fetch(it.u);
    if (!r.ok) throw new Error(String(r.status));
    let t = (await r.text()).replace(/\r/g, "");
    const block = t.match(/```(?:text)?\n([\s\S]*?)\n```/);
    if (it.o === "opus" && block) t = block[1];
    prompts.set(it.u, t.trim());
    return t.trim();
  }
  function copyBtn(get) {
    const b = el("button", { type: "button", class: "lt-copy", text: T().copy });
    b.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(get()); } catch { return; }
      b.textContent = T().copied; b.dataset.done = "";
      setTimeout(() => { b.textContent = T().copy; delete b.dataset.done; }, 1500);
    });
    return b;
  }
  const codeBox = (text) => el("div", { class: "lt-code" }, el("pre", {}, el("code", { text })), copyBtn(() => text));
  const link = (href, text) => (href ? el("a", { href, target: "_blank", rel: "noopener", text: `${text} ↗` }) : null);
  const facetRow = (label, group, keys) => (keys.length ? el("div", { class: "lt-facet" }, el("dt", { text: label }), el("dd", {}, ...keys.map((k) => el("span", { text: L(group, k) })))) : null);

  async function show(it) {
    panelTitle.textContent = title(it);
    const vid = it.v ? el("video", { src: media(it.v), poster: media(it.p), controls: true, muted: true, loop: true, playsinline: true, autoplay: !reduce }) : null;
    if (vid) vid.muted = true;
    const fig = vid || (it.p ? el("img", { src: media(it.p), alt: "" }) : null);
    const isHf = it.o === "hf";
    const pre = el("pre", {}, el("code", { text: T().loading }));
    const promptBox = el("div", { class: "lt-code lt-prompt" }, pre);
    const lic = it.li || data.labels.origin[it.o]?.lic;
    panelBody.replaceChildren(
      fig ? el("div", { class: "lt-panel-media" + (it.F[0] === "9:16" ? " tall" : "") }, fig) : "",
      el("p", { class: "lt-sub" }, el("span", { class: `lt-badge static t${it.q}`, text: L("tier", String(it.q)) }), " ", [L("kind", it.k), it.o === "opus" && it.a ? `${T().by} @${it.a}` : L("origin", it.o), isHf ? null : it.c, it.d ? `${Math.round(it.d)} ${T().s}` : null, it.z].filter(Boolean).join(" · ")),
      it.l ? el("p", { class: "lt-panel-line", text: it.l }) : "",
      it.f ? el("p", { class: "lt-panel-film", text: it.f }) : "",
      el("dl", { class: "lt-facets" }, facetRow(T().madeFor, "project", it.P), facetRow(T().groups.mood, "mood", it.M), facetRow(T().groups.medium, "medium", it.D), facetRow(T().groups.tech, "tech", it.T)),
      el("p", { class: "lt-links" }, link(it.v || it.w, it.v ? T().clip : T().film), link(it.x, T().post), it.g && it.g !== it.w && !isHf ? link(it.g, T().gallery) : null, link(isHf ? it.g : it.u, T().source)),
      isHf ? el("h3", { text: T().install }) : "", isHf ? el("p", { class: "lt-hint", text: T().blockNote }) : "", isHf && it.i ? codeBox(it.i) : "",
      el("h3", { text: T().useIt }), codeBox(`umd styles get ${it.id}`), el("p", { class: "lt-hint", text: T().useHint }),
      !isHf ? el("h3", { text: T().prompt }) : "", !isHf && it.pp ? el("p", { class: "lt-hint", text: T().partial }) : "", !isHf ? promptBox : "",
      lic ? el("p", { class: "lt-lic" }, el("strong", { text: `${T().licence} : `.replace(" : ", lang === "fr" ? " : " : ": ") }), lic) : "");
    if (!panel.open) panel.showModal();
    panelBody.scrollTop = 0;
    try { history.replaceState(null, "", `${location.pathname}${location.search}#${encodeURIComponent(it.id)}`); } catch { /* file:// */ }
    if (isHf) return;
    try {
      const text = await promptText(it);
      if (panelTitle.textContent !== title(it)) return;
      pre.firstChild.textContent = text;
      promptBox.append(copyBtn(() => text));
    } catch {
      pre.replaceWith(el("p", {}, `${T().failed} `, el("a", { href: it.u, target: "_blank", rel: "noopener", text: it.u })));
    }
  }
  $(".lt-panel-close").addEventListener("click", () => panel.close());
  panel.addEventListener("click", (e) => { if (e.target === panel) panel.close(); });
  panel.addEventListener("close", () => {
    panel.querySelector("video")?.pause();
    try { history.replaceState(null, "", location.pathname + location.search); } catch { /* file:// */ }
  });

  // ---------------------------------------------------------------- filters drawer (narrow screens)
  const setDrawer = (on) => { aside.classList.toggle("open", on); scrim.hidden = !on; openBtn.setAttribute("aria-expanded", String(on)); document.body.classList.toggle("lt-lock", on); if (on) aside.querySelector("summary")?.focus(); };
  openBtn.addEventListener("click", () => setDrawer(true));
  scrim.addEventListener("click", () => setDrawer(false));
  $(".lt-filters-close").addEventListener("click", () => setDrawer(false));
  applyBtn.addEventListener("click", () => setDrawer(false));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && aside.classList.contains("open")) setDrawer(false); });

  // ---------------------------------------------------------------- URL state
  function syncURL() {
    const p = new URLSearchParams();
    if (state.type) p.set("type", state.type);
    if (state.q) p.set("q", state.q);
    for (const [g] of GROUPS) if (state.sel[g].size) p.set(g, [...state.sel[g]].join(","));
    if (state.sort !== "quality") p.set("sort", state.sort);
    if (params.get("lang") || store.get("umd-lang")) p.set("lang", lang);
    const qs = p.toString();
    try { history.replaceState(null, "", `${location.pathname}${qs ? `?${qs}` : ""}${location.hash}`); } catch { /* file:// */ }
  }

  let timer;
  input.value = state.q;
  input.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(() => { state.q = input.value.trim(); update(); }, 140); });
  sortSel.addEventListener("change", () => { state.sort = sortSel.value; update(); });

  // ---------------------------------------------------------------- load
  applyLang();
  const ORDER = { lemo: 0, oscar: 1, mg: 2, hf: 3, opus: 4 };
  fetch("../assets/library.json").then((r) => r.json()).then((d) => {
    data = d;
    const lab = (g, ks) => ks.map((k) => { const v = d.labels[g]?.[k]; return v ? `${v.fr} ${v.en}` : k; }).join(" ");
    items = d.items.map((it) => ({ ...it, _o: ORDER[it.o] ?? 9, _name: fold(it.o === "opus" && it.a ? it.a : it.n),
      _h: fold([it.id, it.n, it.c, it.l, it.f, it.a, ...(it.t || []), lab("project", it.P), lab("mood", it.M), lab("medium", it.D), it.F.join(" "), lab("tech", it.T), lab("kind", [it.k])].join(" ")) }));
    if (state.type && !d.labels.project[state.type]) state.type = "";
    update();
    const fromHash = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      const hit = id && items.find((x) => x.id === id);
      if (hit) show(hit);
    };
    fromHash();
    addEventListener("hashchange", fromHash);
  }).catch(() => { count.textContent = T().error; });
})();
