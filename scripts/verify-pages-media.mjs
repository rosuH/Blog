import { execFile } from 'node:child_process';
import { access, readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { promisify } from 'node:util';
import sharp from 'sharp';

const execFileP = promisify(execFile);
const DIST_DIR = 'dist';
const MEDIA_DIR = join(DIST_DIR, '_media');
const TARGET_HTML = join(DIST_DIR, '2026-04-25-year-end-summary', 'index.html');
const BLOCKED_VIDEO_TAGS = /(?:com\.apple|quicktime|location|gps|creation_time|make|model|artist|author|comment|description|title)/i;
const PRIVATE_IMAGE_METADATA = ['exif', 'xmp', 'iptc', 'icc'];
const ALLOWED_MEDIA_EXTENSIONS = new Set(['.avif', '.webp', '.jpg', '.jpeg', '.mp4']);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function fail(message, details = []) {
  console.error(message);
  for (const detail of details) console.error(`- ${detail}`);
  process.exit(1);
}

async function verifyMediaReferences() {
  const htmlFiles = (await walk(DIST_DIR)).filter((path) => path.endsWith('.html'));
  const missing = new Set();

  for (const file of htmlFiles) {
    const html = await readFile(file, 'utf8');
    for (const match of html.matchAll(/\/_media\/[^"'()\s,<>]+/g)) {
      const localPath = join(DIST_DIR, match[0].slice(1));
      if (!(await exists(localPath))) {
        missing.add(`${file}: ${match[0]}`);
      }
    }
  }

  if (missing.size > 0) {
    fail('Missing generated media files referenced from HTML:', [...missing].sort());
  }

  const targetHtml = await readFile(TARGET_HTML, 'utf8');
  if (!targetHtml.includes('data-livephoto') || !targetHtml.includes('clip.h264.mp4')) {
    fail(`${TARGET_HTML} did not render the expected Live Photo markup.`);
  }
}

async function verifyImagePrivacy(file) {
  const metadata = await sharp(file).metadata();
  const leaked = PRIVATE_IMAGE_METADATA.filter((field) => Boolean(metadata[field]));
  if (leaked.length > 0) {
    fail('Generated image contains private metadata:', [
      `${relative('.', file)}: ${leaked.join(', ')}`,
    ]);
  }
}

function collectBlockedVideoTags(scope, tags = {}) {
  return Object.entries(tags)
    .filter(([key, value]) => BLOCKED_VIDEO_TAGS.test(`${key}=${value}`))
    .map(([key, value]) => `${scope}.${key}=${value}`);
}

async function verifyVideoPrivacy(file) {
  const { stdout } = await execFileP('ffprobe', [
    '-v', 'error',
    '-show_format',
    '-show_streams',
    '-show_chapters',
    '-of', 'json',
    file,
  ]);
  const probe = JSON.parse(stdout);
  const streams = probe.streams ?? [];
  const audioStreams = streams.filter((stream) => stream.codec_type === 'audio');
  const chapters = probe.chapters ?? [];
  const blockedTags = [
    ...collectBlockedVideoTags('format', probe.format?.tags),
    ...streams.flatMap((stream, index) => collectBlockedVideoTags(`stream[${index}]`, stream.tags)),
  ];

  const issues = [];
  if (audioStreams.length > 0) issues.push(`${audioStreams.length} audio stream(s) present`);
  if (chapters.length > 0) issues.push(`${chapters.length} chapter(s) present`);
  if (blockedTags.length > 0) issues.push(`blocked tag(s): ${blockedTags.join(', ')}`);

  if (issues.length > 0) {
    fail('Generated video contains private media data:', [
      `${relative('.', file)}: ${issues.join('; ')}`,
    ]);
  }
}

async function verifyPublishedMediaPrivacy() {
  if (!(await exists(MEDIA_DIR))) {
    fail(`${MEDIA_DIR} is missing; generated media was not published.`);
  }

  const files = await walk(MEDIA_DIR);
  const forbidden = files.filter((file) => !ALLOWED_MEDIA_EXTENSIONS.has(extname(file).toLowerCase()));
  if (forbidden.length > 0) {
    fail('Unexpected files were published under dist/_media:', forbidden.map((file) => relative('.', file)).sort());
  }

  await Promise.all(files.map(async (file) => {
    const ext = extname(file).toLowerCase();
    if (ext === '.mp4') {
      await verifyVideoPrivacy(file);
    } else {
      await verifyImagePrivacy(file);
    }
  }));
}

await verifyMediaReferences();
await verifyPublishedMediaPrivacy();
console.log('verified generated media references and privacy stripping');
