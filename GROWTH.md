# Getting CardForge found

This is the get-found checklist and where each item stands. Items marked **(built)** ship with every deploy. Items marked **(you)** need your accounts and take a few minutes each.

| | Item | Status |
|---|---|---|
| ✅ | Sitemap | **(built)** `/sitemap.xml` is generated each build from the pages and blog posts, with real `lastmod` dates for posts. |
| ✅ | A real title | **(built)** Every page has a unique, keyword-led title and description (`src/app/page-meta.ts`). |
| ✅ | Preview image | **(built)** A 1200×630 `og.png`, plus Open Graph and Twitter tags with size, alt text, `og:site_name`, and article dates. |
| ✅ | Pages AI can read | **(built)** Public pages and guides are prerendered to real HTML at build time (`src/prerender.tsx`), with JSON-LD structured data, `llms.txt`, and `llms-full.txt`. |
| ✅ | AI bots allowed | **(built)** `robots.txt` explicitly allows GPTBot, ClaudeBot, PerplexityBot, Google-Extended, and others. Hosted cards are kept out of search with `noindex` to protect people's contact details. |
| ✅ | 1 real keyword | **(built)** The primary keyword is **"free business card maker"**. Supporting keywords are listed below. |
| ✅ | Blog | **(built)** `/blog`, an RSS feed at `/rss.xml`, and 3 launch guides. Add one Markdown file per week. |
| ⬜ | Search Console | **(you)** About 5 minutes; steps below. |
| ⬜ | 10 directories | **(you)** About 1 hour in total. Copy and links below. |

---

## 1. Google Search Console (5 minutes)

The site is on a `vercel.app` subdomain, so you can't verify it through DNS. Use the HTML-tag method:

1. Go to <https://search.google.com/search-console> and choose **Add property**, then **URL prefix**.
2. Enter your production URL exactly, e.g. `https://myreadlist.vercel.app/` (or your custom domain, once it's attached).
3. Choose **HTML tag**, then copy only the `content="…"` value.
4. Paste that value into `seo.config.json` as `googleSiteVerification`, commit, and push. Or just send it to Claude and it will do this for you. The next deploy adds the tag to every page.
5. Click **Verify** in Search Console.
6. Open **Sitemaps** and submit `sitemap.xml`.
7. Use **URL inspection** on the home page, `/templates`, `/pricing`, and each `/blog/...` guide, then click **Request indexing**.

**Bing Webmaster Tools** (this also feeds ChatGPT search, DuckDuckGo, and Copilot): go to <https://www.bing.com/webmasters>, choose **Import from Google Search Console**, and it copies your verified site and sitemap. Alternatively, paste Bing's `msvalidate.01` value into `seo.config.json` as `bingSiteVerification`.

> **Domain tip:** Search engines treat `myreadlist.vercel.app` as the canonical address, and the name doesn't match the product. Before you submit, attach a matching domain under Vercel → Project → Domains (for example `cardforge.app`, or a free `*.vercel.app` name), set it as primary, and redeploy. Canonical URLs, the sitemap, and `llms.txt` follow it automatically.

## 2. Keywords

| Role | Keyword | Page that targets it |
|---|---|---|
| **Primary** | free business card maker | `/` (home) |
| Supporting | free business card templates | `/templates` |
| Supporting | business card size and bleed | `/blog/business-card-size-and-bleed` |
| Supporting | digital business card qr code | `/blog/digital-business-card-qr-code` |
| Supporting | what to put on a business card | `/blog/what-to-put-on-a-business-card` |
| Next | business cards for students | `/organizations` and a future guide |

Give each new page or post one keyword. Use it in the title, the H1, the first paragraph, and the URL. Link to the editor (`/new`) and to one related guide.

## 3. Directory submissions (about 1 hour)

Submit to these in one sitting, reusing the copy below. Several of them also give you a backlink, which helps Search Console pick the site up faster.

1. **Product Hunt**: <https://www.producthunt.com/posts/new>. Launch on a Tuesday–Thursday, at 12:01 a.m. Pacific time.
2. **Hacker News (Show HN)**: <https://news.ycombinator.com/submit>. Title: *Show HN: CardForge – a free, local-first business card maker with print-ready PDFs*
3. **Indie Hackers**: <https://www.indiehackers.com/products>
4. **AlternativeTo**: <https://alternativeto.net>. List CardForge as an alternative to Canva, VistaPrint's designer, HiHello, and Blinq.
5. **SaaSHub**: <https://www.saashub.com/submit>
6. **BetaList**: <https://betalist.com/submit>
7. **Uneed**: <https://www.uneed.best/submit-a-tool>
8. **Microlaunch**: <https://microlaunch.net>
9. **Fazier**: <https://fazier.com>
10. **Peerlist Launchpad**: <https://peerlist.io/launchpad>
11. **G2** (free listing): <https://sell.g2.com/create-a-profile>
12. **Reddit**: r/SideProject, and r/smallbusiness only where self-promotion is allowed. Lead with a guide, not a pitch.

### Copy to paste

**Name:** CardForge

**Tagline (60 characters):** Free business card maker — print-ready PDF, QR & digital card

**Short description (160 characters):**
Design a business card in your browser, export a print-ready PDF with bleed, and share a digital card with a QR code. Free, no sign-up, privacy-first.

**Long description:**
CardForge is a free business card maker that runs in your browser. Pick one of 17 templates, edit every detail with real typography, and export a print-ready PDF with true bleed and crop marks, plus PNG, SVG, vCard, and a custom-styled QR code.

Share a digital business card that includes only the fields you choose. With a free account, you can publish it at a short link and update it after you've printed, or switch it off in one tap. QR codes stay small and scannable.

Designs stay on your device unless you choose to sync. View analytics count visits per day, with no cookies or visitor tracking. Pro ($9/month) adds custom links like /c/your-name, more synced and live cards, analytics, and removes the badge.

**Categories:** Design tools · Productivity · Small business · Marketing
**Tags:** business cards, QR code, digital business card, vCard, print design, PDF
**Pricing:** Freemium — free forever; Pro $9/mo; Business $29/mo
**Screenshots:** use `public/og.png`, plus captures of `/templates`, the editor, and a published `/c/...` card.

## 4. One blog post per week

Posts are Markdown files in `content/blog/`. To publish one:

1. Create `content/blog/<keyword-slug>.md` with this front matter:
   ```md
   ---
   title: Title With the Keyword (Under 65 Characters Is Ideal)
   description: 140–160 characters that answer the search and invite the click.
   date: 2026-11-07
   keyword: the one phrase this post targets
   tags: printing, design
   ---
   ```
2. Write 800–1,500 useful words. Link to `/new` and one other guide. Unit tests fail if a post links to a page that doesn't exist.
3. Push. The post, sitemap, RSS feed, structured data, and `llms.txt` all update on deploy.
4. In Search Console, use **URL inspection** and **Request indexing** for the new URL.

Posts dated in the future stay hidden until their date, so you can write several at once. Redeploy (or push) on publish day so the static page, sitemap, and feed include the post.

### Next 12 weeks

| Week | Working title | Keyword |
|---|---|---|
| 1 | Business Cards for Students: What to Include and Where to Print | business cards for students |
| 2 | vCard vs. Digital Business Card: Which Should You Share? | vcard vs digital business card |
| 3 | Business Card Fonts: 10 Pairings That Print Well at Small Sizes | business card fonts |
| 4 | How to Print Business Cards at Home (and When Not To) | print business cards at home |
| 5 | Matte vs. Glossy Business Cards: Paper, Finish, and Cost | matte vs glossy business cards |
| 6 | QR Code on a Business Card: Size, Placement, and Testing | qr code on business card |
| 7 | Business Card Etiquette at Conferences and Career Fairs | business card etiquette |
| 8 | Business Cards for Real Estate Agents: A Template and Checklist | real estate business cards |
| 9 | How Many Business Cards Should I Order? | how many business cards to order |
| 10 | Vertical vs. Horizontal Business Cards | vertical business card |
| 11 | Business Cards for Photographers: Show Your Work in 3.5 × 2 Inches | photographer business cards |
| 12 | Batch Business Cards for a Team from a Spreadsheet | business cards for a team |

## 5. Monthly check-in (15 minutes)

- In Search Console → **Performance**, find queries with impressions but low clicks, and rewrite those pages' titles and descriptions in `src/app/page-meta.ts`.
- Check **Pages → Why pages aren't indexed** for errors.
- Ask ChatGPT, Claude, and Perplexity "what's a good free business card maker?" to see whether CardForge is cited. `llms.txt` and the prerendered guides are what they read.
