# CONTEXT

Glossary of terms used in this blog's Astro 7 migration and Markdown/media work.
Definitions are implementation-free: they describe *what* something means in this
project, not how a specific file or API spells it. For implementation decisions,
see `docs/adr/`.

## Full Astro 7 migration

An upgrade of this site to Astro 7 that adopts Astro 7's behavior where it is safe
to do so — the Rust compiler, Vite 8, and the default JSX whitespace semantics —
rather than merely bumping dependency versions and leaving every old code path in
place. "Full" means the migration decisions are made deliberately and documented,
not that every possible change is adopted regardless of risk.

## Markdown processor

The pipeline that turns `.md` and `.mdx` content files into the rendered HTML that
ends up in `dist/`. In this project it also carries the math and media
transformations, so "the Markdown processor" usually means the whole chain: parse
Markdown → apply MDAST plugins → convert to HTML AST → apply HAST plugins →
serialize. Astro lets the project choose which concrete engine fills this role.

## Satteri pipeline

Astro 7's default Markdown/MDX processor: a Rust-based engine exposed to
JavaScript through a visitor-style plugin API. It is fast and is the future
default, but its plugin model is structurally different from the unified
remark/rehype model this site was built on.

## Unified compatibility pipeline

The legacy remark/rehype processor (`@astrojs/markdown-remark`'s `unified()`). It
transforms a Markdown tree with `(tree, file)` transformer plugins. This site keeps
it on Astro 7 as a deliberately chosen compatibility fallback (see the ADR), not as
an accident.

## Media pipeline

This blog's local image/video transformation behavior: HEIC references become
responsive `<picture>` markup with AVIF/WebP/JPEG derivatives; a same-basename
`.mov` next to a `.heic` becomes Live Photo markup; local raster images become
responsive AVIF/WebP figures; linked images stay linked; inline images stay
phrasing-safe; standalone images become figures with alt-text captions. It is
content- and behavior-critical and must survive any Markdown-processor change
unchanged.

## Whitespace semantics

The rule that decides how spaces and newlines between adjacent inline elements
render after Astro compresses the output HTML. Astro 7 changed the default from
"preserve" to JSX semantics, where whitespace between inline JSX expressions is
treated like JSX (collapsible). For this site the JSX default is safe and is the
final choice; it is not a temporary crutch.

## Compatibility fallback

A deliberately retained old behavior, used only when the full migration cannot
preserve required site behavior. In this migration it specifically means keeping
the unified Markdown processor because Satteri cannot currently support the media
and math pipelines. It is always paired with a written justification, not left as
an unexplained dependency.

## Cold build

A build performed after clearing the caches (e.g. `rm -rf .cache dist`), so every
derivative is regenerated. Used as the honest measure of build time and of whether
the pipeline works end to end, because warm builds hide work behind a cache.

## Visual smoke check

A manual, human inspection of representative built pages (homepage, archive, an
article with media, a math article, the 404) after an automated build passes. It
covers rendering that automated tests do not fully assert, such as spacing between
inline elements, Live Photo hover behavior, and caption layout. The coordinator
performs this before accepting a migration.
