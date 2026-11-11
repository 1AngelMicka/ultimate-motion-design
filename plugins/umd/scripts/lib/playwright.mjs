// Find Playwright without adding a dependency to the plugin: the project's own install first,
// then the shared umd runtime (~/.umd/runtime, created by `umd doctor --fix`).
import { createRequire } from "node:module";
import { join } from "node:path";
import { homedir } from "node:os";
import { pathToFileURL } from "node:url";

export const RUNTIME_DIR = process.env.UMD_RUNTIME || join(homedir(), ".umd", "runtime");

export function resolvePlaywright(cwd = process.cwd()) {
  for (const base of [cwd, RUNTIME_DIR]) {
    const req = createRequire(join(base, "package.json"));
    for (const name of ["playwright", "@playwright/test", "playwright-core"]) {
      try { return { name, path: req.resolve(name), from: base === cwd ? "project" : "umd-runtime" }; } catch { /* next */ }
    }
  }
  return null;
}

export async function loadChromium(cwd) {
  const pw = resolvePlaywright(cwd);
  if (!pw) throw new Error("Playwright not found. Run: node umd.mjs doctor --fix (installs it in ~/.umd/runtime), or npm i -D playwright in the project.");
  const mod = await import(pathToFileURL(pw.path).href);
  const chromium = mod.chromium || mod.default?.chromium;
  if (!chromium) throw new Error(`${pw.name} has no chromium export`);
  return { chromium, pw };
}

export const CHROMIUM_ARGS = [
  "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-unsafe-webgpu",
  "--autoplay-policy=no-user-gesture-required", "--font-render-hinting=none", "--disable-lcd-text",
  "--hide-scrollbars", "--mute-audio",
  // redraw whole tiles: a partial redraw keeps old anti-aliased edges at its border, so a frame drawn in
  // sequence could differ by a pixel from the same frame drawn cold (seen on Linux and macOS with SVG)
  "--disable-partial-raster",
];

export async function launch(chromium, extraArgs = []) {
  const args = [...CHROMIUM_ARGS, ...extraArgs];
  try { return await chromium.launch({ args }); } catch (first) {
    if (/Executable doesn't exist|browserType.launch/i.test(String(first.message))) {
      try { return await chromium.launch({ args, channel: "chrome" }); } catch { /* keep first error */ }
      throw new Error(`Chromium is not installed for Playwright. Run: node umd.mjs doctor --fix\n${String(first.message).split("\n")[0]}`);
    }
    throw first;
  }
}
