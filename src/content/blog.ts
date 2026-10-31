import { markdownToText, parseFrontMatter, renderMarkdown } from './markdown';

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  /** ISO date (YYYY-MM-DD) the post was published. */
  date: string;
  /** ISO date of the last meaningful update; defaults to `date`. */
  updated: string;
  keyword: string;
  tags: string[];
  html: string;
  markdown: string;
  readingMinutes: number;
}

// Posts live in /content/blog/<slug>.md with front matter. Add a file to
// publish: the blog index, sitemap, RSS feed, and llms files pick it up.
const files = import.meta.glob('../../content/blog/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function toPost(path: string, raw: string): BlogPost {
  const slug = path.split('/').pop()!.replace(/\.md$/, '');
  const { data, body } = parseFrontMatter(raw);
  if (!data.title || !data.description || !DATE.test(data.date ?? '')) {
    throw new Error(`Blog post ${slug} needs title, description, and date (YYYY-MM-DD) front matter`);
  }
  const words = markdownToText(body).split(/\s+/).filter(Boolean).length;
  return {
    slug,
    title: data.title,
    description: data.description,
    date: data.date,
    updated: DATE.test(data.updated ?? '') ? data.updated : data.date,
    keyword: data.keyword ?? '',
    tags: (data.tags ?? '').split(',').map((tag) => tag.trim()).filter(Boolean),
    html: renderMarkdown(body),
    markdown: body.trim(),
    readingMinutes: Math.max(1, Math.round(words / 230))
  };
}

/** Published posts, newest first. Posts dated in the future stay hidden until that day. */
export function getPosts(now = new Date()): BlogPost[] {
  const today = now.toISOString().slice(0, 10);
  return Object.entries(files)
    .map(([path, raw]) => toPost(path, raw))
    .filter((post) => post.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

export function getPost(slug: string, now = new Date()) {
  return getPosts(now).find((post) => post.slug === slug);
}

export function formatPostDate(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}
