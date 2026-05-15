// SHA-256 content-addressed cache for derived media (HEIC stills, MOV clips).
// Bumping PROCESSOR_VERSION invalidates all existing cache entries.
import { createHash } from 'node:crypto';
import { createReadStream, writeFileSync, mkdirSync, readdirSync, statSync, rmSync } from 'node:fs';
import { resolve as pathResolve, dirname as pathDirname } from 'node:path';

// Test instrumentation: when MEDIA_TEST_COUNTER=1, every actual processor run
// (cache miss path) increments globalThis.__mediaProcessCount.
function bumpCounter() {
  if (process.env.MEDIA_TEST_COUNTER === '1') {
    globalThis.__mediaProcessCount = (globalThis.__mediaProcessCount || 0) + 1;
  }
}

// Astro's CLI calls process.exit() which skips 'beforeExit'; use 'exit' with
// synchronous I/O instead so the counter file is always written.
if (process.env.MEDIA_TEST_COUNTER === '1' && !globalThis.__mediaCounterHook) {
  globalThis.__mediaCounterHook = true;
  globalThis.__mediaProcessCount = 0;
  process.once('exit', () => {
    try {
      const out = pathResolve('.cache/media-counter.json');
      mkdirSync(pathDirname(out), { recursive: true });
      writeFileSync(out, JSON.stringify({ count: globalThis.__mediaProcessCount || 0 }));
    } catch { /* ignore write failures */ }
  });
}

export const PROCESSOR_VERSION = 2;

export async function hashSource(absPath) {
  return new Promise((resolve, reject) => {
    const h = createHash('sha256');
    const s = createReadStream(absPath);
    s.on('error', reject);
    s.on('data', (chunk) => h.update(chunk));
    s.on('end', () => resolve(h.digest('hex').slice(0, 16)));
  });
}

export function cacheKeyFor(hash) {
  return `${hash}-v${PROCESSOR_VERSION}`;
}

import { mkdir, writeFile, readFile, access, stat, rm, readdir, cp } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execFileP = promisify(execFile);

let _sharp;
async function getSharp() {
  if (_sharp) return _sharp;
  const mod = await import('sharp');
  _sharp = mod.default;
  return _sharp;
}

let _ffmpegPresent;
async function ensureFfmpeg() {
  if (_ffmpegPresent) return;
  try {
    await execFileP('ffmpeg', ['-hide_banner', '-version']);
    _ffmpegPresent = true;
  } catch (err) {
    throw new Error(`ffmpeg not available: ${err.message}`);
  }
}

// Stronger probe used only by processMov — H.264 transcode needs libx264.
// HEIC decode (called from processHeic) does not, so it uses ensureFfmpeg.
let _ffmpegX264Ok;
async function ensureFfmpegX264() {
  if (_ffmpegX264Ok) return;
  await ensureFfmpeg();
  try {
    const { stdout } = await execFileP('ffmpeg', ['-hide_banner', '-codecs']);
    if (!/libx264/.test(stdout)) {
      throw new Error('ffmpeg present but missing libx264 encoder.');
    }
    _ffmpegX264Ok = true;
  } catch (err) {
    throw new Error(`ffmpeg unusable for MOV transcode: ${err.message}`);
  }
}

async function probePrimaryVideoCodec(srcPath) {
  await ensureFfmpeg();
  try {
    const { stdout } = await execFileP('ffprobe', [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=codec_name',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      srcPath,
    ]);
    const codec = stdout.trim().split(/\s+/)[0];
    if (!codec) throw new Error('no primary video stream found');
    return codec;
  } catch (err) {
    throw new Error(`ffprobe unusable for MOV codec detection: ${err.message}`);
  }
}

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

const publishLocks = new Map();

async function withPublishLock(cacheKey, task) {
  const previous = publishLocks.get(cacheKey) ?? Promise.resolve();
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const next = previous.catch(() => {}).then(() => gate);
  publishLocks.set(cacheKey, next);
  await previous.catch(() => {});

  try {
    return await task();
  } finally {
    release();
    if (publishLocks.get(cacheKey) === next) publishLocks.delete(cacheKey);
  }
}

export async function processHeic(srcPath, cacheRoot) {
  await ensureFfmpeg();
  const sharp = await getSharp();
  const hash = await hashSource(srcPath);
  const key = cacheKeyFor(hash);
  // Directory and public URL are keyed by cacheKey (= <hash>-v<version>) so
  // bumping PROCESSOR_VERSION starts a fresh dir + URL — old artifacts become
  // orphaned (eventually cleaned by gcCacheSync) and CDN/browser caches see a
  // new path on the version flip.
  const dir = join(cacheRoot, key);
  const metaPath = join(dir, 'meta.json');

  if (await exists(metaPath)) {
    const meta = JSON.parse(await readFile(metaPath, 'utf8'));
    if (meta.cacheKey === key) return meta;
  }

  bumpCounter();
  await mkdir(dir, { recursive: true });

  // Decode HEIC HEVC → PNG via ffmpeg (sharp's libheif lacks HEVC decoder)
  const pngPath = join(dir, 'source.png');
  await execFileP('ffmpeg', [
    '-y', '-i', srcPath,
    '-update', '1', '-frames:v', '1',
    pngPath,
  ]);

  const img = sharp(pngPath).rotate();
  const metadata = await img.metadata();
  const w1 = Math.min(metadata.width, 1600);
  // Emit 2x only when source has meaningfully more pixels than 1x (≥1.5×).
  // Clamp to source width so the filename matches actual output dimensions.
  const w2 = metadata.width >= w1 * 1.5 ? Math.min(w1 * 2, metadata.width) : null;
  const widths = [w1, w2].filter(Boolean);

  const products = {};
  for (let i = 0; i < widths.length; i++) {
    const w = widths[i];
    const tier = i === 0 ? '1x' : '2x';
    const base = img.clone().resize({ width: w, withoutEnlargement: true });

    const avifName = `img-${w}w.avif`;
    const webpName = `img-${w}w.webp`;
    const jpgName = `img-${w}w.jpg`;

    await base.clone().avif({ quality: 65, effort: 4 }).toFile(join(dir, avifName));
    await base.clone().webp({ quality: 80 }).toFile(join(dir, webpName));
    await base.clone().jpeg({ quality: 82, mozjpeg: true }).toFile(join(dir, jpgName));

    products[`still_${tier}_avif`] = avifName;
    products[`still_${tier}_webp`] = webpName;
    products[`still_${tier}_jpg`] = jpgName;
  }

  const result = {
    cacheKey: key,
    hash,
    kind: 'heic',
    version: PROCESSOR_VERSION,
    src_basename: basename(srcPath, extname(srcPath)),
    dimensions: { width: metadata.width, height: metadata.height },
    products,
  };

  await writeFile(metaPath, JSON.stringify(result, null, 2));
  return result;
}

export async function processMov(srcPath, cacheRoot) {
  await ensureFfmpeg();
  const hash = await hashSource(srcPath);
  const key = cacheKeyFor(hash);
  const dir = join(cacheRoot, key);
  const metaPath = join(dir, 'meta.json');

  if (await exists(metaPath)) {
    const meta = JSON.parse(await readFile(metaPath, 'utf8'));
    if (meta.cacheKey === key) return meta;
  }

  bumpCounter();
  await mkdir(dir, { recursive: true });
  const codec = await probePrimaryVideoCodec(srcPath);
  const hevcOut = join(dir, 'clip.hevc.mp4');
  const h264Out = join(dir, 'clip.h264.mp4');
  const products = {};

  if (codec === 'hevc') {
    await ensureFfmpegX264();
    // HEVC: remux only, strip audio, force hvc1 tag for Safari.
    await execFileP('ffmpeg', [
      '-y', '-i', srcPath,
      '-map', '0:v:0',
      '-map_metadata', '-1',
      '-map_chapters', '-1',
      '-an', '-c:v', 'copy', '-tag:v', 'hvc1',
      '-movflags', '+faststart',
      hevcOut,
    ]);
    products.video_hevc = 'clip.hevc.mp4';

    // H.264: transcode, strip audio, fast-start.
    await execFileP('ffmpeg', [
      '-y', '-i', srcPath,
      '-map', '0:v:0',
      '-map_metadata', '-1',
      '-map_chapters', '-1',
      '-an',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      h264Out,
    ]);
    products.video_h264 = 'clip.h264.mp4';
  } else if (codec === 'h264') {
    // Some Live Photo exporters emit H.264 already; keep it lossless instead of
    // forcing an incompatible hvc1 remux.
    await execFileP('ffmpeg', [
      '-y', '-i', srcPath,
      '-map', '0:v:0',
      '-map_metadata', '-1',
      '-map_chapters', '-1',
      '-an', '-c:v', 'copy',
      '-movflags', '+faststart',
      h264Out,
    ]);
    products.video_h264 = 'clip.h264.mp4';
  } else {
    await ensureFfmpegX264();
    await execFileP('ffmpeg', [
      '-y', '-i', srcPath,
      '-map', '0:v:0',
      '-map_metadata', '-1',
      '-map_chapters', '-1',
      '-an',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      h264Out,
    ]);
    products.video_h264 = 'clip.h264.mp4';
  }

  const result = {
    cacheKey: key,
    hash,
    kind: 'mov',
    version: PROCESSOR_VERSION,
    video_codec: codec,
    src_basename: basename(srcPath, extname(srcPath)),
    products,
  };

  await writeFile(metaPath, JSON.stringify(result, null, 2));
  return result;
}

// Copies only the product files listed in meta.json into public/_media/<cacheKey>/.
// `cacheKey` is what processHeic/processMov use as the directory name (= <hash>-v<version>).
// Internal cache artifacts like source.png (HEIC decode intermediate) and
// meta.json are intentionally NOT published. Stale files in the destination
// (from a different output set) are removed before copying so the published
// dir is always exactly meta.products.
export async function publishToPublic(cacheKey, cacheRoot, publicRoot) {
  return withPublishLock(cacheKey, async () => {
    const src = join(cacheRoot, cacheKey);
    const dst = join(publicRoot, '_media', cacheKey);
    const metaPath = join(src, 'meta.json');
    const meta = JSON.parse(await readFile(metaPath, 'utf8'));
    const products = new Set(Object.values(meta.products || {}).filter(Boolean));
    await mkdir(dst, { recursive: true });

    // Prune stale entries that aren't in the current product set.
    try {
      const existing = await readdir(dst, { withFileTypes: true });
      for (const ent of existing) {
        if (products.has(ent.name)) continue;
        await rm(join(dst, ent.name), { recursive: true, force: true });
      }
    } catch {
      // ignore destination cleanup failures; copy below may still succeed
    }

    for (const filename of products) {
      await cp(join(src, filename), join(dst, filename), { force: true });
    }
  });
}

export async function gcCache(cacheRoot, keepSet, { maxAgeDays = 60 } = {}) {
  let entries;
  try {
    entries = await readdir(cacheRoot, { withFileTypes: true });
  } catch {
    return;
  }
  const cutoff = Date.now() - maxAgeDays * 86400 * 1000;
  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    if (keepSet.has(ent.name)) continue;
    const dirPath = join(cacheRoot, ent.name);
    try {
      const s = await stat(dirPath);
      if (s.mtimeMs < cutoff) {
        await rm(dirPath, { recursive: true, force: true });
      }
    } catch {
      // ignore individual failures
    }
  }
}

// Synchronous variant for use in process.exit handlers.
// Astro calls process.exit(), which skips beforeExit and async work in 'exit'
// is unreliable, so the GC scheduler in remark-media.mjs needs sync I/O.
export function gcCacheSync(cacheRoot, keepSet, { maxAgeDays = 60 } = {}) {
  let entries;
  try {
    entries = readdirSync(cacheRoot, { withFileTypes: true });
  } catch {
    return;
  }
  const cutoff = Date.now() - maxAgeDays * 86400 * 1000;
  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    if (keepSet.has(ent.name)) continue;
    const dirPath = join(cacheRoot, ent.name);
    try {
      const s = statSync(dirPath);
      if (s.mtimeMs < cutoff) {
        rmSync(dirPath, { recursive: true, force: true });
      }
    } catch {
      // ignore individual failures
    }
  }
}
