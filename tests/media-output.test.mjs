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
