# HEIC + Live Photo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `.heic` files in `content/posts/<slug>/` render correctly across all browsers, and auto-upgrade to interactive Live Photos when paired with a same-basename `.mov`. Zero markdown syntax change.

**Architecture:** Build-time pipeline. A SHA-256 content-addressed cache (`.cache/media/`) backs two processors: HEIC→AVIF/WebP/JPEG (sharp) and MOV→HEVC/H.264 MP4 (ffmpeg). New remark+rehype plugin pair detects HEIC images in markdown and rewrites them to `<picture>` (HEIC alone) or `<figure data-livephoto>` (HEIC + MOV) with prebuilt URLs. Cached derivatives are copied into `public/_media/<hash>/` and served by Astro. iOS-style "LIVE" badge with hover/long-press playback; fully muted; respects `prefers-reduced-motion`.

**Tech Stack:** Astro 5, sharp ^0.33 (image resizing + AVIF/WebP/JPEG encoding), system ffmpeg (HEIC HEVC decoding + MOV processing — libx264 required), Node.js 20 (`node:test`), GitHub Actions ubuntu-latest.

**HEIC decode note:** sharp's prebuilt libvips includes libheif but ships **without** the HEVC decoder plugin (libde265 is LGPL and excluded for binary-size/licensing reasons). iPhone HEIC files are almost always HEVC-compressed, so sharp cannot decode them directly. We use ffmpeg as the HEIC decoder front-end, producing a lossless PNG intermediate that sharp then re-encodes. This adds zero new system dependencies (ffmpeg is already required for MOV).

**Reference:** [Spec](../specs/2026-04-25-heic-livephoto-design.md)

---

## File Structure

**Created:**
- `src/utils/media-cache.mjs` — content-addressed cache + HEIC processor + MOV processor
- `src/utils/remark-media.mjs` — markdown image-node detection, attaches metadata
- `src/utils/rehype-media.mjs` — expands metadata into final `<picture>`/`<figure>` HTML
- `src/components/LivePhoto.astro` — purely presentational figure + scoped CSS + inline script
- `src/components/Picture.astro` — pure `<picture>` wrapper (used by HEIC-alone path)
- `tests/media-output.test.mjs` — build-output assertions for HEIC/LivePhoto pages

**Modified:**
- `astro.config.mjs` — replace `remark-image-performance` / `rehype-image-performance` with new media plugins
- `.github/workflows/deploy_astro.yml` — add cache restore + tooling probes
- `.gitignore` — add `public/_media/`
- `package.json` — add `sharp` dependency

**Deleted:**
- `src/utils/remark-image-performance.mjs` — superseded by `remark-media.mjs`
- `src/utils/rehype-image-performance.mjs` — superseded by `rehype-media.mjs`

---

### Task 1: Project setup — dependencies and gitignore

**Files:**
- Modify: `package.json`
- Modify: `.gitignore`

- [ ] **Step 1: Install sharp**

```bash
npm install sharp@^0.33
```

Expected: adds `"sharp": "^0.33.x"` to `dependencies` in `package.json` and updates `package-lock.json`.

- [ ] **Step 2: Verify sharp HEIF support locally**

```bash
node -e "import('sharp').then(s => { console.log('heif input:', !!s.default.format.heif?.input?.file); })"
```

Expected output: `heif input: true`

If `false`: stop and investigate. macOS arm64 / linux-x64 prebuilts at sharp ^0.33 ship libvips-heif. If we hit a platform without it later, the runtime probe in Task 3 will fail loudly.

- [ ] **Step 3: Add `public/_media/` to .gitignore**

In `.gitignore`, after the line `dist`, add:

```
# Media build output (generated from .heic/.mov sources)
public/_media/
```

Note: `.cache/` is already gitignored (Gatsby block) so `.cache/media/` is covered.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "chore: add sharp dep + ignore generated media dir"
```

---

### Task 2: MediaCache — pure key/hash helpers

**Files:**
- Create: `src/utils/media-cache.mjs`
- Test: `tests/media-cache.test.mjs`

This is the foundation. We build it test-first because the cache key logic is the most failure-prone part — if hashing is wrong, derivatives leak across versions.

- [ ] **Step 1: Write failing tests for hash helpers**

Create `tests/media-cache.test.mjs`:

```js
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
```

- [ ] **Step 2: Run test, expect failure**

```bash
node --test tests/media-cache.test.mjs
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement minimal `media-cache.mjs`**

Create `src/utils/media-cache.mjs`:

```js
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
```

- [ ] **Step 4: Run tests, expect pass**

```bash
node --test tests/media-cache.test.mjs
```

Expected: 3 pass, 0 fail.

- [ ] **Step 5: Commit**

```bash
git add src/utils/media-cache.mjs tests/media-cache.test.mjs
git commit -m "feat(media): content-addressed cache key helpers"
```

---

### Task 3: MediaCache — HEIC processor

**Files:**
- Modify: `src/utils/media-cache.mjs`
- Test: `tests/media-heic.test.mjs`

We process the real test file from `content/posts/2026-04-25-year-end-summary/` to verify end-to-end. Sharp is fast enough that this is fine to run in tests.

- [ ] **Step 1: Write failing test**

Create `tests/media-heic.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdir, rm, stat, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FIXTURE = fileURLToPath(new URL(
  '../content/posts/2026-04-25-year-end-summary/tea-heic-with-live-photo.heic',
  import.meta.url,
));

test('processHeic produces avif/webp/jpg at 1x and 2x sizes with meta.json', async () => {
  const { processHeic } = await import('../src/utils/media-cache.mjs');
  const cacheRoot = join(tmpdir(), `heic-${Date.now()}`);
  await mkdir(cacheRoot, { recursive: true });

  const result = await processHeic(FIXTURE, cacheRoot);

  assert.match(result.hash, /^[a-f0-9]{16}$/);
  assert.ok(result.dimensions.width > 0);
  assert.ok(result.dimensions.height > 0);
  assert.ok(result.products.still_1x_avif.endsWith('.avif'));
  assert.ok(result.products.still_1x_webp.endsWith('.webp'));
  assert.ok(result.products.still_1x_jpg.endsWith('.jpg'));
  // 2x exists when source is large (3158px wide → 2x is 3200, fits)
  assert.ok(result.products.still_2x_avif?.endsWith('.avif'));

  // All product files exist on disk
  const dir = join(cacheRoot, result.hash);
  for (const filename of Object.values(result.products)) {
    if (!filename) continue;
    const s = await stat(join(dir, filename));
    assert.ok(s.size > 0);
  }

  // meta.json is correct
  const meta = JSON.parse(await readFile(join(dir, 'meta.json'), 'utf8'));
  assert.equal(meta.kind, 'heic');
  assert.equal(meta.version, 1);

  await rm(cacheRoot, { recursive: true, force: true });
});

test('processHeic is a cache hit on repeated call (no rework)', async () => {
  const { processHeic } = await import('../src/utils/media-cache.mjs');
  const cacheRoot = join(tmpdir(), `heic-hit-${Date.now()}`);
  await mkdir(cacheRoot, { recursive: true });

  const r1 = await processHeic(FIXTURE, cacheRoot);
  const t0 = Date.now();
  const r2 = await processHeic(FIXTURE, cacheRoot);
  const elapsed = Date.now() - t0;

  assert.equal(r1.hash, r2.hash);
  assert.deepEqual(r1.products, r2.products);
  assert.ok(elapsed < 100, `cache hit should be < 100ms, got ${elapsed}ms`);

  await rm(cacheRoot, { recursive: true, force: true });
});
```

- [ ] **Step 2: Run test, expect failure**

```bash
node --test tests/media-heic.test.mjs
```

Expected: FAIL — `processHeic` not exported.

- [ ] **Step 3: Implement `processHeic`**

Append to `src/utils/media-cache.mjs`. The HEIC pipeline is:
1. ffmpeg decodes HEVC HEIC → lossless PNG in cache dir (`source.png`)
2. sharp reads the PNG → resize → AVIF/WebP/JPEG outputs at 1×/2×
3. PNG intermediate is kept (small overhead, regenerated only on cache miss)

```js
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
  const w2 = metadata.width >= w1 * 2 ? w1 * 2 : null;
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
```

- [ ] **Step 4: Run tests, expect pass**

```bash
node --test tests/media-heic.test.mjs
```

Expected: 2 pass. First test takes ~5-15s (real HEIC encoding); second is < 100ms (cache hit).

- [ ] **Step 5: Commit**

```bash
git add src/utils/media-cache.mjs tests/media-heic.test.mjs
git commit -m "feat(media): HEIC processor with sharp + cache"
```

---

### Task 4: MediaCache — MOV processor

**Files:**
- Modify: `src/utils/media-cache.mjs`
- Test: `tests/media-mov.test.mjs`

We don't have a fixture .mov in the repo. Generate a tiny one in the test setup using ffmpeg's `lavfi` source (1-second silent HEVC video). This gives us a deterministic, repo-free fixture.

- [ ] **Step 1: Write failing test**

Create `tests/media-mov.test.mjs`:

```js
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
```

- [ ] **Step 2: Run test, expect failure**

```bash
node --test tests/media-mov.test.mjs
```

Expected: FAIL — `processMov` not exported.

- [ ] **Step 3: Implement `processMov`**

Append to `src/utils/media-cache.mjs`. Note: `execFileP` and `ensureFfmpeg()` were already added in Task 3 — do NOT redeclare them. Just use the existing helpers.

```js
export async function processMov(srcPath, cacheRoot) {
  await ensureFfmpeg();
  const hash = await hashSource(srcPath);
  const key = cacheKeyFor(hash);
  const dir = join(cacheRoot, hash);
  const metaPath = join(dir, 'meta.json');

  if (await exists(metaPath)) {
    const meta = JSON.parse(await readFile(metaPath, 'utf8'));
    if (meta.cacheKey === key) return meta;
  }

  await mkdir(dir, { recursive: true });
  const hevcOut = join(dir, 'clip.hevc.mp4');
  const h264Out = join(dir, 'clip.h264.mp4');

  // HEVC: remux only, strip audio, force hvc1 tag for Safari
  await execFileP('ffmpeg', [
    '-y', '-i', srcPath,
    '-an', '-c:v', 'copy', '-tag:v', 'hvc1',
    '-movflags', '+faststart',
    hevcOut,
  ]);

  // H.264: transcode, strip audio, fast-start
  await execFileP('ffmpeg', [
    '-y', '-i', srcPath,
    '-an',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '23',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    h264Out,
  ]);

  const result = {
    cacheKey: key,
    hash,
    kind: 'mov',
    version: PROCESSOR_VERSION,
    src_basename: basename(srcPath, extname(srcPath)),
    products: {
      video_hevc: 'clip.hevc.mp4',
      video_h264: 'clip.h264.mp4',
    },
  };

  await writeFile(metaPath, JSON.stringify(result, null, 2));
  return result;
}
```

- [ ] **Step 4: Run tests, expect pass**

```bash
node --test tests/media-mov.test.mjs
```

Expected: 2 pass. First test ~3-5s (transcode); second < 100ms.

- [ ] **Step 5: Commit**

```bash
git add src/utils/media-cache.mjs tests/media-mov.test.mjs
git commit -m "feat(media): MOV processor (HEVC remux + H.264 transcode, audio stripped)"
```

---

### Task 5: MediaCache — public copy + GC

**Files:**
- Modify: `src/utils/media-cache.mjs`
- Test: `tests/media-publish.test.mjs`

The cache lives in `.cache/media/`. For Astro to serve, we need to copy hits into `public/_media/<hash>/`. We also need a `gcCache` function that prunes entries not referenced this build (and older than 60 days mtime, as a safety net for cache restored across runs).

- [ ] **Step 1: Write failing tests**

Create `tests/media-publish.test.mjs`:

```js
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
```

- [ ] **Step 2: Run tests, expect failure**

```bash
node --test tests/media-publish.test.mjs
```

Expected: FAIL — exports missing.

- [ ] **Step 3: Implement `publishToPublic` and `gcCache`**

Append to `src/utils/media-cache.mjs`:

```js
import { readdir, cp } from 'node:fs/promises';

export async function publishToPublic(hash, cacheRoot, publicRoot) {
  const src = join(cacheRoot, hash);
  const dst = join(publicRoot, '_media', hash);
  await mkdir(dst, { recursive: true });
  await cp(src, dst, { recursive: true, force: true });
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
```

Also add the missing import at top of `media-cache.mjs`:
```js
import { stat, rm } from 'node:fs/promises';
```
(Add `stat, rm` to the existing import line that already pulls `mkdir, writeFile, readFile, access` — keep imports DRY.)

- [ ] **Step 4: Run tests, expect pass**

```bash
node --test tests/media-publish.test.mjs
```

Expected: 2 pass.

- [ ] **Step 5: Commit**

```bash
git add src/utils/media-cache.mjs tests/media-publish.test.mjs
git commit -m "feat(media): public publishing + cache GC"
```

---

### Task 6: Picture.astro component

**Files:**
- Create: `src/components/Picture.astro`

A pure presentational component for `<picture>`. Used by HEIC-alone path. Keep it simple — no logic, just templating.

- [ ] **Step 1: Create the component**

Create `src/components/Picture.astro`:

```astro
---
interface Props {
  hash: string;
  alt: string;
  width: number;
  height: number;
  products: {
    still_1x_avif: string;
    still_1x_webp: string;
    still_1x_jpg: string;
    still_2x_avif?: string;
    still_2x_webp?: string;
    still_2x_jpg?: string;
  };
  loading?: 'lazy' | 'eager';
}

const { hash, alt, width, height, products, loading = 'lazy' } = Astro.props;
const base = `/_media/${hash}`;
const has2x = !!products.still_2x_jpg;

const avifSrcset = has2x
  ? `${base}/${products.still_1x_avif} 1x, ${base}/${products.still_2x_avif} 2x`
  : `${base}/${products.still_1x_avif} 1x`;
const webpSrcset = has2x
  ? `${base}/${products.still_1x_webp} 1x, ${base}/${products.still_2x_webp} 2x`
  : `${base}/${products.still_1x_webp} 1x`;
const jpgSrcset = has2x ? `${base}/${products.still_2x_jpg} 2x` : undefined;
---
<picture>
  <source type="image/avif" srcset={avifSrcset} />
  <source type="image/webp" srcset={webpSrcset} />
  <img
    src={`${base}/${products.still_1x_jpg}`}
    srcset={jpgSrcset}
    width={width}
    height={height}
    alt={alt}
    loading={loading}
    decoding="async"
  />
</picture>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Picture.astro
git commit -m "feat(media): Picture.astro component"
```

---

### Task 7: LivePhoto.astro component

**Files:**
- Create: `src/components/LivePhoto.astro`

The full Live Photo component: figure wrapper, picture, video, badge button, scoped CSS, and the `is:inline` script.

- [ ] **Step 1: Create the component**

Create `src/components/LivePhoto.astro`:

```astro
---
interface Props {
  hash: string;
  alt: string;
  width: number;
  height: number;
  products: {
    still_1x_avif: string;
    still_1x_webp: string;
    still_1x_jpg: string;
    still_2x_avif?: string;
    still_2x_webp?: string;
    still_2x_jpg?: string;
    video_hevc: string;
    video_h264: string;
  };
}
import Picture from './Picture.astro';

const { hash, alt, width, height, products } = Astro.props;
const base = `/_media/${hash}`;
---
<figure class="livephoto" data-livephoto data-state="idle" style={`aspect-ratio: ${width} / ${height};`}>
  <Picture hash={hash} alt={alt} width={width} height={height} products={products} />
  <video
    class="livephoto-video"
    data-lp-video
    muted
    playsinline
    preload="none"
    width={width}
    height={height}
    aria-hidden="true"
  >
    <source src={`${base}/${products.video_hevc}`} type='video/mp4; codecs="hvc1"' />
    <source src={`${base}/${products.video_h264}`} type="video/mp4" />
  </video>
  <button type="button" class="livephoto-badge" aria-label="Live Photo — 悬停或长按播放">
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.2" />
      <circle cx="8" cy="8" r="3.6" fill="none" stroke="currentColor" stroke-width="1.2" />
      <circle cx="8" cy="8" r="1.4" fill="currentColor" class="livephoto-dot" />
    </svg>
    <span>LIVE</span>
  </button>
</figure>

<style>
  .livephoto {
    position: relative;
    margin: 0;
    overflow: hidden;
    border-radius: 4px;
    background: var(--code-bg);
  }
  .livephoto :global(picture),
  .livephoto :global(picture img),
  .livephoto-video {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .livephoto-video {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 0.18s ease-out;
    pointer-events: none;
  }
  .livephoto[data-state="playing"] :global(picture) {
    opacity: 0;
    transition: opacity 0.18s ease-out;
  }
  .livephoto[data-state="playing"] .livephoto-video {
    opacity: 1;
  }
  .livephoto-badge {
    position: absolute;
    top: 12px;
    left: 12px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px 4px 8px;
    border: 0;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(8px) saturate(1.4);
    -webkit-backdrop-filter: blur(8px) saturate(1.4);
    color: #fff;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    cursor: pointer;
    user-select: none;
  }
  :global(html.dark) .livephoto-badge {
    background: rgba(255, 255, 255, 0.12);
    color: var(--bg);
  }
  .livephoto-badge:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .livephoto[data-state="playing"] .livephoto-dot {
    animation: livephoto-pulse 1.4s ease-in-out infinite;
  }
  @keyframes livephoto-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  @media (prefers-reduced-motion: reduce) {
    .livephoto[data-state="playing"] :global(picture),
    .livephoto-video {
      transition: none;
    }
    .livephoto[data-state="playing"] .livephoto-dot {
      animation: none;
    }
  }
</style>

<script is:inline>
  (function () {
    if (window.__livephotoBound) return;
    window.__livephotoBound = true;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelectorAll('[data-livephoto]').forEach((fig) => {
      const video = fig.querySelector('[data-lp-video]');
      const badge = fig.querySelector('.livephoto-badge');
      if (!video || !badge) return;
      let pressTimer = 0;
      const start = () => {
        if (fig.dataset.state === 'playing') return;
        fig.dataset.state = 'playing';
        try { video.currentTime = 0; } catch (e) {}
        const p = video.play();
        if (p && p.catch) p.catch(() => { fig.dataset.state = 'idle'; });
      };
      const stop = () => {
        video.pause();
        try { video.currentTime = 0; } catch (e) {}
        fig.dataset.state = 'idle';
      };
      video.addEventListener('ended', stop);

      if (reduce) {
        badge.addEventListener('click', () => {
          fig.dataset.state === 'playing' ? stop() : start();
        });
      } else {
        fig.addEventListener('mouseenter', start);
        fig.addEventListener('mouseleave', stop);
        fig.addEventListener('pointerdown', (e) => {
          if (e.pointerType !== 'touch') return;
          pressTimer = setTimeout(start, 200);
        });
        ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => {
          fig.addEventListener(ev, () => { clearTimeout(pressTimer); stop(); });
        });
        badge.addEventListener('keydown', (e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            fig.dataset.state === 'playing' ? stop() : start();
          }
        });
      }

      const io = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting && fig.dataset.state === 'playing') stop();
      }, { rootMargin: '200px' });
      io.observe(fig);
    });
  })();
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/LivePhoto.astro
git commit -m "feat(media): LivePhoto.astro component"
```

---

### Task 8: remark-media plugin (detection + metadata)

**Files:**
- Create: `src/utils/remark-media.mjs`

This walks the markdown AST. For HEIC images, it resolves the absolute path via the vfile, runs both processors as needed, and stores the metadata as a JSON-encoded `data-media` attribute on the image node. For non-HEIC images it preserves the existing `loading=lazy` / `decoding=async` defaults.

- [ ] **Step 1: Create the plugin**

Create `src/utils/remark-media.mjs`:

```js
// Detects .heic markdown image references, resolves their paired .mov (if any),
// runs HEIC/MOV processors, and serializes per-image metadata onto the
// AST node so the rehype phase can render the final picture/figure HTML.
//
// Non-HEIC images are passed through with the original loading/decoding hints.
import { dirname, extname, isAbsolute, join, resolve, basename } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  processHeic,
  processMov,
  publishToPublic,
} from './media-cache.mjs';

const CACHE_ROOT = fileURLToPath(new URL('../../.cache/media/', import.meta.url));
const PUBLIC_ROOT = fileURLToPath(new URL('../../public/', import.meta.url));

const referencedHashes = new Set();
export function getReferencedHashes() { return referencedHashes; }

function walk(node, visit) {
  if (!node || typeof node !== 'object') return;
  visit(node);
  if (Array.isArray(node.children)) for (const c of node.children) walk(c, visit);
}

function resolveSrc(url, mdFile) {
  if (!url) return null;
  if (isAbsolute(url)) return url;
  if (/^https?:\/\//i.test(url)) return null; // remote, skip
  return resolve(dirname(mdFile), url);
}

export default function remarkMedia() {
  return async (tree, file) => {
    const mdFile = file?.path ?? file?.history?.[file.history.length - 1];
    if (!mdFile) return;

    const tasks = [];
    walk(tree, (node) => {
      if (node.type !== 'image') return;
      node.data ||= {};
      node.data.hProperties ||= {};
      const ext = extname(node.url || '').toLowerCase();

      if (ext !== '.heic') {
        if (node.data.hProperties.loading == null) node.data.hProperties.loading = 'lazy';
        if (node.data.hProperties.decoding == null) node.data.hProperties.decoding = 'async';
        return;
      }
      const heicPath = resolveSrc(node.url, mdFile);
      if (!heicPath || !existsSync(heicPath)) return;
      tasks.push({ node, heicPath });
    });

    for (const { node, heicPath } of tasks) {
      const stillMeta = await processHeic(heicPath, CACHE_ROOT);
      referencedHashes.add(stillMeta.hash);
      await publishToPublic(stillMeta.hash, CACHE_ROOT, PUBLIC_ROOT);

      const movPath = join(
        dirname(heicPath),
        `${basename(heicPath, '.heic')}.mov`,
      );
      let videoMeta = null;
      if (existsSync(movPath)) {
        videoMeta = await processMov(movPath, CACHE_ROOT);
        referencedHashes.add(videoMeta.hash);
        await publishToPublic(videoMeta.hash, CACHE_ROOT, PUBLIC_ROOT);
      }

      const payload = {
        kind: videoMeta ? 'livephoto' : 'heic',
        stillHash: stillMeta.hash,
        width: stillMeta.dimensions.width,
        height: stillMeta.dimensions.height,
        products: { ...stillMeta.products, ...(videoMeta?.products ?? {}) },
        // For livephoto, video files live under videoMeta.hash dir
        videoHash: videoMeta?.hash ?? null,
        alt: node.alt ?? '',
      };
      node.data.hProperties['data-media'] = JSON.stringify(payload);
      // Remove the URL so rehype doesn't double-render the original .heic <img>
      node.data.hProperties['data-media-marker'] = '1';
    }
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/remark-media.mjs
git commit -m "feat(media): remark plugin detects HEIC and runs processors"
```

---

### Task 9: rehype-media plugin (AST → final HTML)

**Files:**
- Create: `src/utils/rehype-media.mjs`

In rehype-land, find `<img>` nodes that have `data-media-marker`, parse the JSON payload, and replace the node with the appropriate hast subtree.

- [ ] **Step 1: Create the plugin**

Create `src/utils/rehype-media.mjs`:

```js
// Replaces <img data-media-marker="1"> nodes with the final <picture> or
// <figure data-livephoto> hast subtree, using the JSON payload that
// remark-media stored on data-media.

function h(tag, props = {}, children = []) {
  return { type: 'element', tagName: tag, properties: props, children };
}
function text(value) { return { type: 'text', value }; }

function pictureNode({ hash, alt, width, height, products, loading = 'lazy' }) {
  const base = `/_media/${hash}`;
  const has2x = !!products.still_2x_jpg;
  const avifSrcset = has2x
    ? `${base}/${products.still_1x_avif} 1x, ${base}/${products.still_2x_avif} 2x`
    : `${base}/${products.still_1x_avif} 1x`;
  const webpSrcset = has2x
    ? `${base}/${products.still_1x_webp} 1x, ${base}/${products.still_2x_webp} 2x`
    : `${base}/${products.still_1x_webp} 1x`;
  const img = h('img', {
    src: `${base}/${products.still_1x_jpg}`,
    width, height, alt,
    loading, decoding: 'async',
  });
  if (has2x) img.properties.srcset = `${base}/${products.still_2x_jpg} 2x`;
  return h('picture', {}, [
    h('source', { type: 'image/avif', srcset: avifSrcset }),
    h('source', { type: 'image/webp', srcset: webpSrcset }),
    img,
  ]);
}

function livePhotoNode({ stillHash, videoHash, alt, width, height, products }) {
  const stillBase = `/_media/${stillHash}`;
  const videoBase = `/_media/${videoHash}`;
  const picture = pictureNode({ hash: stillHash, alt, width, height, products });
  const video = h('video', {
    class: 'livephoto-video',
    'data-lp-video': '',
    muted: true,
    playsinline: true,
    preload: 'none',
    width, height,
    'aria-hidden': 'true',
  }, [
    h('source', { src: `${videoBase}/${products.video_hevc}`, type: 'video/mp4; codecs="hvc1"' }),
    h('source', { src: `${videoBase}/${products.video_h264}`, type: 'video/mp4' }),
  ]);
  const badge = h('button', {
    type: 'button',
    class: 'livephoto-badge',
    'aria-label': 'Live Photo — 悬停或长按播放',
  }, [
    {
      type: 'element', tagName: 'svg',
      properties: { viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': 'true' },
      children: [
        h('circle', { cx: 8, cy: 8, r: 6.5, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.2 }),
        h('circle', { cx: 8, cy: 8, r: 3.6, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.2 }),
        h('circle', { cx: 8, cy: 8, r: 1.4, fill: 'currentColor', class: 'livephoto-dot' }),
      ],
    },
    h('span', {}, [text('LIVE')]),
  ]);
  return h('figure', {
    class: 'livephoto',
    'data-livephoto': '',
    'data-state': 'idle',
    style: `aspect-ratio: ${width} / ${height};`,
  }, [picture, video, badge]);
}

function walk(node, visit, parent = null, index = -1) {
  if (!node || typeof node !== 'object') return;
  visit(node, parent, index);
  if (Array.isArray(node.children)) {
    for (let i = 0; i < node.children.length; i++) {
      walk(node.children[i], visit, node, i);
    }
  }
}

export default function rehypeMedia() {
  return (tree) => {
    walk(tree, (node, parent, index) => {
      if (node.type !== 'element' || node.tagName !== 'img') return;
      // Defaults from non-HEIC pass-through (already preserved by remark)
      const props = node.properties || {};
      if (!props['dataMediaMarker'] && !props['data-media-marker']) {
        // ensure loading/decoding hints (works for property-cased and dash-cased)
        if (props.loading == null) props.loading = 'lazy';
        if (props.decoding == null) props.decoding = 'async';
        return;
      }
      const raw = props.dataMedia ?? props['data-media'];
      if (!raw || !parent) return;
      let payload;
      try { payload = JSON.parse(raw); } catch { return; }
      const node2 = payload.kind === 'livephoto'
        ? livePhotoNode(payload)
        : pictureNode({
            hash: payload.stillHash,
            alt: payload.alt,
            width: payload.width,
            height: payload.height,
            products: payload.products,
          });
      parent.children[index] = node2;
    });
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/rehype-media.mjs
git commit -m "feat(media): rehype plugin emits final picture/livephoto HTML"
```

---

### Task 10: Wire plugins into astro.config + delete old files

**Files:**
- Modify: `astro.config.mjs`
- Delete: `src/utils/remark-image-performance.mjs`
- Delete: `src/utils/rehype-image-performance.mjs`

- [ ] **Step 1: Update astro.config.mjs**

Edit `astro.config.mjs`. Replace:

```js
import rehypeImagePerformance from './src/utils/rehype-image-performance.mjs';
import remarkImagePerformance from './src/utils/remark-image-performance.mjs';
```

with:

```js
import rehypeMedia from './src/utils/rehype-media.mjs';
import remarkMedia from './src/utils/remark-media.mjs';
```

And in the `markdown` block, replace:

```js
remarkPlugins: [remarkMath, remarkImagePerformance],
rehypePlugins: [rehypeImagePerformance, [rehypeKatex, { strict: false }]],
```

with:

```js
remarkPlugins: [remarkMath, remarkMedia],
rehypePlugins: [rehypeMedia, [rehypeKatex, { strict: false }]],
```

- [ ] **Step 2: Delete old plugins**

```bash
git rm src/utils/remark-image-performance.mjs src/utils/rehype-image-performance.mjs
```

- [ ] **Step 3: Try a build**

```bash
npm run build
```

Expected: build succeeds. The `2026-04-25-year-end-summary` page is generated. There are no warnings about missing `.mov` (the test post has no .mov yet — it should render as plain `<picture>`).

If it fails: read the error. Common issues: sharp HEIF probe firing, ffmpeg not in PATH, plugin import path typo.

- [ ] **Step 4: Inspect build output for the test post**

```bash
grep -o 'data-livephoto\|<picture>\|<source[^>]*image/avif\|tea-heic-with-live-photo' dist/2021_summary/index.html | sort -u
```

Expected: shows `<picture>` and `<source ... image/avif>`. Should NOT show `tea-heic-with-live-photo` (the original HEIC URL must be replaced) or `data-livephoto` (no .mov pair yet).

- [ ] **Step 5: Commit**

```bash
git add astro.config.mjs
git commit -m "feat(media): wire remark-media + rehype-media into Astro pipeline"
```

---

### Task 11: Wire GC into the Astro build

**Files:**
- Modify: `src/utils/remark-media.mjs`

We have `gcCache` and `getReferencedHashes`. We need to call GC after the build. The cleanest hook: an Astro integration's `astro:build:done`, but for the minimum-viable approach, run GC at process exit from the remark plugin module itself (it's loaded once per build).

- [ ] **Step 1: Add exit-time GC to remark-media.mjs**

At the bottom of `src/utils/remark-media.mjs`, append:

```js
import { gcCache } from './media-cache.mjs';

let _gcScheduled = false;
function scheduleGc() {
  if (_gcScheduled) return;
  _gcScheduled = true;
  process.once('beforeExit', async () => {
    try {
      await gcCache(CACHE_ROOT, referencedHashes, { maxAgeDays: 60 });
    } catch (err) {
      console.warn('[media] GC skipped:', err.message);
    }
  });
}
// Schedule GC the first time the plugin is invoked.
const __origExport = remarkMedia; // capture reference
export default function remarkMediaWithGc() {
  scheduleGc();
  return __origExport();
}
```

Wait — that double-export pattern is awkward. Simpler: schedule inside the existing default export's transformer initialization. Replace the existing `export default function remarkMedia()` block so the schedule happens on first invocation:

```js
let _gcScheduled = false;
function scheduleGc() {
  if (_gcScheduled) return;
  _gcScheduled = true;
  process.once('beforeExit', async () => {
    try {
      await gcCache(CACHE_ROOT, referencedHashes, { maxAgeDays: 60 });
    } catch (err) {
      console.warn('[media] GC skipped:', err.message);
    }
  });
}

export default function remarkMedia() {
  scheduleGc();
  return async (tree, file) => {
    /* ...existing transformer body unchanged... */
  };
}
```

(Apply this as an in-place edit. Don't keep both versions — remove the earlier `export default` + the dummy wrapper above.)

Add the import at the top of `remark-media.mjs`:
```js
import { processHeic, processMov, publishToPublic, gcCache } from './media-cache.mjs';
```

- [ ] **Step 2: Verify GC runs without breaking the build**

```bash
npm run build
```

Expected: build succeeds, no GC warning in output.

- [ ] **Step 3: Commit**

```bash
git add src/utils/remark-media.mjs
git commit -m "feat(media): GC stale cache entries at build exit"
```

---

### Task 12: GitHub Actions — cache + tooling probes

**Files:**
- Modify: `.github/workflows/deploy_astro.yml`

- [ ] **Step 1: Add cache + probes to workflow**

Edit `.github/workflows/deploy_astro.yml`. Find the `Install dependencies` step. Insert these steps **after** it and **before** `Configure GitHub Pages`:

```yaml
      - name: Cache media derivatives
        uses: actions/cache@v4
        with:
          path: .cache/media
          key: media-${{ hashFiles('content/posts/**/*.heic', 'content/posts/**/*.mov') }}
          restore-keys: |
            media-

      - name: Verify media tooling
        run: |
          ffmpeg -hide_banner -codecs 2>&1 | grep -E 'libx264' >/dev/null \
            || (echo "ffmpeg missing libx264"; exit 1)
          node -e "import('sharp').then(s => { if (!s.default.format.heif?.input?.file) { console.error('sharp HEIF decoder missing'); process.exit(1); } })"
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy_astro.yml
git commit -m "ci: cache media derivatives + probe ffmpeg/sharp HEIF support"
```

---

### Task 13: End-to-end build snapshot test

**Files:**
- Create: `tests/media-output.test.mjs`
- Modify: `package.json` (test script)

Build the site and assert the output for the test post is correct.

- [ ] **Step 1: Update test script in package.json**

Change the `"test"` script from:
```json
"test": "npm run build && node --test tests/performance-output.test.mjs"
```
to:
```json
"test": "npm run build && node --test tests/performance-output.test.mjs tests/media-output.test.mjs"
```

(Note: unit tests in `tests/media-cache.test.mjs`, `tests/media-heic.test.mjs`, `tests/media-mov.test.mjs`, `tests/media-publish.test.mjs` run with `node --test tests/` independently and are not included in the build-output suite.)

- [ ] **Step 2: Write the failing test**

Create `tests/media-output.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const articleHtmlPath = fileURLToPath(new URL('../dist/2021_summary/index.html', import.meta.url));

test('HEIC reference is replaced with <picture> + AVIF/WebP/JPEG sources', async () => {
  const html = await readFile(articleHtmlPath, 'utf8');
  // Original .heic URL should NOT appear as an <img src>
  assert.doesNotMatch(html, /<img[^>]+src="[^"]*tea-heic-with-live-photo\.heic/);
  // Should have <picture> with AVIF source pointing into _media
  assert.match(html, /<picture>[\s\S]*<source[^>]+type="image\/avif"[^>]+srcset="\/_media\/[a-f0-9]{16}\//);
  // JPEG fallback img with width/height (CLS protection)
  assert.match(html, /<img[^>]+src="\/_media\/[a-f0-9]{16}\/img-\d+w\.jpg"[^>]+width="\d+"[^>]+height="\d+"/);
});

test('Test post does NOT (yet) render as Live Photo (no .mov pair)', async () => {
  const html = await readFile(articleHtmlPath, 'utf8');
  assert.doesNotMatch(html, /data-livephoto/);
});

test('Existing PNG images keep loading=lazy and decoding=async', async () => {
  const html = await readFile(articleHtmlPath, 'utf8');
  assert.match(html, /<img[^>]+vs-code-fonts[^>]+loading="lazy"[^>]+decoding="async"|<img[^>]+vs-code-fonts[^>]+decoding="async"[^>]+loading="lazy"/);
});

test('Generated derivative files exist on disk', async () => {
  const html = await readFile(articleHtmlPath, 'utf8');
  const m = html.match(/\/_media\/([a-f0-9]{16})\/(img-\d+w\.jpg)/);
  assert.ok(m, 'should find a derivative URL');
  const [_, hash, filename] = m;
  const onDisk = fileURLToPath(new URL(`../dist/_media/${hash}/${filename}`, import.meta.url));
  const s = await stat(onDisk);
  assert.ok(s.size > 0);
});
```

- [ ] **Step 3: Run the build + tests**

```bash
npm test
```

Expected: build succeeds, all 4 new tests pass, existing performance tests still pass.

- [ ] **Step 4: Commit**

```bash
git add tests/media-output.test.mjs package.json
git commit -m "test(media): build-output snapshot for HEIC handling"
```

---

### Task 14: Live Photo end-to-end smoke (manual + scripted)

**Files:**
- Modify: `tests/media-output.test.mjs`

We need to verify the LivePhoto path actually works. Since the current test post has no .mov, create one alongside the HEIC for the duration of the test, then build and assert.

- [ ] **Step 1: Append a Live Photo build test**

Edit `tests/media-output.test.mjs` and append:

```js
import { execFileSync } from 'node:child_process';
import { copyFile, unlink } from 'node:fs/promises';

test('When a same-basename .mov exists, output renders as Live Photo', async () => {
  const postDir = fileURLToPath(new URL('../content/posts/2026-04-25-year-end-summary/', import.meta.url));
  const movPath = `${postDir}tea-heic-with-live-photo.mov`;
  // Generate fixture .mov
  execFileSync('ffmpeg', [
    '-y', '-f', 'lavfi', '-i', 'color=c=black:s=64x64:d=1',
    '-c:v', 'libx265', '-tag:v', 'hvc1', '-pix_fmt', 'yuv420p',
    '-an', '-movflags', '+faststart',
    movPath,
  ], { stdio: 'pipe' });

  try {
    // Re-build with the .mov in place
    execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
    const html = await readFile(articleHtmlPath, 'utf8');
    assert.match(html, /<figure[^>]+class="livephoto"/);
    assert.match(html, /data-livephoto/);
    assert.match(html, /<source[^>]+type="video\/mp4; codecs=&#x22;hvc1&#x22;"|<source[^>]+codecs="hvc1"/);
    assert.match(html, /<source[^>]+type="video\/mp4"[^>]+\.h264\.mp4/);
    assert.match(html, /<button[^>]+class="livephoto-badge"/);
  } finally {
    await unlink(movPath);
    // Restore: rebuild without .mov so subsequent tests / dev see the still-only state
    execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
  }
});
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all media-output tests pass. The Live Photo test takes ~15-20s (two builds + ffmpeg).

- [ ] **Step 3: Manual check — start dev server and open in browser**

```bash
# Add the fixture .mov manually (so the page renders as LivePhoto in dev too)
ffmpeg -y -f lavfi -i color=c=black:s=64x64:d=1 -c:v libx265 -tag:v hvc1 \
  -pix_fmt yuv420p -an -movflags +faststart \
  content/posts/2026-04-25-year-end-summary/tea-heic-with-live-photo.mov
npm run dev
```

Open http://localhost:4321/2021_summary/ in Chrome, Safari, and Firefox. Verify:
- HEIC image renders correctly in all three (was broken before)
- "LIVE" badge top-left of the tea image
- Hover (desktop) → video plays once, returns to still
- Long-press on phone (or Chrome devtools mobile emulation) → same
- No audio at any point
- Dark mode toggle: badge background flips appropriately

Stop dev server. Remove the fixture mov:
```bash
rm content/posts/2026-04-25-year-end-summary/tea-heic-with-live-photo.mov
```

- [ ] **Step 4: Commit**

```bash
git add tests/media-output.test.mjs
git commit -m "test(media): live photo end-to-end snapshot"
```

---

### Task 15: Cache idempotence test (two-pass build)

**Files:**
- Create: `tests/media-cache-idempotence.test.mjs`

A second build of an unchanged tree should not re-run sharp/ffmpeg. We expose a counter via env var.

- [ ] **Step 1: Add a counter to media-cache.mjs**

Edit `src/utils/media-cache.mjs`. At the top of the file, after the imports:

```js
// Test instrumentation: when MEDIA_TEST_COUNTER=1, every actual processor run
// (cache miss path) increments globalThis.__mediaProcessCount.
function bumpCounter() {
  if (process.env.MEDIA_TEST_COUNTER === '1') {
    globalThis.__mediaProcessCount = (globalThis.__mediaProcessCount || 0) + 1;
  }
}
```

In `processHeic` and `processMov`, **right before** `await mkdir(dir, { recursive: true })` (the cache-miss path), insert:
```js
bumpCounter();
```

- [ ] **Step 2: Write the failing idempotence test**

Create `tests/media-cache-idempotence.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { execSync } from 'node:child_process';
import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));

test('Second build with unchanged inputs hits cache for all media (zero processor runs)', () => {
  // Cold build to populate cache
  execSync('npm run build', { cwd: repoRoot, env: { ...process.env, MEDIA_TEST_COUNTER: '1' }, stdio: 'pipe' });
  // Wipe dist (but NOT .cache/media). Re-build.
  execSync('rm -rf dist public/_media', { cwd: repoRoot });
  const out = execSync('node -e "process.env.MEDIA_TEST_COUNTER=\'1\'; globalThis.__mediaProcessCount=0; import(\'./node_modules/astro/astro.js\').then(()=>{}); " || true', { cwd: repoRoot }).toString();
  // The above is a no-op shim — instead, run build and read the counter via a side-channel file:
});
```

This is awkward to assert from a separate process. Simpler approach: write the counter to a sidecar file at process exit and read it.

Replace the test above with:

```js
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
  execSync('npm run build', {
    cwd: repoRoot,
    env: { ...process.env, MEDIA_TEST_COUNTER: '1' },
    stdio: 'pipe',
  });
  return JSON.parse(await readFile(counterPath, 'utf8')).count;
}

test('Second consecutive build runs zero processor invocations', async () => {
  const cold = await buildAndReadCounter();
  assert.ok(cold >= 1, `cold build should process at least one file, got ${cold}`);
  const warm = await buildAndReadCounter();
  assert.equal(warm, 0, `warm build should be 0 processor runs, got ${warm}`);
});
```

- [ ] **Step 3: Wire the counter sidecar in media-cache.mjs**

Replace the `bumpCounter()` block in `media-cache.mjs` with this version that also writes a sidecar JSON at `beforeExit`:

```js
function bumpCounter() {
  if (process.env.MEDIA_TEST_COUNTER === '1') {
    globalThis.__mediaProcessCount = (globalThis.__mediaProcessCount || 0) + 1;
  }
}

if (process.env.MEDIA_TEST_COUNTER === '1' && !globalThis.__mediaCounterHook) {
  globalThis.__mediaCounterHook = true;
  globalThis.__mediaProcessCount = 0;
  process.once('beforeExit', async () => {
    const path = await import('node:path');
    const { writeFile, mkdir } = await import('node:fs/promises');
    const out = path.resolve('.cache/media-counter.json');
    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, JSON.stringify({ count: globalThis.__mediaProcessCount || 0 }));
  });
}
```

- [ ] **Step 4: Run the idempotence test**

```bash
node --test tests/media-cache-idempotence.test.mjs
```

Expected: 1 pass. Cold build counter ≥ 1, warm build counter == 0.

- [ ] **Step 5: Commit**

```bash
git add src/utils/media-cache.mjs tests/media-cache-idempotence.test.mjs
git commit -m "test(media): two-pass build verifies cache idempotence"
```

---

### Task 16: Documentation polish — README/CLAUDE memory note

**Files:**
- Modify: `/Users/rosu/.claude/projects/-Users-rosu-Coding-Blog/memory/MEMORY.md` (auto-memory index)
- Create: `/Users/rosu/.claude/projects/-Users-rosu-Coding-Blog/memory/heic-livephoto-pipeline.md`

Save a project-memory entry so future sessions know about the new pipeline without re-discovering it. This is genuinely useful project context (a non-obvious build dependency on system ffmpeg, plus the auto-pair convention).

- [ ] **Step 1: Create the memory file**

Create `/Users/rosu/.claude/projects/-Users-rosu-Coding-Blog/memory/heic-livephoto-pipeline.md`:

```markdown
---
name: HEIC + Live Photo build pipeline
description: How HEIC images are processed in the Astro blog build, including the .mov auto-pair convention and required system tooling
type: project
---

The blog has a build-time HEIC + Live Photo pipeline (introduced 2026-04-25 on `astro-migration`).

**Author convention:** Drop `<name>.heic` into `content/posts/<slug>/`. Optionally drop `<name>.mov` (same basename) alongside — it auto-upgrades to a Live Photo. Markdown syntax stays `![alt](file.heic)` in both cases.

**Why:** Most browsers don't decode HEIC; iOS Live Photo MOV is HEVC which Chrome/Firefox can't play. The build converts both at compile time.

**How to apply:** When adding HEIC handling features, check `src/utils/media-cache.mjs` for the processor + cache layer (SHA-256 keyed, gitignored at `.cache/media/`). Plugins are `src/utils/remark-media.mjs` + `rehype-media.mjs`. Components in `src/components/{Picture,LivePhoto}.astro`. CI requires system ffmpeg with libx264 (ubuntu-latest has it) + sharp ^0.33 (HEIF decoder via libvips-heif).

**Build invariant:** Generated outputs land in `public/_media/<hash>/` (gitignored, regenerated each build from `.cache/media/`). Cache GC runs at `beforeExit`, removing entries not referenced this build that are >60 days mtime.

**Test entry points:** `npm test` runs build + `tests/media-output.test.mjs`. Unit tests for the cache: `node --test tests/media-cache.test.mjs tests/media-heic.test.mjs tests/media-mov.test.mjs tests/media-publish.test.mjs`.
```

- [ ] **Step 2: Add pointer to MEMORY.md index**

Edit `/Users/rosu/.claude/projects/-Users-rosu-Coding-Blog/memory/MEMORY.md` and add to whichever index list is appropriate (or append at end):

```markdown
- [HEIC + Live Photo pipeline](heic-livephoto-pipeline.md) — auto-pair `.heic` + `.mov` in posts; SHA-256 cached; needs ffmpeg+libx264 in CI
```

- [ ] **Step 3: Final commit**

```bash
git add docs/superpowers/plans/2026-04-25-heic-livephoto.md
git commit -m "docs: HEIC + Live Photo implementation plan"
```

(Memory files live outside the repo, no git action needed for them.)

---

## Self-Review Notes

**Spec coverage check (re-read [spec](../specs/2026-04-25-heic-livephoto-design.md)):**
- ✅ HEIC → AVIF/WebP/JPEG @ 1×/2× → Task 3, 13
- ✅ MOV → HEVC remux + H.264 transcode, audio stripped → Task 4, 14
- ✅ SHA-256 content addressing + processor version → Task 2
- ✅ Cache hit on repeat → Tasks 3, 4, 15
- ✅ `<picture>` for HEIC alone → Tasks 6, 9, 13
- ✅ `<figure data-livephoto>` for HEIC + MOV → Tasks 7, 9, 14
- ✅ iOS-style badge, hover/long-press, prefers-reduced-motion → Task 7
- ✅ Zero markdown syntax change, auto-pair detection → Task 8
- ✅ Existing non-HEIC `<img>` keeps lazy/async → Task 8, asserted Task 13
- ✅ Public copy + GC → Tasks 5, 11
- ✅ CI cache + tooling probes → Task 12
- ✅ Build-output tests → Tasks 13, 14, 15
- ✅ Caption stays as separate `<p><em>` (no figcaption coercion) → handled implicitly by remark-media not touching neighboring nodes
- ✅ Failure modes: sharp HEIF probe, ffmpeg probe, single-file failures don't break build → covered in Tasks 3, 4 (probes); single-file fallback per spec note covered in Task 8 (existsSync gate; broken HEICs would throw — that's a future hardening)

**Hardening note (deferred):** Spec mentions HEIC/MOV corruption should not break the build. Current Task 3/4 will throw on corrupted input. Acceptable for v1 because the only HEIC source is the author's own files. If this ships and we need it, add a try/catch in remark-media.mjs around each task and render a degraded `<img src="<original .heic>">` on failure. Tracked here, not implemented.

**Type consistency:** All processors return `{ hash, products, dimensions, cacheKey, kind, ... }` with consistent property names. Components use the same product key strings (`still_1x_avif`, `video_hevc`, etc.).

**Placeholder scan:** No TBD/TODO. All steps have concrete code or commands.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-25-heic-livephoto.md`. Two execution options:

1. **Subagent-Driven (recommended)** — Dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?

---

## Implementation Notes (post-execution, 2026-04-25)

Captured here so a future reader knows where the actual code diverges from the plan above. Code is the source of truth; this section just points at the deltas.

- **HEIC decoder**: plan assumed `sharp` would decode HEIC directly. The prebuilt libvips includes libheif but **omits libde265** (LGPL / binary-size constraints), so iPhone HEVC HEIC is undecodable. `processHeic` (in `src/utils/media-cache.mjs`) routes through ffmpeg → lossless PNG → sharp instead. No new system dependency (ffmpeg is already required for MOV).
- **GC scheduling**: plan used `process.once('beforeExit', ...)` with async `gcCache`. Astro's CLI calls `process.exit()`, which **skips `beforeExit`** entirely. `remark-media.mjs` now uses `process.once('exit', ...)` with a synchronous `gcCacheSync` helper exported from `media-cache.mjs`. Same applies to the test counter sidecar in Task 15.
- **Sharp version**: bumped from `^0.33` to `^0.34` to align with Astro 5's optional sharp dependency and avoid duplicate native binaries in `node_modules`.
- **CI sharp probe**: switched from `format.heif?.input?.file` (false positive — only proves libheif loaded, not that HEVC decodes) to verifying `format.heif.output.alias` includes `'avif'` (matches what we actually rely on).
- **Components dropped**: `src/components/{Picture,LivePhoto}.astro` were specified but turned out to be dead code — `rehype-media.mjs` emits the HTML directly, so the components were never rendered and their scoped CSS/script were never loaded. The styles + behavior script were moved into `Layout.astro` as a global `<style>` and `<script is:inline>`; the .astro files were deleted.
- **`publishToPublic`**: originally `cp(src, dst, { recursive: true })`, which leaked `meta.json` and the HEIC `source.png` intermediate to the public site. Now reads `meta.json` and copies only the files listed in `products`.
- **Filename collision fix**: the test post (`content/posts/2026-04-25-year-end-summary/`) was created with `filename: 2021_summary` in frontmatter, colliding with the existing 2021 post. Renamed to `filename: year-end-summary` so both posts get distinct URLs; HEIC e2e test paths point to `dist/year-end-summary/`.
- **2x derivative threshold**: plan's `metadata.width >= w1 * 2` was strict; for the 3158-wide test fixture this would skip 2x even though 3158 ≈ 2× of 1579 is useful for retina. Relaxed to `>= 1.5×` and clamped output width to `min(w1*2, source)` so file names always reflect actual dimensions.
