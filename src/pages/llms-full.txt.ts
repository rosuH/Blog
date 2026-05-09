import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { SITE, absoluteUrl, formatIsoDate } from '../utils/site-info';

const listValues = (values: string[]) => values.filter(Boolean).join(', ') || 'none';

export const GET: APIRoute = async ({ site }) => {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const sortedPosts = posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  const body = `# ${SITE.name} Full Archive

${SITE.alternateName}: ${SITE.description}

This is a single-file markdown archive for agents. It includes public post metadata and source markdown content. Public reading requires no authentication, and the site does not expose account APIs, OAuth authorization, MCP tools, delegated user resources, or commerce endpoints.

## Site Resources

- Home: ${absoluteUrl('/', site)}
- RSS feed: ${absoluteUrl('/rss.xml', site)}
- Sitemap: ${absoluteUrl('/sitemap.xml', site)}
- Lightweight llms.txt: ${absoluteUrl('/llms.txt', site)}

## Posts

${sortedPosts
  .map((post) => {
    const description = post.data.description || post.data.excerpt || '';
    const metadata = [
      `- URL: ${absoluteUrl(`/${post.id}/`, site)}`,
      `- Published: ${formatIsoDate(post.data.date)}`,
      `- Author: ${post.data.author || SITE.author.name}`,
      `- Tags: ${listValues(post.data.tags ?? [])}`,
      `- Categories: ${listValues(post.data.categories ?? [])}`,
      description ? `- Description: ${description}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    return `### ${post.data.title}

${metadata}

${(post.body ?? '').trim()}
`;
  })
  .join('\n---\n\n')}
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
