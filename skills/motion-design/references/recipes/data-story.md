# Recipe — Data story (animated charts and numbers)

Numbers and charts that build in the order the story needs them: a count-up, a bar that wins, a line that breaks its trend. For video (report films, social stats, launch proof beats) and pages (dashboards, landing stats). Routes: [../routes/html-video.md](../routes/html-video.md), [../routes/web-page.md](../routes/web-page.md).

## Use when / avoid when

- Use when a number or a comparison is the message: growth, ranking over time, before/after, share of a whole.
- Avoid animating every chart on a dashboard; animate the change the user must notice.

## Setup

| Need | Tool | Licence |
| --- | --- | --- |
| Count-ups, changing digits (web) | `number-flow` / `@number-flow/react` (0.6) | MIT |
| Simple counter (web) | `countUp.js` | MIT |
| Charts with transitions, any layout | `d3` (7.9): scales, shapes, `d3-interpolate`, `d3-transition` | ISC |
| Declarative charts generated from data | Vega-Lite, ECharts, Recharts (static frames, re-render per t) | BSD-3 / Apache-2.0 / MIT |
| Bar chart race | D3 in HTML (recommended); `dexplo/bar_chart_race` (Python, MIT, inactive since 2024) | — |
| Remotion | `interpolate()` on SVG/D3 output; ⚠️ Remotion licence: free up to 3 employees, paid above | — |

Chart craft (colour, axes, labels): [../craft/composition.md](../craft/composition.md), [../craft/text-on-screen.md](../craft/text-on-screen.md).

## Core patterns

**1. In video, compute every frame from `t`.** Do not let D3 or number-flow run their own timers; derive the state:

```js
const ease = d3.easeCubicOut;
window.umdRender = (t) => {
  const p = ease(Math.min(1, Math.max(0, (t - 1.0) / 1.6)));   // beat starts 1.0 s, lasts 1.6 s
  bars.attr("width", d => x(d.value * p));
  label.text(fmt(Math.round(target * p)));                     // fmt = Intl.NumberFormat
};
```

On the web, `number-flow` and `d3-transition` are fine: they respect real time and can honour reduced motion.

**2. Order = story.** Axis and context first (0.3–0.5 s), then the data, then the annotation that says what it means. Never everything at once.

**3. Tabular figures** (`font-variant-numeric: tabular-nums`) so counting digits do not jitter; fixed decimal count; units small and next to the number.

**4. Count-ups end on the exact value** and hold ≥ 1.5 s. Ease-out so the last digits slow down and can be read.

**5. Bar chart race**: interpolate values between keyframes (e.g. 10 frames per period), re-sort ranks with a smoothed rank position, keep bar colours bound to the entity, show the period label large.

**6. Annotate the insight**: highlight one series, grey the rest; a callout line draws to the point that matters.

### Beat structure (20 s stat sequence)

| Time | Beat | Intent |
| --- | --- | --- |
| 0–2 s | Question / context | "How much did X grow?" + empty axes |
| 2–8 s | Build | Data enters in reading order (left→right, oldest→newest) |
| 8–12 s | Turn | The surprising point: highlight, zoom, callout |
| 12–17 s | Big number | Count-up to the key figure, held |
| 17–20 s | Source + takeaway | One line; data source visible (small) |

### Shot list template

```
| id | start–end | chart type | data subset | animation | highlight | annotation text | source line |
| c02 | 2.0–7.5 | bars | 2019–2025 revenue | grow from baseline, stagger 80 ms | 2025 bar | "+340 % in 6 years" | Company report 2025 |
```

### Durations

| Element | Duration |
| --- | --- |
| Axis / gridline draw | 0.3–0.5 s |
| Bar or line build | 0.8–1.6 s per series |
| Count-up | 1.0–2.0 s, hold ≥ 1.5 s |
| Bar chart race period | 0.3–0.6 s per period |
| Web stat entrance | 0.6–1.2 s, once, on view |

### Do / don't

- Do start bars at zero; do keep scales honest during animation (no rescaling mid-beat without showing it).
- Do show the data source on screen.
- Don't animate pie slices spinning; don't 3D-extrude charts.
- Don't use more than 5 colours; one highlight colour.

## Rendering to video with umd

Capture block from [../routes/html-video.md](../routes/html-video.md). Load data from a local JSON file (no live API at render time) so two renders match.

## Pitfalls

| Breaks | Fix |
| --- | --- |
| D3 transitions timed by `d3-timer` in video | Compute from `t` (pattern 1) |
| Digits jitter while counting | Tabular numerals, monospace digits, fixed width |
| Rank swaps flicker in a race | Interpolate rank positions, not just values |
| Labels collide when bars are close | Label inside bars or offset; test the densest frame |
| Live data changes between renders | Freeze the dataset in the repo |

## Checks

- **TXT**: every number held long enough to read; labels not overlapping.
- **NAR**: one insight per chart, annotated.
- **MOT**: easing slows on final values; one focal change at a time.
- **REN**: data frozen, two renders identical.
- **WEB**: reduced motion shows final values instantly.

## Sources

- https://github.com/barvian/number-flow · https://github.com/d3/d3 · https://github.com/d3/d3-transition · https://github.com/inorganik/countUp.js · https://github.com/dexplo/bar_chart_race
- Catalogue section 06 "Données animées"
