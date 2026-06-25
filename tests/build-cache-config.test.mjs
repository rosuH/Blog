import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const astroConfigPath = new URL('../astro.config.mjs', import.meta.url);
const workflowPath = new URL('../.github/workflows/deploy_astro.yml', import.meta.url);

test('Astro stores generated image assets in the project cache directory', async () => {
  const config = await readFile(astroConfigPath, 'utf8');
  assert.match(config, /cacheDir:\s*['"]\.cache\/astro['"]/);
});

// Strip JS line comments so config-key assertions don't match documentation that
// merely mentions a key by name (e.g. a comment explaining `compressHTML`).
function stripLineComments(src) {
  return src.replace(/^\s*\/\/.*$/gm, '');
}

test('Astro 7 migration intentionally keeps the unified Markdown processor', async () => {
  // The Markdown processor decision is a deliberate, documented compatibility
  // fallback (see docs/adr/0001-astro-7-markdown-pipeline.md): Satteri's visitor
  // plugin API cannot carry the media pipeline and does not render KaTeX. Pin the
  // config shape so an accidental removal of unified()/the media/math plugins is
  // caught.
  const config = await readFile(astroConfigPath, 'utf8');
  assert.match(config, /from\s+['"]@astrojs\/markdown-remark['"]/);
  assert.match(config, /processor:\s*unified\(/);
  assert.match(config, /remarkMedia/);
  assert.match(config, /rehypeMedia/);
  assert.match(config, /rehypeKatex/);
  // No `compressHTML:` key is set (the code is checked, ignoring comments).
  assert.doesNotMatch(stripLineComments(config), /compressHTML\s*:/);
});

test('Astro 7 JSX whitespace default is a deliberate final choice', async () => {
  // We adopt Astro 7's default `compressHTML: 'jsx'` (JSX whitespace semantics).
  // There is no override because the templates have no inline "text <tag> text"
  // JSX patterns that would collapse. If someone re-adds a compressHTML assignment
  // it must be a new deliberate decision — this test makes a silent reintroduction
  // explicit (only the code is checked, not the explanatory comments).
  const config = await readFile(astroConfigPath, 'utf8');
  assert.doesNotMatch(stripLineComments(config), /compressHTML\s*:/);
});


test('responsive image widths are defined in the media pipeline', async () => {
  // Astro 6 removed image.breakpoints config; our content images use the custom
  // raster pipeline whose widths live in media-cache.mjs.
  const mediaCache = await readFile(new URL('../src/utils/media-cache.mjs', import.meta.url), 'utf8');
  assert.match(mediaCache, /RASTER_WIDTHS\s*=\s*\[\s*640,\s*828,\s*1080,\s*1440\s*\]/);
});

test('GitHub Actions caches Astro and custom media derivatives', async () => {
  const workflow = await readFile(workflowPath, 'utf8');

  assert.match(workflow, /Cache generated image derivatives/);
  assert.match(workflow, /\.cache\/astro\/assets/);
  assert.match(workflow, /\.cache\/media/);
  assert.doesNotMatch(workflow, /\.cache\/astro\n/);
  assert.match(workflow, /runs-on:\s*ubuntu-24\.04/);
  assert.match(workflow, /node-version:\s*['"]24['"]/);
  assert.match(workflow, /persist-credentials:\s*false/);
  assert.match(workflow, /actions\/checkout@[a-f0-9]{40} # v\d/);
  assert.match(workflow, /actions\/setup-node@[a-f0-9]{40} # v\d/);
  assert.match(workflow, /actions\/cache@[a-f0-9]{40} # v\d/);
  assert.match(workflow, /src\/utils\/media-cache\.mjs/);
  assert.match(workflow, /content\/posts\/\*\*\/\*\.heic/);
  assert.match(workflow, /Log image cache sizes/);
  assert.match(workflow, /node scripts\/verify-pages-media\.mjs/);
  assert.doesNotMatch(workflow, /npm run build -- --force/);
  assert.doesNotMatch(workflow, /BtbN|releases\/download\/latest|curl .*sudo/);
});
