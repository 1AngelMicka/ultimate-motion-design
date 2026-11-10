// Theme toggle, copy buttons, menu open on desktop / closed on phones, demo video respects reduced motion.
(() => {
  const root = document.documentElement;
  const dark = () => root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  document.querySelector(".theme")?.addEventListener("click", () => {
    root.dataset.theme = dark() ? "light" : "dark";
    try { localStorage.setItem("umd-theme", root.dataset.theme); } catch (e) { /* private mode */ }
  });

  for (const btn of document.querySelectorAll(".copy")) {
    btn.addEventListener("click", async () => {
      const code = btn.parentElement.querySelector("code")?.innerText || "";
      try { await navigator.clipboard.writeText(code); } catch (e) { return; }
      const label = btn.textContent;
      btn.dataset.done = "";
      btn.textContent = root.lang === "fr" ? "Copié" : "Copied";
      setTimeout(() => { btn.textContent = label; delete btn.dataset.done; }, 1500);
    });
  }

  const side = document.querySelector(".side");
  const wide = matchMedia("(min-width: 861px)");
  const sync = () => { if (side) side.open = wide.matches; };
  sync();
  wide.addEventListener("change", sync);

  const video = document.querySelector(".hero-media video");
  if (video && matchMedia("(prefers-reduced-motion: reduce)").matches) { video.removeAttribute("autoplay"); video.pause(); video.controls = true; }
})();
