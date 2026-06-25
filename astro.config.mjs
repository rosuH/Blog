// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
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

  // Astro 7 默认 `compressHTML: 'jsx'`（JSX 空白语义）。本站的内联内容都放在独立
  // 的 <span>/<a> 或属性里，没有「文本 <标签> 文本」同行的 JSX 模式，因此 JSX
  // 压缩不会合并相邻词；采用默认值是刻意的最终选择（不是兼容性妥协）。
  // 依据：npm test 全绿 + 对渲染后的 index/article HTML 做了人工抽检，无缺空格。
  // 如未来出现 JSX 行内拼接，应在模板里加显式空格/排版，而不是回退 compressHTML。

  markdown: {
    // 代码高亮（Astro 内置 Shiki）
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
    // Astro 7：Markdown/MDX 默认处理器是 Satteri，但它使用全新的 visitor 插件
    // API，无法承载本站媒体管线所需的 MDAST/HAST 深度改写，也不渲染 KaTeX
    // （Satteri 只输出 <code class="language-math"> 原文）。因此刻意图保留
    // unified() 处理器作为兼容方案——详见 docs/adr/0001-astro-7-markdown-pipeline.md。
    // remark/rehype 插件传入方式与 Astro 6 完全一致（数学公式 + 媒体管线）。
    processor: unified({
      remarkPlugins: [remarkMath, remarkMedia],
      rehypePlugins: [rehypeMedia, [rehypeKatex, { strict: false }]],
    }),
  },

  // 构建输出
  output: 'static',
});
