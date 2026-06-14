---
score: 30
p0: 0
p1: 0
p2: 2
p3: 3
timestamp: 2026-05-15T00-29-33Z
slug: src-pages-index-astro
---
# Critique: Blog homepage and article visual consistency

Target: `src/pages/index.astro`, `src/pages/[slug].astro`, local preview `http://127.0.0.1:4321/?motion-tuning=1`.

Overall: Good, 30/40. The design now reads as a personal, restrained, content-first blog rather than a generic AI-generated page. Avatar-derived blue/peach accents, paper background, and scribble masks create a real visual signature. The remaining gap is that the hand-drawn language is applied to accents, while the underlying information structure is still mostly precise ruled-list UI.

## Automated detector

`npx impeccable detect --json src/pages/index.astro src/styles/global.css src/components/Bio.astro src/layouts/Layout.astro` => `[]`.
`npx impeccable detect --json http://127.0.0.1:4321/?motion-tuning=1` => `[]`.

## Evidence

- Homepage desktop: 5 featured posts, 6 archive groups, 26 archived posts, 16 visible controls/links in the first viewport.
- Homepage mobile: archive begins around y=800 in an 844px viewport; first year label starts at y=837.
- Fonts loaded, no page errors; only Vite dev logs in console.
- Reduced motion removes intro/list animations and hover transitions.
- Astro dev toolbar appears in local dev only and can visually cover the lower mobile viewport during QA.

## Priority issues

### P2: Hand-drawn style is present but not yet structural

The quote stroke, hover underline, and year capsule all share the same scribble-mask idea, which is good. But the rest of the homepage remains exact ruled rows, mono dates, and very regular spacing. This creates a mild "skin over system" feeling.

Recommendation: keep hand-drawn accents fewer and make them more semantic: identity quote, active/hover reading target, and archive year marker. Then slightly soften row dividers/date treatment so the list grammar belongs to the same notebook/letterpress world.

### P2: Homepage archive exposes too much choice at once

The homepage has a clear recent-writing section, but below that the archive becomes a full index. On desktop this is scannable; on mobile it becomes a long task surface. The first viewport already contains 11 controls/links on mobile and 16 on desktop.

Recommendation: make homepage archive progressive. Show recent years and a small "全部归档" route, or collapse older years by default. Keep the full archive available, but move the dense index away from the homepage's first impression.

### P3: Typography is credible but still generic-developer-blog

The current font pair is readable and stable, but `Outfit` + `IBM Plex Serif` + `JetBrains Mono` does not fully carry the "well-made notebook / letterpress book" brief. The avatar and scribble marks now have more personality than the type system.

Recommendation: consider a later type pass: either a warmer Chinese-first serif/sans pairing or a more distinctive display treatment for article titles and year markers. Do not change it before the layout decisions settle.

### P3: Article page utility controls feel more app-like than notebook-like

The mobile TOC trigger, back-to-top button, copy button, and image lightbox are useful, but their dark floating-pill language is less aligned with the home page's paper/ink vocabulary. This is especially visible on article pages with many headings and media.

Recommendation: restyle utility controls with the same ink/support palette and lower visual weight, then reserve stronger contrast for focus/open states.

### P3: Dev toolbar can distort local visual review

The Astro dev toolbar is injected in local dev and appears over the bottom center. It is not production UI, but it can obscure the mobile archive and make visual tuning misleading.

Recommendation: disable Astro dev toolbar during visual QA/screenshots or inspect production preview (`npm run build` + preview/static server) for final judgment.

## Heuristic score

- Visibility of system status: 3/4
- Match with real world / author voice: 4/4
- User control and freedom: 3/4
- Consistency and standards: 3/4
- Error prevention: 3/4
- Recognition rather than recall: 3/4
- Flexibility and efficiency: 2/4
- Aesthetic and minimalist design: 3/4
- Error recovery: 3/4
- Help and documentation: 3/4

Total: 30/40, Good.

## Cognitive load

Moderate: 2 checklist failures.

- Choice count is high once archive enters the viewport.
- Progressive disclosure is weak because the archive is fully expanded on the homepage.

## Persona red flags

- Focused technical reader: likely appreciates density, but may not need the whole archive before choosing a recent post.
- First-time reader: gets strong author atmosphere, but not much guidance about the writing taxonomy or best entry points.
- Returning reader: archive is useful, but would benefit from search/filter or a dedicated archive page if the post count grows.

## Questions before polish

1. Should the homepage be a quiet front door with only recent posts, or also remain a full archive?
2. Should the hand-drawn style stay as sparse accent marks, or become a deeper system for dividers, labels, and controls?
3. Are you open to a later typography pass, or should this branch avoid font identity changes?
