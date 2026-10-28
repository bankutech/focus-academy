import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const read = (path) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Enrollment persistence architecture', () => {
  it('does not write enrollment records directly from the browser', () => {
    const page = read('src/pages/EnrollPage.jsx');
    expect(page).not.toContain("setDoc(doc(db, 'enrollments'");
    expect(page).not.toContain("from 'firebase/firestore'");
    expect(page).not.toContain('PROV-');
  });

  it('submits the admission through the server API and trusts only its response', () => {
    const page = read('src/pages/EnrollPage.jsx');
    expect(page).toContain('LeadService.submitLead');
    expect(page).toContain('leadResult.meta');
    expect(page).toContain('submissionResult.studentId');
    expect(page).not.toContain("'FA-2026-ENR'");
  });

  it('marks a failed server save as not saved instead of showing a confirmed slip', () => {
    const page = read('src/pages/EnrollPage.jsx');
    expect(page).toContain('Your admission was NOT saved at the campus database.');
    expect(page).toContain('Admission Not Saved');
  });

  it('passes the server response metadata through the lead service', () => {
    const service = read('src/services/leadService.js');
    expect(service).toContain('meta: body.meta || null');
  });

  it('never falls back to demo payments or obligations when the live database is unreachable', () => {
    const service = read('src/services/adminDataService.js');
    const payments = service.slice(service.indexOf('async getPayments('), service.indexOf('async recordPayment('));
    expect(payments).toContain('throw dataUnavailable(err)');
    expect(payments).not.toContain('using cached store');

    const obligations = service.slice(service.indexOf('async getFeeObligations('), service.indexOf('async createFeeObligation('));
    expect(obligations).toContain('throw dataUnavailable(err)');
    expect(obligations).not.toContain('using cached store');
  });

  it('does not merge seed demo students into the live roster', () => {
    const service = read('src/services/adminDataService.js');
    const students = service.slice(service.indexOf('async getStudents('), service.indexOf('async getLeads('));
    expect(students).toContain('throw dataUnavailable(err)');
    expect(students).not.toContain('using verified local store');
  });
});
