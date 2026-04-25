# Article Page and Build Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Speed up resource-heavy Astro builds and redesign the article detail page with editorial image captions derived from Markdown alt text.

**Architecture:** Move Astro image derivatives into an explicit cache directory, cache that directory in GitHub Actions, and reduce global responsive image breakpoints. Extend the existing remark/rehype media pipeline so all standalone article images render as semantic figures with optional figcaptions, then restyle the article page around a constrained editorial reading system.

**Tech Stack:** Astro 5, Node test runner, GitHub Actions, Markdown/rehype HAST transforms, CSS custom properties, Chrome headless screenshots for visual verification.

---

## File Structure

- Modify `astro.config.mjs`: set `cacheDir: '.cache/astro'` and configure `image.breakpoints`.
- Modify `.github/workflows/deploy_astro.yml`: cache `.cache/astro` and `.cache/media`, add cache-size logging around the build.
- Create `tests/build-cache-config.test.mjs`: source-level regression checks for Astro cache settings and workflow cache paths.
- Modify `tests/_helpers/temp-post.mjs`: add fixture Markdown cases for a standalone PNG, an empty-alt PNG, and a linked image.
- Modify `tests/media-output.test.mjs`: assert figure/caption output for HEIC, Live Photo, normal images, empty alt, and linked images.
- Modify `src/utils/rehype-media.mjs`: add reusable HAST helpers for figures, figcaptions, and paragraph replacement.
- Modify `src/styles/global.css`: add article media figure, caption, prose, code, and overflow-safe image styles.
- Modify `src/pages/[slug].astro`: apply the article shell/header/footer class structure and redesign article-local styles.
- Modify `tests/ui-regressions.test.mjs`: assert article page structural hooks and CSS overflow safeguards.

---

## Task 1: Cache Configuration and Responsive Breakpoints

**Files:**
- Create: `tests/build-cache-config.test.mjs`
- Modify: `astro.config.mjs`
- Modify: `.github/workflows/deploy_astro.yml`

- [ ] **Step 1: Write failing config tests**

Create `tests/build-cache-config.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const astroConfigPath = new URL('../astro.config.mjs', import.meta.url);
const workflowPath = new URL('../.github/workflows/deploy_astro.yml', import.meta.url);

test('Astro stores generated image assets in the project cache directory', async () => {
  const config = await readFile(astroConfigPath, 'utf8');

  assert.match(config, /cacheDir:\s*['"]\.cache\/astro['"]/);
  assert.match(config, /breakpoints:\s*\[\s*640,\s*828,\s*1080,\s*1440\s*\]/);
});

test('GitHub Actions caches Astro and custom media derivatives', async () => {
  const workflow = await readFile(workflowPath, 'utf8');

  assert.match(workflow, /Cache generated image derivatives/);
  assert.match(workflow, /\.cache\/astro/);
  assert.match(workflow, /\.cache\/media/);
  assert.match(workflow, /src\/utils\/media-cache\.mjs/);
  assert.match(workflow, /content\/posts\/\*\*\/\*\.heic/);
  assert.match(workflow, /Log image cache sizes/);
});
```

- [ ] **Step 2: Run config tests and verify failure**

Run:

```bash
node --test tests/build-cache-config.test.mjs
```

Expected: FAIL because `cacheDir`, `breakpoints`, and the new workflow cache step are not present.

- [ ] **Step 3: Configure Astro cache and breakpoints**

In `astro.config.mjs`, update the config object:

```js
export default defineConfig({
  site: 'https://blog.rosuh.me',
  cacheDir: '.cache/astro',

  image: {
    layout: 'constrained',
    responsiveStyles: true,
    breakpoints: [640, 828, 1080, 1440],
  },

  integrations: [
    mdx(),
  ],

  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
    remarkPlugins: [remarkMath, remarkMedia],
    rehypePlugins: [rehypeMedia, [rehypeKatex, { strict: false }]],
  },

  output: 'static',
});
```

- [ ] **Step 4: Replace the media cache step in GitHub Actions**

In `.github/workflows/deploy_astro.yml`, replace the existing `Cache media derivatives` step with:

```yaml
      - name: Cache generated image derivatives
        uses: actions/cache@v4
        with:
          path: |
            .cache/astro
            .cache/media
          key: image-cache-${{ runner.os }}-${{ hashFiles('package-lock.json', 'astro.config.mjs', 'src/utils/media-cache.mjs', 'src/utils/remark-media.mjs', 'src/utils/rehype-media.mjs', 'content/posts/**/*.png', 'content/posts/**/*.jpg', 'content/posts/**/*.jpeg', 'content/posts/**/*.webp', 'content/posts/**/*.gif', 'content/posts/**/*.heic', 'content/posts/**/*.mov') }}
          restore-keys: |
            image-cache-${{ runner.os }}-
```

Add this step immediately after `Verify media tooling`:

```yaml
      - name: Log image cache sizes
        run: |
          du -sh .cache/astro .cache/media public/_media 2>/dev/null || true
```

Add this step immediately after `Build Astro site`:

```yaml
      - name: Log generated image output sizes
        run: |
          du -sh .cache/astro .cache/media public/_media dist/_astro dist/_media 2>/dev/null || true
```

- [ ] **Step 5: Run config tests and verify pass**

Run:

```bash
node --test tests/build-cache-config.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Run a build to ensure the new cache directory is used**

Run:

```bash
npm run build
du -sh .cache/astro .cache/media 2>/dev/null || true
```

Expected: build succeeds and `.cache/astro` exists after images are processed.

- [ ] **Step 7: Commit cache configuration**

Run:

```bash
git add astro.config.mjs .github/workflows/deploy_astro.yml tests/build-cache-config.test.mjs
git commit -m "ci: cache generated image derivatives"
```

---

## Task 2: Figure and Caption Output

**Files:**
- Modify: `tests/_helpers/temp-post.mjs`
- Modify: `tests/media-output.test.mjs`
- Modify: `src/utils/rehype-media.mjs`

- [ ] **Step 1: Extend the media fixture post**

In `tests/_helpers/temp-post.mjs`, replace the `writeFile(join(dir, 'index.md'), ...)` template with:

```js
  await writeFile(join(dir, 'index.md'),
    `---\ntitle: media e2e fixture\nfilename: ${slug}\ndate: 2026-04-25\n---\n\n![sample-heic](sample.heic)\n\n![sample-png](sample.png)\n\n![](sample.png)\n\n[![linked-png](sample.png)](https://example.com)\n`,
  );
```

- [ ] **Step 2: Update HEIC still output test before implementation**

In `tests/media-output.test.mjs`, replace the first test with:

```js
test('HEIC reference is replaced with a semantic figure, caption, and responsive picture sources', async () => {
  const html = await readFile(post.articleHtmlPath, 'utf8');

  assert.doesNotMatch(html, /<img[^>]+src="[^"]*sample\.heic/);
  assert.match(html, /<figure[^>]+class="media-figure media-figure--generated"/);
  assert.match(html, /<picture>[\s\S]*<source[^>]+type="image\/avif"[^>]+srcset="\/_media\/[a-f0-9]{16}-v\d+\//);
  assert.match(html, /<img[^>]+src="\/_media\/[a-f0-9]{16}-v\d+\/img-\d+w\.jpg"[^>]+width="\d+"[^>]+height="\d+"[^>]+alt="sample-heic"|<img[^>]+alt="sample-heic"[^>]+src="\/_media\/[a-f0-9]{16}-v\d+\/img-\d+w\.jpg"[^>]+width="\d+"[^>]+height="\d+"/);
  assert.match(html, /<figcaption>sample-heic<\/figcaption>/);
});
```

- [ ] **Step 3: Update normal image tests before implementation**

In `tests/media-output.test.mjs`, replace the `Non-HEIC images still get loading=lazy and decoding=async` test with:

```js
test('Standalone non-HEIC images render as figures with captions and lazy async hints', async () => {
  const html = await readFile(post.articleHtmlPath, 'utf8');

  assert.match(html, /<figure[^>]+class="media-figure"[\s\S]*<img[^>]+alt="sample-png"[^>]+loading="lazy"[^>]+decoding="async"[\s\S]*<figcaption>sample-png<\/figcaption>[\s\S]*<\/figure>|<figure[^>]+class="media-figure"[\s\S]*<img[^>]+alt="sample-png"[^>]+decoding="async"[^>]+loading="lazy"[\s\S]*<figcaption>sample-png<\/figcaption>[\s\S]*<\/figure>/);
});

test('Empty alt standalone images render as figures without empty captions', async () => {
  const html = await readFile(post.articleHtmlPath, 'utf8');

  assert.match(html, /<figure[^>]+class="media-figure"[\s\S]*<img[^>]+alt=""[\s\S]*<\/figure>/);
  assert.doesNotMatch(html, /<figcaption>\s*<\/figcaption>/);
});

test('Linked images stay linked and are not promoted into standalone figures', async () => {
  const html = await readFile(post.articleHtmlPath, 'utf8');

  assert.match(html, /<a href="https:\/\/example\.com"><img[^>]+alt="linked-png"/);
  assert.doesNotMatch(html, /<figure[^>]*>\s*<a href="https:\/\/example\.com"/);
});
```

- [ ] **Step 4: Update Live Photo test before implementation**

In the Live Photo test in `tests/media-output.test.mjs`, add this assertion after the badge assertion:

```js
    assert.match(html, /<figcaption>sample-heic<\/figcaption>/);
```

- [ ] **Step 5: Run media output tests and verify failure**

Run:

```bash
node --test --test-concurrency=1 tests/media-output.test.mjs
```

Expected: FAIL because figures and figcaptions are not yet generated for all image paths.

- [ ] **Step 6: Add HAST helpers to `src/utils/rehype-media.mjs`**

In `src/utils/rehype-media.mjs`, add these helpers after `function text(value)`:

```js
function altText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function captionNode(alt) {
  const value = altText(alt);
  return value ? h('figcaption', {}, [text(value)]) : null;
}

function mediaFigureNode(children, { alt, className = 'media-figure', props = {} } = {}) {
  const caption = captionNode(alt);
  return h('figure', {
    ...props,
    class: className,
  }, caption ? [...children, caption] : children);
}

function isWhitespaceText(node) {
  return node?.type === 'text' && /^\s*$/.test(node.value || '');
}

function isOnlyChildInParagraph(parent, index) {
  if (!parent || parent.type !== 'element' || parent.tagName !== 'p') return false;
  return parent.children.every((child, childIndex) => childIndex === index || isWhitespaceText(child));
}

function replaceImageNode(parent, index, grandparent, parentIndex, replacement) {
  if (isOnlyChildInParagraph(parent, index) && grandparent && parentIndex >= 0) {
    grandparent.children[parentIndex] = replacement;
    return;
  }
  parent.children[index] = replacement;
}
```

- [ ] **Step 7: Update `livePhotoNode` to include caption support**

Replace the end of `livePhotoNode` with:

```js
  return mediaFigureNode([picture, video, badge], {
    alt,
    className: 'livephoto media-figure media-figure--livephoto',
    props: {
      'data-livephoto': '',
      'data-state': 'idle',
      style: `aspect-ratio: ${width} / ${height};`,
    },
  });
}
```

- [ ] **Step 8: Update `walk` to expose grandparent context**

Replace the existing `walk` function with:

```js
function walk(node, visit, parent = null, index = -1, grandparent = null, parentIndex = -1) {
  if (!node || typeof node !== 'object') return;
  visit(node, parent, index, grandparent, parentIndex);
  if (Array.isArray(node.children)) {
    for (let i = 0; i < node.children.length; i++) {
      walk(node.children[i], visit, node, i, parent, index);
    }
  }
}
```

- [ ] **Step 9: Update marker replacement and normal image wrapping**

Replace the body of the `walk(tree, ...)` callback inside `rehypeMedia()` with:

```js
    walk(tree, (node, parent, index, grandparent, parentIndex) => {
      if (node.type !== 'element' || node.tagName !== 'img') return;
      const props = node.properties || {};
      if (!props['dataMediaMarker'] && !props['data-media-marker']) {
        if (props.loading == null) props.loading = 'lazy';
        if (props.decoding == null) props.decoding = 'async';
        if (!parent || !isOnlyChildInParagraph(parent, index)) return;

        const figure = mediaFigureNode([node], {
          alt: props.alt,
          className: 'media-figure',
        });
        replaceImageNode(parent, index, grandparent, parentIndex, figure);
        return;
      }

      if (!parent) return;
      const raw = props.dataMedia ?? props['data-media'];
      let payload = null;
      if (raw) {
        try { payload = JSON.parse(raw); } catch { payload = null; }
      }
      if (!payload) {
        parent.children[index] = {
          type: 'comment',
          value: ' rehype-media: media payload missing or unparseable ',
        };
        return;
      }

      const replacement = payload.kind === 'livephoto'
        ? livePhotoNode(payload)
        : mediaFigureNode([
            pictureNode({
              key: payload.stillKey,
              alt: payload.alt,
              width: payload.width,
              height: payload.height,
              products: payload.products,
            }),
          ], {
            alt: payload.alt,
            className: 'media-figure media-figure--generated',
          });
      replaceImageNode(parent, index, grandparent, parentIndex, replacement);
    });
```

- [ ] **Step 10: Run media output tests and verify pass**

Run:

```bash
node --test --test-concurrency=1 tests/media-output.test.mjs
```

Expected: PASS.

- [ ] **Step 11: Run related media regression tests**

Run:

```bash
node --test --test-concurrency=1 tests/media-cache-idempotence.test.mjs tests/media-publish.test.mjs tests/media-cache.test.mjs
```

Expected: PASS.

- [ ] **Step 12: Commit figure output**

Run:

```bash
git add tests/_helpers/temp-post.mjs tests/media-output.test.mjs src/utils/rehype-media.mjs
git commit -m "feat: render article image captions"
```

---

## Task 3: Editorial Article Page Styling

**Files:**
- Modify: `tests/ui-regressions.test.mjs`
- Modify: `src/pages/[slug].astro`
- Modify: `src/styles/global.css`

- [ ] **Step 1: Add article structure and CSS guard tests**

In `tests/ui-regressions.test.mjs`, add this test before the `before(() => { buildSite(); })` block:

```js
test('article page exposes editorial layout hooks and overflow-safe media styles', () => {
  const html = readDist('2026-04-25-year-end-summary', 'index.html');
  const pageSource = readSource('src', 'pages', '[slug].astro');
  const css = readSource('src', 'styles', 'global.css');

  assert.match(html, /class="article-shell"/);
  assert.match(html, /class="article-header"/);
  assert.match(html, /class="article-title"/);
  assert.match(html, /class="article-date"/);
  assert.match(css, /--content-width:\s*700px/);
  assert.match(css, /--media-width:\s*980px/);
  assert.match(css, /\.media-figure\s*\{/);
  assert.match(css, /grid-template-columns:\s*minmax\(0,\s*1fr\)\s*var\(--caption-width\)/);
  assert.match(css, /overflow-wrap:\s*anywhere/);
  assert.match(css, /overflow-x:\s*auto/);
  assert.match(pageSource, /article-shell/);
});
```

- [ ] **Step 2: Run UI regression tests and verify failure**

Run:

```bash
node --test tests/ui-regressions.test.mjs
```

Expected: FAIL because the article hooks and CSS rules are not present.

- [ ] **Step 3: Update article markup hooks in `src/pages/[slug].astro`**

Change the `<article>` opening tag and article header markup to:

```astro
  <article class="article-shell" itemscope itemtype="http://schema.org/BlogPosting">
    <header class="article-header" data-reveal="article-header">
      <p class="article-kicker">Article</p>
      <h1 class="article-title" itemprop="headline">{post.data.title}</h1>
      <div class="article-meta">
        <time
          class="article-date"
          datetime={post.data.date.toISOString()}
          itemprop="datePublished"
        >
          {post.data.date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </time>
        {(post.data.tags ?? []).length > 0 && (
          <div class="article-tags" role="list" aria-label="文章标签">
            {post.data.tags.map((tag) => (
              <span class="article-tag" role="listitem">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </header>
```

Keep the rest of the article structure unchanged.

- [ ] **Step 4: Replace article-local styles in `src/pages/[slug].astro`**

Replace the existing `<style>` content in `src/pages/[slug].astro` with:

```css
  .article-shell {
    display: grid;
    gap: 0;
  }

  .article-header {
    display: grid;
    gap: 0.85rem;
    margin: 1.25rem 0 3.25rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid color-mix(in oklab, var(--border) 78%, transparent);
    animation: article-settle-in 560ms var(--ease-out-expo) both;
  }

  .article-kicker {
    margin: 0;
    color: color-mix(in oklab, var(--support) 68%, var(--fg-muted));
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .article-title {
    margin: 0;
    max-width: 13ch;
    font-family: var(--font-display);
    font-size: clamp(2.25rem, 7vw, 4.35rem);
    font-weight: 700;
    letter-spacing: 0;
    line-height: 1.04;
    text-wrap: balance;
    overflow-wrap: anywhere;
  }

  .article-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.7rem;
    color: var(--fg-muted);
    font-size: var(--text-sm);
  }

  .article-date {
    font-family: var(--font-serif);
    font-variant-numeric: tabular-nums;
  }

  .article-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .article-tag {
    padding: 0.12rem 0.5rem;
    border: 1px solid color-mix(in oklab, var(--support-border) 60%, var(--border));
    border-radius: 999px;
    color: var(--support);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
  }

  .article-footer {
    margin-top: 4rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border);
  }

  .post-nav {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.5rem;
    margin-top: 2.75rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border);
  }

  .nav-prev,
  .nav-next {
    display: grid;
    gap: 0.35rem;
    min-width: 0;
    text-decoration: none;
    position: relative;
  }

  .nav-next {
    text-align: right;
  }

  .nav-label {
    color: color-mix(in oklab, var(--support) 72%, var(--fg-subtle));
    font-size: var(--text-xs);
    font-family: var(--font-mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .nav-title {
    color: var(--fg-muted);
    font-size: var(--text-sm);
    font-weight: 500;
    line-height: 1.55;
    text-wrap: pretty;
    transition: color var(--duration-fast) ease, transform var(--duration-fast) ease;
  }

  .nav-prev:hover .nav-title,
  .nav-next:hover .nav-title,
  .nav-prev:focus-visible .nav-title,
  .nav-next:focus-visible .nav-title {
    color: var(--accent);
    transform: translateY(-1px);
  }

  @keyframes article-settle-in {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 640px) {
    .article-header {
      margin-top: 0.75rem;
      margin-bottom: 2.25rem;
    }

    .article-title {
      max-width: 100%;
      font-size: clamp(2rem, 13vw, 3rem);
      line-height: 1.08;
    }

    .post-nav {
      grid-template-columns: 1fr;
    }

    .nav-next {
      text-align: left;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .article-header {
      animation: none;
    }

    .nav-title {
      transition: none;
    }
  }
```

- [ ] **Step 5: Add width tokens and overflow-safe global styles**

In `src/styles/global.css`, update `:root` layout tokens:

```css
  --max-width: 720px;
  --content-width: 700px;
  --media-width: 980px;
  --caption-width: 10rem;
```

Update `.site-wrap`:

```css
.site-wrap {
  width: min(100%, var(--media-width));
  margin: 0 auto;
  padding: 0 1.25rem;
  position: relative;
}
```

Update `.prose`:

```css
.prose {
  max-width: var(--content-width);
  margin: 0 auto;
  font-size: var(--text-base);
  line-height: 1.88;
  overflow-wrap: break-word;
}
```

- [ ] **Step 6: Add global media figure styles**

In `src/styles/global.css`, replace the existing `.prose img` rule with this block:

```css
.prose img,
.prose picture {
  max-width: 100%;
}

.prose img {
  display: block;
  height: auto;
  border-radius: 5px;
}

.media-figure {
  width: min(var(--media-width), calc(100vw - 2.5rem));
  margin: 2.6rem 50% 2.8rem;
  transform: translateX(-50%);
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--caption-width);
  gap: 0.9rem;
  align-items: start;
}

.media-figure picture,
.media-figure img {
  min-width: 0;
}

.media-figure > picture,
.media-figure > img,
.media-figure > .livephoto-video {
  grid-column: 1;
}

.media-figure figcaption {
  grid-column: 2;
  margin: 0;
  padding-left: 0.75rem;
  border-left: 1px solid color-mix(in oklab, var(--support-border) 72%, var(--border));
  color: var(--fg-muted);
  font-family: var(--font-serif);
  font-size: var(--text-xs);
  line-height: 1.7;
  text-wrap: pretty;
}

.media-figure--livephoto {
  position: relative;
}

.media-figure--livephoto .livephoto-badge {
  grid-column: 1;
}
```

Add the mobile override near the existing mobile section:

```css
@media (max-width: 760px) {
  .media-figure {
    width: 100%;
    margin: 2rem 0 2.25rem;
    transform: none;
    grid-template-columns: 1fr;
    gap: 0.55rem;
  }

  .media-figure figcaption {
    grid-column: 1;
    padding: 0.6rem 0 0;
    border-left: 0;
    border-top: 1px solid color-mix(in oklab, var(--support-border) 72%, var(--border));
  }
}
```

- [ ] **Step 7: Harden code, table, and heading overflow styles**

In `src/styles/global.css`, update or add these rules:

```css
.prose h2 {
  font-size: var(--text-xl);
  margin-top: 3.4rem;
  margin-bottom: 1rem;
  padding-top: 0.85rem;
  border-top: 1px solid color-mix(in oklab, var(--border) 78%, transparent);
  color: color-mix(in oklab, var(--accent) 65%, var(--fg));
  overflow-wrap: anywhere;
}

.prose h3 {
  font-size: var(--text-lg);
  margin-top: 2.35rem;
  margin-bottom: 0.75rem;
  color: color-mix(in oklab, var(--support) 62%, var(--fg));
  overflow-wrap: anywhere;
}

.prose pre {
  max-width: 100%;
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 1rem;
  overflow-x: auto;
  margin-bottom: 1.5rem;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  line-height: 1.6;
}

.prose table {
  display: block;
  width: 100%;
  overflow-x: auto;
  border-collapse: collapse;
  margin-bottom: 1.5rem;
  font-size: var(--text-sm);
}
```

- [ ] **Step 8: Run UI regression tests and verify pass**

Run:

```bash
node --test tests/ui-regressions.test.mjs
```

Expected: PASS.

- [ ] **Step 9: Run full build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 10: Commit article styling**

Run:

```bash
git add tests/ui-regressions.test.mjs src/pages/[slug].astro src/styles/global.css
git commit -m "style: redesign article reading page"
```

---

## Task 4: Verification, Screenshots, and Final Regression Pass

**Files:**
- Modify only if verification exposes a concrete bug in files changed by Tasks 1-3.

- [ ] **Step 1: Run the focused test set**

Run:

```bash
node --test tests/build-cache-config.test.mjs tests/ui-regressions.test.mjs
node --test --test-concurrency=1 tests/media-output.test.mjs tests/media-cache-idempotence.test.mjs tests/media-publish.test.mjs tests/media-cache.test.mjs
```

Expected: PASS.

- [ ] **Step 2: Run package test script**

Run:

```bash
npm run test
```

Expected: PASS.

- [ ] **Step 3: Start local dev server for screenshots**

Run:

```bash
npm run dev -- --host 127.0.0.1 --port 4321
```

Expected: terminal prints `Local    http://127.0.0.1:4321/`.

- [ ] **Step 4: Capture desktop article screenshot**

Run in a second terminal:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --user-data-dir=/tmp/blog-article-desktop-check --screenshot=/tmp/blog-article-desktop-check.png --window-size=1440,1800 http://127.0.0.1:4321/2026-04-25-year-end-summary/
```

Expected: `/tmp/blog-article-desktop-check.png` is created and shows a centered article, no page-level horizontal clipping, visible media captions for images with alt text.

- [ ] **Step 5: Capture mobile article screenshot**

Run:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --user-data-dir=/tmp/blog-article-mobile-check --screenshot=/tmp/blog-article-mobile-check.png --window-size=390,1400 http://127.0.0.1:4321/2026-04-25-year-end-summary/
```

Expected: `/tmp/blog-article-mobile-check.png` is created; title is not cut off, images fit inside the viewport, captions appear below images.

- [ ] **Step 6: Measure horizontal overflow in Chrome**

Run:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --user-data-dir=/tmp/blog-overflow-check --dump-dom "http://127.0.0.1:4321/2026-04-25-year-end-summary/" >/tmp/blog-overflow-dom.html
```

Then run this in the browser console manually if using visible Chrome, or use a small Playwright check if Playwright is installed:

```js
document.documentElement.scrollWidth <= document.documentElement.clientWidth
```

Expected: `true` at 390px width. If Playwright is not installed, rely on the mobile screenshot and manual visible Chrome check.

- [ ] **Step 7: Stop local dev server**

Stop the `npm run dev` terminal with `Ctrl-C`.

Expected: port `4321` is free.

- [ ] **Step 8: Review generated HTML for caption semantics**

Run:

```bash
rg -n "<figure|<figcaption|alt=\"富士山|alt=\"sample" dist/2026-04-25-year-end-summary/index.html dist/_e2e_heic/index.html 2>/dev/null || true
```

Expected: standalone article images use `<figure>` and non-empty alt text appears in `<figcaption>` while still remaining in `alt`.

- [ ] **Step 9: Inspect final diff**

Run:

```bash
git status --short
git diff --stat HEAD
git diff --check
```

Expected: no whitespace errors. Untracked `.impeccable.md` and `.superpowers/` may still be present from planning; do not stage them unless the user asks.

- [ ] **Step 10: Commit verification fixes if any were needed**

If verification required code changes, commit only those files:

```bash
git add astro.config.mjs .github/workflows/deploy_astro.yml src/utils/rehype-media.mjs src/pages/[slug].astro src/styles/global.css tests/build-cache-config.test.mjs tests/_helpers/temp-post.mjs tests/media-output.test.mjs tests/ui-regressions.test.mjs
git commit -m "test: verify article media layout"
```

If no code changes were needed after Task 3, skip this commit.

---

## Final Acceptance Checklist

- [ ] `node --test tests/build-cache-config.test.mjs tests/ui-regressions.test.mjs` passes.
- [ ] `node --test --test-concurrency=1 tests/media-output.test.mjs tests/media-cache-idempotence.test.mjs tests/media-publish.test.mjs tests/media-cache.test.mjs` passes.
- [ ] `npm run test` passes.
- [ ] `npm run build` passes.
- [ ] GitHub Actions workflow caches `.cache/astro` and `.cache/media`.
- [ ] `astro.config.mjs` uses `cacheDir: '.cache/astro'`.
- [ ] `astro.config.mjs` uses `breakpoints: [640, 828, 1080, 1440]`.
- [ ] Ordinary standalone Markdown images render as `<figure class="media-figure">`.
- [ ] HEIC still images render as `<figure class="media-figure media-figure--generated">`.
- [ ] Live Photo images render as `<figure class="livephoto media-figure media-figure--livephoto">`.
- [ ] Non-empty Markdown alt text remains on `<img alt="...">` and appears in `<figcaption>`.
- [ ] Empty alt text does not create an empty visible caption.
- [ ] Linked images remain linked and are not wrapped into standalone figures.
- [ ] 390px screenshot has no title or image clipping.
