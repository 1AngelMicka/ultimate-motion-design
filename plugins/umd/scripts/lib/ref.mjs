// Referential, project file, flags and thresholds. No dependencies.
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname, resolve, relative, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";

export const PLUGIN_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));

export function pluginVersion() {
  try { return readJson(join(PLUGIN_ROOT, ".claude-plugin", "plugin.json")).version; } catch { return "0.0.0"; }
}

let cached = null;
export function loadReferential() {
  if (cached) return cached;
  const dir = join(PLUGIN_ROOT, "referential");
  const scoring = readJson(join(dir, "scoring.json"));
  const groups = readdirSync(join(dir, "domains")).filter((f) => f.endsWith(".json")).sort()
    .map((f) => readJson(join(dir, "domains", f)));
  cached = {
    version: pluginVersion(),
    scoring: scoring.scoring,
    thresholds: scoring.thresholds,
    flags: scoring.flags,
    derived_flags: scoring.derived_flags,
    profiles: scoring.profiles,
    groups,
    licenses: readJson(join(dir, "licenses.json")),
    slop: readJson(join(dir, "slop-words.json")),
  };
  return cached;
}

export function allDomains(ref) {
  return ref.groups.flatMap((g) => g.domains.map((d) => ({ ...d, group: g.group })));
}

export function motionDir(cwd = process.cwd()) {
  return join(cwd, ".motion");
}

export function loadProject(cwd = process.cwd()) {
  const p = join(motionDir(cwd), "project.json");
  if (!existsSync(p)) return null;
  return readJson(p);
}

export function resolveFlags(flags, ref) {
  const active = new Set(flags || []);
  for (const [name, anyOf] of Object.entries(ref.derived_flags || {})) {
    if (anyOf.some((f) => active.has(f))) active.add(name);
  }
  return active;
}

export function projectFlags(project, ref) {
  const profile = ref.profiles[project?.profile];
  return resolveFlags(project?.flags ?? profile?.default_flags ?? [], ref);
}

export function applies(item, flags) {
  return (item.applies_if || []).every((f) => flags.has(f));
}

export function thresholds(project, ref) {
  const { _note, ...base } = ref.thresholds;
  return { ...base, ...(project?.thresholds || {}) };
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function stamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-");
}

// a path to show the user: relative inside cwd, absolute outside it (never a long chain of ..)
export function shown(cwd, p) {
  const rel = relative(cwd, p);
  return !rel ? "." : rel.startsWith("..") || isAbsolute(rel) ? resolve(p) : rel;
}
