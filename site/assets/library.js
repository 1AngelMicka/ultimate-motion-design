// Style library: search, filters, cards with previews, and a dialog that reads the prompt from its source.
// Every third-party string goes in through textContent, never innerHTML.
(() => {
  const root = document.querySelector(".lib");
  if (!root) return;
  const fr = document.documentElement.lang === "fr";
  const T = fr
    ? { results: (n) => `${n} résultat${n > 1 ? "s" : ""}`, none: "Aucun résultat. Essaie un autre mot, en français ou en anglais.", prompt: "Prompt", film: "Voir le film", open: "Ouvrir", copy: "Copier", copied: "Copié", loading: "Lecture du prompt à la source…", failed: "Impossible de lire le prompt ici. Ouvre-le à la source :", source: "Prompt à la source", gallery: "Galerie d'origine", post: "Post original", inProject: "Dans ton projet", inProjectHint: "Ou dis simplement « prends ce style » pendant /umd:go.", partial: "Prompt partiel : l'auteur n'a pas tout partagé.", by: "par", s: "s", score: "Note du jury", error: "La bibliothèque n'a pas pu se charger." }
    : { results: (n) => `${n} result${n > 1 ? "s" : ""}`, none: "No result. Try another word.", prompt: "Prompt", film: "Watch the film", open: "Open", copy: "Copy", copied: "Copied", loading: "Reading the prompt from its source…", failed: "Could not read the prompt here. Open it at the source:", source: "Prompt at the source", gallery: "Original gallery", post: "Original post", inProject: "In your project", inProjectHint: "Or just say \"use this style\" during /umd:go.", partial: "Partial prompt: the author did not share all of it.", by: "by", s: "s", score: "Jury score", error: "The library could not load." };
  const SRC = { "lemo-opuscar": "LemoLab", "mg-styles-15": "mg-styles-15", "awesome-opus5-5-videos": fr ? "Créateur" : "Creator" };
  const CAT_FR = { "Evidence Films": "Films d'enquête", "Graphic & Type": "Graphisme et typo", "Cinema & Eras": "Cinéma et époques", "Materials & 3D": "Matières et 3D",
    "Edit & Documentary": "Montage et documentaire", "Cartoon & Anime": "Cartoon et anime", "Hand-drawn & Painting": "Dessin et peinture", "Information & Keynote": "Information et keynote",
    "Print & Printmaking": "Imprimé et gravure", Games: "Jeux", "East Asian Traditions": "Traditions d'Asie de l'Est", interactive: "interactif" };
  const cat = (c) => { const v = (fr && CAT_FR[c]) || c || ""; return v.charAt(0).toUpperCase() + v.slice(1); };
  const SYN = { neon: "neon", papier: "paper", encre: "ink", bois: "wood", verre: "glass", carte: "map", donnees: "data", retro: "retro", sombre: "dark", lancement: "launch",
    produit: "product", typo: "type", typographie: "type", dessin: "drawn", aquarelle: "watercolor", peinture: "paint", jeu: "game", jeux: "game", espace: "space", ville: "city",
    luxe: "luxury", lumiere: "light", film: "film", graphique: "chart", interactif: "interactive", ecran: "screen", nature: "nature", eau: "water", feu: "fire", argile: "clay" };
  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PAGE = 48;

  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "text") n.textContent = v; else if (k === "class") n.className = v; else n.setAttribute(k, v === true ? "" : v);
    }
    for (const k of kids) if (k) n.append(k);
    return n;
  };
  const base = root.dataset.src.replace(/assets\/library\.json$/, "");
  const media = (p) => (p && !/^https?:/.test(p) ? base + p : p);

  const input = root.querySelector("input");
  const select = root.querySelector("select");
  const grid = root.querySelector(".lib-grid");
  const count = root.querySelector(".lib-count");
  const more = root.querySelector(".lib-more");
  const srcBtns = [...root.querySelectorAll(".lib-src button")];
  const dlg = document.querySelector(".lib-dlg");
  const dlgTitle = dlg.querySelector("h2");
  const dlgBody = dlg.querySelector(".lib-dlg-body");
  let items = [], shown = [], limit = PAGE, source = "all";
  const prompts = new Map();

  const name = (it) => (it.s === "awesome-opus5-5-videos" ? `@${it.a}` : it.n);
  const meta = (it) => [it.s === "awesome-opus5-5-videos" ? cat(it.c) : cat(it.c), it.d ? `${Math.round(it.d)} ${T.s}` : null].filter(Boolean).join(" · ");

  function filter() {
    const words = norm(input.value).split(/\s+/).filter(Boolean);
    const c = select.value;
    shown = items.filter((it) => (source === "all" || it.s === source) && (!c || it.c === c) && words.every((w) => it._h.includes(w) || (SYN[w] && it._h.includes(SYN[w]))));
    limit = PAGE;
    render();
  }

  function categories() {
    const seen = new Map();
    for (const it of items) if (source === "all" || it.s === source) seen.set(it.c, (seen.get(it.c) || 0) + 1);
    const keep = select.value;
    select.replaceChildren(select.options[0]);
    for (const [c, n] of [...seen].sort((a, b) => cat(a[0]).localeCompare(cat(b[0])))) select.append(el("option", { value: c, text: `${cat(c)} (${n})` }));
    select.value = seen.has(keep) ? keep : "";
  }

  function card(it) {
    const img = it.p ? el("img", { src: media(it.p), alt: "", loading: "lazy", decoding: "async", width: 480, height: 270 }) : el("span", { class: "card-ph", text: cat(it.c) });
    const open = el("button", { type: "button", class: "card-media", "aria-label": `${T.open} : ${name(it)}` }, img, el("span", { class: "card-badge", text: SRC[it.s] }), it.j ? el("span", { class: "card-score", title: T.score, text: `${it.j.toFixed(1)}/10` }) : null);
    open.addEventListener("click", () => show(it));
    const li = el("li", { class: "card" },
      open,
      el("div", { class: "card-body" }, el("h3", { text: name(it) }), el("p", { class: "card-meta", text: meta(it) }), el("p", { class: "card-line", text: it.l })),
      el("div", { class: "card-actions" },
        (() => { const b = el("button", { type: "button", class: "card-prompt", text: T.prompt }); b.addEventListener("click", () => show(it)); return b; })(),
        it.w ? el("a", { href: it.w, target: "_blank", rel: "noopener", text: `${T.film} ↗` }) : null));
    if (it.v && !reduce) {
      let vid;
      li.addEventListener("pointerenter", (e) => {
        if (e.pointerType !== "mouse") return;
        if (!vid) { vid = el("video", { src: media(it.v), muted: true, loop: true, playsinline: true, preload: "auto", "aria-hidden": "true" }); vid.muted = true; open.prepend(vid); }
        vid.hidden = false; vid.play().catch(() => {});
      });
      li.addEventListener("pointerleave", () => { if (vid) { vid.pause(); vid.hidden = true; } });
    }
    return li;
  }

  function render() {
    grid.replaceChildren(...shown.slice(0, limit).map(card));
    count.textContent = shown.length ? T.results(shown.length) : T.none;
    more.hidden = shown.length <= limit;
  }

  function copyBtn(get) {
    const b = el("button", { type: "button", class: "copy", text: T.copy });
    b.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(get()); } catch (e) { return; }
      b.dataset.done = ""; b.textContent = T.copied;
      setTimeout(() => { b.textContent = T.copy; delete b.dataset.done; }, 1500);
    });
    return b;
  }

  async function promptText(it) {
    if (prompts.has(it.u)) return prompts.get(it.u);
    const r = await fetch(it.u);
    if (!r.ok) throw new Error(String(r.status));
    let t = (await r.text()).replace(/\r/g, "");
    const block = t.match(/```(?:text)?\n([\s\S]*?)\n```/);
    if (it.s === "awesome-opus5-5-videos" && block) t = block[1];
    prompts.set(it.u, t.trim());
    return t.trim();
  }

  async function show(it) {
    dlgTitle.textContent = name(it);
    const fig = it.v
      ? el("video", { src: media(it.v), poster: media(it.p), controls: true, muted: true, loop: true, playsinline: true, autoplay: !reduce })
      : it.p ? el("img", { src: media(it.p), alt: "" }) : null;
    if (fig && fig.tagName === "VIDEO") fig.muted = true;
    const links = el("p", { class: "lib-links" },
      it.w ? el("a", { href: it.w, target: "_blank", rel: "noopener", text: `${T.film} ↗` }) : null,
      it.x ? el("a", { href: it.x, target: "_blank", rel: "noopener", text: `${T.post} ↗` }) : null,
      it.g && it.g !== it.w ? el("a", { href: it.g, target: "_blank", rel: "noopener", text: `${T.gallery} ↗` }) : null,
      el("a", { href: it.u, target: "_blank", rel: "noopener", text: `${T.source} ↗` }));
    const cmd = `umd styles get ${it.id}`;
    const pre = el("pre", {}, el("code", { text: T.loading }));
    const promptBox = el("div", { class: "code lib-prompt" }, pre);
    dlgBody.replaceChildren(
      fig ? el("div", { class: "lib-dlg-media" }, fig) : "",
      el("p", { class: "card-meta", text: [SRC[it.s] + (it.s === "awesome-opus5-5-videos" ? ` · @${it.a}` : ""), meta(it), it.j ? `${T.score} ${it.j.toFixed(1)}/10` : null].filter(Boolean).join(" · ") }),
      el("p", { text: it.l }),
      it.f ? el("p", { class: "lib-film", text: it.f }) : "",
      links,
      el("h3", { text: T.inProject }),
      el("div", { class: "code" }, el("pre", {}, el("code", { text: cmd })), copyBtn(() => cmd)),
      el("p", { class: "lib-hint", text: T.inProjectHint }),
      el("h3", { text: T.prompt }),
      it.pp ? el("p", { class: "lib-hint", text: T.partial }) : "",
      promptBox);
    if (!dlg.open) dlg.showModal();
    dlgBody.scrollTop = 0;
    try { history.replaceState(null, "", `#${encodeURIComponent(it.id)}`); } catch (e) { /* file:// */ }
    try {
      const text = await promptText(it);
      if (dlgTitle.textContent !== name(it)) return;
      pre.firstChild.textContent = text;
      promptBox.append(copyBtn(() => text));
    } catch (e) {
      pre.replaceWith(el("p", {}, T.failed + " ", el("a", { href: it.u, target: "_blank", rel: "noopener", text: it.u })));
    }
  }

  dlg.querySelector(".lib-close").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", () => {
    dlg.querySelector("video")?.pause();
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* file:// */ }
  });
  let t;
  input.addEventListener("input", () => { clearTimeout(t); t = setTimeout(filter, 120); });
  select.addEventListener("change", filter);
  for (const b of srcBtns) b.addEventListener("click", () => {
    source = b.dataset.src;
    for (const x of srcBtns) x.setAttribute("aria-pressed", String(x === b));
    categories(); filter();
  });
  more.addEventListener("click", () => { limit += PAGE; render(); });

  fetch(root.dataset.src).then((r) => r.json()).then((data) => {
    const order = { "lemo-opuscar": 0, "mg-styles-15": 1, "awesome-opus5-5-videos": 2 };
    items = data.items.map((it) => ({ ...it, _h: norm([it.id, it.n, it.c, cat(it.c), it.l, it.f, it.a, ...(it.t || [])].join(" ")) }))
      .sort((a, b) => order[a.s] - order[b.s] || (b.j || 0) - (a.j || 0));
    categories(); filter();
    const fromHash = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      const hit = id && items.find((x) => x.id === id);
      if (hit) show(hit);
    };
    fromHash();
    addEventListener("hashchange", fromHash);
  }).catch(() => { count.textContent = T.error; });
})();
