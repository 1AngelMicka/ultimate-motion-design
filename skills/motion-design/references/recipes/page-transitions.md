# Recipe — Page transitions

Motion between routes or pages that keeps the user oriented: what stays, what leaves, where the new content comes from. Native View Transitions first, a library only when the site needs it. Route: [../routes/web-page.md](../routes/web-page.md).

## Use when / avoid when

- Use for multi-page sites, portfolios (list → detail), SPAs with route changes, galleries.
- Avoid long showcase transitions on task-oriented apps; a transition must never delay the next click.

## Setup — choose the mechanism

| Site type | Mechanism | Licence |
| --- | --- | --- |
| SPA (any framework) | `document.startViewTransition(() => updateDOM())` | native |
| Multi-page site (MPA), same origin | Cross-document view transitions: `@view-transition { navigation: auto; }` in both pages | native |
| Next.js App Router | `next-view-transitions` | MIT |
| Astro | `<ClientRouter />` (View Transitions); starter: `codrops/interlude` (GSAP transitions, Lenis optional) | MIT |
| Server-rendered site needing JS-controlled, cross-browser transitions | `swup` (4.x, themes `@swup/fade-theme`, `@swup/overlay-theme`) or `@unseenco/taxi` (2.x) | MIT / BSD-3-Clause |
| Barba.js | Works, but no push since Dec 2024: prefer swup or taxi for new projects | MIT |

⚠️ `vtbag/*` helpers (turn-signal, element-crossing, inspection-chamber) have no licence: read, do not copy. Engine details: [../engines/css-waapi.md](../engines/css-waapi.md), [../engines/gsap.md](../engines/gsap.md).

## Core patterns

**1. Shared element morph (list → detail).** Give the same `view-transition-name` to the thumbnail and the detail hero; the browser morphs position and size:

```css
.card[data-id="42"] img, .detail-hero { view-transition-name: project-42; }
::view-transition-old(root), ::view-transition-new(root) { animation-duration: 240ms; }
::view-transition-group(project-42) { animation-duration: 420ms; animation-timing-function: cubic-bezier(.2,.8,.2,1); }
@media (prefers-reduced-motion: reduce) { ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none; } }
```

Names must be unique on the page at transition time; set them only on the clicked item.

**2. Direction matters.** Forward navigation slides or pushes one way, back the other (read `navigation.activation` or the router's direction); depth changes (list → detail) scale up, siblings slide sideways.

**3. Old content leaves fast, new content arrives slower**: exit 120–200 ms ease-in, enter 200–320 ms ease-out, slight overlap.

**4. Persistent chrome stays still**: header, nav and player get their own `view-transition-name` (or stay outside the swup container) so they do not flash.

**5. Showcase transitions** (portfolios): overlay wipes, seam reveals, kinetic type between pages. Study `codrops/SeamTransitions`, `codrops/KineticTypePageTransition` (MIT). Cap total at ~900 ms and make it interruptible.

### Durations

| Transition | Duration |
| --- | --- |
| App route cross-fade | 150–250 ms |
| Shared element morph | 300–450 ms |
| Sibling slide (tabs, steps) | 250–350 ms |
| Showcase overlay / wipe | 600–900 ms max |
| Reduced motion | instant or ≤ 150 ms cross-fade |

### Shot list template (one row per route pair)

```
| from → to | trigger | shared elements | exit (ms, ease) | enter (ms, ease) | direction | reduced motion |
| /work → /work/[id] | card click | card image → hero | 160 ease-in | 380 ease-out | depth in | cross-fade 120 |
```

### Do / don't

- Do keep focus management and scroll position correct after the transition (focus the new `h1` or main).
- Do keep the URL change and history working without JavaScript (progressive enhancement).
- Don't block input while transitioning; a second click must win.
- Don't animate the whole page with a 3D flip or a long blur.

## Rendering to video with umd

Not needed. To show the flow in a case-study video, record a scripted navigation with Playwright or capture a page that triggers the transitions at fixed times (`umd capture <url> --out flow.mp4 --duration 10`).

## Pitfalls

| Breaks | Fix |
| --- | --- |
| Duplicate `view-transition-name` → transition skipped | Assign names on click, remove after |
| Images stretch during morph | Same `object-fit` and aspect ratio on both ends, or morph a wrapper |
| Flash of unstyled new page (MPA) | Same CSS loaded early on both pages; keep pages fast |
| Header flickers on each navigation | Name it or keep it outside the swapped container |
| Scroll jumps to top mid-animation | Restore scroll after the new page is in place |
| Long transition hides slow server response | Fix the response; transitions are not loading screens |

## Checks

- **WEB**: reduced motion honoured; no CLS on arrival; `umd webperf` smooth frames during navigation.
- **MOT**: durations from tokens; exit faster than enter; one focal motion.
- **SAF**: no full-screen flashes.
- **TXT**: new page headline readable as soon as the transition ends.

## Sources

- https://developer.chrome.com/docs/web-platform/view-transitions · https://github.com/bramus/view-transitions-demos
- https://github.com/swup/swup · https://github.com/craftedbygc/taxi · https://github.com/barbajs/barba · https://github.com/shuding/next-view-transitions · https://github.com/codrops/interlude · https://github.com/codrops/SeamTransitions
