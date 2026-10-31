import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock3, Rss } from 'lucide-react';
import { formatPostDate, getPost, getPosts } from '../content/blog';
import { applyPageMeta } from '../app/apply-meta';
import { NotFoundRoute } from './not-found';

export function BlogIndexRoute() {
  const posts = getPosts();
  return (
    <main className="page blog-page">
      <header className="page-header blog-header">
        <h1>Business card guides</h1>
        <p>Practical, no-fluff guides to sizes, printing, QR codes, and digital business cards — written by the team behind CardForge.</p>
        <a className="text-link" href={`${import.meta.env.BASE_URL}rss.xml`}><Rss size={15} />Subscribe via RSS</a>
      </header>
      <ol className="post-list">
        {posts.map((post) => (
          <li key={post.slug}>
            <article>
              <p className="post-meta"><time dateTime={post.date}>{formatPostDate(post.date)}</time> · <Clock3 size={13} aria-hidden="true" /> {post.readingMinutes} min read</p>
              <h2><Link to={`/blog/${post.slug}`}>{post.title}</Link></h2>
              <p>{post.description}</p>
              <Link to={`/blog/${post.slug}`} className="text-link" aria-label={`Read: ${post.title}`}>Read the guide <ArrowRight size={15} /></Link>
            </article>
          </li>
        ))}
      </ol>
    </main>
  );
}

export function BlogPostRoute() {
  const { slug = '' } = useParams();
  const post = getPost(slug);
  const related = getPosts().filter((item) => item.slug !== slug).slice(0, 2);

  useEffect(() => {
    if (post) applyPageMeta({ title: `${post.title} | CardForge`, description: post.description }, `/blog/${post.slug}`);
    else applyPageMeta({ title: 'Page not found | CardForge', description: 'The requested CardForge page could not be found.', index: false }, '/');
  }, [post]);

  if (!post) return <NotFoundRoute />;

  return (
    <main className="page blog-page">
      <article className="post">
        <Link to="/blog" className="text-link back-link"><ArrowLeft size={15} />All guides</Link>
        <header className="post-header">
          <h1>{post.title}</h1>
          <p className="post-lede">{post.description}</p>
          <p className="post-meta">
            <time dateTime={post.date}>{formatPostDate(post.date)}</time>
            {post.updated !== post.date ? <> · Updated <time dateTime={post.updated}>{formatPostDate(post.updated)}</time></> : null}
            {' · '}<Clock3 size={13} aria-hidden="true" /> {post.readingMinutes} min read
          </p>
        </header>
        {/* First-party Markdown, escaped and link-filtered by renderMarkdown. */}
        <div className="post-body" dangerouslySetInnerHTML={{ __html: post.html }} />
        <aside className="post-cta">
          <h2>Make yours in a minute</h2>
          <p>Free business card maker with print-ready PDF export, custom QR codes, and digital cards. No sign-up needed.</p>
          <Link to="/new" className="primary-button">Open the editor <ArrowRight size={16} /></Link>
        </aside>
      </article>
      {related.length ? (
        <nav className="related-posts" aria-label="More guides">
          <h2>More guides</h2>
          <ul>
            {related.map((item) => (
              <li key={item.slug}><Link to={`/blog/${item.slug}`}>{item.title}</Link></li>
            ))}
          </ul>
        </nav>
      ) : null}
    </main>
  );
}
