// Token transparency: read Claude Code session transcripts for this project and attribute usage
// to the /umd:* command that was running. Reads local files only.
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";

export function transcriptDir(cwd) {
  const base = process.env.CLAUDE_CONFIG_DIR || join(homedir(), ".claude");
  return join(base, "projects", resolve(cwd).replace(/[^a-zA-Z0-9]/g, "-"));
}

const empty = () => ({ input: 0, output: 0, cache_write: 0, cache_read: 0, turns: 0, runs: 0 });
const add = (a, u) => { a.input += u.input_tokens || 0; a.output += u.output_tokens || 0; a.cache_write += u.cache_creation_input_tokens || 0; a.cache_read += u.cache_read_input_tokens || 0; a.turns++; };

function commandOf(entry) {
  if (entry.type !== "user") return null;
  const c = entry.message?.content;
  const text = typeof c === "string" ? c : Array.isArray(c) ? c.map((x) => x.text || "").join(" ") : "";
  const m = text.match(/<command-name>\/?([\w:-]+)<\/command-name>/);
  if (m) return m[1];
  if (Array.isArray(c) && c.every((x) => x.type === "tool_result")) return undefined; // tool results do not change the command
  return text.trim() ? "conversation" : undefined;
}

function readTranscript(file, byCommand, seen, start = "conversation") {
  let current = start;
  const lines = readFileSync(file, "utf8").split("\n");
  for (const l of lines) {
    if (!l.trim()) continue;
    let e;
    try { e = JSON.parse(l); } catch { continue; }
    const cmd = commandOf(e);
    if (cmd !== undefined && cmd !== null) {
      if (/^umd:/.test(cmd) && /<command-name>/.test(JSON.stringify(e.message?.content || ""))) (byCommand[cmd] ||= empty()).runs++; // one run per typed command
      current = cmd;
    }
    const u = e.message?.usage;
    if (e.type === "assistant" && u) {
      const id = e.message.id || e.uuid;
      if (id && seen.has(id)) continue; // streamed messages repeat usage per content block
      if (id) seen.add(id);
      const key = /^umd:/.test(current) ? current : current === "conversation" ? "other (conversation)" : current;
      add((byCommand[key] ||= empty()), u);
    }
    // a skill launched by Claude itself (Skill tool) also starts a new attribution
    if (e.type === "assistant" && Array.isArray(e.message?.content)) {
      const s = e.message.content.find((x) => x.type === "tool_use" && x.name === "Skill" && x.input?.skill);
      if (s) { current = String(s.input.skill).replace(/^\//, ""); if (/^umd:/.test(current)) (byCommand[current] ||= empty()).runs++; }
    }
  }
}

export function tokenReport(cwd, { session = null, days = 30 } = {}) {
  const dir = transcriptDir(cwd);
  if (!existsSync(dir)) return { available: false, dir, note: "No transcripts for this folder yet (they appear after the first Claude Code session here)." };
  const since = Date.now() - days * 86400000;
  const files = readdirSync(dir).filter((f) => f.endsWith(".jsonl") && (!session || f.startsWith(session)))
    .map((f) => join(dir, f)).filter((f) => statSync(f).mtimeMs >= since);
  const byCommand = {};
  const seen = new Set();
  for (const f of files) {
    readTranscript(f, byCommand, seen);
    // subagent transcripts (audits run in parallel agents) live next to the session file
    const sub = f.replace(/\.jsonl$/, "");
    for (const d of [join(sub, "subagents"), sub]) {
      if (!existsSync(d) || !statSync(d).isDirectory()) continue;
      for (const s of readdirSync(d).filter((x) => x.endsWith(".jsonl"))) readTranscript(join(d, s), byCommand, seen, "subagents");
    }
  }
  const total = empty();
  for (const v of Object.values(byCommand)) { total.runs += v.runs; total.input += v.input; total.output += v.output; total.cache_write += v.cache_write; total.cache_read += v.cache_read; total.turns += v.turns; }
  const rows = Object.entries(byCommand).map(([command, v]) => ({ command, ...v, total: v.input + v.output + v.cache_write + v.cache_read }))
    .sort((a, b) => b.total - a.total);
  return { available: true, sessions: files.length, days, by_command: rows, total: { ...total, total: total.input + total.output + total.cache_write + total.cache_read },
    note: "cache_read tokens are billed at a fraction of input tokens; output tokens cost the most." };
}
