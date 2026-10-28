import { test, expect } from '@playwright/test';

const step4Journey = async (page) => {
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
};

const completeEnrollmentForm = async (page) => {
  await page.locator('#enroll-parent-name').fill('S. Subramanian');
  await page.locator('#enroll-school-name').fill('Roever Matriculation School');
  await page.locator('#enroll-emergency-name').fill('M. Meenakshi');
  await page.locator('#enroll-emergency-phone').fill('9842451221');
  await page.locator('#enroll-address-street').fill('Door No. 12, Thiripura Complex, Thoramangalam');
  await page.locator('#enroll-address-pin').fill('621220');
  await page.locator('#enroll-id-number').fill('ID-PER-2026-01');
  await page.getByLabel(/Required — Guardian Declaration/i).check();
};

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

  test('shows the centrally confirmed slip, server student ID and vetted next step', async ({ page }) => {
    await page.route('**/api/session', async (route) => {
      const payload = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          applicationId: 'APP-E2E-1',
          step: payload.step,
          token: `v2.APP-E2E-1.${payload.step}.${Date.now() + 600000}.e2e`,
          expiresAt: Date.now() + 600000,
        }),
      });
    });

    await page.route('**/api/batches', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, reservationId: 'RES-E2E-1', seatsRemaining: 9, holdMinutes: 15 }),
        });
        return;
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, batches: [] }) });
    });

    await page.route('**/api/leads', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'FA-E2E-SLIP01',
            studentId: 'FA-2026-001',
            feeObligationId: 'OBL-E2E-1',
            status: 'confirmed',
            enrollmentStatus: 'confirmed',
            studentName: 'S. Kaviya',
            monthlyFee: 2200,
          },
          meta: {
            id: 'FA-E2E-SLIP01',
            studentId: 'FA-2026-001',
            feeObligationId: 'OBL-E2E-1',
            enrollmentStatus: 'confirmed',
            duplicate: false,
          },
        }),
      });
    });

    await step4Journey(page);
    await completeEnrollmentForm(page);
    await page.getByRole('button', { name: /Complete Batch Enrollment/i }).click();

    await expect(page.getByRole('heading', { name: /Admission Confirmed — Seat Reserved/i })).toBeVisible();
    await expect(page.getByText(/Admission Slip No:/i)).toBeVisible();
    await expect(page.getByText('FA-E2E-SLIP01')).toBeVisible();
    await expect(page.getByText(/FA-2026-001/)).toBeVisible();
    const signInLink = page.getByRole('link', { name: /Sign In for the Student Portal →/i });
    await expect(signInLink).toBeVisible();
    await expect(page.getByRole('link', { name: /Create Student Account →/i })).toBeVisible();

    await signInLink.click();
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByRole('heading', { name: /Student Login/i })).toBeVisible();
  });

  test('reports that nothing was saved when the campus API is unavailable', async ({ page }) => {
    await step4Journey(page);
    await completeEnrollmentForm(page);
    await page.getByRole('button', { name: /Complete Batch Enrollment/i }).click();

    const refusal = page.getByRole('alert');
    await expect(refusal).toContainText(/Admission Not Saved/i);
    await expect(refusal).toContainText(/no longer open for online booking|NOT saved|No admission was created/i);
    await expect(page.getByText(/Admission Confirmed — Seat Reserved/i)).toHaveCount(0);
    await expect(page.getByText(/Admission Slip No:/i)).toHaveCount(0);
  });
});
