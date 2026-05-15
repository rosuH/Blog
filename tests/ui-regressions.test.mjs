import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = new URL('..', import.meta.url).pathname;
const distDir = join(repoRoot, 'dist');

function buildSite() {
  rmSync(distDir, { recursive: true, force: true });
  execFileSync('npm', ['run', 'build'], {
    cwd: repoRoot,
    stdio: 'pipe',
    encoding: 'utf8',
  });
}

function readDist(...segments) {
  return readFileSync(join(distDir, ...segments), 'utf8');
}

function readSource(...segments) {
  return readFileSync(join(repoRoot, ...segments), 'utf8');
}

function readAstroJs() {
  const astroDir = join(distDir, '_astro');
  if (!existsSync(astroDir)) return '';
  return readdirSync(astroDir)
    .filter((f) => f.endsWith('.js'))
    .map((f) => readFileSync(join(astroDir, f), 'utf8'))
    .join('\n');
}

function countMatches(text, pattern) {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

test('homepage foregrounds recent writing in Chinese with archive grouping hooks', () => {
  const html = readDist('index.html');
  const homeSource = readSource('src', 'pages', 'index.astro');
  const bioSource = readSource('src', 'components', 'Bio.astro');

  assert.match(html, /最近写作/);
  assert.match(html, /全部归档/);
  assert.match(html, /写 Android、技术，也写生活。/);
  assert.doesNotMatch(html, /按时间顺序整理的技术与生活笔记。/);
  assert.doesNotMatch(html, /其余文章按年份整理，方便快速浏览。/);
  assert.match(html, /aria-label="站点"/);
  assert.match(html, /aria-label="GitHub"/);
  assert.match(html, /aria-label="X"/);
  assert.match(html, /data-reveal="intro"/);
  assert.match(html, /data-stagger="featured-posts"/);
  assert.match(html, /--item-index: 0/);
  assert.doesNotMatch(homeSource, /\.post-row--featured\s*\{[^}]*background:/s);
  assert.doesNotMatch(homeSource, /\.tagline\s*\{[^}]*background:/s);
  assert.doesNotMatch(homeSource, /\.tagline\s*\{[^}]*border-left:/s);
  assert.match(homeSource, /\.tagline::before/);
  assert.match(bioSource, /\.bio-link svg\s*\{[\s\S]*display:\s*block;/);
});

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

test('article page renders a single h1 and Chinese post navigation labels', () => {
  const html = readDist('Manifesto-for-Minimalist-Software-Engineers-CN', 'index.html');
  const js = readAstroJs();

  assert.equal(countMatches(html, /<h1\b/g), 1);
  assert.doesNotMatch(html, /Earlier|Later/);
  assert.match(html, /上一篇|下一篇/);
  assert.match(html + js, /已复制/);
});

test('404 page provides a strong recovery path back into content', () => {
  const html = readDist('404.html');

  assert.match(html, /查看最新文章/);
  assert.match(html, /返回首页/);
  assert.match(html, /最近文章/);
});

test('build emits the expected article route', () => {
  assert.equal(existsSync(join(distDir, 'Manifesto-for-Minimalist-Software-Engineers-CN', 'index.html')), true);
});

test('theme toggle exposes localized motion-friendly labels', () => {
  const html = readDist('index.html');

  assert.match(html, /data-label-light="切换到浅色模式"/);
  assert.match(html, /data-label-dark="切换到深色模式"/);
});

test('bamboo shadow uses JS wind physics instead of global keyframe or SMIL transforms', () => {
  const source = readSource('src', 'components', 'BambooShadow.astro');

  assert.match(source, /requestAnimationFrame/);
  assert.match(source, /visibilitychange/);
  assert.match(source, /scheduleNextGust/);
  assert.match(source, /gustEnvelope/);
  assert.match(source, /class="bamboo-moonlight"/);
  assert.match(source, /radial-gradient/);
  assert.match(source, /mix-blend-mode:\s*soft-light/);
  assert.doesNotMatch(source, /@keyframes bamboo-gust/);
  assert.doesNotMatch(source, /animateTransform/);
});

test('color system uses avatar blue with warm paper accents', () => {
  const css = readSource('src', 'styles', 'global.css');
  const homeSource = readSource('src', 'pages', 'index.astro');

  assert.match(css, /--avatar-blue:\s+oklch\(49% 0\.19 255\)/);
  assert.match(css, /--avatar-peach:\s+oklch\(86% 0\.055 50\)/);
  assert.match(css, /--paper:\s+oklch\(97% 0\.012 78\)/);
  assert.match(css, /--fg-subtle:\s+oklch\(52% 0\.012 250\)/);
  assert.match(css, /--accent:\s+var\(--avatar-blue\)/);
  assert.match(css, /--support:\s+oklch\(50% 0\.095 52\)/);
  assert.match(css, /--bg:\s+var\(--paper\)/);
  assert.match(css, /--scribble-underline-mask:\s+url/);
  assert.match(css, /--scribble-quote-mask:\s+url/);
  assert.match(css, /--scribble-pill-fill-mask:\s+url/);
  assert.match(css, /--scribble-pill-outline-mask:\s+url/);
  assert.match(css, /mask-image:\s+var\(--scribble-underline-mask\)/);
  assert.match(css, /mask-image:\s+var\(--scribble-quote-mask\)/);
  assert.match(css, /clip-path:\s+inset\(0 100% 0 0\)/);
  assert.match(homeSource, /mask-image:\s+var\(--scribble-underline-mask\)/);
  assert.match(homeSource, /mask-image:\s+var\(--scribble-quote-mask\)/);
  assert.match(homeSource, /transition:\s+clip-path var\(--duration-medium\) var\(--ease-quiet\)/);
  assert.doesNotMatch(homeSource, /scaleX\(0\)/);
  assert.match(homeSource, /\.archive-year::before/);
  assert.match(homeSource, /\.archive-year::after/);
  assert.match(homeSource, /mask-image:\s+var\(--scribble-pill-fill-mask\)/);
  assert.match(homeSource, /mask-image:\s+var\(--scribble-pill-outline-mask\)/);
  assert.match(homeSource, /\.archive-year\s*\{[\s\S]*background:\s+transparent/);
  assert.match(homeSource, /home-section--recent/);
});

test('closed overlays are inert and floating controls meet touch target size', () => {
  const articleSource = readSource('src', 'pages', '[slug].astro');
  const css = readSource('src', 'styles', 'global.css');
  const bioSource = readSource('src', 'components', 'Bio.astro');

  assert.match(articleSource, /id="img-lightbox"[^>]+aria-hidden="true"[^>]+inert/);
  assert.match(articleSource, /lightbox\.removeAttribute\('inert'\)/);
  assert.match(articleSource, /lightbox\.setAttribute\('inert', ''\)/);
  assert.match(articleSource, /tocMobile\.setAttribute\('inert', ''\)/);
  assert.match(articleSource, /tocMobile\.removeAttribute\('inert'\)/);
  assert.match(articleSource, /tocTrigger\.setAttribute\('aria-controls', 'mobile-toc'\)/);
  assert.match(css, /\.toc-trigger\s*\{[\s\S]*min-height:\s*2\.75rem/);
  assert.match(css, /\.toc-mobile__close\s*\{[\s\S]*width:\s*2\.75rem;[\s\S]*height:\s*2\.75rem/);
  assert.match(css, /\.back-to-top\s*\{[\s\S]*width:\s*2\.75rem;[\s\S]*height:\s*2\.75rem/);
  assert.match(bioSource, /\.bio-link\s*\{[\s\S]*min-height:\s*2\.75rem;[\s\S]*min-width:\s*2\.75rem/);
  assert.doesNotMatch(css, /\.toc-trigger\s*\{[^}]*backdrop-filter:\s*blur/);
  assert.doesNotMatch(css, /\.back-to-top\s*\{[^}]*backdrop-filter:\s*blur/);
});

test('motion system stays quiet and ink-like', () => {
  const css = readSource('src', 'styles', 'global.css');
  const homeSource = readSource('src', 'pages', 'index.astro');
  const articleSource = readSource('src', 'pages', '[slug].astro');
  const darkModeSource = readSource('src', 'components', 'DarkMode.astro');

  assert.match(css, /--ease-quiet:\s+cubic-bezier/);
  assert.match(homeSource, /@keyframes home-settle/);
  assert.match(homeSource, /@keyframes ink-line-reveal/);
  assert.match(homeSource, /@keyframes quote-stroke-reveal/);
  assert.match(homeSource, /animation:\s+ink-line-reveal 560ms 120ms var\(--ease-quiet\) both/);
  assert.match(homeSource, /animation:\s+quote-stroke-reveal 480ms 80ms var\(--ease-quiet\) both/);
  assert.doesNotMatch(articleSource, /prose\.style\.opacity/);
  assert.match(articleSource, /behavior:\s+prefersReducedMotion \? 'auto' : 'smooth'/);
  assert.match(darkModeSource, /transform:\s+scale\(1\.06\)/);
});

test('article page exposes editorial layout hooks and overflow-safe media styles', () => {
  const html = readDist('2026-04-25-year-end-summary', 'index.html');
  const articleSource = readSource('src', 'pages', '[slug].astro');
  const css = readSource('src', 'styles', 'global.css');

  assert.match(html, /class="article-shell"/);
  assert.match(html, /class="article-header"/);
  assert.match(html, /class="article-title"/);
  assert.match(html, /class="article-date"/);
  assert.doesNotMatch(html, /__ASTRO_IMAGE_/);
  assert.match(html, /<img[^>]+alt="澳门大三巴牌坊"/);
  assert.match(css, /--content-width:\s+700px/);
  assert.match(css, /--media-width:\s+980px/);
  assert.match(css, /\.media-figure\s*\{/);
  assert.match(css, /position:\s*absolute/);
  assert.match(css, /overflow-wrap:\s+anywhere/);
  assert.match(css, /overflow-x:\s+auto/);
  assert.match(articleSource, /article-shell/);
});

before(() => {
  buildSite();
});
