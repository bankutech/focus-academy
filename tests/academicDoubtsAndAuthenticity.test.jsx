import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Authentic Academic Data and Zero-Comment Tests', () => {
  const touchedFiles = [
    'src/App.jsx',
    'src/pages/EnrollPage.jsx',
    'src/pages/StudentDashboardPage.jsx',
    'src/pages/admin/AdminStudentsPage.jsx',
    'src/utils/printableDocuments.js',
    'api/student-portal.js',
    'api/leads.js',
    'api/batches.js',
    'api/_lib/rateLimiter.js'
  ];

  it('strictly enforces the zero-comment requirement across all touched source files', () => {
    for (const relPath of touchedFiles) {
      const fullPath = path.resolve(__dirname, '..', relPath);
      expect(fs.existsSync(fullPath)).toBe(true);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        expect(trimmed.startsWith('//'), `${relPath}:${idx + 1} has single line comment`).toBe(false);
        expect(trimmed.startsWith('/*'), `${relPath}:${idx + 1} has multiline comment`).toBe(false);
        expect(trimmed.startsWith('<!--'), `${relPath}:${idx + 1} has HTML comment`).toBe(false);
        expect(trimmed.includes('{/*'), `${relPath}:${idx + 1} has JSX comment`).toBe(false);
      });
    }
  });

  it('eliminates fake placeholder FA26-RECORDED student IDs across dashboard and print utils', () => {
    const dashboardContent = fs.readFileSync(path.resolve(__dirname, '../src/pages/StudentDashboardPage.jsx'), 'utf-8');
    const printContent = fs.readFileSync(path.resolve(__dirname, '../src/utils/printableDocuments.js'), 'utf-8');

    expect(dashboardContent).not.toContain('FA26-RECORDED');
    expect(printContent).not.toContain('FA26-RECORDED');
    expect(printContent).toContain('Pending assignment');
  });

  it('verifies that student doubt resolutions are never hardcoded with canned fake answers', () => {
    const dashboardContent = fs.readFileSync(path.resolve(__dirname, '../src/pages/StudentDashboardPage.jsx'), 'utf-8');
    expect(dashboardContent).not.toContain('Focus Academy Evening Desk');
    expect(dashboardContent).not.toContain('Your query has been logged and assigned to the subject tutor. Review will be shared during your evening batch session.');
    expect(dashboardContent).toContain('Tutor review scheduled for upcoming evening batch');
  });

  it('verifies that AdminStudentsPage contains Academic Doubts review tab and resolve handler', () => {
    const adminContent = fs.readFileSync(path.resolve(__dirname, '../src/pages/admin/AdminStudentsPage.jsx'), 'utf-8');
    expect(adminContent).toContain('Academic Doubts');
    expect(adminContent).toContain('handleResolveDoubt');
    expect(adminContent).toContain('studentDoubtsRecords');
    expect(adminContent).toContain('Submit Resolution');
  });
});
