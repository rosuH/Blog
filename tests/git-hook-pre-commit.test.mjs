import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HOOK_PATH = fileURLToPath(new URL('../.githooks/pre-commit', import.meta.url));
const SHARP_FIXTURE = fileURLToPath(new URL('./fixtures/sample.png', import.meta.url));

function gpsTagsOf(file) {
  const out = execFileSync('exiftool', ['-S', '-GPSLatitude', '-GPSLongitude', '-GPSPosition', file]).toString();
  return out.trim();
}

async function makeJpegWithGps(path) {
  const sharp = (await import('sharp')).default;
  // Make a tiny JPEG from the existing tracked PNG fixture
  await sharp(SHARP_FIXTURE).jpeg({ quality: 80 }).toFile(path);
  // Inject GPS coords (San Francisco)
  execFileSync('exiftool', [
    '-overwrite_original', '-q',
    '-GPSLatitude=37.7749', '-GPSLatitudeRef=N',
    '-GPSLongitude=-122.4194', '-GPSLongitudeRef=W',
    path,
  ]);
}

test('pre-commit hook strips GPS from staged JPEG, keeping the file content otherwise intact', async () => {
  const repoDir = join(tmpdir(), `gps-hook-${Date.now()}`);
  await mkdir(repoDir, { recursive: true });
  try {
    // Init a fresh repo + identity so commit-related plumbing works
    const git = (...args) => execFileSync('git', args, { cwd: repoDir, stdio: 'pipe' });
    git('init', '-q');
    git('config', 'user.email', 'test@example.com');
    git('config', 'user.name', 'test');
    git('config', 'commit.gpgsign', 'false');

    const photo = join(repoDir, 'photo.jpg');
    await makeJpegWithGps(photo);

    // Sanity: GPS is present pre-stage
    assert.match(gpsTagsOf(photo), /GPSLatitude/, 'fixture must have GPS before staging');

    git('add', 'photo.jpg');

    // Run the hook with the temp repo as cwd (the hook reads `git diff --cached`)
    const result = spawnSync('bash', [HOOK_PATH], { cwd: repoDir, encoding: 'utf8' });
    assert.equal(result.status, 0, `hook exit code: ${result.status}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);
    assert.match(result.stdout, /Stripped GPS\/location metadata/);

    // After hook: GPS should be gone from the file on disk
    assert.equal(gpsTagsOf(photo).trim(), '', 'GPS tags must be removed');

    // And the file should be re-staged with the cleaned content
    const stagedShaBefore = git('rev-parse', ':photo.jpg').toString().trim();
    const fileShaCurrent = git('hash-object', 'photo.jpg').toString().trim();
    assert.equal(stagedShaBefore, fileShaCurrent, 'cleaned file must be re-staged');
  } finally {
    await rm(repoDir, { recursive: true, force: true });
  }
});

test('pre-commit hook is a no-op when no media files are staged', async () => {
  const repoDir = join(tmpdir(), `gps-hook-noop-${Date.now()}`);
  await mkdir(repoDir, { recursive: true });
  try {
    const git = (...args) => execFileSync('git', args, { cwd: repoDir, stdio: 'pipe' });
    git('init', '-q');
    git('config', 'user.email', 'test@example.com');
    git('config', 'user.name', 'test');

    await writeFile(join(repoDir, 'README.md'), '# hello\n');
    git('add', 'README.md');

    const result = spawnSync('bash', [HOOK_PATH], { cwd: repoDir, encoding: 'utf8' });
    assert.equal(result.status, 0);
    assert.equal(result.stdout.trim(), '', 'no-op should produce no output');
  } finally {
    await rm(repoDir, { recursive: true, force: true });
  }
});

test('pre-commit hook leaves files without GPS untouched (no spurious re-stage)', async () => {
  const repoDir = join(tmpdir(), `gps-hook-clean-${Date.now()}`);
  await mkdir(repoDir, { recursive: true });
  try {
    const git = (...args) => execFileSync('git', args, { cwd: repoDir, stdio: 'pipe' });
    git('init', '-q');
    git('config', 'user.email', 'test@example.com');
    git('config', 'user.name', 'test');

    const sharp = (await import('sharp')).default;
    const photo = join(repoDir, 'clean.jpg');
    await sharp(SHARP_FIXTURE).jpeg({ quality: 80 }).toFile(photo);
    git('add', 'clean.jpg');

    const result = spawnSync('bash', [HOOK_PATH], { cwd: repoDir, encoding: 'utf8' });
    assert.equal(result.status, 0);
    assert.equal(result.stdout.trim(), '', 'no Stripped report when nothing was stripped');
  } finally {
    await rm(repoDir, { recursive: true, force: true });
  }
});
