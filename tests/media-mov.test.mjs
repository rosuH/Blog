import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

function makeFixtureMov(path, { codec = 'hevc' } = {}) {
  // 1s, 64x64, AAC silent — close enough to an iOS Live Photo MOV.
  const videoArgs = codec === 'h264'
    ? ['-c:v', 'libx264']
    : ['-c:v', 'libx265', '-tag:v', 'hvc1'];
  execFileSync('ffmpeg', [
    '-y', '-f', 'lavfi', '-i', 'color=c=black:s=64x64:d=1',
    '-f', 'lavfi', '-i', 'anullsrc=channel_layout=mono:sample_rate=44100',
    ...videoArgs, '-pix_fmt', 'yuv420p',
    '-metadata', 'creation_time=2026-04-25T02:44:31Z',
    '-metadata', 'com.apple.quicktime.content.identifier=test-live-photo-id',
    '-c:a', 'aac', '-shortest', '-movflags', '+faststart',
    path,
  ], { stdio: 'pipe' });
}

function sensitiveMetadataOf(path) {
  return execFileSync('exiftool', [
    '-S',
    '-GPS:all',
    '-Keys:all',
    '-UserData:all',
    '-QuickTime:CreateDate',
    '-QuickTime:ModifyDate',
    path,
  ]).toString();
}

test('processMov outputs hevc and h264 mp4s, both audio-stripped', async () => {
  const { processMov } = await import('../src/utils/media-cache.mjs');
  const cacheRoot = join(tmpdir(), `mov-${Date.now()}`);
  await mkdir(cacheRoot, { recursive: true });

  try {
    const fixture = join(cacheRoot, 'src.mov');
    makeFixtureMov(fixture);

    const result = await processMov(fixture, cacheRoot);

    assert.equal(result.kind, 'mov');
    assert.ok(result.products.video_hevc.endsWith('.hevc.mp4'));
    assert.ok(result.products.video_h264.endsWith('.h264.mp4'));

    const dir = join(cacheRoot, result.cacheKey);
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
    assert.doesNotMatch(
      sensitiveMetadataOf(join(dir, result.products.video_hevc)),
      /test-live-photo-id|2026:04:25|GPS|ContentIdentifier/,
      'hevc output must not retain source privacy metadata',
    );
    assert.doesNotMatch(
      sensitiveMetadataOf(join(dir, result.products.video_h264)),
      /test-live-photo-id|2026:04:25|GPS|ContentIdentifier/,
      'h264 output must not retain source privacy metadata',
    );
  } finally {
    await rm(cacheRoot, { recursive: true, force: true });
  }
});

test('processMov accepts H.264 Live Photo MOVs without forcing an HEVC source', async () => {
  const { processMov } = await import('../src/utils/media-cache.mjs');
  const cacheRoot = join(tmpdir(), `mov-h264-${Date.now()}`);
  await mkdir(cacheRoot, { recursive: true });

  try {
    const fixture = join(cacheRoot, 'src.mov');
    makeFixtureMov(fixture, { codec: 'h264' });

    const result = await processMov(fixture, cacheRoot);

    assert.equal(result.kind, 'mov');
    assert.equal(result.video_codec, 'h264');
    assert.equal(result.products.video_hevc, undefined);
    assert.ok(result.products.video_h264.endsWith('.h264.mp4'));

    const dir = join(cacheRoot, result.cacheKey);
    const h264Path = join(dir, result.products.video_h264);
    const h264Stat = await stat(h264Path);
    assert.ok(h264Stat.size > 0);

    const audioProbe = execFileSync('ffprobe', [
      '-v', 'error', '-show_streams', '-select_streams', 'a',
      h264Path,
    ]).toString();
    const videoCodec = execFileSync('ffprobe', [
      '-v', 'error', '-select_streams', 'v:0',
      '-show_entries', 'stream=codec_name',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      h264Path,
    ]).toString().trim();
    assert.equal(audioProbe.trim(), '', 'h264 output must have no audio stream');
    assert.equal(videoCodec, 'h264');
    assert.doesNotMatch(
      sensitiveMetadataOf(h264Path),
      /test-live-photo-id|2026:04:25|GPS|ContentIdentifier/,
      'h264 output must not retain source privacy metadata',
    );
  } finally {
    await rm(cacheRoot, { recursive: true, force: true });
  }
});

test('processMov is cache-hit on repeat (no file rewrites)', async () => {
  const { processMov } = await import('../src/utils/media-cache.mjs');
  const cacheRoot = join(tmpdir(), `mov-hit-${Date.now()}`);
  await mkdir(cacheRoot, { recursive: true });

  try {
    const fixture = join(cacheRoot, 'src.mov');
    makeFixtureMov(fixture);

    const r1 = await processMov(fixture, cacheRoot);
    const dir = join(cacheRoot, r1.cacheKey);
    const tracked = ['meta.json', ...Object.values(r1.products).filter(Boolean)];
    const before = Object.fromEntries(
      await Promise.all(tracked.map(async (f) => [f, (await stat(join(dir, f))).mtimeMs])),
    );

    const r2 = await processMov(fixture, cacheRoot);

    const after = Object.fromEntries(
      await Promise.all(tracked.map(async (f) => [f, (await stat(join(dir, f))).mtimeMs])),
    );

    assert.equal(r1.hash, r2.hash);
    for (const [filename, mtime] of Object.entries(before)) {
      assert.equal(after[filename], mtime, `${filename} must not be rewritten on cache hit`);
    }
  } finally {
    await rm(cacheRoot, { recursive: true, force: true });
  }
});
