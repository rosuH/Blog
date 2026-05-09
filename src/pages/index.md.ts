import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { SITE, absoluteUrl, formatIsoDate } from '../utils/site-info';

export const GET: APIRoute = async ({ site }) => {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const sortedPosts = posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  const body = `# ${SITE.alternateName}

${SITE.description}

## Links

- Website: ${absoluteUrl('/', site)}
- RSS: ${absoluteUrl('/rss.xml', site)}
- llms.txt: ${absoluteUrl('/llms.txt', site)}
- Full archive: ${absoluteUrl('/llms-full.txt', site)}
- Author: ${SITE.author.url}

## Posts

${sortedPosts
  .map((post) => `- ${formatIsoDate(post.data.date)} [${post.data.title}](${absoluteUrl(`/${post.id}/`, site)})`)
  .join('\n')}
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
};
