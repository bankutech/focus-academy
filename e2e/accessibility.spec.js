import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AXE_PATH = path.resolve(__dirname, '../node_modules/axe-core/axe.min.js');

const PUBLIC_ROUTES = [
  { path: '/', name: 'home' },
  { path: '/about', name: 'about' },
  { path: '/courses', name: 'courses' },
  { path: '/timings', name: 'timings' },
  { path: '/fees', name: 'fees' },
  { path: '/contact', name: 'contact' },
  { path: '/student-details', name: 'student-details' },
  { path: '/exam-prep', name: 'exam-prep' },
  { path: '/batches', name: 'batches' },
  { path: '/login', name: 'student-login' },
  { path: '/signup', name: 'student-signup' },
  { path: '/admin-portal/login', name: 'admin-login' },
  { path: '/privacy', name: 'privacy' },
  { path: '/this-page-does-not-exist', name: 'not-found' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 375, height: 812 },
];

const runAxe = async (page) => {
  await page.addScriptTag({ path: AXE_PATH });
  return page.evaluate(async () => {
    const results = await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
      resultTypes: ['violations'],
    });
    return results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.slice(0, 4).map((n) => ({ target: n.target.join(' '), summary: (n.failureSummary || '').replace(/\s+/g, ' ').slice(0, 320) })),
      count: v.nodes.length,
    }));
  });
};

const format = (route, viewport, violations) =>
  violations
    .map(
      (v) =>
        `\n[${route} @ ${viewport}] ${v.impact} · ${v.id} (${v.count} nodes)\n  ${v.help}\n` +
        v.nodes.map((n) => `    - ${n.target}\n      ${n.summary}`).join('\n')
    )
    .join('\n');

const SERIOUS = new Set(['serious', 'critical']);

for (const viewport of VIEWPORTS) {
  for (const route of PUBLIC_ROUTES) {
    test(`axe: ${route.path} @ ${viewport.name} has no serious or critical violations`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(route.path, { waitUntil: 'networkidle' });

      const violations = await runAxe(page);
      const blocking = violations.filter((v) => SERIOUS.has(v.impact));

      expect(blocking.length === 0 ? 'clean' : format(route.path, viewport.name, blocking)).toBe('clean');
    });
  }
}
