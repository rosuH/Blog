import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const astroConfigPath = new URL('../astro.config.mjs', import.meta.url);
const workflowPath = new URL('../.github/workflows/deploy_astro.yml', import.meta.url);

test('Astro stores generated image assets in the project cache directory', async () => {
  const config = await readFile(astroConfigPath, 'utf8');

  assert.match(config, /cacheDir:\s*['"]\.cache\/astro['"]/);
  assert.match(config, /breakpoints:\s*\[\s*640,\s*828,\s*1080,\s*1440\s*\]/);
});

test('GitHub Actions caches Astro and custom media derivatives', async () => {
  const workflow = await readFile(workflowPath, 'utf8');

  assert.match(workflow, /Cache generated image derivatives/);
  assert.match(workflow, /\.cache\/astro/);
  assert.match(workflow, /\.cache\/media/);
  assert.match(workflow, /src\/utils\/media-cache\.mjs/);
  assert.match(workflow, /content\/posts\/\*\*\/\*\.heic/);
  assert.match(workflow, /Log image cache sizes/);
});
