import { test, expect } from '@playwright/test';

const ROUTES = [
  '/',
  '/about',
  '/batches',
  '/fees',
  '/contact',
  '/courses',
  '/student-details',
  '/exam-prep',
  '/login',
  '/signup',
  '/privacy',
  '/404',
  '/admin-portal/login',
];

const VIEWPORTS = [
  { name: 'mobile-320', width: 320, height: 568 },
  { name: 'mobile-360', width: 360, height: 800 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-430', width: 430, height: 932 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'tablet-1024', width: 1024, height: 768 },
  { name: 'laptop-1280', width: 1280, height: 720 },
  { name: 'desktop-1920', width: 1920, height: 1080 },
];

test.describe.configure({ timeout: 180000 });

const measure = (page) =>
  page.evaluate(() => {
    const doc = document.documentElement;
    const vw = window.innerWidth;
    const offenders = [];
    document.querySelectorAll('body *').forEach((el) => {
      if (offenders.length >= 6) return;
      const style = window.getComputedStyle(el);
      if (style.position === 'fixed' || style.visibility === 'hidden' || style.display === 'none') return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      if (rect.right <= vw + 1 && rect.left >= -1) return;
      let scrollable = false;
      let parent = el.parentElement;
      while (parent && parent !== document.body) {
        const parentStyle = window.getComputedStyle(parent);
        if (['auto', 'scroll', 'hidden'].includes(parentStyle.overflowX)) {
          scrollable = true;
          break;
        }
        parent = parent.parentElement;
      }
      if (scrollable) return;
      const id = el.id ? `#${el.id}` : '';
      const cls = typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/).slice(0, 3).join('.')}` : '';
      offenders.push(`${el.tagName.toLowerCase()}${id}${cls} right=${Math.round(rect.right)}`);
    });
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      viewport: vw,
      offenders,
    };
  });

for (const viewport of VIEWPORTS) {
  test(`no horizontal overflow at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const problems = [];

    for (const route of ROUTES) {
      await page.goto(route, { waitUntil: 'load' });
      await page.waitForTimeout(150);
      const result = await measure(page);
      if (result.scrollWidth > result.viewport + 1) {
        problems.push(`${route}: scrollWidth ${result.scrollWidth} > ${result.viewport} :: ${result.offenders.join(' | ')}`);
      }
    }

    expect(problems, problems.join('\n')).toHaveLength(0);
  });
}
