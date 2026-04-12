import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const homeHtmlPath = new URL('../dist/index.html', import.meta.url);
const articleHtmlPath = new URL('../dist/2021_summary/index.html', import.meta.url);

async function readHtml(url) {
  return readFile(url, 'utf8');
}

test('site defers the analytics payload instead of eagerly embedding gtag', async () => {
  const homeHtml = await readHtml(homeHtmlPath);

  assert.doesNotMatch(
    homeHtml,
    /<script[^>]+src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-1F0F92B00T"/,
  );
  assert.doesNotMatch(homeHtml, /const analyticsId = '\{analyticsId\}'/);
  assert.match(homeHtml, /requestIdleCallback|addEventListener\("load"/);
});

test('non-math articles do not ship the KaTeX stylesheet', async () => {
  const articleHtml = await readHtml(articleHtmlPath);

  assert.doesNotMatch(articleHtml, /katex\.min\.css/);
});

test('markdown article images emit responsive markup', async () => {
  const articleHtml = await readHtml(articleHtmlPath);

  assert.match(articleHtml, /title="崽崽在睡觉"[^>]+srcset=/);
  assert.match(articleHtml, /title="崽崽在睡觉"[^>]+sizes=/);
});
