import { test, expect } from '@playwright/test';

const TARGET_RESOLUTIONS = [
  { width: 1366, height: 768, name: '1366x768' },
  { width: 1280, height: 720, name: '1280x720' },
  { width: 1440, height: 900, name: '1440x900' },
];

test.describe('Focus Academy Split-Screen Authentication Page', () => {
  for (const resolution of TARGET_RESOLUTIONS) {
    test(`renders perfectly without scrollbars at ${resolution.name} in all modes`, async ({ page }) => {
      await page.setViewportSize({ width: resolution.width, height: resolution.height });
      await page.goto('/admin-portal/login');

      await expect(page.getByText('Administrator access only.')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Administrator sign in' })).toBeVisible();

      const loginScroll = await page.evaluate(() => {
        const doc = document.documentElement;
        const rightPanel = document.querySelector('[data-testid="auth-right-panel"]');
        console.log(`1280x720 Reg Panel: scrollHeight=${rightPanel?.scrollHeight}, clientHeight=${rightPanel?.clientHeight}`);
        return {
          hasVerticalScroll: doc.scrollHeight > window.innerHeight,
          hasHorizontalScroll: doc.scrollWidth > window.innerWidth,
          rightPanelHasScroll: rightPanel ? rightPanel.scrollHeight > rightPanel.clientHeight : false,
        };
      });

      expect(loginScroll.hasVerticalScroll).toBe(false);
      expect(loginScroll.hasHorizontalScroll).toBe(false);
      expect(loginScroll.rightPanelHasScroll).toBe(false);

      await page.getByRole('button', { name: 'Create account' }).click();
      await expect(page.getByRole('heading', { name: 'Create administrator account' })).toBeVisible();

      const regScroll = await page.evaluate(() => {
        const doc = document.documentElement;
        const rightPanel = document.querySelector('[data-testid="auth-right-panel"]');
        return {
          hasVerticalScroll: doc.scrollHeight > window.innerHeight,
          hasHorizontalScroll: doc.scrollWidth > window.innerWidth,
          rightPanelHasScroll: rightPanel ? rightPanel.scrollHeight > rightPanel.clientHeight : false,
          scrollHeight: rightPanel?.scrollHeight,
          clientHeight: rightPanel?.clientHeight,
        };
      });

      expect(regScroll.hasVerticalScroll).toBe(false);
      expect(regScroll.hasHorizontalScroll).toBe(false);
      expect(regScroll.rightPanelHasScroll).toBe(false);

      await page.getByRole('button', { name: 'Sign in' }).first().click();
      await page.getByRole('button', { name: 'Forgot password?' }).click();
      await expect(page.getByRole('heading', { name: 'Reset password' })).toBeVisible();

      const forgotScroll = await page.evaluate(() => {
        const doc = document.documentElement;
        const rightPanel = document.querySelector('[data-testid="auth-right-panel"]');
        console.log(`1280x720 Reg Panel: scrollHeight=${rightPanel?.scrollHeight}, clientHeight=${rightPanel?.clientHeight}`);
        return {
          hasVerticalScroll: doc.scrollHeight > window.innerHeight,
          hasHorizontalScroll: doc.scrollWidth > window.innerWidth,
          rightPanelHasScroll: rightPanel ? rightPanel.scrollHeight > rightPanel.clientHeight : false,
        };
      });

      expect(forgotScroll.hasVerticalScroll).toBe(false);
      expect(forgotScroll.hasHorizontalScroll).toBe(false);
      expect(forgotScroll.rightPanelHasScroll).toBe(false);
    });
  }

  test('verifies correct hierarchy: inputs -> primary submit -> divider -> Google auth', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/admin-portal/login');

    const formBox = page.locator('[data-testid="auth-right-panel"]');
    const emailBox = formBox.locator('#admin-email');
    const passwordBox = formBox.locator('#admin-password');
    const submitBtn = formBox.getByRole('button', { name: /Sign in|Access Admin Console/i }).first();
    const divider = formBox.getByText('or continue with');
    const googleBtn = formBox.getByRole('button', { name: /Sign in with Google/i });

    const emailPos = await emailBox.boundingBox();
    const passPos = await passwordBox.boundingBox();
    const submitPos = await submitBtn.boundingBox();
    const divPos = await divider.boundingBox();
    const googlePos = await googleBtn.boundingBox();

    expect(emailPos.y).toBeLessThan(passPos.y);
    expect(passPos.y).toBeLessThan(submitPos.y);
    expect(submitPos.y).toBeLessThan(divPos.y);
    expect(divPos.y).toBeLessThan(googlePos.y);

    await page.getByRole('button', { name: 'Create account' }).click();
    const regEmailBox = formBox.locator('#reg-email');
    const regPassBox = formBox.locator('#reg-password');
    const regSubmitBtn = formBox.getByRole('button', { name: 'Create account' });
    const regDivider = formBox.getByText('or continue with');
    const regGoogleBtn = formBox.getByRole('button', { name: /Sign up with Google/i });

    const regEmailPos = await regEmailBox.boundingBox();
    const regPassPos = await regPassBox.boundingBox();
    const regSubmitPos = await regSubmitBtn.boundingBox();
    const regDivPos = await regDivider.boundingBox();
    const regGooglePos = await regGoogleBtn.boundingBox();

    expect(regEmailPos.y).toBeLessThan(regPassPos.y);
    expect(regPassPos.y).toBeLessThan(regSubmitPos.y);
    expect(regSubmitPos.y).toBeLessThan(regDivPos.y);
    expect(regDivPos.y).toBeLessThan(regGooglePos.y);
  });

  test('toggles password visibility control in login and register modes', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/admin-portal/login');

    const passwordInput = page.locator('#admin-password');
    await passwordInput.fill('SecretPass123');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = page.getByRole('button', { name: /show password/i });
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    const hideBtn = page.getByRole('button', { name: /hide password/i });
    await hideBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');

    await page.getByRole('button', { name: 'Create account' }).click();
    const regPassInput = page.locator('#reg-password');
    await regPassInput.fill('AnotherSecret456');
    await expect(regPassInput).toHaveAttribute('type', 'password');

    const regToggleBtn = page.getByRole('button', { name: /show password/i });
    await regToggleBtn.click();
    await expect(regPassInput).toHaveAttribute('type', 'text');

    const regHideBtn = page.getByRole('button', { name: /hide password/i });
    await regHideBtn.click();
    await expect(regPassInput).toHaveAttribute('type', 'password');
  });

  test('switches seamlessly between login, registration, and password reset modes', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/admin-portal/login');

    await expect(page.getByRole('heading', { name: 'Administrator sign in' })).toBeVisible();

    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByRole('heading', { name: 'Create administrator account' })).toBeVisible();
    await expect(page.locator('#reg-first-name')).toBeVisible();
    await expect(page.locator('#reg-last-name')).toBeVisible();
    await expect(page.locator('#reg-email')).toBeVisible();
    await expect(page.locator('#reg-password')).toBeVisible();

    await page.getByRole('button', { name: 'Sign in' }).first().click();
    await expect(page.getByRole('heading', { name: 'Administrator sign in' })).toBeVisible();

    await page.getByRole('button', { name: 'Forgot password?' }).click();
    await expect(page.getByRole('heading', { name: 'Reset password' })).toBeVisible();
    await expect(page.locator('#reset-email')).toBeVisible();

    await page.getByRole('button', { name: '← Back to sign in' }).click();
    await expect(page.getByRole('heading', { name: 'Administrator sign in' })).toBeVisible();
  });

  test('validates password reset submission', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/admin-portal/login');

    await page.getByRole('button', { name: 'Forgot password?' }).click();
    await page.locator('#reset-email').fill('admin@focusacademyperambalur.com');
    await page.getByRole('button', { name: 'Send reset instructions' }).click();

    await expect(page.getByText(/instructions dispatched|Password reset instructions sent|reset link is on its way/i)).toBeVisible();
  });

  test('validates registration form requires terms acceptance and allowlist', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/admin-portal/login');

    await page.getByRole('button', { name: 'Create account' }).click();
    await page.locator('#reg-first-name').fill('Campus');
    await page.locator('#reg-last-name').fill('Admin');
    await page.locator('#reg-email').fill('unauthorized@test.com');
    await page.locator('#reg-password').fill('SafePassword123');

    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText(/Please accept the Terms/i)).toBeVisible();

    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText(/Registration is limited to invited administrators|Access Denied.*allowlist/i)).toBeVisible();
  });

  test('navigates back to public website via Back to website link', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/admin-portal/login');

    await page.getByRole('link', { name: /Back to website/i }).click();
    await expect(page).toHaveURL(/http:\/\/localhost:4173\/?$/);
  });

  test('adapts responsively on mobile viewports without horizontal scrolling', async ({ page }) => {
    for (const mobileSize of [{ width: 375, height: 667 }, { width: 412, height: 915 }]) {
      await page.setViewportSize(mobileSize);
      await page.goto('/admin-portal/login');

      await expect(page.getByRole('link', { name: /Back to website/i })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Administrator sign in' })).toBeVisible();
      await expect(page.locator('#admin-email')).toBeVisible();
      await expect(page.locator('#admin-password')).toBeVisible();

      const horizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(horizontalScroll).toBe(false);
    }
  });
});
