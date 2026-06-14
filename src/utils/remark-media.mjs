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
  processRaster,
  publishToPublic,
  gcCacheSync,
  prunePublishedMediaSync,
} from './media-cache.mjs';

const CACHE_ROOT = fileURLToPath(new URL('../../.cache/media/', import.meta.url));
const PUBLIC_ROOT = fileURLToPath(new URL('../../public/', import.meta.url));

const referencedKeys = new Set();
export function getReferencedKeys() { return referencedKeys; }

function walk(node, visit, parent = null) {
  if (!node || typeof node !== 'object') return;
  visit(node, parent);
  if (Array.isArray(node.children)) for (const c of node.children) walk(c, visit, node);
}

function resolveSrc(url, mdFile) {
  if (!url) return null;
  if (isAbsolute(url)) return url;
  if (/^https?:\/\//i.test(url)) return null; // remote, skip
  return resolve(dirname(mdFile), url);
}

let _gcScheduled = false;
function scheduleGc() {
  if (_gcScheduled) return;
  _gcScheduled = true;
  // Astro CLI calls process.exit() which skips 'beforeExit', so use 'exit'
  // with the synchronous GC variant.
  process.once('exit', () => {
    try {
      gcCacheSync(CACHE_ROOT, referencedKeys, { maxAgeDays: 60 });
      prunePublishedMediaSync(join(PUBLIC_ROOT, '_media'), referencedKeys);
    } catch (err) {
      console.warn('[media] GC skipped:', err.message);
    }
  });
}

export default function remarkMedia() {
  scheduleGc();
  return async (tree, file) => {
    const mdFile = file?.path ?? file?.history?.[file.history.length - 1];
    if (!mdFile) return;

    const tasks = [];
    const rasterTasks = [];
    walk(tree, (node, parent) => {
      if (node.type !== 'image') return;
      node.data ||= {};
      node.data.hProperties ||= {};
      const url = node.url || '';
      const ext = extname(url).toLowerCase();

      if (ext === '.heic') {
        const heicPath = resolveSrc(url, mdFile);
        if (!heicPath || !existsSync(heicPath)) return;
        tasks.push({ node, heicPath });
        return;
      }

      // Local raster images (jpg/jpeg/png) get responsive AVIF + WebP via our
      // pipeline; remote, svg, gif, etc. fall through to plain lazy hints.
      // Linked images (parent is a link) stay plain so the anchor wraps a bare
      // <img>, never a promoted <picture>/<figure>.
      if (['.jpg', '.jpeg', '.png'].includes(ext) && !/^https?:\/\//i.test(url) && parent?.type !== 'link') {
        const rasterPath = resolveSrc(url, mdFile);
        if (rasterPath && existsSync(rasterPath)) {
          rasterTasks.push({ node, rasterPath });
          return;
        }
      }

      if (node.data.hProperties.loading == null) node.data.hProperties.loading = 'lazy';
      if (node.data.hProperties.decoding == null) node.data.hProperties.decoding = 'async';
    });

    for (const { node, heicPath } of tasks) {
      const stillMeta = await processHeic(heicPath, CACHE_ROOT);
      referencedKeys.add(stillMeta.cacheKey);
      await publishToPublic(stillMeta.cacheKey, CACHE_ROOT, PUBLIC_ROOT);

      const movPath = join(
        dirname(heicPath),
        `${basename(heicPath, '.heic')}.mov`,
      );
      let videoMeta = null;
      if (existsSync(movPath)) {
        videoMeta = await processMov(movPath, CACHE_ROOT);
        referencedKeys.add(videoMeta.cacheKey);
        await publishToPublic(videoMeta.cacheKey, CACHE_ROOT, PUBLIC_ROOT);
      }

      const payload = {
        kind: videoMeta ? 'livephoto' : 'heic',
        stillKey: stillMeta.cacheKey,
        width: stillMeta.dimensions.width,
        height: stillMeta.dimensions.height,
        products: { ...stillMeta.products, ...(videoMeta?.products ?? {}) },
        // For livephoto, video files live under videoMeta.cacheKey dir
        videoKey: videoMeta?.cacheKey ?? null,
        alt: node.alt ?? '',
      };
      node.data.hProperties['data-media'] = JSON.stringify(payload);
      node.data.hProperties['data-media-marker'] = '1';
      // Keep the original .heic URL — rehype-media is the source of truth for
      // replacement and removes the node on payload-parse failure (see
      // rehype-media.mjs). Blanking the URL would yield <img src=""> on
      // failure, which triggers an extra request to the current document URL.
    }

    for (const { node, rasterPath } of rasterTasks) {
      const meta = await processRaster(rasterPath, CACHE_ROOT);
      referencedKeys.add(meta.cacheKey);
      await publishToPublic(meta.cacheKey, CACHE_ROOT, PUBLIC_ROOT);

      const largestWidth = meta.widths[meta.widths.length - 1];
      const payload = {
        kind: 'raster',
        key: meta.cacheKey,
        widths: meta.widths,
        products: meta.products,
        width: meta.dimensions.width,
        height: meta.dimensions.height,
        alt: node.alt ?? '',
        title: node.title ?? null,
      };
      // Point the URL at an absolute published asset so Astro's markdown image
      // optimizer leaves it untouched; rehype-media swaps in the <picture>.
      node.url = `/_media/${meta.cacheKey}/${meta.products[`webp_${largestWidth}`]}`;
      node.data.hProperties['data-media'] = JSON.stringify(payload);
      node.data.hProperties['data-media-marker'] = '1';
    }
  };
}
