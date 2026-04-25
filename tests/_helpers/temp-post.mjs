// Helpers for creating ephemeral posts under content/posts/ during e2e tests.
// The HEIC fixture is content-addressed (cacheKey driven), so any test that
// needs a built page exercising the HEIC pipeline can drop a temp post here,
// run `npm run build`, assert against dist/<slug>/index.html, then tear down.
import { mkdir, writeFile, copyFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const FIXTURE_HEIC = fileURLToPath(new URL('../fixtures/sample.heic', import.meta.url));
const FIXTURE_PNG = fileURLToPath(new URL('../fixtures/sample.png', import.meta.url));

export function postsRoot() {
  return fileURLToPath(new URL('../../content/posts/', import.meta.url));
}

export function distPath(slug) {
  return fileURLToPath(new URL(`../../dist/${slug}/index.html`, import.meta.url));
}

export async function setupHeicPost({ slug, withLivePhoto = false }) {
  const dir = join(postsRoot(), slug);
  await mkdir(dir, { recursive: true });
  await copyFile(FIXTURE_HEIC, join(dir, 'sample.heic'));
  await copyFile(FIXTURE_PNG, join(dir, 'sample.png'));
  if (withLivePhoto) {
    execFileSync('ffmpeg', [
      '-y', '-f', 'lavfi', '-i', 'color=c=black:s=64x64:d=1',
      '-c:v', 'libx265', '-tag:v', 'hvc1', '-pix_fmt', 'yuv420p',
      '-an', '-movflags', '+faststart',
      join(dir, 'sample.mov'),
    ], { stdio: 'pipe' });
  }
  await writeFile(join(dir, 'index.md'),
    `---\ntitle: media e2e fixture\nfilename: ${slug}\ndate: 2026-04-25\n---\n\n![sample-heic](sample.heic)\n\nInline HEIC before ![inline-heic](sample.heic) after.\n\n![sample-png](sample.png)\n\n![](sample.png)\n\n[![linked-png](sample.png)](https://example.com/)\n`,
  );
  return { dir, slug, articleHtmlPath: distPath(slug) };
}

export async function teardownHeicPost(dir) {
  await rm(dir, { recursive: true, force: true });
}
