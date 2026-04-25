import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const articleHtmlPath = fileURLToPath(new URL('../dist/2021_summary/index.html', import.meta.url));

test('HEIC reference is replaced with <picture> + AVIF/WebP/JPEG sources', async () => {
  const html = await readFile(articleHtmlPath, 'utf8');
  // Original .heic URL should NOT appear as an <img src>
  assert.doesNotMatch(html, /<img[^>]+src="[^"]*tea-heic-with-live-photo\.heic/);
  // Should have <picture> with AVIF source pointing into _media
  assert.match(html, /<picture>[\s\S]*<source[^>]+type="image\/avif"[^>]+srcset="\/_media\/[a-f0-9]{16}\//);
  // JPEG fallback img with width/height (CLS protection)
  assert.match(html, /<img[^>]+src="\/_media\/[a-f0-9]{16}\/img-\d+w\.jpg"[^>]+width="\d+"[^>]+height="\d+"/);
});

test('Test post does NOT (yet) render as Live Photo (no .mov pair)', async () => {
  const html = await readFile(articleHtmlPath, 'utf8');
  assert.doesNotMatch(html, /data-livephoto/);
});

test('Existing PNG images keep loading=lazy and decoding=async', async () => {
  const html = await readFile(articleHtmlPath, 'utf8');
  assert.match(html, /<img[^>]+vs-code-fonts[^>]+loading="lazy"[^>]+decoding="async"|<img[^>]+vs-code-fonts[^>]+decoding="async"[^>]+loading="lazy"/);
});

test('Generated derivative files exist on disk', async () => {
  const html = await readFile(articleHtmlPath, 'utf8');
  const m = html.match(/\/_media\/([a-f0-9]{16})\/(img-\d+w\.jpg)/);
  assert.ok(m, 'should find a derivative URL');
  const [_, hash, filename] = m;
  const onDisk = fileURLToPath(new URL(`../dist/_media/${hash}/${filename}`, import.meta.url));
  const s = await stat(onDisk);
  assert.ok(s.size > 0);
});

import { execFileSync } from 'node:child_process';
import { copyFile, unlink } from 'node:fs/promises';

test('When a same-basename .mov exists, output renders as Live Photo', async () => {
  const postDir = fileURLToPath(new URL('../content/posts/2026-04-25-year-end-summary/', import.meta.url));
  const movPath = `${postDir}tea-heic-with-live-photo.mov`;
  // Generate fixture .mov
  execFileSync('ffmpeg', [
    '-y', '-f', 'lavfi', '-i', 'color=c=black:s=64x64:d=1',
    '-c:v', 'libx265', '-tag:v', 'hvc1', '-pix_fmt', 'yuv420p',
    '-an', '-movflags', '+faststart',
    movPath,
  ], { stdio: 'pipe' });

  try {
    // Re-build with the .mov in place; --force busts content cache for deterministic slug resolution
    execFileSync('npm', ['run', 'build', '--', '--force'], { stdio: 'pipe' });
    const html = await readFile(articleHtmlPath, 'utf8');
    assert.match(html, /<figure[^>]+class="livephoto"/);
    assert.match(html, /data-livephoto/);
    assert.match(html, /<source[^>]+type="video\/mp4; codecs=&#x22;hvc1&#x22;"|<source[^>]+codecs="hvc1"/);
    assert.match(html, /<source[^>]+\.h264\.mp4[^>]*type="video\/mp4"|<source[^>]+type="video\/mp4"[^>]+\.h264\.mp4/);
    assert.match(html, /<button[^>]+class="livephoto-badge"/);
  } finally {
    await unlink(movPath);
    // Restore: rebuild without .mov so subsequent tests / dev see the still-only state
    execFileSync('npm', ['run', 'build', '--', '--force'], { stdio: 'pipe' });
  }
});
