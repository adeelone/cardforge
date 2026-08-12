import { expect, test } from '@playwright/test';

test('editor updates identity and shows export controls', async ({ page }) => {
  await page.goto('/new');
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Jordan Lee');
  await expect(page.locator('figure.card-face').filter({ hasText: 'Front' })).toContainText('Jordan Lee');
  await expect(page.getByRole('button', { name: 'PDF' })).toBeVisible();
});
