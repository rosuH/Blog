// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeMedia from './src/utils/rehype-media.mjs';
import remarkMedia from './src/utils/remark-media.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://blog.rosuh.me',
  cacheDir: '.cache/astro',

  // Internal links prefetch on hover — near-instant reading-to-reading navigation.
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },

  // Self-hosted, subset Latin webfonts (stable Fonts API in Astro 6). The site is
  // Chinese-primary (body/headings fall back to system CJK), so these only style
  // the minority Latin runs; we keep the payload minimal and same-origin.
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Outfit',
      cssVariable: '--font-outfit',
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', '-apple-system', 'sans-serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'IBM Plex Serif',
      cssVariable: '--font-ibm-plex-serif',
      weights: [400, 700],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['Iowan Old Style', 'Baskerville', 'STSong', 'serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'JetBrains Mono',
      cssVariable: '--font-jetbrains-mono',
      weights: [400, 500],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['Fira Code', 'Courier New', 'monospace'],
    },
  ],

  integrations: [
    mdx(),
  ],

  markdown: {
    // 代码高亮（Astro 内置 Shiki）
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
    // 数学公式
    remarkPlugins: [remarkMath, remarkMedia],
    rehypePlugins: [rehypeMedia, [rehypeKatex, { strict: false }]],
  },

  // 构建输出
  output: 'static',
});
