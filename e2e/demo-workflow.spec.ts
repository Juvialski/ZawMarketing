import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test('explicit demo workspace loads without disguising fixtures as live data', async ({ page }) => {
  await expect(page.getByText(/Demo · Phoenix Value-Add/i).first()).toBeVisible();
  await expect(page.getByText(/Demo · Dallas 8-Unit/i).first()).toBeVisible();
  await expect(page.getByText(/Fictional/i).first()).toBeVisible();

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
});

test('demo campaign opens, edits locally, and survives reload', async ({ page }) => {
  await page.getByText(/Demo · Phoenix Value-Add/i).first().click();
  await expect(page.getByRole('button', { name: 'Full Marketing Kit', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Property Data', exact: true }).click();
  const title = page.getByLabel('Campaign Working Title');
  await title.fill('Demo · Revised Fictional Campaign');
  await page.getByRole('button', { name: /Save & Proceed to Campaign Studio/i }).click();
  await expect(page.getByText('Demo · Revised Fictional Campaign').first()).toBeVisible();

  await page.reload();
  await expect(page.getByText('Demo · Revised Fictional Campaign').first()).toBeVisible();
});

test('mobile shell has no full-page horizontal overflow', async ({ page }) => {
  const metrics = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    page: document.documentElement.scrollWidth,
  }));
  expect(metrics.page).toBeLessThanOrEqual(metrics.viewport + 1);
});
