import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

function makeFixtureMov(path) {
  // 1s, 64x64, HEVC, AAC silent — close enough to an iOS Live Photo MOV
  execFileSync('ffmpeg', [
    '-y', '-f', 'lavfi', '-i', 'color=c=black:s=64x64:d=1',
    '-f', 'lavfi', '-i', 'anullsrc=channel_layout=mono:sample_rate=44100',
    '-c:v', 'libx265', '-tag:v', 'hvc1', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-shortest', '-movflags', '+faststart',
    path,
  ], { stdio: 'pipe' });
}

test('processMov outputs hevc and h264 mp4s, both audio-stripped', async () => {
  const { processMov } = await import('../src/utils/media-cache.mjs');
  const cacheRoot = join(tmpdir(), `mov-${Date.now()}`);
  await mkdir(cacheRoot, { recursive: true });
  const fixture = join(cacheRoot, 'src.mov');
  makeFixtureMov(fixture);

  const result = await processMov(fixture, cacheRoot);

  assert.equal(result.kind, 'mov');
  assert.ok(result.products.video_hevc.endsWith('.hevc.mp4'));
  assert.ok(result.products.video_h264.endsWith('.h264.mp4'));

  const dir = join(cacheRoot, result.hash);
  const hevcStat = await stat(join(dir, result.products.video_hevc));
  const h264Stat = await stat(join(dir, result.products.video_h264));
  assert.ok(hevcStat.size > 0);
  assert.ok(h264Stat.size > 0);

  // Probe both outputs to confirm there is NO audio stream
  const probeHevc = execFileSync('ffprobe', [
    '-v', 'error', '-show_streams', '-select_streams', 'a',
    join(dir, result.products.video_hevc),
  ]).toString();
  const probeH264 = execFileSync('ffprobe', [
    '-v', 'error', '-show_streams', '-select_streams', 'a',
    join(dir, result.products.video_h264),
  ]).toString();
  assert.equal(probeHevc.trim(), '', 'hevc output must have no audio stream');
  assert.equal(probeH264.trim(), '', 'h264 output must have no audio stream');

  await rm(cacheRoot, { recursive: true, force: true });
});

test('processMov is cache-hit on repeat', async () => {
  const { processMov } = await import('../src/utils/media-cache.mjs');
  const cacheRoot = join(tmpdir(), `mov-hit-${Date.now()}`);
  await mkdir(cacheRoot, { recursive: true });
  const fixture = join(cacheRoot, 'src.mov');
  makeFixtureMov(fixture);

  const r1 = await processMov(fixture, cacheRoot);
  const t0 = Date.now();
  const r2 = await processMov(fixture, cacheRoot);
  const elapsed = Date.now() - t0;

  assert.equal(r1.hash, r2.hash);
  assert.ok(elapsed < 100, `cache hit should be < 100ms, got ${elapsed}ms`);

  await rm(cacheRoot, { recursive: true, force: true });
});
