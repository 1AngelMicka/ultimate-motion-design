// Token cost of the next step, told to the user before it runs. Measured from this project's own transcripts
// when the step already ran here (median per run), otherwise estimated from what the step will do: agents
// launched, images read, files read. Tokens are counted the way /umd:tokens counts them (input + output +
// cache writes + cache reads); most of them are cache reads, billed at a fraction.

const K = 1000;
// One agent run (fresh context: its instructions, the files and images it reads, its reply), in tokens
const AGENT = { critic: [25 * K, 45 * K], auditor: [25 * K, 60 * K] };
const IMAGE = 1800; // one 1536 px contact sheet

function ranges(step, p, st) {
  const dur = Number(p.duration_s || 30);
  const sheets = 1 + (dur > 40 ? Math.min(4, Math.ceil(dur / 40)) : 0);
  const rounds = Number(p.quality_target || 8) >= 9 ? 3 : 2; // likely critic rounds (3 at most)
  const beats = Math.max(st.storyboard?.beats || 0, Math.round(dur / 2.5), 3);
  const sheetCost = (sheets - 1) * IMAGE;
  switch (step) {
    case "doctor": return { lo: 2 * K, hi: 8 * K, drivers: ["one CLI call; installs run outside the model"] };
    case "kickoff": return { lo: 12 * K, hi: 30 * K, drivers: ["a few questions, then writing BRIEF.md and project.json"] };
    case "storyboard": return {
      lo: 20 * K + 3 * K + 1 * AGENT.critic[0], hi: 45 * K + 8 * K + 3 * (AGENT.critic[1] + sheetCost),
      drivers: [`script and ${beats} beats`, "one style prompt read once (1 to 8 k)", `up to 3 critique rounds on the stills (a fresh critic agent each, ${AGENT.critic[0] / K}–${AGENT.critic[1] / K} k)`],
    };
    case "build": return {
      lo: 30 * K + beats * 3 * K + rounds * AGENT.critic[0], hi: 60 * K + beats * 8 * K + 3 * (AGENT.critic[1] + sheetCost),
      drivers: [`${beats} beats to build`, `${rounds} to 3 draft rounds, each with a fresh critic agent (${AGENT.critic[0] / K}–${AGENT.critic[1] / K} k)`, ...(sheets > 1 ? [`${sheets} contact sheets per round (piece over 40 s)`] : [])],
    };
    case "render": return { lo: 4 * K, hi: 15 * K, drivers: ["the render itself costs no tokens; reading its summary does"] };
    case "audit": {
      const groups = Math.max(1, Math.min(4, st.audit_groups || 4));
      return {
        lo: 8 * K + groups * AGENT.auditor[0] * (st.last_audit ? 0.4 : 1), hi: 15 * K + groups * (AGENT.auditor[1] + sheetCost),
        drivers: [`automatic checks in code (no tokens), then up to ${groups} auditor agents in parallel (${AGENT.auditor[0] / K}–${AGENT.auditor[1] / K} k each)`, st.last_audit ? "incremental: unchanged criteria are carried over" : "first audit: every criterion is judged"],
      };
    }
    case "fix": return { lo: 15 * K, hi: 80 * K, drivers: ["each fix is a small edit plus the narrowest check; a re-render and a scoped re-audit follow"] };
    case "deliver": return { lo: 3 * K, hi: 10 * K, drivers: ["copies, manifest and credits in code"] };
    default: return { lo: 0, hi: 0, drivers: [] };
  }
}

// the level follows the likely cost (middle of the range), so only the steps that usually cost a lot ask first
const level = (lo, hi) => { const mid = (lo + hi) / 2; return mid >= 150 * K ? "high" : mid >= 50 * K ? "medium" : "low"; };
const fmt = (n) => (n >= 10 * K ? `${Math.round(n / K)} k` : `${Math.round(n / 100) / 10} k`);

const CHEAPER = {
  storyboard: ["`quality_target` 8 instead of 9 (fewer rounds)", "fewer key stills (4 instead of 8)"],
  build: ["2 draft rounds instead of 3", "build one sequence at a time (`/umd:build 1-6`)", "auditors and critics on a cheaper model: `\"audit_model\": \"sonnet\"`"],
  audit: ["`/umd:audit quick`: automatic checks only, no agent", "a scoped audit (`/umd:audit TXT`, `/umd:audit blockers`)", "`\"audit_model\": \"sonnet\"` in project.json"],
  fix: ["`/umd:fix blockers` only"],
};

// reasoning effort that pays for each step: iterate at medium (plans, stills, notes), build and fix at high
const EFFORT = { doctor: "low", kickoff: "medium", storyboard: "medium", build: "high", render: "low", audit: "medium", fix: "high", deliver: "low" };

// history: rows from tokenReport().by_command ({ command, total, runs })
export function estimateCost(step, project = {}, state = {}, history = null) {
  const r = ranges(step, project, state);
  const row = history?.find?.((h) => h.command === `umd:${step}` && h.runs > 0);
  const measured = row ? Math.round(row.total / row.runs) : null;
  const lo = measured ? Math.round(measured * 0.7) : r.lo, hi = measured ? Math.round(measured * 1.3) : r.hi;
  const out = { step, level: level(lo, hi), tokens: `${fmt(lo)}–${fmt(hi)}`, source: measured ? `measured: ${row.runs} earlier run(s) in this project` : "estimate", drivers: r.drivers,
    effort: EFFORT[step] || undefined };
  if (CHEAPER[step] && out.level !== "low") out.cheaper = CHEAPER[step];
  const budget = Number(project.token_budget || 0);
  if (budget && state.tokens_used != null) {
    out.budget = { budget, used: state.tokens_used, after: state.tokens_used + hi };
    if (state.tokens_used + hi > budget) out.over_budget = true;
  }
  // ask before running when the step is expensive (cost_confirm: "high" by default, "medium", or "never")
  const confirm = project.cost_confirm || "high";
  out.confirm = !!out.over_budget || (confirm === "medium" && out.level !== "low") || (confirm === "high" && out.level === "high");
  return out;
}
