// Turn the collected evidence into statuses for every "auto" criterion, in code, without an agent.
// This is where most of the audit's token savings come from: Claude only reviews the "inspect" criteria.
const f1 = (x) => (x == null ? "?" : Math.round(x * 10) / 10);

export function autocheck(ev, th, project) {
  const R = {};
  const set = (id, status, evidence, fix = "") => { R[id] = { status, evidence, ...(status === "pass" ? {} : { fix }) }; };
  const unknown = (id, why, fix) => set(id, "unknown", why, fix);
  const a = ev.analysis, l = ev.lint, lic = ev.licenses, cap = ev.captions, web = ev.webperf, det = ev.determinism, vm = ev.vmaf;
  const src = a ? `analysis.json (${a.file})` : null;

  // --- lint-based
  if (l) {
    const sb = l.storyboard;
    if (!sb) unknown("NAR-03", "no .motion/storyboard.md", "Write the storyboard with /umd:storyboard (table: #, duration, shot, on-screen text, motion, sound, intent).");
    else if (sb.beats === 0) set("NAR-03", "fail", "storyboard.md has no beat rows", "Use the storyboard table with one numbered row per beat.");
    else set("NAR-03", sb.beats_missing_duration + sb.beats_missing_intent === 0 ? "pass" : "partial",
      `lint: ${sb.beats} beats, ${sb.beats_missing_duration} without duration, ${sb.beats_missing_intent} without intent`, "Give every beat a duration and one intent at the end of its line.");
    const slop = l.slop?.count || 0;
    set("NAR-05", slop === 0 ? "pass" : "fail", slop ? `lint: ${slop} slop phrase(s): ${(l.slop.at || []).slice(0, 3).join("; ")}` : "lint: 0 slop phrases in scripts, captions and on-screen text",
      "Rewrite these lines in plain words (see references/craft/anti-slop.md).");
    const hc = l.hardcoded_motion?.count || 0;
    set("MOT-01", hc <= th.hardcoded_motion_max ? "pass" : hc <= th.hardcoded_motion_max * 4 ? "partial" : "fail",
      `lint: ${hc} hard-coded duration/easing value(s) outside the token file${hc ? ` (${(l.hardcoded_motion.at || []).slice(0, 3).join("; ")})` : ""}`,
      "Move durations and curves to .motion/motion-tokens.json (CSS variables or a tokens module) and reference them.");
    const lp = (l.layout_props?.count || 0) + (l.transition_all?.count || 0);
    set("MOT-06", lp === 0 ? "pass" : "fail", `lint: ${l.layout_props?.count || 0} layout-property animation(s), ${l.transition_all?.count || 0} transition: all${lp ? ` (${[...(l.layout_props?.at || []), ...(l.transition_all?.at || [])].slice(0, 3).join("; ")})` : ""}`,
      "Animate transform and opacity instead (scale/translate), and list explicit properties in transitions.");
    const wc = l.will_change?.count || 0;
    set("WEB-06", wc <= 5 ? "pass" : "partial", `lint: ${wc} will-change declaration(s)`, "Set will-change only during the animation, or remove it.");
    if (sb) {
      set("TXT-01", sb.text_too_short === 0 ? "pass" : "fail", sb.text_too_short ? `lint: ${sb.text_too_short} text beat(s) too short: ${sb.text_too_short_at.slice(0, 2).join("; ")}` : `lint: every on-screen text in ${sb.beats} beats has enough time (min ${th.text_min_s}s, ${th.text_words_per_s} words/s + 0.5s)`,
        "Lengthen these beats or cut words: display time ≥ max(1.2 s, words ÷ 3 + 0.5 s).");
    } else unknown("TXT-01", "no storyboard to read text durations from", "Write .motion/storyboard.md with an on-screen text column and durations.");
    const st = l.stills;
    set("ART-01", st.ok ? "pass" : "fail", `lint: ${st.count} still(s) in .motion/stills (need ${st.needed}), storyboard validation line ${l.storyboard?.stills_validated ? "present" : "missing"}`,
      "Render key stills with umd still, compare them with the reference, fix up to 3 rounds, then add \"Stills validated YYYY-MM-DD\" to storyboard.md.");
    const ra = l.remote_assets?.count || 0;
    set("REN-04", ra === 0 ? "pass" : "fail", `lint: ${ra} remote font/asset URL(s)${ra ? ` (${l.remote_assets.at.slice(0, 2).join("; ")})` : ""}`, "Self-host fonts (Fontsource) and download assets into the project; record them in assets.lock.json.");
  }

  // --- analysis-based
  if (a?.probe) {
    const p = a.probe;
    if (p.width) {
      const longDead = (a.dead_air || []).filter((d) => d.duration > th.dead_air_s);
      set("TIM-01", longDead.length ? "fail" : "pass", longDead.length ? `${src}: dead air ${longDead.map((d) => `${d.start}–${d.end}s`).join(", ")}` : `${src}: no segment over ${th.dead_air_s}s below motion floor ${th.motion_floor}`,
        "Add a meaningful event in these spans (new element, camera move, text beat), or mark an intended hold in the storyboard.");
      const longFreeze = (a.freezes || []).filter((x) => x.duration > th.freeze_s);
      set("LIF-01", longFreeze.length ? "fail" : "pass", longFreeze.length ? `${src}: frozen ${longFreeze.map((x) => `${x.start}–${x.end}s`).join(", ")}` : `${src}: no frozen segment over ${th.freeze_s}s`,
        "Keep something alive in these shots (breathing, ambient particles, slow drift), including the last shot.");
      const fl = a.flashes || { max_per_s: 0 };
      set("SAF-01", fl.max_per_s <= th.flashes_per_s ? "pass" : "fail", `${src}: max ${fl.max_per_s} flash(es) per second${fl.at != null ? ` at ${fl.at}s` : ""} (full-frame luminance)`,
        "Slow down or soften the flashing (fewer than 3 per second, smaller luminance change).");
      const want = { w: project?.format?.width, h: project?.format?.height, fps: project?.format?.fps };
      const specOk = (!want.w || want.w === p.width) && (!want.h || want.h === p.height) && (!want.fps || Math.abs(want.fps - p.fps) < 0.01) && p.cfr !== false && (!/mp4|mov/.test(p.container) || p.pix_fmt === "yuv420p" || p.has_alpha);
      set("REN-02", specOk ? "pass" : "fail", `${src}: ${p.width}x${p.height} ${p.fps} fps ${p.cfr ? "CFR" : "VFR"} ${p.vcodec} ${p.pix_fmt}${want.w ? ` (brief ${want.w}x${want.h} ${want.fps || "?"} fps)` : ""}`,
        "Render at the brief's size and fps; encode H.264 High yuv420p with constant frame rate.");
      const blk = (a.black || []).filter((b) => b.duration > th.black_frames_max_s && !(b.start <= 0.05 && project?.intended_fade_in) && !(b.end >= p.duration - 0.05 && project?.intended_fade_out));
      set("REN-05", blk.length || a.first_frame_black ? "partial" : "pass", blk.length || a.first_frame_black ? `${src}: black ${(a.black || []).map((b) => `${b.start}–${b.end}s`).join(", ")}` : `${src}: no unintended black frames`,
        "Remove the black frames or set intended_fade_in/out in project.json if they are planned fades.");
      const target = project?.duration_s;
      if (target) {
        const dev = Math.abs(p.duration - target) / target;
        set("TIM-04", dev <= th.duration_tolerance ? "pass" : "fail", `${src}: ${f1(p.duration)}s for a ${target}s target (${Math.round(dev * 100)}% off)`, "Adjust beat durations to reach the target duration.");
      } else unknown("TIM-04", "project.json has no duration_s", "Set duration_s in .motion/project.json.");
    }
    if (a.loudness) {
      const L = a.loudness;
      const ok = L.integrated != null && Math.abs(L.integrated - th.loudness_lufs) <= th.loudness_tolerance_lu && L.true_peak != null && L.true_peak <= th.true_peak_dbtp;
      set("AUD-01", ok ? "pass" : "fail", `${src}: ${f1(L.integrated)} LUFS integrated, true peak ${f1(L.true_peak)} dBTP (target ${th.loudness_lufs} ±${th.loudness_tolerance_lu}, ≤ ${th.true_peak_dbtp})`,
        `Normalise: umd normalize <video> <out> --lufs ${th.loudness_lufs} --tp ${th.true_peak_dbtp}`);
      const s = a.silence || {};
      const edgeOk = (s.leading_s || 0) <= th.silence_edge_max_s && !a.audio_end?.abrupt;
      set("AUD-04", edgeOk ? "pass" : "fail", `${src}: leading silence ${f1(s.leading_s || 0)}s, trailing ${f1(s.trailing_s || 0)}s, last 100 ms at ${f1(a.audio_end?.tail_rms_db)} dB${a.audio_end?.abrupt ? " (abrupt end)" : ""}`,
        "Trim the leading silence and add a short fade-out (afade) at the end.");
      const au = p.audio;
      const fmtOk = au && au.sample_rate === 48000 && au.channels === 2 && ((au.codec === "aac" && (au.bitrate_kbps == null || au.bitrate_kbps >= 180)) || au.codec === "opus");
      set("AUD-06", fmtOk ? "pass" : "partial", `${src}: ${au ? `${au.codec} ${au.sample_rate} Hz ${au.channels} ch ${au.bitrate_kbps ?? "?"} kb/s` : "no audio stream"}`, "Encode audio as AAC 192 kb/s 48 kHz stereo (or Opus in WebM).");
    } else if (project && (project.flags || []).includes("has_audio")) {
      for (const id of ["AUD-01", "AUD-04", "AUD-06"]) set(id, "fail", `${src || "no render"}: no audio stream`, "Mux the soundtrack into the render (umd render with render.audio, or ffmpeg -i video -i mix.wav).");
    }
  } else {
    for (const id of ["TIM-01", "LIF-01", "SAF-01", "REN-02", "REN-05", "TIM-04", "AUD-01", "AUD-04", "AUD-06"])
      unknown(id, "no render analysed", "Run /umd:render (or umd analyze <video>) before the audit.");
  }

  // --- determinism and VMAF
  if (det) set("REN-01", det.identical || (det.ssim != null && det.ssim >= 0.999) ? "pass" : "fail",
    `compare: identical=${det.identical}${det.first_diff_frame != null ? `, first difference at frame ${det.first_diff_frame}` : ""}${det.ssim != null ? `, SSIM ${det.ssim}` : ""}`,
    "Drive every animation from the frame time (no clock, unseeded random or network data); see references/engines for the engine's rules.");
  else unknown("REN-01", "no second render to compare", "Run umd render --twice.");
  if (vm) set("REN-03", (vm.vmaf ?? 0) >= th.vmaf_min ? "pass" : "fail", `vmaf: ${vm.vmaf ?? "n/a"}${vm.ssim != null ? `, SSIM ${vm.ssim}` : ""}`, "Raise the delivery bitrate (lower CRF) or use a slower preset.");

  // --- licences
  if (lic) {
    set("LIC-01", lic.violations.length ? "fail" : "pass", lic.violations.length ? `licenses: ${lic.violations.map((v) => `${v.name} (${v.class})`).slice(0, 5).join(", ")}` : `licenses: 0 violation for policy commercial=${lic.policy.commercial} region=${lic.policy.region} (${lic.dependencies_checked} deps, ${lic.assets_listed} assets)`,
      "Replace these items with permissive alternatives (references/licenses.md) or record an explicit exception in license_policy.allow.");
    set("LIC-02", lic.remotion.ok ? "pass" : "fail", `licenses: Remotion used=${lic.remotion.used}, declared=${lic.remotion.declared}`, "Set license_policy.remotion in project.json (individual, small-company, non-profit, company-license) or switch to umd capture / HyperFrames.");
    const miss = lic.unlisted_assets + lic.incomplete_count;
    set("LIC-03", miss === 0 ? "pass" : "fail", `licenses: ${lic.unlisted_assets} media file(s) missing from assets.lock.json${lic.unlisted_sample.length ? ` (${lic.unlisted_sample.slice(0, 3).join(", ")})` : ""}, ${lic.incomplete_count} entr(ies) without source or licence`,
      "Add each file to .motion/assets.lock.json with path, source, url, license, author.");
  }

  // --- captions
  if (cap) {
    set("CAP-01", cap.coverage >= th.caption_coverage_min && (cap.max_offset_ms ?? 0) <= th.caption_offset_ms ? "pass" : "fail",
      `captions-check: coverage ${cap.coverage}, max offset ${cap.max_offset_ms ?? "?"} ms`, "Regenerate captions from forced alignment (umd captions words.json) and check again.");
    set("CAP-03", (cap.max_cps ?? 0) <= th.caption_cps_max && cap.max_lines <= th.caption_lines_max ? "pass" : "partial",
      `captions-check: max ${cap.max_cps} chars/s, max ${cap.max_lines} line(s)`, "Split long cues (lower --max-chars) so reading speed stays under 17 chars/s.");
  }

  // --- web
  if (web) {
    set("WEB-01", web.reduced_motion?.respected ? "pass" : "fail", `webperf: reduce mode static=${web.reduced_motion?.static_after_1s}, running=${web.reduced_motion?.activity?.running}, gsap=${web.reduced_motion?.activity?.gsap_active}`,
      "Wrap motion in a prefers-reduced-motion check (CSS media query, gsap.matchMedia, useReducedMotion) and stop loops in reduce mode.");
    set("WEB-02", (web.smooth_ratio ?? 0) >= th.web_smooth_frames_min ? "pass" : web.smooth_ratio >= th.web_smooth_frames_min - 0.1 ? "partial" : "fail",
      `webperf: ${Math.round((web.smooth_ratio ?? 0) * 100)}% smooth frames at ${web.throttle}× CPU throttle, ${web.frames?.long_frames} long frame(s), worst ${web.frames?.worst_ms} ms`,
      "Animate transform/opacity only, reduce simultaneous animations and shader cost, lazy-start off-screen motion.");
    set("WEB-03", (web.cls ?? 0) < th.web_cls_max ? "pass" : "fail", `webperf: CLS ${web.cls}`, "Reserve space for animated elements and avoid animating layout properties.");
  }
  return R;
}
