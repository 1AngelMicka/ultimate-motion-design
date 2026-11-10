// Run a command and return a compact summary instead of its full output (pattern from quality-pack, MIT).
// The full output goes to a log file on disk; Claude only reads it when the summary is not enough.
// Render, encode and install commands print thousands of progress lines when only the failures matter.
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SUPERVISOR = join(dirname(fileURLToPath(import.meta.url)), "supervise.mjs");

const SIGNAL = /\b(error|errors|fail|failed|failing|failure|exception|traceback|panic|fatal|warn|warning|vulnerab\w*|critical|denied|refused|timeout|cannot|not found|undefined|unexpected|invalid)\b|✗|✖|×|❌|\bFAIL\b|\bERR!/i;
const NOISE = /^\s*$|node_modules[\\/]|^\s+at\s.+\(node:internal|^\s*\^+\s*$|^frame=\s*\d+|^\s*\d+%\||Rendered \d+\/\d+|Encoded \d+\/\d+/;
export const estimateTokens = (text) => Math.ceil((text || "").length / 4);

export function summarize(output, { maxSignal = 30, tail = 12 } = {}) {
  const lines = output.split(/\r?\n|\r/);
  const signal = [];
  const seen = new Set();
  for (const l of lines) {
    if (NOISE.test(l) || !SIGNAL.test(l)) continue;
    const key = l.trim().replace(/\d+/g, "#");
    if (seen.has(key)) continue;
    seen.add(key);
    signal.push(l.length > 300 ? l.slice(0, 300) + "…" : l);
    if (signal.length >= maxSignal) break;
  }
  const last = lines.filter((l) => l.trim() && !NOISE.test(l)).slice(-tail).map((l) => (l.length > 300 ? l.slice(0, 300) + "…" : l));
  return { total_lines: lines.length, signal_lines: signal, last_lines: last };
}

export function recordSavings(statsFile, full, returned) {
  let stats = { commands: 0, full_output: 0, returned: 0, saved: 0 };
  try { if (existsSync(statsFile)) stats = JSON.parse(readFileSync(statsFile, "utf8")); } catch { /* reset */ }
  stats.commands++;
  stats.full_output += full;
  stats.returned += returned;
  stats.saved += Math.max(0, full - returned);
  try { writeFileSync(statsFile, JSON.stringify(stats, null, 2)); } catch { /* read-only */ }
}

export function runCommand(label, command, { cwd, logDir, timeoutMs = 60 * 60 * 1000, env = {}, statsFile } = {}) {
  const started = Date.now();
  // the supervisor kills the whole process tree on timeout (a plain spawnSync timeout kills only the shell)
  const r = spawnSync(process.execPath, [SUPERVISOR, String(timeoutMs), command], { cwd, encoding: "utf8", maxBuffer: 512 * 1024 * 1024, windowsHide: true,
    env: { ...process.env, CI: process.env.CI || "1", FORCE_COLOR: "0", NO_COLOR: "1", ...env } });
  const output = `${r.stdout || ""}${r.stderr ? `\n${r.stderr}` : ""}`.replace(/\x1b\[[0-9;]*[A-Za-z]/g, "");
  const safe = label.replace(/[^a-z0-9_.-]+/gi, "-").slice(0, 60) || "command";
  mkdirSync(logDir, { recursive: true });
  const logFile = join(logDir, `${safe}.log`);
  writeFileSync(logFile, `$ ${command}\n# exit ${r.status ?? "killed"} after ${Math.round((Date.now() - started) / 1000)} s\n\n${output}`);
  const result = {
    label, command, exit_code: r.status, timed_out: r.status === 124 && /umd: timed out after/.test(r.stderr || ""),
    duration_s: Math.round((Date.now() - started) / 100) / 10, log: relative(cwd, logFile), ...summarize(output),
  };
  const returned = estimateTokens(JSON.stringify(result));
  result.tokens = { full_output: estimateTokens(output), returned, saved: Math.max(0, estimateTokens(output) - returned) };
  if (statsFile) recordSavings(statsFile, result.tokens.full_output, returned);
  return result;
}
