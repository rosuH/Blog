import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import { readFile, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { setupHeicPost, teardownHeicPost } from './_helpers/temp-post.mjs';

const SLUG = '_e2e_heic';
let post;

before(async () => {
  post = await setupHeicPost({ slug: SLUG });
  // Force-rebuild so Astro's content cache picks up the new post deterministically
  execFileSync('npm', ['run', 'build', '--', '--force'], { stdio: 'pipe' });
});

after(async () => {
  await teardownHeicPost(post.dir);
  // Restore: rebuild without the temp post so dist/ is clean
  execFileSync('npm', ['run', 'build', '--', '--force'], { stdio: 'pipe' });
});

test('HEIC reference is replaced with <picture> + AVIF/WebP/JPEG sources', async () => {
  const html = await readFile(post.articleHtmlPath, 'utf8');
  // Original .heic URL should NOT appear as an <img src>
  assert.doesNotMatch(html, /<img[^>]+src="[^"]*sample\.heic/);
  // Should have <picture> with AVIF source pointing into _media keyed by cacheKey
  assert.match(html, /<picture>[\s\S]*<source[^>]+type="image\/avif"[^>]+srcset="\/_media\/[a-f0-9]{16}-v\d+\//);
  // JPEG fallback img with width/height (CLS protection)
  assert.match(html, /<img[^>]+src="\/_media\/[a-f0-9]{16}-v\d+\/img-\d+w\.jpg"[^>]+width="\d+"[^>]+height="\d+"/);
});

test('Test post does NOT (yet) render as Live Photo (no .mov pair)', async () => {
  const html = await readFile(post.articleHtmlPath, 'utf8');
  // Match the actual figure markup, not the bare attribute name (which appears
  // in Layout's inline behavior script's '[data-livephoto]' selector text on every page).
  assert.doesNotMatch(html, /<figure[^>]*data-livephoto/);
});

test('Non-HEIC images still get loading=lazy and decoding=async', async () => {
  const html = await readFile(post.articleHtmlPath, 'utf8');
  // The PNG sample reference must be passed through with the lazy/async hints
  // (the new pipeline must preserve the old remark-image-performance behavior
  // for non-HEIC inputs). Match by alt — Astro's image optimizer rewrites the
  // src to a hashed /_astro/*.webp, so the .png filename isn't in the markup.
  assert.match(html, /<img[^>]+alt="sample-png"[^>]+loading="lazy"[^>]+decoding="async"|<img[^>]+alt="sample-png"[^>]+decoding="async"[^>]+loading="lazy"/);
});

test('Generated derivative files exist on disk', async () => {
  const html = await readFile(post.articleHtmlPath, 'utf8');
  const m = html.match(/\/_media\/([a-f0-9]{16}-v\d+)\/(img-\d+w\.jpg)/);
  assert.ok(m, 'should find a derivative URL');
  const [, key, filename] = m;
  const onDisk = new URL(`../dist/_media/${key}/${filename}`, import.meta.url);
  const s = await stat(onDisk);
  assert.ok(s.size > 0);
});

test('When a same-basename .mov exists, output renders as Live Photo', async () => {
  // Drop a fixture .mov next to the temp post's HEIC + rebuild
  execFileSync('ffmpeg', [
    '-y', '-f', 'lavfi', '-i', 'color=c=black:s=64x64:d=1',
    '-c:v', 'libx265', '-tag:v', 'hvc1', '-pix_fmt', 'yuv420p',
    '-an', '-movflags', '+faststart',
    `${post.dir}/sample.mov`,
  ], { stdio: 'pipe' });

  try {
    execFileSync('npm', ['run', 'build', '--', '--force'], { stdio: 'pipe' });
    const html = await readFile(post.articleHtmlPath, 'utf8');
    assert.match(html, /<figure[^>]+class="livephoto"/);
    assert.match(html, /<figure[^>]+data-livephoto/);
    assert.match(html, /<source[^>]+type="video\/mp4; codecs=&#x22;hvc1&#x22;"|<source[^>]+codecs="hvc1"/);
    assert.match(html, /<source[^>]+\.h264\.mp4[^>]*type="video\/mp4"|<source[^>]+type="video\/mp4"[^>]+\.h264\.mp4/);
    assert.match(html, /<button[^>]+class="livephoto-badge"/);
  } finally {
    const { unlink } = await import('node:fs/promises');
    await unlink(`${post.dir}/sample.mov`);
    // Restore: rebuild without .mov so the next test sees still-only state
    execFileSync('npm', ['run', 'build', '--', '--force'], { stdio: 'pipe' });
  }
});
