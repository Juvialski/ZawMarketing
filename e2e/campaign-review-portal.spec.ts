import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/?demo=1');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test('owner workspace can create review link and view generated public URL', async ({ page }) => {
  // 1. Open sample campaign
  await page.getByText(/Demo · Phoenix Value-Add/i).first().click();

  // 2. Click "Share & Review" tab
  await page.getByRole('button', { name: 'Share & Review' }).click();

  await expect(page.getByText('Shareable Campaign Review Room')).toBeVisible();

  // 3. Create review link
  await page.getByRole('button', { name: 'Create Secure Review Link' }).click();

  // 4. Verify link is active and token URL is displayed
  await expect(page.getByText('Review Link Active')).toBeVisible();
  await expect(page.getByText(/\/review\/rev_/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy Review Link' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Publish Latest Changes' })).toBeVisible();
});

test('public client review portal loads standalone room with presentation, variants, and approval', async ({ page }) => {
  // 1. Open campaign and create link
  await page.getByText(/Demo · Phoenix Value-Add/i).first().click();
  await page.getByRole('button', { name: 'Share & Review' }).click();
  await page.getByRole('button', { name: 'Create Secure Review Link' }).click();

  // 2. Extract generated URL from text
  const linkText = await page.getByTestId('review-link-url').textContent();
  expect(linkText).toBeTruthy();

  // 3. Navigate directly to the public review URL
  await page.goto(linkText!.trim());

  // 4. Verify client-facing review room header
  await expect(page.getByText('Review Package · Version 1')).toBeVisible();
  await expect(page.getByText('Investment Presentation Deck')).toBeVisible();
  await expect(page.getByText('Marketing Graphics & Flyer Materials')).toBeVisible();

  // 5. Verify presentation deck is present and read-only
  const deck = page.locator('.zaw-deck');
  await expect(deck).toBeVisible();
  // Annotator dock button should NOT be visible in read-only mode
  await expect(page.getByRole('button', { name: 'Canvas drawing tool' })).not.toBeVisible();

  // 6. Test Variant Comparison modal
  const compareBtn = page.getByRole('button', { name: /Compare/i }).first();
  await compareBtn.click();
  const modal = page.getByRole('dialog', { name: /Compare/i });
  await expect(modal).toBeVisible();
  await expect(modal.getByText('Compare Creative Versions')).toBeVisible();

  // Click Mark as Preferred on variant inside modal
  const markPreferredBtn = modal.getByRole('button', { name: /Mark as Preferred|Mark Preferred/i }).first();
  await markPreferredBtn.click();

  // Close comparison modal
  await modal.getByRole('button', { name: 'Close comparison view' }).click();
  await expect(modal).not.toBeVisible();

  // 7. Submit Campaign Package Approval
  const nameInput = page.getByPlaceholder('Your name (e.g. John)');
  await nameInput.fill('Sarah General Partner');

  const approvePkgBtn = page.getByRole('button', { name: 'Approve Selected Materials' }).first();
  await approvePkgBtn.click();

  await expect(page.getByText('Review Successfully Submitted')).toBeVisible();
});
