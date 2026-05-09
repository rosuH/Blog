export const SITE = {
  url: 'https://blog.rosuh.me',
  name: 'Blog.kt',
  alternateName: 'rosu 的博客',
  description: '写 Android、技术，也写生活。',
  language: 'zh-CN',
  author: {
    name: 'rosu',
    url: 'https://rosuh.me',
    github: 'https://github.com/rosuH',
    x: 'https://twitter.com/rosu_h',
  },
} as const;

export function absoluteUrl(pathname: string, site: URL | undefined | null): string {
  return new URL(pathname, site ?? SITE.url).toString();
}

export function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
