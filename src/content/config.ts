// src/content/config.ts
// Astro Content Collections Schema 定义
// 支持多种 frontmatter 格式，与 Gatsby 保持兼容

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 博客文章集合
const blog = defineCollection({
  // 指向原 Gatsby 内容目录
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './content/posts',
    // 自定义 ID 生成，保持与 Gatsby 一致的 URL
    generateId: ({ entry, data }) => {
      // 优先级：filename > slug > 文件名
      const id = data.filename || data.slug || entry.replace(/\/index\.mdx?$/, '').split('/').pop();
      return id?.replace(/\.mdx?$/, '') || entry;
    },
  }),

  // Schema 定义
  schema: z.object({
    // 必填字段
    title: z.string(),
    date: z.coerce.date(),

    // URL 相关（兼容多种格式）
    slug: z.string().optional(),
    filename: z.string().optional(),

    // 可选字段
    author: z.string().default('rosu'),
    tags: z.array(z.string()).default([]),
    categories: z.array(z.string()).default([]),
    hero: z.string().optional(),
    heroAlt: z.string().optional(),
    excerpt: z.string().optional(),
    description: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };