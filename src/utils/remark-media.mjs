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
  gcCacheSync,
} from './media-cache.mjs';

const CACHE_ROOT = fileURLToPath(new URL('../../.cache/media/', import.meta.url));
const PUBLIC_ROOT = fileURLToPath(new URL('../../public/', import.meta.url));

const referencedKeys = new Set();
export function getReferencedKeys() { return referencedKeys; }

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

let _gcScheduled = false;
function scheduleGc() {
  if (_gcScheduled) return;
  _gcScheduled = true;
  // Astro CLI calls process.exit() which skips 'beforeExit', so use 'exit'
  // with the synchronous GC variant.
  process.once('exit', () => {
    try {
      gcCacheSync(CACHE_ROOT, referencedKeys, { maxAgeDays: 60 });
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
  };
}
