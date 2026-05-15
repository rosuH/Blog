# Blog Quiet Archive and Visual System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the homepage from a full archive index to a quiet writing entry, add a dedicated archive page, and align the blog's paper/scribble visual system across homepage, archive, and article controls.

**Architecture:** Keep the Astro static site model. Extract post sorting/grouping into a small utility, add `/archive/` as a static page, update the homepage to consume only recent posts plus an archive summary, and centralize list/control visual rules through shared classes and small components only where they reduce duplication.

**Tech Stack:** Astro 5, TypeScript, CSS custom properties, `node:test`, `astro:content`, Playwright/manual browser QA.

---

## File Structure

- Create `src/utils/posts.ts`: post collection helpers for sorting, slicing recent posts, grouping by year, and formatting dates.
- Create `src/pages/archive.astro`: full static archive page.
- Create `src/components/ArchiveYearPill.astro`: shared year marker used by homepage archive summary and archive page.
- Create `src/components/PostList.astro`: shared article row list for recent posts and archive groups.
- Modify `src/pages/index.astro`: remove full archive rendering, use helper output and archive summary link.
- Modify `src/pages/[slug].astro`: align article utility controls and navigation with quiet control/list language.
- Modify `src/styles/global.css`: centralize paper/list/control classes and keep scribble assets constrained.
- Modify `tests/ui-regressions.test.mjs`: add build-output assertions for homepage, archive, visual hooks, and controls.

## Task 1: Post Data Helper and Regression Tests

**Files:**
- Create: `src/utils/posts.ts`
- Modify: `tests/ui-regressions.test.mjs`

- [ ] **Step 1: Add failing tests for homepage/archive data boundaries**

Add this test after the existing homepage test in `tests/ui-regressions.test.mjs`:

```js
test('homepage links to archive without rendering the full historical index', () => {
  const html = readDist('index.html');
  const homeSource = readSource('src', 'pages', 'index.astro');

  assert.match(html, /href="\/archive\/"/);
  assert.match(html, /查看全部归档/);
  assert.doesNotMatch(html, /id="archive-year-2018"/);
  assert.doesNotMatch(html, /id="archive-year-2016"/);
  assert.doesNotMatch(homeSource, /archiveGroups\.map/);
  assert.match(homeSource, /getArchiveSummary/);
});
```

Add this archive test after it:

```js
test('archive page renders the complete historical index by year', () => {
  const html = readDist('archive', 'index.html');
  const archiveSource = readSource('src', 'pages', 'archive.astro');
  const postsHelper = readSource('src', 'utils', 'posts.ts');

  assert.match(html, /完整归档/);
  assert.match(html, /id="archive-year-2021"/);
  assert.match(html, /id="archive-year-2016"/);
  assert.match(html, /SparseArray 简介/);
  assert.match(html, /启用 HTTPS 札记/);
  assert.match(html, /<time[^>]+datetime="2021-07-23T/);
  assert.match(archiveSource, /getArchiveGroups/);
  assert.match(postsHelper, /export function getSortedPosts/);
  assert.match(postsHelper, /export function getLatestPosts/);
  assert.match(postsHelper, /export function getArchiveGroups/);
  assert.match(postsHelper, /export function getArchiveSummary/);
});
```

- [ ] **Step 2: Run the targeted UI test and verify it fails**

Run:

```bash
npm run test:ui
```

Expected: FAIL because `dist/archive/index.html` and `src/utils/posts.ts` do not exist, and the homepage still renders `archiveGroups.map`.

- [ ] **Step 3: Create the post helper**

Create `src/utils/posts.ts`:

```ts
import type { CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;
export type ArchiveGroup = readonly [year: string, posts: BlogPost[]];

export interface ArchiveSummary {
  totalPosts: number;
  totalYears: number;
  recentYears: string[];
}

export function getSortedPosts(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function getLatestPosts(posts: BlogPost[], count = 5): BlogPost[] {
  return getSortedPosts(posts).slice(0, count);
}

export function getArchiveGroups(posts: BlogPost[]): ArchiveGroup[] {
  const groups = getSortedPosts(posts).reduce((map, post) => {
    const year = String(post.data.date.getFullYear());
    const bucket = map.get(year) ?? [];
    bucket.push(post);
    map.set(year, bucket);
    return map;
  }, new Map<string, BlogPost[]>());

  return Array.from(groups.entries());
}

export function getArchiveSummary(posts: BlogPost[], recentYearCount = 3): ArchiveSummary {
  const groups = getArchiveGroups(posts);

  return {
    totalPosts: getSortedPosts(posts).length,
    totalYears: groups.length,
    recentYears: groups.slice(0, recentYearCount).map(([year]) => year),
  };
}

export function formatFullDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatMonthDay(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  });
}
```

- [ ] **Step 4: Run the targeted UI test and verify helper compiles but route tests still fail**

Run:

```bash
npm run test:ui
```

Expected: FAIL remains because `src/pages/archive.astro` has not been created and `src/pages/index.astro` still renders full archive groups.

- [ ] **Step 5: Commit Task 1**

```bash
git add src/utils/posts.ts tests/ui-regressions.test.mjs
git commit -m "test: cover quiet archive data boundaries"
```

## Task 2: Dedicated Archive Page and Quiet Homepage

**Files:**
- Create: `src/pages/archive.astro`
- Create: `src/components/ArchiveYearPill.astro`
- Create: `src/components/PostList.astro`
- Modify: `src/pages/index.astro`
- Modify: `tests/ui-regressions.test.mjs`

- [ ] **Step 1: Create the shared year pill component**

Create `src/components/ArchiveYearPill.astro`:

```astro
---
interface Props {
  year: string;
  href?: string;
}

const { year, href } = Astro.props;
---

{href ? (
  <a href={href} class="archive-year">{year}</a>
) : (
  <span class="archive-year">{year}</span>
)}
```

- [ ] **Step 2: Create the shared post list component**

Create `src/components/PostList.astro`:

```astro
---
import type { BlogPost } from '../utils/posts';
import { formatFullDate, formatMonthDay } from '../utils/posts';

interface Props {
  posts: BlogPost[];
  variant: 'featured' | 'archive';
}

const { posts, variant } = Astro.props;
const isFeatured = variant === 'featured';
const formatDate = isFeatured ? formatFullDate : formatMonthDay;
---

<ol class:list={['post-list', `post-list--${variant}`]} role="list" data-stagger={isFeatured ? 'featured-posts' : undefined}>
  {posts.map((post, index) => (
    <li class:list={['post-row', { 'post-row--featured': isFeatured }]} style={isFeatured ? `--item-index: ${index}` : undefined}>
      <a href={`/${post.id}/`} class="post-link">
        <span class="post-title">{post.data.title}</span>
        <time class="post-date" datetime={post.data.date.toISOString()}>
          {formatDate(post.data.date)}
        </time>
      </a>
    </li>
  ))}
</ol>
```

- [ ] **Step 3: Create the archive page**

Create `src/pages/archive.astro`:

```astro
---
import Layout from '../layouts/Layout.astro';
import ArchiveYearPill from '../components/ArchiveYearPill.astro';
import PostList from '../components/PostList.astro';
import { getCollection } from 'astro:content';
import { SITE, absoluteUrl } from '../utils/site-info';
import { getArchiveGroups } from '../utils/posts';

const posts = await getCollection('blog', ({ data }) => !data.draft);
const archiveGroups = getArchiveGroups(posts);
const archiveUrl = absoluteUrl('/archive/', Astro.site);
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  url: archiveUrl,
  name: '完整归档',
  description: '按年份整理的 rosu 博客文章索引。',
  inLanguage: SITE.language,
  isPartOf: {
    '@type': 'Blog',
    name: SITE.name,
    url: absoluteUrl('/', Astro.site),
  },
};
---

<Layout title="完整归档" description="按年份整理的 rosu 博客文章索引。" structuredData={structuredData}>
  <section class="archive-page" aria-labelledby="archive-title">
    <header class="archive-page__header">
      <p class="archive-page__eyebrow">Archive</p>
      <h1 id="archive-title">完整归档</h1>
      <p>按年份整理的技术、写作和生活笔记。</p>
    </header>

    {archiveGroups.length > 0 ? (
      <div class="archive-groups archive-groups--full">
        {archiveGroups.map(([year, yearPosts]) => (
          <section class="archive-group" id={`archive-year-${year}`} aria-labelledby={`archive-heading-${year}`}>
            <h2 class="archive-year-heading" id={`archive-heading-${year}`}>
              <ArchiveYearPill year={year} href={`#archive-year-${year}`} />
            </h2>
            <PostList posts={yearPosts} variant="archive" />
          </section>
        ))}
      </div>
    ) : (
      <p class="archive-empty">暂无归档。</p>
    )}
  </section>
</Layout>

<style>
  .archive-page {
    max-width: var(--content-width);
    margin: 0 auto;
  }

  .archive-page__header {
    margin: 1.5rem 0 2.5rem;
    padding-bottom: 1.25rem;
    border-bottom: 1px solid color-mix(in oklab, var(--border) 74%, transparent);
  }

  .archive-page__eyebrow {
    margin: 0 0 0.4rem;
    color: color-mix(in oklab, var(--support) 70%, var(--fg-muted));
    font-family: var(--font-mono);
    font-size: var(--text-xs);
  }

  .archive-page__header h1 {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-3xl);
  }

  .archive-page__header p:last-child {
    margin: 0.75rem 0 0;
    color: var(--fg-muted);
    font-size: var(--text-sm);
  }

  .archive-empty {
    color: var(--fg-muted);
  }
</style>
```

- [ ] **Step 4: Update the homepage to consume only latest posts and archive summary**

In `src/pages/index.astro`, replace the current post setup with:

```astro
import PostList from '../components/PostList.astro';
import ArchiveYearPill from '../components/ArchiveYearPill.astro';
import { getCollection } from 'astro:content';
import { SITE, absoluteUrl } from '../utils/site-info';
import { getLatestPosts, getArchiveSummary } from '../utils/posts';

const posts = await getCollection('blog', ({ data }) => !data.draft);
const latestPosts = getLatestPosts(posts, 5);
const archiveSummary = getArchiveSummary(posts);
```

Replace the featured list markup with:

```astro
<PostList posts={latestPosts} variant="featured" />
```

Replace the full archive section with:

```astro
<section class="home-section home-section--archive" aria-labelledby="archive-title">
  <div class="section-head" data-reveal="section-head">
    <h2 id="archive-title">归档</h2>
  </div>

  <a href="/archive/" class="archive-entry">
    <span class="archive-entry__copy">
      <span class="archive-entry__title">查看全部归档</span>
      <span class="archive-entry__meta">
        {archiveSummary.totalPosts} 篇文章，跨 {archiveSummary.totalYears} 年
      </span>
    </span>
    <span class="archive-entry__years" aria-label={`最近年份：${archiveSummary.recentYears.join('、')}`}>
      {archiveSummary.recentYears.map((year) => <ArchiveYearPill year={year} />)}
    </span>
  </a>
</section>
```

Keep the existing `homeStructuredData` blogPost field based on `latestPosts`.

- [ ] **Step 5: Add homepage archive-entry CSS**

In the `<style>` block of `src/pages/index.astro`, replace the full archive group styles used only by homepage with:

```css
.archive-entry {
  min-height: 4.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.95rem 0;
  border-top: 1px solid color-mix(in oklab, var(--border) 78%, transparent);
  border-bottom: 1px solid color-mix(in oklab, var(--border) 78%, transparent);
  color: inherit;
  text-decoration: none;
  position: relative;
}

.archive-entry::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0.42rem;
  width: min(11rem, 52%);
  height: 6px;
  background: color-mix(in oklab, var(--avatar-blue) 58%, transparent);
  opacity: 0.68;
  clip-path: inset(0 100% 0 0);
  transition: clip-path var(--duration-medium) var(--ease-quiet);
  -webkit-mask-image: var(--scribble-underline-mask);
  mask-image: var(--scribble-underline-mask);
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
}

.archive-entry:hover::after,
.archive-entry:focus-visible::after {
  clip-path: inset(0 0 0 0);
}

.archive-entry__copy {
  display: grid;
  gap: 0.18rem;
}

.archive-entry__title {
  color: var(--fg);
  font-weight: 560;
  line-height: 1.4;
}

.archive-entry__meta {
  color: var(--fg-muted);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
}

.archive-entry__years {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.45rem;
}
```

In the mobile media query, add:

```css
.archive-entry {
  align-items: flex-start;
  flex-direction: column;
}

.archive-entry__years {
  justify-content: flex-start;
}
```

- [ ] **Step 6: Run the targeted UI test and verify it passes**

Run:

```bash
npm run test:ui
```

Expected: PASS.

- [ ] **Step 7: Commit Task 2**

```bash
git add src/pages/index.astro src/pages/archive.astro src/components/PostList.astro src/components/ArchiveYearPill.astro tests/ui-regressions.test.mjs
git commit -m "feat: add quiet archive entry"
```

## Task 3: Shared List, Year, and Paper Styling

**Files:**
- Modify: `src/styles/global.css`
- Modify: `src/pages/index.astro`
- Modify: `src/pages/archive.astro`
- Modify: `tests/ui-regressions.test.mjs`

- [ ] **Step 1: Add failing tests for shared visual hooks**

Add this test after `color system uses avatar blue with warm paper accents`:

```js
test('quiet archive visual system uses shared list and year hooks', () => {
  const css = readSource('src', 'styles', 'global.css');
  const homeSource = readSource('src', 'pages', 'index.astro');
  const archiveSource = readSource('src', 'pages', 'archive.astro');
  const postListSource = readSource('src', 'components', 'PostList.astro');
  const yearPillSource = readSource('src', 'components', 'ArchiveYearPill.astro');

  assert.match(css, /--divider-soft:/);
  assert.match(css, /--control-paper:/);
  assert.match(css, /\.post-row\s*\{[\s\S]*border-top:\s*1px solid var\(--divider-soft\)/);
  assert.match(css, /\.archive-year::before/);
  assert.match(css, /\.archive-year::after/);
  assert.match(postListSource, /post-list--featured/);
  assert.match(postListSource, /post-list--archive/);
  assert.match(yearPillSource, /class="archive-year"/);
  assert.match(homeSource, /archive-entry/);
  assert.match(archiveSource, /archive-groups--full/);
});
```

- [ ] **Step 2: Run the targeted UI test and verify it fails**

Run:

```bash
npm run test:ui
```

Expected: FAIL because `--divider-soft` and `--control-paper` are not defined yet.

- [ ] **Step 3: Add shared visual tokens**

In `src/styles/global.css` inside `:root`, add:

```css
--divider-soft: color-mix(in oklab, var(--border) 78%, transparent);
--divider-warm: color-mix(in oklab, var(--support-border) 44%, transparent);
--control-paper: color-mix(in oklab, var(--support-soft) 58%, var(--bg));
--control-ink: color-mix(in oklab, var(--support) 58%, var(--fg-muted));
```

Inside `html.dark`, add:

```css
--divider-soft: color-mix(in oklab, var(--border) 82%, transparent);
--divider-warm: color-mix(in oklab, var(--support-border) 52%, transparent);
--control-paper: color-mix(in oklab, var(--support-soft) 44%, var(--bg));
--control-ink: color-mix(in oklab, var(--support) 48%, var(--fg-muted));
```

- [ ] **Step 4: Move shared list/year styling into global CSS**

In `src/styles/global.css`, add this shared list block after the base `a` rule:

```css
.post-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.post-row {
  border-top: 1px solid var(--divider-soft);
}

.post-row:last-child {
  border-bottom: 1px solid var(--divider-soft);
}

.post-link {
  min-height: 2.75rem;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.8rem 0;
  text-decoration: none;
  position: relative;
}

.post-link::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0.35rem;
  width: min(18rem, 72%);
  height: 6px;
  background: linear-gradient(
    90deg,
    color-mix(in oklab, var(--avatar-blue) 72%, transparent),
    color-mix(in oklab, var(--avatar-blue-bright) 50%, transparent),
    color-mix(in oklab, var(--avatar-blue) 22%, transparent)
  );
  opacity: 0.72;
  transform: rotate(-0.8deg) translateY(1px);
  transform-origin: left;
  clip-path: inset(0 100% 0 0);
  transition: clip-path var(--duration-medium) var(--ease-quiet);
  pointer-events: none;
  -webkit-mask-image: var(--scribble-underline-mask);
  mask-image: var(--scribble-underline-mask);
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
}

.post-link:hover::after,
.post-link:focus-visible::after {
  clip-path: inset(0 0 0 0);
}

.post-title {
  min-width: 0;
  color: var(--fg);
  font-size: var(--text-base);
  font-weight: 500;
  letter-spacing: 0;
  line-height: 1.5;
  text-wrap: pretty;
  transition: color var(--duration-fast) ease;
}

.post-date {
  color: color-mix(in oklab, var(--fg-muted) 84%, var(--support));
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  transition: color var(--duration-fast) ease, transform var(--duration-fast) ease;
}

.post-link:hover .post-title,
.post-link:focus-visible .post-title {
  color: var(--accent);
}

.post-link:hover .post-date,
.post-link:focus-visible .post-date {
  color: color-mix(in oklab, var(--accent) 62%, var(--fg-muted));
  transform: translateX(-1px);
}

.post-row--featured {
  opacity: 0;
  animation: home-settle 400ms var(--ease-quiet) both;
  animation-delay: calc(70ms + (var(--item-index) * 36ms));
}

.post-row--featured .post-title {
  font-size: var(--text-lg);
  font-weight: 520;
}

.post-row--featured .post-link {
  padding: 0.9rem 0;
}

.post-list--archive .post-title {
  font-size: var(--text-sm);
}
```

Add this shared year marker block after the list block in `src/styles/global.css`:

```css
.archive-year {
  position: relative;
  isolation: isolate;
  display: inline-flex;
  align-items: center;
  width: fit-content;
  margin: 0;
  padding: 0.22rem 0.6rem;
  border: none;
  border-radius: 47% 53% 51% 49% / 54% 46% 52% 48%;
  background: transparent;
  color: var(--support);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-decoration: none;
  transition: color 0.15s ease, transform var(--duration-fast) var(--ease-quiet);
}

.archive-year::before,
.archive-year::after {
  content: '';
  position: absolute;
  pointer-events: none;
  z-index: -1;
}

.archive-year::before {
  inset: 0.04rem -0.08rem -0.03rem -0.05rem;
  background:
    linear-gradient(
      96deg,
      color-mix(in oklab, var(--support-soft) 92%, transparent),
      color-mix(in oklab, var(--avatar-peach) 42%, var(--support-soft))
    );
  transform: rotate(-0.8deg);
  -webkit-mask-image: var(--scribble-pill-fill-mask);
  mask-image: var(--scribble-pill-fill-mask);
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
}

.archive-year::after {
  inset: -0.08rem -0.16rem -0.07rem -0.13rem;
  background: var(--divider-warm);
  transform: rotate(0.9deg);
  opacity: 0.78;
  -webkit-mask-image: var(--scribble-pill-outline-mask);
  mask-image: var(--scribble-pill-outline-mask);
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
}

.archive-year:hover,
.archive-year:focus-visible {
  color: color-mix(in oklab, var(--support) 80%, var(--fg));
  transform: translateY(-1px) rotate(-0.3deg);
}

.archive-year:hover::before,
.archive-year:focus-visible::before {
  background:
    linear-gradient(
      96deg,
      color-mix(in oklab, var(--support-soft) 100%, transparent),
      color-mix(in oklab, var(--avatar-peach) 54%, var(--support-soft))
    );
}

.archive-year:hover::after,
.archive-year:focus-visible::after {
  background: color-mix(in oklab, var(--support-border) 86%, var(--border));
  opacity: 0.92;
}
```

- [ ] **Step 5: Remove duplicated list/year CSS from `src/pages/index.astro`**

Delete the local `.post-list`, `.post-row`, `.post-link`, `.post-title`, `.post-date`, `.post-row--featured`, `.post-list--archive`, `.archive-year`, and `.archive-year::before/::after` blocks from `src/pages/index.astro`. Keep homepage-only layout styles like `.home-section--recent`, `.archive-entry`, and media query layout.

- [ ] **Step 6: Run the targeted UI test and verify it passes**

Run:

```bash
npm run test:ui
```

Expected: PASS.

- [ ] **Step 7: Commit Task 3**

```bash
git add src/styles/global.css src/pages/index.astro src/pages/archive.astro tests/ui-regressions.test.mjs
git commit -m "style: unify archive list language"
```

## Task 4: Article Utility Control Alignment

**Files:**
- Modify: `src/styles/global.css`
- Modify: `src/pages/[slug].astro`
- Modify: `tests/ui-regressions.test.mjs`

- [ ] **Step 1: Add failing tests for quiet article controls**

Extend the existing `closed overlays are inert and floating controls meet touch target size` test with:

```js
assert.match(css, /\.quiet-control/);
assert.match(css, /\.toc-trigger\s*\{[\s\S]*background:\s*var\(--control-paper\)/);
assert.match(css, /\.back-to-top\s*\{[\s\S]*background:\s*var\(--control-paper\)/);
assert.match(css, /\.copy-btn\s*\{[\s\S]*background:\s*var\(--control-paper\)/);
assert.doesNotMatch(css, /\.toc-trigger\s*\{[\s\S]*color:\s*var\(--bg\)/);
assert.doesNotMatch(css, /\.back-to-top\s*\{[\s\S]*color:\s*var\(--bg\)/);
```

- [ ] **Step 2: Run the targeted UI test and verify it fails**

Run:

```bash
npm run test:ui
```

Expected: FAIL because `.quiet-control` and the `var(--control-paper)` control backgrounds are not present yet.

- [ ] **Step 3: Add shared quiet control CSS**

In `src/styles/global.css`, add before the TOC section:

```css
.quiet-control {
  min-width: 2.75rem;
  min-height: 2.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--control-ink);
  background: var(--control-paper);
  border: 1px solid var(--divider-warm);
  border-radius: 999px;
  cursor: pointer;
  box-shadow: none;
  transition:
    color var(--duration-fast) ease,
    border-color var(--duration-fast) ease,
    background-color var(--duration-fast) ease,
    transform var(--duration-fast) var(--ease-quiet);
}

.quiet-control:hover,
.quiet-control:focus-visible {
  color: color-mix(in oklab, var(--avatar-blue) 78%, var(--fg));
  border-color: color-mix(in oklab, var(--avatar-blue) 34%, var(--divider-warm));
  background: color-mix(in oklab, var(--control-paper) 88%, var(--accent-soft));
  transform: translateY(-1px);
}

.quiet-control:active {
  transform: translateY(0);
}
```

- [ ] **Step 4: Apply quiet control language to global controls**

Update `.copy-btn`, `.toc-trigger`, `.toc-mobile__close`, and `.back-to-top` in `src/styles/global.css` so their base declarations match the quiet control system.

Use this complete `.copy-btn` block:

```css
.copy-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.25rem;
  background: var(--control-paper);
  border: 1px solid var(--divider-warm);
  border-radius: 999px;
  color: var(--control-ink);
  cursor: pointer;
  opacity: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transform: translateY(-2px);
  transition:
    opacity var(--duration-fast) ease,
    color var(--duration-fast) ease,
    background-color var(--duration-fast) ease,
    transform var(--duration-fast) var(--ease-quiet);
}
```

For `.toc-trigger` and `.back-to-top`, keep their fixed positioning but use:

```css
.toc-trigger {
  position: fixed;
  left: 1rem;
  bottom: 1rem;
  z-index: 120;
  display: none;
  align-items: center;
  gap: 0.4rem;
  min-height: 2.75rem;
  padding: 0.55rem 0.95rem;
  font-family: var(--font-sans);
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--control-ink);
  background: var(--control-paper);
  border: 1px solid var(--divider-warm);
  border-radius: 9999px;
  cursor: pointer;
  box-shadow: none;
  transition:
    transform var(--duration-fast) var(--ease-quiet),
    color var(--duration-fast) ease,
    border-color var(--duration-fast) ease,
    background-color var(--duration-fast) ease;
}

.toc-trigger:hover {
  color: color-mix(in oklab, var(--avatar-blue) 78%, var(--fg));
  border-color: color-mix(in oklab, var(--avatar-blue) 34%, var(--divider-warm));
  background: color-mix(in oklab, var(--control-paper) 88%, var(--accent-soft));
  transform: translateY(-1px);
}

.back-to-top {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 120;
  width: 2.75rem;
  height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: var(--control-ink);
  background: var(--control-paper);
  border: 1px solid var(--divider-warm);
  border-radius: 50%;
  cursor: pointer;
  opacity: 0;
  transform: translateY(0.5rem);
  pointer-events: none;
  box-shadow: none;
  transition:
    opacity 220ms ease,
    transform 220ms var(--ease-quiet),
    color var(--duration-fast) ease,
    border-color var(--duration-fast) ease,
    background-color var(--duration-fast) ease;
}

.back-to-top.is-visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.back-to-top:hover {
  color: color-mix(in oklab, var(--avatar-blue) 78%, var(--fg));
  border-color: color-mix(in oklab, var(--avatar-blue) 34%, var(--divider-warm));
  background: color-mix(in oklab, var(--control-paper) 88%, var(--accent-soft));
}
```

Use this complete `.toc-mobile__close` block:

```css
.toc-mobile__close {
  position: absolute;
  top: 0.85rem;
  right: 0.85rem;
  width: 2.75rem;
  height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--control-ink);
  background: var(--control-paper);
  border: 1px solid var(--divider-warm);
  border-radius: 999px;
  cursor: pointer;
  transition:
    color var(--duration-fast) ease,
    border-color var(--duration-fast) ease,
    background-color var(--duration-fast) ease;
}

.toc-mobile__close:hover {
  color: color-mix(in oklab, var(--avatar-blue) 78%, var(--fg));
  border-color: color-mix(in oklab, var(--avatar-blue) 34%, var(--divider-warm));
  background: color-mix(in oklab, var(--control-paper) 88%, var(--accent-soft));
}
```

- [ ] **Step 5: Add quiet-control class to dynamic article buttons**

In `src/pages/[slug].astro`, update the script-created controls:

```ts
tocTrigger.className = 'toc-trigger quiet-control';
```

```ts
backToTop.className = 'back-to-top quiet-control';
```

Keep `copy-btn` class unchanged because it is styled directly and created inside code block wrappers.

- [ ] **Step 6: Run the targeted UI test and verify it passes**

Run:

```bash
npm run test:ui
```

Expected: PASS.

- [ ] **Step 7: Commit Task 4**

```bash
git add src/styles/global.css src/pages/[slug].astro tests/ui-regressions.test.mjs
git commit -m "style: soften article utility controls"
```

## Task 5: Full Verification and Browser QA

**Files:**
- Modify: `tests/ui-regressions.test.mjs` only if verification exposes a missing regression assertion.

- [ ] **Step 1: Run full test suite**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 2: Run whitespace check**

Run:

```bash
git diff --check
```

Expected: no output.

- [ ] **Step 3: Build production output**

Run:

```bash
npm run build
```

Expected: PASS and `dist/archive/index.html` exists.

- [ ] **Step 4: Start preview server**

Run:

```bash
npm run preview -- --host 127.0.0.1 --port 4321
```

Expected: server prints a local URL at `http://127.0.0.1:4321/`. If port 4321 is busy, use port 4322 and carry that URL through the next steps.

- [ ] **Step 5: Browser QA homepage, archive, and article**

Use Playwright or the in-app Browser against the preview URL:

```js
const pages = [
  '/',
  '/archive/',
  '/2026-04-25-year-end-summary/',
];
```

Check:

- Homepage first viewport shows Bio, quote, recent writing, and one archive entry.
- Homepage does not show 2018/2017/2016 year groups.
- Archive page shows 2021, 2020, 2019, 2018, 2017, and 2016 groups.
- Article page TOC and back-to-top controls use paper/ink controls, not dark app pills.
- Mobile viewport has no horizontal overflow.
- Reduced motion disables entry and hover transition motion.

- [ ] **Step 6: Capture final status**

Run:

```bash
git status --short
```

Expected: only intended files are modified and no build artifacts are staged.

- [ ] **Step 7: Commit final verification updates if any tests were adjusted**

If Task 5 required test updates:

```bash
git add tests/ui-regressions.test.mjs
git commit -m "test: cover quiet archive verification"
```

If no files changed in Task 5, do not create an empty commit.
