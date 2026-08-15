import { expect, test } from '@playwright/test';

test('editor updates identity and shows export controls', async ({ page }) => {
  await page.goto('/new');
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Jordan Lee');
  await expect(page.locator('figure.card-face').filter({ hasText: 'Front' })).toContainText('Jordan Lee');
  await expect(page.getByRole('button', { name: 'PDF', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'dots', exact: true }).click();
  await expect(page.getByRole('button', { name: 'dots', exact: true })).toHaveClass(/on/);
  await page.getByLabel('Phone').uncheck();
  await expect(page.getByLabel('Phone')).not.toBeChecked();
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
  await expect(page.getByText('CardForge 0.3.2. Production updates are checked whenever the app opens.')).toBeVisible();
});

test('digital cards keep private data out of the request query', async ({ context, page }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/new');
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Private Example');
  await page.getByRole('button', { name: 'Copy digital card link' }).click();
  const shareUrl = await page.evaluate(() => navigator.clipboard.readText());
  const parsed = new URL(shareUrl);
  expect(parsed.search).toBe('');
  expect(parsed.hash).toMatch(/^#d=/);
  await page.goto(shareUrl);
  await expect(page.getByRole('heading', { name: 'Private Example' })).toBeVisible();
});
