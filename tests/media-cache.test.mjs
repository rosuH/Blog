import assert from 'node:assert/strict';
import test from 'node:test';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { hashSource, cacheKeyFor, PROCESSOR_VERSION } from '../src/utils/media-cache.mjs';

test('hashSource is stable for identical bytes', async () => {
  const dir = await mkdir(join(tmpdir(), `mc-${Date.now()}`), { recursive: true });
  const f1 = join(dir, 'a.bin');
  const f2 = join(dir, 'b.bin');
  await writeFile(f1, Buffer.from('hello'));
  await writeFile(f2, Buffer.from('hello'));
  const h1 = await hashSource(f1);
  const h2 = await hashSource(f2);
  assert.equal(h1, h2);
  assert.match(h1, /^[a-f0-9]{16}$/);
  await rm(dir, { recursive: true, force: true });
});

test('hashSource differs for different bytes', async () => {
  const dir = await mkdir(join(tmpdir(), `mc-${Date.now()}-2`), { recursive: true });
  const f1 = join(dir, 'a.bin');
  const f2 = join(dir, 'b.bin');
  await writeFile(f1, Buffer.from('hello'));
  await writeFile(f2, Buffer.from('world'));
  const h1 = await hashSource(f1);
  const h2 = await hashSource(f2);
  assert.notEqual(h1, h2);
  await rm(dir, { recursive: true, force: true });
});

test('cacheKeyFor combines hash and processor version', () => {
  assert.equal(cacheKeyFor('abc123'), `abc123-v${PROCESSOR_VERSION}`);
});
