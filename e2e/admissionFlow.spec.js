import { test, expect } from '@playwright/test';

test.describe('Focus Academy Admission Funnel E2E', () => {
  test('redirects unstarted visitors attempting to load /enroll directly to /student-details with requirement banner', async ({ page }) => {
    await page.goto('/enroll');
    await expect(page).toHaveURL(/.*student-details/);
    await expect(page.getByText(/Step 1 Required/i)).toBeVisible();
    await expect(page.getByText(/Please provide basic student details first to unlock batches/i)).toBeVisible();
  });

  test('completes full sequential 5-step admission flow in ascending order', async ({ page }) => {
    await page.goto('/student-details');
    await expect(page.getByRole('heading', { name: /Student Registration/i })).toBeVisible();

    await page.locator('#signup-student-name').fill('S. Kaviya');
    await page.locator('#signup-phone').fill('9842451220');

    await page.getByRole('button', { name: /Continue to Exam Preparation/i }).click();

    await expect(page).toHaveURL(/.*exam-prep/);
    await expect(page.getByText(/S. Kaviya/i)).toBeVisible();

    await page.getByRole('button', { name: /Continue to Batch Schedules/i }).click();

    await expect(page).toHaveURL(/.*batches/);
    await expect(page.getByTestId('batches-filter-bar')).toBeVisible();

    const selectBatchButtons = page.getByRole('link', { name: /Select Batch & Details/i });
    await selectBatchButtons.first().click();

    await expect(page).toHaveURL(/.*batch\/.*/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.getByRole('link', { name: /Confirm Batch & Proceed to Enrollment/i }).click();

    await expect(page).toHaveURL(/.*enroll\/.*/);
    await expect(page.getByText(/5\. Enrollment/i)).toBeVisible();
  });
});
