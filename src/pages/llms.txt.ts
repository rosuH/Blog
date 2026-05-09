import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { SITE, absoluteUrl, formatIsoDate } from '../utils/site-info';

export const GET: APIRoute = async ({ site }) => {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const sortedPosts = posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  const latestPosts = sortedPosts.slice(0, 12);

  const body = `# ${SITE.name}

> ${SITE.alternateName}: ${SITE.description}

${SITE.name} is a public static personal blog by ${SITE.author.name}. It contains Chinese-language writing about Android engineering, software development, and personal reflections.

## Primary URLs

- Home: ${absoluteUrl('/', site)}
- RSS feed: ${absoluteUrl('/rss.xml', site)}
- Sitemap: ${absoluteUrl('/sitemap.xml', site)}
- Markdown homepage: ${absoluteUrl('/index.md', site)}
- Full agent-readable archive: ${absoluteUrl('/llms-full.txt', site)}

## Author

- Name: ${SITE.author.name}
- Website: ${SITE.author.url}
- GitHub: ${SITE.author.github}
- X: ${SITE.author.x}

## Agent Access Notes

- Public reading requires no authentication.
- This site does not expose account APIs, OAuth authorization, MCP tools, delegated user resources, or commerce endpoints.
- Canonical article URLs use the root-level pattern \`/{slug}/\`.
- Legacy \`/blog/{slug}/\` URLs redirect to the canonical article URLs.

## Latest Posts

${latestPosts
  .map((post) => {
    const description = post.data.description || post.data.excerpt;
    return `- [${post.data.title}](${absoluteUrl(`/${post.id}/`, site)}) - ${formatIsoDate(post.data.date)}${description ? `: ${description}` : ''}`;
  })
  .join('\n')}
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
