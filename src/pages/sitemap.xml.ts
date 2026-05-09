import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { absoluteUrl, formatIsoDate } from '../utils/site-info';

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

export const GET: APIRoute = async ({ site }) => {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const sortedPosts = posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  const newestPostDate = sortedPosts[0]?.data.date ?? new Date();
  const urls = [
    {
      loc: absoluteUrl('/', site),
      lastmod: formatIsoDate(newestPostDate),
      changefreq: 'weekly',
      priority: '1.0',
    },
    {
      loc: absoluteUrl('/rss.xml', site),
      lastmod: formatIsoDate(newestPostDate),
      changefreq: 'weekly',
      priority: '0.7',
    },
    ...sortedPosts.map((post) => ({
      loc: absoluteUrl(`/${post.id}/`, site),
      lastmod: formatIsoDate(post.data.date),
      changefreq: 'monthly',
      priority: '0.8',
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
