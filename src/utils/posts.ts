import type { CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;
export type ArchiveGroup = readonly [year: string, posts: BlogPost[]];

export interface ArchiveSummary {
  totalPosts: number;
  totalYears: number;
  recentYears: string[];
}

export function getSortedPosts(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function getLatestPosts(posts: BlogPost[], count = 5): BlogPost[] {
  return getSortedPosts(posts).slice(0, count);
}

export function getArchiveGroups(posts: BlogPost[]): ArchiveGroup[] {
  const groups = getSortedPosts(posts).reduce((map, post) => {
    const year = String(post.data.date.getFullYear());
    const bucket = map.get(year) ?? [];
    bucket.push(post);
    map.set(year, bucket);
    return map;
  }, new Map<string, BlogPost[]>());

  return Array.from(groups.entries());
}

export function getArchiveSummary(posts: BlogPost[], recentYearCount = 3): ArchiveSummary {
  const groups = getArchiveGroups(posts);

  return {
    totalPosts: getSortedPosts(posts).length,
    totalYears: groups.length,
    recentYears: groups.slice(0, recentYearCount).map(([year]) => year),
  };
}

export function formatFullDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatMonthDay(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  });
}
