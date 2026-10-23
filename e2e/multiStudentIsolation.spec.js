import { test, expect } from '@playwright/test';

test.describe('Focus Academy Multi-Student Isolation E2E', () => {
  test('guarantees complete isolation between two distinct students in separate browser sessions', async ({ browser }) => {
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();

    await pageA.goto('/student-details');
    await pageA.locator('#signup-student-name').fill('Aarav Raman');
    await pageA.locator('#signup-phone').fill('9842100001');
    await pageA.getByRole('button', { name: 'Class 6' }).click();
    await pageA.getByRole('button', { name: /Continue to Exam Preparation/i }).click();

    await expect(pageA).toHaveURL(/.*exam-prep/);
    await expect(pageA.getByText(/Aarav Raman/i)).toBeVisible();
    await pageA.getByRole('button', { name: /View Available Batches/i }).click();

    await expect(pageA).toHaveURL(/.*batches/);
    await expect(pageA.getByText(/Middle School Science & Math Foundation/i).first()).toBeVisible();

    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    await pageB.goto('/student-details');
    await pageB.locator('#signup-student-name').fill('Bhavana Suresh');
    await pageB.locator('#signup-phone').fill('9842100002');
    await pageB.getByRole('button', { name: 'Class 10' }).click();
    await pageB.getByRole('button', { name: /Continue to Exam Preparation/i }).click();

    await expect(pageB).toHaveURL(/.*exam-prep/);
    await expect(pageB.getByText(/Bhavana Suresh/i)).toBeVisible();
    await expect(pageB.getByText(/Aarav Raman/i)).toHaveCount(0);

    await pageB.getByRole('button', { name: /View Available Batches/i }).click();
    await expect(pageB).toHaveURL(/.*batches/);
    await expect(pageB.getByText(/Class 10 State Board/i).first()).toBeVisible();

    await contextA.close();
    await contextB.close();
  });

  test('fixes navbar at top of viewport when scrolling down the page', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('header');
    await expect(header).toBeVisible();

    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(200);

    const box = await header.boundingBox();
    expect(box).not.toBeNull();
    expect(box.y).toBe(0);
  });
});
