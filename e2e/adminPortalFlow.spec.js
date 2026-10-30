import { test, expect } from '@playwright/test';

test.describe('Focus Academy Admin Portal E2E', () => {
  test('redirects unauthenticated users attempting to access /admin-portal to /admin-portal/login', async ({ page }) => {
    await page.goto('/admin-portal');
    await expect(page).toHaveURL(/.*admin-portal\/login/);
    await expect(page.getByText(/Administrator Management Portal/i)).toBeVisible();
  });

  test('rejects non-allowlisted email address with access denied warning', async ({ page }) => {
    await page.addInitScript(() => {
      window.__E2E_SEED__ = true;
    });

    await page.goto('/admin-portal/login');

    await page.locator('#admin-email').fill('unauthorized.student@gmail.com');
    await page.locator('#admin-password').fill('SomePassword123');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Email or password is incorrect|Access Denied/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('authenticates authorized administrator, views dashboard, and navigates all admin modules', async ({ page }) => {
    await page.route('**/identitytoolkit.googleapis.com/**', async (route) => {
      const url = route.request().url();
      if (url.includes('signInWithPassword')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            idToken: 'fake-admin-token',
            email: 'admin@focusacademyperambalur.com',
            refreshToken: 'fake-refresh',
            expiresIn: '3600',
            localId: 'admin-fa-001',
            registered: true
          })
        });
      } else if (url.includes('lookup')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            users: [{
              localId: 'admin-fa-001',
              email: 'admin@focusacademyperambalur.com',
              emailVerified: true
            }]
          })
        });
      } else {
        await route.continue();
      }
    });

    await page.addInitScript(() => {
      window.__E2E_SEED__ = true;
    });

    await page.goto('/admin-portal/login');

    await page.locator('#admin-email').fill('admin@focusacademyperambalur.com');
    await page.locator('#admin-password').fill('FocusCampus@2026');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    await expect(page).toHaveURL(/.*admin-portal/);
    await expect(page.getByText(/Campus Operations Dashboard/i)).toBeVisible();
    await expect(page.getByText(/Active Students/i).first()).toBeVisible();

    await page.getByRole('link', { name: 'Inquiries & Leads' }).first().click();
    await expect(page).toHaveURL(/.*admin-portal\/leads/);
    await expect(page.getByText('Enrollments & Admission Inquiries').first()).toBeVisible();
    await expect(page.getByText('Enrollment Records (Admission Funnel)').first()).toBeVisible();
    await expect(page.getByText('No enrollment records match the current filter.').first()).toBeVisible();

    await page.getByRole('link', { name: 'Batches' }).first().click();
    await expect(page).toHaveURL(/.*admin-portal\/batches/);
    await expect(page.getByText('Batch Management').first()).toBeVisible();

    await page.getByRole('link', { name: 'Students' }).first().click();
    await expect(page).toHaveURL(/.*admin-portal\/students/);
    await expect(page.getByText('Student Management').first()).toBeVisible();

    await page.getByTitle('Edit Student').first().click();
    await expect(page.getByText(/Edit Student:/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Save Student Updates/i })).toBeVisible();
    await page.getByRole('button', { name: /Cancel/i }).first().click();

    await page.getByRole('link', { name: 'Fee Schedules' }).first().click();
    await expect(page).toHaveURL(/.*admin-portal\/fees/);
    await expect(page.getByText(/Recurring Fee Schedules/i).first()).toBeVisible();

    await page.getByRole('link', { name: 'Pay', exact: true }).first().click();
    await expect(page).toHaveURL(/.*admin-portal\/ledger\?studentId=/);
    await expect(page.getByText('Record Verified Payment')).toBeVisible();
    const amountInput = page.locator('input[type="number"]');
    await expect(amountInput).toBeVisible();
    const amountVal = await amountInput.inputValue();
    expect(Number(amountVal)).toBeGreaterThan(0);
    await page.getByRole('button', { name: /Cancel/i }).first().click();

    await page.getByRole('link', { name: 'Ledger & Payments' }).first().click();
    await expect(page).toHaveURL(/.*admin-portal\/ledger/);
    await expect(page.getByText('Financial Ledger & Payments').first()).toBeVisible();

    await page.getByRole('link', { name: 'WhatsApp Reminders' }).first().click();
    await expect(page).toHaveURL(/.*admin-portal\/reminders/);
    await expect(page.getByText('WhatsApp Fee Reminders').first()).toBeVisible();

    await page.getByRole('link', { name: 'Analytics' }).first().click();
    await expect(page).toHaveURL(/.*admin-portal\/reports/);
    await expect(page.getByText('Analytics').first()).toBeVisible();

    await page.getByRole('link', { name: 'Audit Logs' }).first().click();
    await expect(page).toHaveURL(/.*admin-portal\/audit-logs/);
    await expect(page.getByText('Administrative Audit Trail').first()).toBeVisible();

    await page.getByRole('button', { name: /Sign Out/i }).first().click();
    await expect(page).toHaveURL(/.*admin-portal\/login/);
  });
});
