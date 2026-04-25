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
