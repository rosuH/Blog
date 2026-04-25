// SHA-256 content-addressed cache for derived media (HEIC stills, MOV clips).
// Bumping PROCESSOR_VERSION invalidates all existing cache entries.
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';

export const PROCESSOR_VERSION = 1;

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

import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
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

let _ffmpegOk;
async function ensureFfmpeg() {
  if (_ffmpegOk) return;
  try {
    const { stdout } = await execFileP('ffmpeg', ['-hide_banner', '-codecs']);
    if (!/libx264/.test(stdout)) {
      throw new Error('ffmpeg present but missing libx264 encoder.');
    }
    _ffmpegOk = true;
  } catch (err) {
    throw new Error(`ffmpeg not available or unusable: ${err.message}`);
  }
}

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

export async function processHeic(srcPath, cacheRoot) {
  await ensureFfmpeg();
  const sharp = await getSharp();
  const hash = await hashSource(srcPath);
  const key = cacheKeyFor(hash);
  const dir = join(cacheRoot, hash);
  const metaPath = join(dir, 'meta.json');

  if (await exists(metaPath)) {
    const meta = JSON.parse(await readFile(metaPath, 'utf8'));
    if (meta.cacheKey === key) return meta;
  }

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
