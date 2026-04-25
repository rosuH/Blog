import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdir, rm, writeFile, stat, utimes } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('publishToPublic copies a hash directory into public/_media/<hash>/', async () => {
  const { publishToPublic } = await import('../src/utils/media-cache.mjs');
  const root = join(tmpdir(), `pub-${Date.now()}`);
  const cache = join(root, 'cache');
  const pub = join(root, 'public');
  await mkdir(join(cache, 'abc123'), { recursive: true });
  await writeFile(join(cache, 'abc123', 'img-800w.jpg'), Buffer.from('fake'));
  await writeFile(join(cache, 'abc123', 'meta.json'), '{}');

  await publishToPublic('abc123', cache, pub);

  const s1 = await stat(join(pub, '_media', 'abc123', 'img-800w.jpg'));
  assert.ok(s1.size > 0);
  await rm(root, { recursive: true, force: true });
});

test('gcCache removes entries not in keep set and older than maxAgeDays', async () => {
  const { gcCache } = await import('../src/utils/media-cache.mjs');
  const cache = join(tmpdir(), `gc-${Date.now()}`);
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

  await rm(cache, { recursive: true, force: true });
});
