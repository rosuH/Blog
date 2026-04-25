import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdir, rm, writeFile, stat, utimes } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('publishToPublic copies only the product files (not meta.json or source.png)', async () => {
  const { publishToPublic } = await import('../src/utils/media-cache.mjs');
  const root = join(tmpdir(), `pub-${Date.now()}`);
  const cache = join(root, 'cache');
  const pub = join(root, 'public');
  try {
    await mkdir(join(cache, 'abc123'), { recursive: true });
    await writeFile(join(cache, 'abc123', 'img-800w.jpg'), Buffer.from('fake-product'));
    await writeFile(join(cache, 'abc123', 'source.png'), Buffer.from('internal-intermediate'));
    await writeFile(
      join(cache, 'abc123', 'meta.json'),
      JSON.stringify({ products: { still_1x_jpg: 'img-800w.jpg' } }),
    );

    await publishToPublic('abc123', cache, pub);

    const product = await stat(join(pub, '_media', 'abc123', 'img-800w.jpg'));
    assert.ok(product.size > 0);
    await assert.rejects(
      () => stat(join(pub, '_media', 'abc123', 'meta.json')),
      'meta.json must NOT be published',
    );
    await assert.rejects(
      () => stat(join(pub, '_media', 'abc123', 'source.png')),
      'source.png intermediate must NOT be published',
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('publishToPublic prunes stale files from previous publish runs', async () => {
  const { publishToPublic } = await import('../src/utils/media-cache.mjs');
  const root = join(tmpdir(), `pub-prune-${Date.now()}`);
  const cache = join(root, 'cache');
  const pub = join(root, 'public');
  try {
    // First publish: products contain old filenames
    await mkdir(join(cache, 'abc123'), { recursive: true });
    await writeFile(join(cache, 'abc123', 'img-old.jpg'), Buffer.from('old'));
    await writeFile(
      join(cache, 'abc123', 'meta.json'),
      JSON.stringify({ products: { still_1x_jpg: 'img-old.jpg' } }),
    );
    await publishToPublic('abc123', cache, pub);
    await stat(join(pub, '_media', 'abc123', 'img-old.jpg'));

    // Second publish: meta now lists a different filename (e.g. PROCESSOR_VERSION bump)
    await writeFile(join(cache, 'abc123', 'img-new.jpg'), Buffer.from('new'));
    await writeFile(
      join(cache, 'abc123', 'meta.json'),
      JSON.stringify({ products: { still_1x_jpg: 'img-new.jpg' } }),
    );
    await publishToPublic('abc123', cache, pub);

    await stat(join(pub, '_media', 'abc123', 'img-new.jpg'));
    await assert.rejects(
      () => stat(join(pub, '_media', 'abc123', 'img-old.jpg')),
      'stale product from previous publish must be pruned',
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('gcCache removes entries not in keep set and older than maxAgeDays', async () => {
  const { gcCache } = await import('../src/utils/media-cache.mjs');
  const cache = join(tmpdir(), `gc-${Date.now()}`);
  try {
    await mkdir(join(cache, 'keep1'), { recursive: true });
    await mkdir(join(cache, 'stale1'), { recursive: true });
    await mkdir(join(cache, 'fresh-unused'), { recursive: true });
    await writeFile(join(cache, 'keep1', 'meta.json'), '{}');
    await writeFile(join(cache, 'stale1', 'meta.json'), '{}');
    await writeFile(join(cache, 'fresh-unused', 'meta.json'), '{}');
    // Make stale1 old (90 days ago)
    const old = new Date(Date.now() - 90 * 86400 * 1000);
    await utimes(join(cache, 'stale1'), old, old);

    await gcCache(cache, new Set(['keep1']), { maxAgeDays: 60 });

    await stat(join(cache, 'keep1'));         // present
    await stat(join(cache, 'fresh-unused'));  // present (not stale enough)
    await assert.rejects(() => stat(join(cache, 'stale1'))); // gone
  } finally {
    await rm(cache, { recursive: true, force: true });
  }
});
