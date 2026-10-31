import { describe, expect, it } from 'vitest';
import { parseFrontMatter, renderMarkdown } from '../../src/content/markdown';
import { getPosts } from '../../src/content/blog';
import { PAGES } from '../../src/app/page-meta';

describe('renderMarkdown', () => {
  it('escapes HTML and drops unsafe links', () => {
    const html = renderMarkdown('Hello <script>alert(1)</script> [bad](javascript:alert(1)) [ok](/new) [ext](https://example.com) `<b>`');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('javascript:');
    expect(html).toContain('<a href="/new">ok</a>');
    expect(html).toContain('<a href="https://example.com" rel="noopener" target="_blank">ext</a>');
    expect(html).toContain('<code>&lt;b&gt;</code>');
  });

  it('renders headings, lists, tasks, quotes, and tables', () => {
    const html = renderMarkdown('## A **bold** idea\n\n- one\n- two\n\n1. first\n\n- [ ] todo\n\n> quoted\n\n| a | b |\n| --- | --- |\n| 1 | 2 |');
    expect(html).toContain('<h2 id="a-bold-idea">A <strong>bold</strong> idea</h2>');
    expect(html).toContain('<ul><li>one</li><li>two</li></ul>');
    expect(html).toContain('<ol><li>first</li></ol>');
    expect(html).toContain('<li class="task">☐ todo</li>');
    expect(html).toContain('<blockquote><p>quoted</p></blockquote>');
    expect(html).toContain('<thead><tr><th scope="col">a</th><th scope="col">b</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody>');
  });

  it('parses front matter', () => {
    const { data, body } = parseFrontMatter('---\ntitle: "Hi: there"\ndate: 2026-10-31\n---\nBody');
    expect(data).toEqual({ title: 'Hi: there', date: '2026-10-31' });
    expect(body).toBe('Body');
  });
});

describe('blog posts', () => {
  const posts = getPosts(new Date('2100-01-01'));

  it('have unique slugs and search-friendly metadata', () => {
    expect(posts.length).toBeGreaterThanOrEqual(3);
    expect(new Set(posts.map((post) => post.slug)).size).toBe(posts.length);
    for (const post of posts) {
      expect(post.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(post.description.length, post.slug).toBeGreaterThanOrEqual(70);
      expect(post.description.length, post.slug).toBeLessThanOrEqual(200);
      expect(post.keyword, post.slug).not.toBe('');
      expect(post.html).toContain('href="/new"');
    }
  });

  it('hides posts scheduled for a later date', () => {
    expect(getPosts(new Date('2000-01-01'))).toHaveLength(0);
  });

  it('only links to pages that exist', () => {
    const known = new Set([...Object.keys(PAGES), ...posts.map((post) => `/blog/${post.slug}`)]);
    for (const post of posts) {
      for (const [, href] of post.html.matchAll(/href="(\/[^"#?]*)/g)) expect(known.has(href), `${post.slug} → ${href}`).toBe(true);
    }
  });
});

describe('page metadata', () => {
  it('gives every indexable page a unique, well-sized title and description', () => {
    const indexable = Object.entries(PAGES).filter(([, meta]) => meta.index !== false);
    expect(new Set(indexable.map(([, meta]) => meta.title)).size).toBe(indexable.length);
    for (const [path, meta] of indexable) {
      expect(meta.title.length, path).toBeLessThanOrEqual(75);
      expect(meta.description.length, path).toBeGreaterThanOrEqual(70);
      expect(meta.description.length, path).toBeLessThanOrEqual(200);
      expect(meta.sitemap, path).toBeDefined();
    }
    expect(PAGES['/'].title.toLowerCase()).toContain('free business card maker');
  });
});
