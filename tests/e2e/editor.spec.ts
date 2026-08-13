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
  await expect(page.getByText('CardForge 0.3.1. Production updates are checked whenever the app opens.')).toBeVisible();
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
