import { test, expect } from '@playwright/test';

test.describe('Focus Academy Full Visual Inspection', () => {
  test('captures desktop screenshots across student portal and admission funnel', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e/screenshots/01-desktop-home.png', fullPage: false });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /Student Login/i })).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/02-desktop-student-login.png', fullPage: false });

    await page.goto('/student-register');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /Create Student Account/i })).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/03-desktop-student-register.png', fullPage: false });

    await page.goto('/student-details');
    await page.waitForLoadState('networkidle');
    await page.locator('#signup-student-name').fill('Sagnik Mitra');
    await page.locator('#signup-phone').fill('9520926065');
    await page.getByRole('button', { name: 'Class 12' }).click();
    await page.screenshot({ path: 'e2e/screenshots/04-desktop-step1-student-details.png', fullPage: false });

    await page.getByRole('button', { name: /Continue to Exam Preparation/i }).click();
    await expect(page).toHaveURL(/.*exam-prep/);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e/screenshots/05-desktop-step2-exam-prep.png', fullPage: false });

    await page.getByRole('button', { name: /View Available Batches/i }).click();
    await expect(page).toHaveURL(/.*batches/);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e/screenshots/06-desktop-step3-batches.png', fullPage: false });

    await page.goto('/batch/batch-12-science');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e/screenshots/07-desktop-step4-batch-detail.png', fullPage: false });

    await page.goto('/student-dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*login/);
    await page.screenshot({ path: 'e2e/screenshots/08-desktop-dashboard-protected-redirect.png', fullPage: false });
  });

  test('captures mobile screenshots (375x667) across key responsive views', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e/screenshots/09-mobile-student-login.png', fullPage: false });

    await page.goto('/student-register');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e/screenshots/10-mobile-student-register.png', fullPage: false });

    await page.goto('/student-details');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e/screenshots/11-mobile-step1-details.png', fullPage: false });
  });
});
