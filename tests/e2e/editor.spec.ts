import { expect, test } from '@playwright/test';

async function openSection(page: import('@playwright/test').Page, name: string) {
  const details = page.locator('.inspector details').filter({ has: page.locator('summary', { hasText: name }) });
  if (!(await details.evaluate((element) => element.hasAttribute('open')))) {
    await details.locator('summary').click();
  }
}

test('editor updates identity and shows export controls', async ({ page }) => {
  await page.goto('/new');
  await openSection(page, 'Identity');
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Jordan Lee');
  await expect(page.locator('figure.card-face').filter({ hasText: 'Front' })).toContainText('Jordan Lee');
  await openSection(page, 'Export');
  await expect(page.getByRole('button', { name: 'PDF', exact: true })).toBeVisible();

  await openSection(page, 'QR style');
  await page.getByRole('button', { name: 'dots', exact: true }).click();
  await expect(page.getByRole('button', { name: 'dots', exact: true })).toHaveClass(/on/);
  await openSection(page, 'Privacy & sharing');
  await page.getByLabel('Phone').uncheck();
  await expect(page.getByLabel('Phone')).not.toBeChecked();
  await openSection(page, 'Team & roster');
  await expect(page.getByRole('button', { name: 'Roster PDF' })).toBeVisible();
});

test('editor remains reachable and stable across desktop and mobile layouts', async ({ page }, testInfo) => {
  await page.goto('/new');
  const inspector = page.locator('.inspector');

  if (testInfo.project.name === 'mobile') {
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      inspectorOverflow: getComputedStyle(document.querySelector('.inspector')!).overflowY,
      railPosition: getComputedStyle(document.querySelector('.editor-rail')!).position
    }));
    expect(metrics.scrollWidth).toBe(metrics.clientWidth);
    expect(metrics.inspectorOverflow).toBe('visible');
    expect(metrics.railPosition).toBe('static');
    await openSection(page, 'Export');
    await page.getByRole('button', { name: 'JSON', exact: true }).scrollIntoViewIfNeeded();
    await expect(page.getByRole('button', { name: 'JSON', exact: true })).toBeVisible();
  } else {
    const metrics = await inspector.evaluate((element) => ({
      bottom: element.getBoundingClientRect().bottom,
      viewport: window.innerHeight,
      overflow: getComputedStyle(element).overflowY,
      canScroll: element.scrollHeight > element.clientHeight
    }));
    expect(metrics.bottom).toBeLessThanOrEqual(metrics.viewport + 1);
    expect(metrics.overflow).toBe('auto');
    expect(metrics.canScroll).toBe(true);
    await openSection(page, 'Export');
    await page.getByRole('button', { name: 'JSON', exact: true }).scrollIntoViewIfNeeded();
    await expect(page.getByRole('button', { name: 'JSON', exact: true })).toBeVisible();
  }
});

test('QR codes support LinkedIn and custom destinations', async ({ page }) => {
  await page.goto('/new');
  await page.getByRole('group', { name: 'Insert elements' }).getByRole('button', { name: 'QR', exact: true }).click();
  await page.getByLabel('QR destination').selectOption('linkedin');
  await page.getByLabel('LinkedIn URL').fill('linkedin.com/in/jordan-lee');
  await expect(page.getByText('QR destination is ready.')).toBeVisible();

  await page.getByLabel('QR destination').selectOption('custom');
  await page.getByLabel('Destination URL').fill('javascript:alert(1)');
  await expect(page.getByText(/Enter a valid http or https URL/)).toBeVisible();
  await page.getByLabel('Destination URL').fill('https://example.com/meet');
  await expect(page.getByText('QR destination is ready.')).toBeVisible();
});

test('professional product pages and expanded templates render', async ({ page }) => {
  await page.goto('/templates');
  await expect(page.getByRole('heading', { name: 'Templates' })).toBeVisible();
  await page.getByPlaceholder('Search styles or professions').fill('student');
  await expect(page.getByText('Campus', { exact: true })).toBeVisible();

  await page.goto('/organizations');
  await expect(page.getByRole('heading', { name: 'One thoughtful card system for a whole group.' })).toBeVisible();
  await expect(page.getByText('Import roster', { exact: true })).toBeVisible();

  await page.goto('/trust');
  await expect(page.getByRole('heading', { name: 'Your card is personal. The editor should respect that.' })).toBeVisible();
  await expect(page.getByText('No tracking runtime')).toBeVisible();

  await page.goto('/settings');
  // Version number comes from package.json at build time (see vite.config.ts)
  // — match the surrounding copy, not a hardcoded version that will go stale.
  await expect(page.getByText(/^CardForge \S+\. Production updates are checked whenever the app opens\.$/)).toBeVisible();
});

test('digital cards keep private data out of the request query', async ({ context, page }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/new');
  await openSection(page, 'Identity');
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Private Example');
  await openSection(page, 'Privacy & sharing');
  await page.getByRole('button', { name: 'Copy digital card link' }).click();
  const shareUrl = await page.evaluate(() => navigator.clipboard.readText());
  const parsed = new URL(shareUrl);
  expect(parsed.search).toBe('');
  expect(parsed.hash).toMatch(/^#d=/);
  await page.goto(shareUrl);
  await expect(page.getByRole('heading', { name: 'Private Example' })).toBeVisible();
});

test('public routes expose distinct crawlable metadata and one primary heading', async ({ page }) => {
  const routes = ['/', '/templates', '/organizations', '/pricing', '/blog', '/blog/business-card-size-and-bleed', '/trust', '/privacy', '/terms', '/accessibility', '/help'];
  const titles = new Set<string>();

  for (const route of routes) {
    await page.goto(route);
    const title = await page.title();
    titles.add(title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{40,}/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https:\/\/adeelone\.github\.io\/cardforge\//);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  }

  expect(titles.size).toBe(routes.length);
});

test('unknown routes render a real noindex 404 screen', async ({ page }) => {
  await page.goto('/not-a-real-cardforge-page');
  await expect(page).toHaveTitle('Page not found | CardForge');
  await expect(page.getByRole('heading', { name: 'This page is not in the deck.' })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
});

test('opening the editor without editing does not add a card to the library', async ({ page }) => {
  await page.goto('/new');
  await expect(page.getByLabel('Design name')).toBeVisible();
  await page.waitForTimeout(1200);
  await page.goto('/library');
  await expect(page.getByText('No saved designs yet.')).toBeVisible();

  await page.goto('/new');
  await page.getByLabel('Design name').fill('Saved Person card');
  await page.waitForTimeout(1200);
  await page.goto('/library');
  await expect(page.getByText('Saved Person card')).toBeVisible();
});

test('missing designs show a recoverable not-found state', async ({ page }) => {
  await page.goto('/design/design_does_not_exist');
  await expect(page.getByRole('heading', { name: 'We couldn’t find that card.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open My cards' })).toBeVisible();
});

test('pricing compares plans and local-only builds explain cloud availability', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.getByRole('heading', { name: 'Simple plans for every introduction.' })).toBeVisible();
  for (const name of ['Free', 'Pro', 'Business']) {
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  }
  await expect(page.getByRole('table')).toContainText('Custom link');
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Accounts aren’t enabled here' })).toBeVisible();
});

test('guides are readable without JavaScript and crawlers get discovery files', async ({ browser, request }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/blog/digital-business-card-qr-code');
  await expect(page.locator('h1')).toHaveText(/Digital Business Card with a QR Code/);
  await expect(page.locator('.post-body')).toContainText('How big should a QR code be');
  await page.goto('/pricing');
  await expect(page.getByRole('heading', { name: 'Simple plans for every introduction.' })).toBeVisible();
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}');
  expect(ld['@graph'].map((node: { '@type': string }) => node['@type'])).toContain('FAQPage');
  await context.close();

  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('User-agent: GPTBot');
  expect(robots).toContain('User-agent: ClaudeBot');
  expect(robots).toMatch(/Sitemap: .*\/sitemap\.xml/);
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain('/blog/business-card-size-and-bleed</loc><lastmod>');
  expect(sitemap).not.toContain('/account');
  expect(await (await request.get('/llms.txt')).text()).toContain('free business card maker');
  expect((await request.get('/rss.xml')).ok()).toBe(true);
});

test('blog index links to every guide and articles render in the app', async ({ page }) => {
  await page.goto('/blog');
  await expect(page.getByRole('heading', { name: 'Business card guides' })).toBeVisible();
  await page.getByRole('link', { name: /What to Put on a Business Card/ }).first().click();
  await expect(page).toHaveURL(/\/blog\/what-to-put-on-a-business-card$/);
  await expect(page).toHaveTitle(/What to Put on a Business Card in 2026/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/blog\/what-to-put-on-a-business-card$/);
});
