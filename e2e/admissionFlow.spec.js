import { test, expect } from '@playwright/test';

test.describe('Focus Academy Admission Funnel E2E', () => {
  test('redirects unstarted visitors attempting to load /enroll directly to /student-details with requirement banner', async ({ page }) => {
    await page.goto('/enroll');
    await expect(page).toHaveURL(/.*student-details/);
    await expect(page.getByText(/Step 1 Required/i).first()).toBeVisible();
    await expect(page.getByText(/Please provide basic student details first to unlock batches/i).first()).toBeVisible();
  });

  test('completes full sequential 5-step admission flow in ascending order', async ({ page }) => {
    await page.goto('/student-details');
    await expect(page.getByRole('heading', { name: /Student Registration/i })).toBeVisible();

    await page.locator('#signup-student-name').fill('S. Kaviya');
    await page.locator('#signup-phone').fill('9842451220');

    await page.getByRole('button', { name: /Continue to Exam Preparation/i }).click();

    await expect(page).toHaveURL(/.*exam-prep/);
    await expect(page.getByText(/S. Kaviya/i)).toBeVisible();

    await page.getByRole('button', { name: /View Available Batches/i }).click();

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

  test('submits Step 5 enrollment and verifies admission slip generation', async ({ page }) => {
    await page.goto('/student-details');
    await page.locator('#signup-student-name').fill('S. Kaviya');
    await page.locator('#signup-phone').fill('9842451220');
    await page.getByRole('button', { name: /Continue to Exam Preparation/i }).click();

    await expect(page).toHaveURL(/.*exam-prep/);
    await page.getByRole('button', { name: /View Available Batches/i }).click();

    await expect(page).toHaveURL(/.*batches/);
    const selectBatchButtons = page.getByRole('link', { name: /Select Batch & Details/i });
    await selectBatchButtons.first().click();

    await expect(page).toHaveURL(/.*batch\/.*/);
    await page.getByRole('link', { name: /Confirm Batch & Proceed to Enrollment/i }).click();

    await expect(page).toHaveURL(/.*enroll\/.*/);
    await expect(page.getByText(/5\. Enrollment/i)).toBeVisible();

    await page.locator('#enroll-parent-name').fill('S. Subramanian');
    await page.locator('#enroll-school-name').fill('Roever Matriculation School');
    await page.locator('#enroll-emergency-name').fill('M. Meenakshi');
    await page.locator('#enroll-emergency-phone').fill('9842451221');
    await page.locator('#enroll-address-street').fill('Door No. 12, Thiripura Complex, Thoramangalam');
    await page.locator('#enroll-address-pin').fill('621220');
    await page.locator('#enroll-id-number').fill('ID-PER-2026-01');

    await page.getByLabel(/Required — Guardian Declaration/i).check();

    await page.getByRole('button', { name: /Complete Batch Enrollment/i }).click();

    await expect(page.getByText(/Seat Reserved & Admission Slip Generated!/i)).toBeVisible();
    await expect(page.getByText(/Admission Slip No:/i)).toBeVisible();
    await expect(page.getByText(/Roever Matriculation School/i)).toBeVisible();
    await expect(page.getByText(/Log In to Student Portal →/i)).toBeVisible();
  });
});
