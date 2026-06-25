# ADR 0001: Astro 7 Markdown Pipeline With a Documented Unified Compatibility Fallback

- **Status:** Accepted
- **Date:** 2026-06-25
- **Deciders:** rosu (user), worker (zcode), coordinator review
- **Context task:** Astro 7 full migration (`20260625-224506--astro7-full-migration`)

## Context

The site was upgraded from Astro 6 to **Astro 7.0.2** (`@astrojs/mdx@7.0.0`,
`@astrojs/markdown-remark@7.2.0`, Vite 8). Astro 7's headline Markdown change is
that **Satteri** (`@astrojs/markdown-satteri@0.3.2`) becomes the default Markdown/MDX
processor, and `@astrojs/markdown-remark` is no longer installed by default.

The site's Markdown pipeline is not trivial. `astro.config.mjs` runs the custom
media pipeline plus math rendering through unified:

```text
remark-math → remarkMedia (src/utils/remark-media.mjs)
rehypeMedia (src/utils/rehype-media.mjs) → rehype-katex
```

The user explicitly asked for a **full** migration, not a conservative compatibility
bump, and the task required that keeping unified be *proven necessary* with
evidence, not assumed. This ADR records the investigation and the decision.

## Decision

1. **Adopt Astro 7 fully:** upgrade to Astro 7.0.2, Vite 8, the Rust compiler, and
   Astro 7's **default JSX whitespace** semantics (`compressHTML: 'jsx'`). No
   `compressHTML` override is added.
2. **Keep the unified Markdown processor** (`@astrojs/markdown-remark`'s `unified()`)
   as a deliberately documented compatibility fallback. Do **not** migrate the
   Markdown/media/math pipeline to Satteri in this change.
3. **Document the whitespace choice** as a final, intentional decision, not a
   temporary crutch.

## Investigation (why Satteri is not adopted here)

The Satteri plugin surface was inspected directly from the installed packages
(`@astrojs/markdown-satteri@0.3.2`, `satteri@0.9.2` — the version resolved in this
repo's `package-lock.json`), not assumed:

1. **Different plugin model.** Satteri exposes `mdastPlugins` / `hastPlugins` as
   **visitor-style** plugins: per-node-type functions such as `image(node, ctx)`
   (MDAST) and `element: { filter, visit(node, ctx) }` (HAST), operating on
   `Readonly` nodes through context methods (`ctx.setProperty`, `ctx.replaceNode`,
   `ctx.parent`, `ctx.indexOf`). This is structurally unlike the unified
   `(tree, file) => {…}` transformer model the current `remarkMedia` /
   `rehypeMedia` are written in. Adopting Satteri would require a ground-up rewrite
   of both media plugins (~370 lines), not a config swap.

2. **The figure-lift cannot be expressed straightforwardly.** `rehype-media` promotes
   a standalone image to a `<figure>` by replacing its *parent* `<p>` in the
   *grandparent* during a single recursive walk. A targeted probe against the
   Satteri HAST visitor (`ctx.replaceNode(parent, figure)` from inside an `img`
   visit) produced no transformation — the model keys mutations off the visited
   node and the parent-replacement path is not reliably expressible from an `img`
   visitor. This is the single most behavior-critical transform in the pipeline.

3. **Satteri does not render KaTeX.** Neither `@astrojs/markdown-satteri` nor
   `@astrojs/mdx@7.0.0` has any KaTeX dependency. With `features.math` enabled,
   Satteri parses `$…$`/`$$…$$` to MDAST math nodes but emits them as raw
   `<code class="language-math math-inline">` / `<code class="language-math
   math-display">` text — verified empirically. The standard `rehype-katex` is a
   unified `(tree) => {…}` plugin and does not fit Satteri's visitor `hastPlugins`
   array. So a Satteri migration would also have to source and wire a KaTeX HTML
   step that Satteri does not provide.

4. **Maturity.** `@astrojs/markdown-satteri` is at `0.3.2` (0.x; released the day
   before this task). The media pipeline is content- and behavior-critical (HEIC,
   Live Photo, responsive rasters, captions, inline safety). Rewriting it against a
   day-old 0.x visitor API would put proven behavior at risk for a speed gain the
   cold build does not need (the build is already well within CI limits).

## Alternatives considered

- **A. Full Satteri migration (rewrite both media plugins as Satteri visitors, find
  a KaTeX substitute).** Rejected for this change: high risk to product-critical
  media behavior, with no maturity or correctness backstop, and no KaTeX path.
  This is the option the user asked to prefer *unless proven unsafe* — it is proven
  unsafe *for now*, which is exactly the gate the task defined.
- **B. Keep unified with no documentation (pure compatibility crutch).** Rejected.
  The task and the `grill-with-docs` flow require the fallback to be deliberate and
  evidenced. This ADR plus the `CONTEXT.md` glossary are that evidence.
- **C. Add `compressHTML: true` to restore Astro 6 compression.** Rejected. The JSX
  whitespace default is safe for this site (verified: all tests pass and rendered
  HTML shows no merged words). An override would be the kind of "temporary crutch"
  the user explicitly told us not to hide behind.

## Consequences

- **Positive:** the site is on Astro 7 (Vite 8, Rust compiler, JSX whitespace); the
  media and math pipelines are unchanged and still fully test-covered; no fragile
  rewrite of behavior-critical code; the cold build passes in ~32s.
- **Negative:** `@astrojs/markdown-remark` remains a dependency, so the build does
  not benefit from Satteri's Rust markdown speedup. This is accepted and documented.
- **Follow-up:** revisit when Satteri reaches a stable 1.x, exposes a reliably
  expressible parent/grandparent transform (or the media pipeline is refactored to
  a node-local shape Satteri supports), and offers or integrates a KaTeX HTML step.
  Track the visitor API's `ctx.replaceNode(parent, …)` semantics specifically.

## Verification

- `rm -rf .cache dist && time npm run build` — passes (~32s cold).
- `npm test` — all media, performance, and UI regression tests pass (see
  `verification.md`).
- Whitespace: rendered `index.html` and an article page inspected for merged words;
  none found. The Astro 7 JSX default is retained with no override.
- The processor fallback is pinned by `tests/build-cache-config.test.mjs`
  ("intentionally keeps the unified Markdown processor", "JSX whitespace default is
  a deliberate final choice").

## Sources

- Official Astro v7 upgrade guide: https://docs.astro.build/en/guides/upgrade-to/v7/
- `@astrojs/markdown-satteri@0.3.2` `dist/processor.js`,
  `dist/satteri-processor.js` (visitor plugin shape, no KaTeX dependency).
- `satteri@0.9.2` (the version installed and resolved in this repo's lockfile)
  `dist/plugin.d.ts`, `dist/mdast/mdast-visitor.d.ts`,
  `dist/hast/hast-visitor.d.ts` (MDAST/HAST visitor contract; `Readonly` nodes;
  `ctx.parent`/`ctx.indexOf`/`ctx.replaceNode`).
- `@astrojs/markdown-remark@7.2.0` `dist/processor.js` (`unified({ remarkPlugins,
  rehypePlugins })` — unchanged API).
- Empirical Satteri math probe against the installed `satteri@0.9.2`:
  `features.math: true` emits `<code class="language-math …">` raw text, not
  KaTeX HTML.
