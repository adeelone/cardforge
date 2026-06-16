import { expect, test } from '@playwright/test';

test('editor updates identity and shows export controls', async ({ page }) => {
  await page.goto('/new');
  await page.getByRole('textbox', { name: 'Name' }).fill('Jordan Lee');
  await expect(page.getByLabel('front side of Jordan Lee business card')).toBeVisible();
  await page.getByText('Export').click();
  await expect(page.getByRole('button', { name: /PDF/i })).toBeVisible();
});
