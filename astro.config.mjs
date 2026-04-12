// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeImagePerformance from './src/utils/rehype-image-performance.mjs';
import remarkImagePerformance from './src/utils/remark-image-performance.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://blog.rosuh.me',

  image: {
    layout: 'constrained',
    responsiveStyles: true,
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
    remarkPlugins: [remarkMath, remarkImagePerformance],
    rehypePlugins: [rehypeImagePerformance, [rehypeKatex, { strict: false }]],
  },

  // 构建输出
  output: 'static',
});
