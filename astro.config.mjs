// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeMedia from './src/utils/rehype-media.mjs';
import remarkMedia from './src/utils/remark-media.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://blog.rosuh.me',
  cacheDir: '.cache/astro',

  image: {
    layout: 'constrained',
    responsiveStyles: true,
    breakpoints: [640, 828, 1080, 1440],
  },

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
