// Word-timed captions: read word timestamps (forced alignment or ASR), group them into readable cues,
// write ASS (karaoke / pop / line), SRT or VTT, and check a caption file against the reference words.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, relative, extname, dirname } from "node:path";
import { shown } from "./ref.mjs";

const clean = (w) => String(w || "").replace(/\s+/g, " ").trim();

// Accepts: [{word,start,end}], {words:[...]}, {segments:[{words:[{word,start,end}]}]} (faster-whisper, WhisperX),
// whisper.cpp full JSON ({transcription:[{tokens:[{text,offsets:{from,to}}]}]}, ms), or [{text,start,end}].
export function readWords(file) {
  const j = JSON.parse(readFileSync(file, "utf8"));
  let words = [];
  const push = (w, s, e) => { const t = clean(w); if (t && Number.isFinite(+s) && Number.isFinite(+e)) words.push({ word: t, start: +s, end: +e }); };
  if (Array.isArray(j)) j.forEach((w) => push(w.word ?? w.text, w.start, w.end));
  else if (Array.isArray(j.words)) j.words.forEach((w) => push(w.word ?? w.text, w.start, w.end));
  else if (Array.isArray(j.segments)) j.segments.forEach((s) => (s.words || []).forEach((w) => push(w.word ?? w.text, w.start, w.end)));
  else if (Array.isArray(j.transcription)) {
    for (const seg of j.transcription) for (const t of seg.tokens || []) {
      if (/^\[_|^\[/.test(t.text)) continue;
      const txt = t.text;
      if (/^\s/.test(txt) || !words.length) push(txt, t.offsets.from / 1000, t.offsets.to / 1000);
      else { const last = words[words.length - 1]; last.word += clean(txt); last.end = t.offsets.to / 1000; }
    }
  }
  words = words.filter((w) => w.end >= w.start).sort((a, b) => a.start - b.start);
  if (!words.length) throw new Error(`No word timestamps found in ${file}`);
  return words;
}

export function groupCues(words, { maxChars = 32, maxLines = 2, maxGap = 0.6, maxDur = 4, style = "karaoke" } = {}) {
  const perCue = style === "pop" ? Math.min(maxChars, 14) : maxChars * maxLines;
  const cues = [];
  let cur = null;
  for (const w of words) {
    const len = cur ? cur.words.reduce((s, x) => s + x.word.length + 1, 0) : 0;
    const gap = cur ? w.start - cur.words[cur.words.length - 1].end : 0;
    const sentenceEnd = cur && /[.!?…]$/.test(cur.words[cur.words.length - 1].word);
    if (!cur || len + w.word.length > perCue || gap > maxGap || w.end - cur.words[0].start > maxDur || sentenceEnd || (style === "pop" && cur.words.length >= 3)) {
      cur = { words: [] };
      cues.push(cur);
    }
    cur.words.push(w);
  }
  return cues.map((c) => {
    const lines = [];
    let line = "";
    for (const w of c.words) {
      if (line && (line + " " + w.word).length > maxChars) { lines.push(line); line = w.word; } else line = line ? `${line} ${w.word}` : w.word;
    }
    if (line) lines.push(line);
    return { start: c.words[0].start, end: c.words[c.words.length - 1].end, words: c.words, lines };
  });
}

const assTime = (s) => { const cs = Math.max(0, Math.round(s * 100)); const h = Math.floor(cs / 360000), m = Math.floor(cs / 6000) % 60, sec = Math.floor(cs / 100) % 60; return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(cs % 100).padStart(2, "0")}`; };
const srtTime = (s, sep = ",") => { const ms = Math.max(0, Math.round(s * 1000)); const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}${sep}${String(ms % 1000).padStart(3, "0")}`; };
const assColor = (hex, alpha = 0) => { const h = String(hex).replace("#", "").padEnd(6, "0"); return `&H${alpha.toString(16).padStart(2, "0").toUpperCase()}${h.slice(4, 6)}${h.slice(2, 4)}${h.slice(0, 2)}`.toUpperCase(); };

export function toAss(cues, { width = 1920, height = 1080, font = "Inter", color = "#FFFFFF", highlight = "#FFD400", style = "karaoke", outline = 0.06 } = {}) {
  const portrait = height > width;
  const size = Math.round(height * (style === "pop" ? (portrait ? 0.055 : 0.075) : (portrait ? 0.042 : 0.05)));
  const marginV = Math.round(height * (portrait ? 0.22 : 0.08)); // above platform UI in 9:16
  const align = style === "pop" ? 5 : 2;
  const head = `[Script Info]\nScriptType: v4.00+\nPlayResX: ${width}\nPlayResY: ${height}\nWrapStyle: 2\nScaledBorderAndShadow: yes\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,${font},${size},${assColor(style === "karaoke" ? highlight : color)},${assColor(color)},${assColor("#000000")},${assColor("#000000", 0x80)},-1,0,0,0,100,100,0,0,1,${Math.max(2, Math.round(size * outline))},0,${align},${Math.round(width * 0.08)},${Math.round(width * 0.08)},${marginV},1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
  const lines = cues.map((c) => {
    let text;
    if (style === "karaoke") {
      let lineLen = 0;
      text = c.words.map((w, i) => {
        const dur = Math.max(1, Math.round(((c.words[i + 1]?.start ?? w.end) - w.start) * 100));
        const brk = i > 0 && c.lines.length > 1 && lineLen + w.word.length > c.lines[0].length && lineLen <= c.lines[0].length ? "\\N" : (i ? " " : "");
        lineLen += w.word.length + 1;
        return `${brk}{\\k${dur}}${w.word.replace(/[{}]/g, "")}`;
      }).join("");
    } else text = c.lines.join("\\N").replace(/[{}]/g, "");
    return `Dialogue: 0,${assTime(c.start)},${assTime(Math.max(c.end, c.start + 0.3))},Default,,0,0,0,,${style === "pop" ? "{\\fad(60,0)}" : ""}${text}`;
  });
  return head + lines.join("\n") + "\n";
}

export function toSrt(cues, vtt = false) {
  const body = cues.map((c, i) => `${vtt ? "" : `${i + 1}\n`}${srtTime(c.start, vtt ? "." : ",")} --> ${srtTime(Math.max(c.end, c.start + 0.3), vtt ? "." : ",")}\n${c.lines.join("\n")}\n`).join("\n");
  return vtt ? `WEBVTT\n\n${body}` : body;
}

export function makeCaptions(wordsFile, out, opts = {}) {
  const cwd = opts.cwd || process.cwd();
  const words = readWords(resolve(cwd, wordsFile));
  const cues = groupCues(words, opts);
  const outAbs = resolve(cwd, out);
  mkdirSync(dirname(outAbs), { recursive: true });
  const ext = extname(outAbs).toLowerCase();
  writeFileSync(outAbs, ext === ".srt" ? toSrt(cues) : ext === ".vtt" ? toSrt(cues, true) : toAss(cues, opts));
  return { output: shown(cwd, outAbs), words: words.length, cues: cues.length, style: opts.style || "karaoke" };
}

const parseClock = (s) => { const m = s.trim().match(/(?:(\d+):)?(\d+):(\d+)[.,](\d+)/); if (!m) return NaN; const frac = m[4].length === 2 ? Number(m[4]) / 100 : Number(m[4]) / 1000; return Number(m[1] || 0) * 3600 + Number(m[2]) * 60 + Number(m[3]) + frac; };

export function readCues(file) {
  const txt = readFileSync(file, "utf8").replace(/\r/g, "");
  const ext = extname(file).toLowerCase();
  const cues = [];
  if (ext === ".ass" || ext === ".ssa") {
    for (const l of txt.split("\n")) {
      if (!l.startsWith("Dialogue:")) continue;
      const parts = l.slice(9).split(",");
      const text = parts.slice(9).join(",");
      const lines = text.replace(/\{[^}]*\}/g, "").split(/\\N|\\n/);
      cues.push({ start: parseClock(parts[1]), end: parseClock(parts[2]), lines, text: lines.join(" ") });
    }
  } else {
    for (const block of txt.split(/\n\n+/)) {
      const m = block.match(/([\d:.,]+)\s*-->\s*([\d:.,]+)[^\n]*\n([\s\S]*)/);
      if (!m) continue;
      const lines = m[3].split("\n").map((x) => x.replace(/<[^>]+>/g, "").trim()).filter(Boolean);
      cues.push({ start: parseClock(m[1]), end: parseClock(m[2]), lines, text: lines.join(" ") });
    }
  }
  return cues;
}

const normWord = (w) => w.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}]+/gu, "");

export function checkCaptions(subsFile, wordsFile, { cwd = process.cwd() } = {}) {
  const cues = readCues(resolve(cwd, subsFile));
  const words = readWords(resolve(cwd, wordsFile));
  const capWords = [];
  for (const c of cues) {
    const ws = c.text.split(/\s+/).map(normWord).filter(Boolean);
    ws.forEach((w, i) => capWords.push({ w, cue: c, first: i === 0 }));
  }
  // greedy in-order matching
  let j = 0, matched = 0;
  const offsets = [];
  for (const ref of words) {
    const w = normWord(ref.word);
    if (!w) continue;
    let k = j;
    while (k < capWords.length && k < j + 8 && capWords[k].w !== w) k++;
    if (k < capWords.length && capWords[k].w === w) {
      matched++;
      if (capWords[k].first) offsets.push(Math.abs(capWords[k].cue.start - ref.start) * 1000);
      j = k + 1;
    }
  }
  const refCount = words.filter((w) => normWord(w.word)).length;
  const cps = cues.map((c) => c.text.replace(/\s+/g, " ").length / Math.max(0.1, c.end - c.start));
  return {
    subs: shown(cwd, resolve(cwd, subsFile)), cues: cues.length, reference_words: refCount,
    coverage: refCount ? Math.round((matched / refCount) * 1000) / 1000 : 0,
    max_offset_ms: offsets.length ? Math.round(Math.max(...offsets)) : null,
    mean_offset_ms: offsets.length ? Math.round(offsets.reduce((s, x) => s + x, 0) / offsets.length) : null,
    max_cps: cps.length ? Math.round(Math.max(...cps) * 10) / 10 : null,
    max_lines: cues.length ? Math.max(...cues.map((c) => c.lines.length)) : 0,
  };
}
