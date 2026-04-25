import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdir, rm, stat, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FIXTURE = fileURLToPath(new URL(
  '../content/posts/2026-04-25-year-end-summary/tea-heic-with-live-photo.heic',
  import.meta.url,
));

test('processHeic produces avif/webp/jpg at 1x and 2x sizes with meta.json', async () => {
  const { processHeic } = await import('../src/utils/media-cache.mjs');
  const cacheRoot = join(tmpdir(), `heic-${Date.now()}`);
  await mkdir(cacheRoot, { recursive: true });

  try {
    const result = await processHeic(FIXTURE, cacheRoot);

    assert.match(result.hash, /^[a-f0-9]{16}$/);
    assert.ok(result.dimensions.width > 0);
    assert.ok(result.dimensions.height > 0);
    assert.ok(result.products.still_1x_avif.endsWith('.avif'));
    assert.ok(result.products.still_1x_webp.endsWith('.webp'));
    assert.ok(result.products.still_1x_jpg.endsWith('.jpg'));
    // 2x exists when source is large (3158px wide → 2x is 3200, fits)
    assert.ok(result.products.still_2x_avif?.endsWith('.avif'));

    // All product files exist on disk
    const dir = join(cacheRoot, result.cacheKey);
    for (const filename of Object.values(result.products)) {
      if (!filename) continue;
      const s = await stat(join(dir, filename));
      assert.ok(s.size > 0);
    }

    // meta.json is correct
    const meta = JSON.parse(await readFile(join(dir, 'meta.json'), 'utf8'));
    assert.equal(meta.kind, 'heic');
    assert.equal(meta.version, 1);
  } finally {
    await rm(cacheRoot, { recursive: true, force: true });
  }
});

test('processHeic is a cache hit on repeated call (no file rewrites)', async () => {
  const { processHeic } = await import('../src/utils/media-cache.mjs');
  const cacheRoot = join(tmpdir(), `heic-hit-${Date.now()}`);
  await mkdir(cacheRoot, { recursive: true });

  try {
    const r1 = await processHeic(FIXTURE, cacheRoot);
    const dir = join(cacheRoot, r1.cacheKey);
    // Snapshot mtimes of every product + meta.json before second call
    const tracked = ['meta.json', ...Object.values(r1.products).filter(Boolean)];
    const before = Object.fromEntries(
      await Promise.all(tracked.map(async (f) => [f, (await stat(join(dir, f))).mtimeMs])),
    );

    const r2 = await processHeic(FIXTURE, cacheRoot);

    const after = Object.fromEntries(
      await Promise.all(tracked.map(async (f) => [f, (await stat(join(dir, f))).mtimeMs])),
    );

    assert.equal(r1.hash, r2.hash);
    assert.deepEqual(r1.products, r2.products);
    for (const [filename, mtime] of Object.entries(before)) {
      assert.equal(after[filename], mtime, `${filename} must not be rewritten on cache hit`);
    }
  } finally {
    await rm(cacheRoot, { recursive: true, force: true });
  }
});
