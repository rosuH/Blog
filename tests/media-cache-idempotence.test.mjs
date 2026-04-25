import assert from 'node:assert/strict';
import test from 'node:test';
import { execSync } from 'node:child_process';
import { readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const counterPath = fileURLToPath(new URL('../.cache/media-counter.json', import.meta.url));

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
