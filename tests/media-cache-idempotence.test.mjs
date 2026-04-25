import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import { execSync } from 'node:child_process';
import { readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { setupHeicPost, teardownHeicPost } from './_helpers/temp-post.mjs';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const counterPath = fileURLToPath(new URL('../.cache/media-counter.json', import.meta.url));

let post;

before(async () => {
  // The cache idempotence test needs at least one HEIC referenced from a
  // built post so the cold build actually exercises a processor. Use a
  // temp post under content/posts/ — same pattern as media-output tests.
  post = await setupHeicPost({ slug: '_e2e_idempotence' });
});

after(async () => {
  await teardownHeicPost(post.dir);
});

async function buildAndReadCounter() {
  if (existsSync(counterPath)) await rm(counterPath);
  execSync('npm run build -- --force', {
    cwd: repoRoot,
    env: { ...process.env, MEDIA_TEST_COUNTER: '1' },
    stdio: 'pipe',
  });
  return JSON.parse(await readFile(counterPath, 'utf8')).count;
}

test('Second consecutive build runs zero processor invocations', async () => {
  // Cold start: nuke the media cache
  const cacheDir = fileURLToPath(new URL('../.cache/media', import.meta.url));
  await rm(cacheDir, { recursive: true, force: true });

  const cold = await buildAndReadCounter();
  assert.ok(cold >= 1, `cold build should process at least one file, got ${cold}`);

  const warm = await buildAndReadCounter();
  assert.equal(warm, 0, `warm build should be 0 processor runs, got ${warm}`);
});
