import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync, existsSync } from 'node:fs';
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
  assert.match(bioSource, /\.bio-link svg\s*\{[\s\S]*display:\s*block;/);
});

test('article page renders a single h1 and Chinese post navigation labels', () => {
  const html = readDist('Manifesto-for-Minimalist-Software-Engineers-CN', 'index.html');

  assert.equal(countMatches(html, /<h1\b/g), 1);
  assert.doesNotMatch(html, /Earlier|Later/);
  assert.match(html, /上一篇|下一篇/);
  assert.match(html, /已复制/);
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

test('color system uses calmer paper, copper, and pine accents', () => {
  const css = readSource('src', 'styles', 'global.css');
  const homeSource = readSource('src', 'pages', 'index.astro');

  assert.match(css, /--accent:\s+oklch\(52% 0\.22 265\)/);
  assert.match(css, /--support:\s+oklch\(47% 0\.11 265\)/);
  assert.match(css, /--bg:\s+oklch\(97\.7% 0\.006 85\)/);
  assert.match(homeSource, /home-section--recent/);
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
  assert.match(css, /grid-template-columns:\s+minmax\(0,\s*1fr\)\s+var\(--caption-width\)/);
  assert.match(css, /overflow-wrap:\s+anywhere/);
  assert.match(css, /overflow-x:\s+auto/);
  assert.match(articleSource, /article-shell/);
});

before(() => {
  buildSite();
});
