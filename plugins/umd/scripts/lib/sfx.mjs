// A small sound-effect palette synthesised by FFmpeg: no download, no licence to track (the files are the user's),
// deterministic (seeded noise), 48 kHz stereo, peaks limited to about -1 dBFS. Library or recorded sounds carry more
// character; these cover the everyday motion-design cues and the drafts.
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { ff } from "./ffmpeg.mjs";
import { recordAsset } from "./commons.mjs";
import { shown } from "./ref.mjs";

const r3 = (x) => Math.round(x * 1000) / 1000;
// each kind: default length, what it is for, and its graph (sources and filters ending in [s]); D = length, S = seed
export const KINDS = {
  whoosh: { d: 0.8, use: "a move across the frame, a transition; peak on the arrival frame", graph: (D, S) =>
    `anoisesrc=d=${D}:c=pink:r=48000:s=${S}:a=0.9,highpass=f=250,lowpass=f=5000,afade=t=in:d=${r3(D * 0.6)}:curve=exp,afade=t=out:st=${r3(D * 0.6)}:d=${r3(D * 0.4)}:curve=exp,aformat=channel_layouts=stereo,apulsator=hz=${r3(1 / (2 * D))}:amount=0.7[s]` },
  swipe: { d: 0.3, use: "a quick slide, a card flick, a UI swipe", graph: (D, S) =>
    `anoisesrc=d=${D}:c=white:r=48000:s=${S}:a=0.7,highpass=f=900,lowpass=f=9000,afade=t=in:d=${r3(D * 0.5)}:curve=exp,afade=t=out:st=${r3(D * 0.5)}:d=${r3(D * 0.5)}:curve=exp,aformat=channel_layouts=stereo,apulsator=hz=${r3(1 / (2 * D))}:amount=0.6[s]` },
  riser: { d: 2.0, use: "tension into a reveal; ends exactly on the hit frame", graph: (D, S) =>
    `aevalsrc='0.22*sin(2*PI*(150*t+${r3(1350 / (2 * D))}*t*t))':s=48000:d=${D}[a];anoisesrc=d=${D}:c=white:r=48000:s=${S}:a=0.5,highpass=f=2500[b];[a][b]amix=inputs=2:normalize=0,afade=t=in:d=${D}:curve=exp,aformat=channel_layouts=stereo[s]` },
  impact: { d: 1.2, use: "the hero moment, a logo landing, a hard cut on a beat", graph: (D, S) =>
    `aevalsrc='0.95*sin(2*PI*(55*t-8*t*t))*exp(-4*t)':s=48000:d=${D}[a];anoisesrc=d=${D}:c=white:r=48000:s=${S}:a=0.9,lowpass=f=2500,volume='exp(-28*t)':eval=frame[b];[a][b]amix=inputs=2:normalize=0,aformat=channel_layouts=stereo[s]` },
  subdrop: { d: 1.5, use: "weight under an impact or a scene change, felt more than heard", graph: (D) =>
    `aevalsrc='0.95*sin(2*PI*(110*t-${r3(75 / (2 * D))}*t*t))*exp(-2.5*t)':s=48000:d=${D},aformat=channel_layouts=stereo[s]` },
  click: { d: 0.04, use: "a cursor press, a toggle, a key", graph: (D, S) =>
    `anoisesrc=d=${D}:c=white:r=48000:s=${S}:a=0.9,highpass=f=2000,volume='exp(-180*t)':eval=frame,aformat=channel_layouts=stereo[s]` },
  tick: { d: 0.05, use: "a counter step, a clock, a list item appearing", graph: (D) =>
    `aevalsrc='0.6*sin(2*PI*2400*t)*exp(-120*t)':s=48000:d=${D},aformat=channel_layouts=stereo[s]` },
  pop: { d: 0.12, use: "a bubble, an icon or a badge appearing", graph: (D) =>
    `aevalsrc='0.7*sin(2*PI*(400*t+${r3(1000 / (2 * D))}*t*t))*(1-exp(-400*t))*exp(-30*t)':s=48000:d=${D},aformat=channel_layouts=stereo[s]` },
  chime: { d: 1.0, use: "a success state, a notification, a gentle end", graph: (D) =>
    `aevalsrc='0.4*sin(2*PI*880*t)*exp(-5*t)+0.4*sin(2*PI*1318.5*t)*exp(-5*(t-0.12))*gte(t,0.12)':s=48000:d=${D},aformat=channel_layouts=stereo[s]` },
  shimmer: { d: 1.6, use: "sparkle on a premium reveal, light passing over glass", graph: (D) =>
    `aevalsrc='0.12*(sin(2*PI*2093*t)+sin(2*PI*2637*t)+sin(2*PI*3136*t)+sin(2*PI*4186*t))':s=48000:d=${D},tremolo=f=9:d=0.6,afade=t=in:d=${r3(D * 0.2)},afade=t=out:st=${r3(D * 0.2)}:d=${r3(D * 0.8)}:curve=exp,aformat=channel_layouts=stereo[s]` },
  glitch: { d: 0.4, use: "a digital cut, an error, a tech transition", graph: (D, S) =>
    `anoisesrc=d=${D}:c=white:r=48000:s=${S}:a=0.8,bandpass=f=1800:width_type=o:w=2,tremolo=f=38:d=1,acrusher=bits=6:mode=log:aa=0.5,aformat=channel_layouts=stereo[s]` },
  roomtone: { d: 5.0, use: "a quiet air bed under silence, so a pause never sounds like a dropout", graph: (D, S) =>
    `anoisesrc=d=${D}:c=brown:r=48000:s=${S}:a=0.5,lowpass=f=300,volume=-28dB,aformat=channel_layouts=stereo[s]` },
};

export function makeSfx(kind, { cwd = process.cwd(), out = null, dur = null, seed = 7, gainDb = 0, lock = true } = {}) {
  const k = KINDS[kind];
  if (!k) throw new Error(`Unknown sound "${kind}". Kinds: ${Object.keys(KINDS).join(", ")}`);
  const D = r3(dur || k.d);
  const file = resolve(cwd, out || `assets/audio/sfx-${kind}.wav`);
  mkdirSync(dirname(file), { recursive: true });
  const run = (gain) => {
    const graph = `${k.graph(D, seed)};[s]volume=${r3(gain)}dB,alimiter=limit=0.89:level=false,atrim=0:${D}[out]`;
    const r = ff(["-hide_banner", "-loglevel", "error", "-y", "-filter_complex", graph, "-map", "[out]", "-ar", "48000", "-c:a", "pcm_s16le", file]);
    if (r.code !== 0) throw new Error(`ffmpeg could not make "${kind}": ${r.stderr.trim().split(/\r?\n/).slice(-2).join(" | ")}`);
  };
  // two passes: measure the peak, then set every effect to the same peak (-1.5 dBFS) so they mix predictably;
  // the room tone stays a quiet bed. --gain then moves it from there.
  run(0);
  if (kind !== "roomtone") {
    const a = ff(["-hide_banner", "-i", file, "-af", "astats=metadata=0:measure_overall=Peak_level:measure_perchannel=none", "-f", "null", "-"]);
    const peak = Number((a.stderr.match(/Peak level dB:\s*(-?[\d.]+)/) || [])[1]);
    if (Number.isFinite(peak)) run(-1.5 - peak + gainDb);
  } else if (gainDb) run(gainDb);
  const path = shown(cwd, file).replace(/\\/g, "/");
  const res = { file: path, kind, seconds: D, use: k.use };
  if (lock) res.lock = recordAsset(cwd, { path, source: "umd sfx (synthesised by FFmpeg)", license: "own work", author: "generated in this project", credit_line: "none needed", recipe: `umd sfx ${kind} --dur ${D} --seed ${seed}` });
  return res;
}
