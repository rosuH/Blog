// src/pages/rss.xml.ts
// RSS Feed 生成
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getCollection('blog');
  const sortedPosts = posts
    .filter(p => !p.data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: "Blog.kt",
    description: 'An Android Developer and his life_',
    site: context.site ?? 'https://blog.rosuh.me',
    items: sortedPosts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description || post.data.excerpt || '',
      link: `/${post.id}/`,
    })),
    customData: `<language>zh-CN</language>
<copyright>© ${new Date().getFullYear()} rosu</copyright>
<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
  });
}
