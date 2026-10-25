import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createFakeServices, mockResponse } from './helpers/fakeFirestore.js';

const holder = vi.hoisted(() => ({ current: null }));
vi.mock('../api/_lib/firebaseAdmin.js', () => ({ getServices: () => holder.current?.services || null }));

import sessionHandler from '../api/session.js';
import batchesHandler from '../api/batches.js';
import leadsHandler from '../api/leads.js';
import whatsappHandler from '../api/whatsapp.js';

const call = async (handler, body, { method = 'POST', ip = '10.0.0.1', headers = {} } = {}) => {
  const res = mockResponse();
  await handler({ method, body, headers: { 'x-forwarded-for': ip, ...headers } }, res);
  return res;
};

const BATCH = (id, grade, board, enrolledCount = 9) => ({
  id, name: id, grade, board, capacity: 12, enrolledCount, isArchived: false, timing: '6:00 PM – 7:30 PM', monthlyFee: 2200,
});

const person = (n, grade = 'Class 10', board = 'TN State Board (Samacheer)') => ({
  studentName: `Student ${n}`, phone: `98421000${String(n).padStart(2, '0')}`, grade, board,
});

const reachStep4 = async (p, ip) => {
  let applicationId;
  let token;
  for (const step of [2, 3, 4]) {
    const res = await call(sessionHandler, { ...p, step, applicationId }, { ip });
    expect(res.statusCode).toBe(200);
    applicationId = res.body.applicationId;
    token = res.body.token;
  }
  return { applicationId, token };
};

let fake;

beforeEach(() => {
  process.env.SESSION_SECRET = 'k'.repeat(48);
  fake = createFakeServices();
  holder.current = fake;
  fake.seed('batches', 'batch-10-state-board', BATCH('batch-10-state-board', 'Class 10', 'TN State Board (Samacheer)'));
  fake.seed('batches', 'batch-12-science-board', BATCH('batch-12-science-board', 'Class 12', 'TN State Board, CBSE & ISC'));
});

afterEach(() => {
  delete process.env.SESSION_SECRET;
  holder.current = null;
});

describe('Admission session API', () => {
  it('fails closed when the secret or database is missing', async () => {
    delete process.env.SESSION_SECRET;
    expect((await call(sessionHandler, { ...person(1), step: 2 })).statusCode).toBe(503);
    process.env.SESSION_SECRET = 'k'.repeat(48);
    holder.current = null;
    expect((await call(sessionHandler, { ...person(1), step: 2 })).statusCode).toBe(503);
  });

  it('only advances one step at a time and keeps an application bound to its phone', async () => {
    const jump = await call(sessionHandler, { ...person(1), step: 4 });
    expect(jump.statusCode).toBe(409);

    const first = await call(sessionHandler, { ...person(1), step: 2 });
    expect(first.statusCode).toBe(200);
    const skip = await call(sessionHandler, { ...person(1), step: 4, applicationId: first.body.applicationId });
    expect(skip.statusCode).toBe(409);

    const other = await call(sessionHandler, { ...person(2), step: 3, applicationId: first.body.applicationId });
    expect(other.statusCode).toBe(403);
  });

  it('rejects malformed identity fields and out-of-range steps', async () => {
    expect((await call(sessionHandler, { ...person(1), phone: '12345', step: 2 })).statusCode).toBe(400);
    expect((await call(sessionHandler, { ...person(1), step: 9 })).statusCode).toBe(400);
    expect((await call(sessionHandler, { ...person(1), step: 1 })).statusCode).toBe(400);
  });

  it('rate limits through the shared store, not process memory', async () => {
    let last;
    for (let i = 0; i < 41; i += 1) last = await call(sessionHandler, { ...person(i % 50), step: 2 }, { ip: '10.9.9.9' });
    expect(last.statusCode).toBe(429);
  });
});

describe('Seat reservation API', () => {
  it('requires a verified step-4 token', async () => {
    const anon = await call(batchesHandler, { batchId: 'batch-10-state-board', ...person(1) });
    expect(anon.statusCode).toBe(401);

    const early = await call(sessionHandler, { ...person(1), step: 2 });
    const res = await call(batchesHandler, { batchId: 'batch-10-state-board', ...person(1), stepToken: early.body.token });
    expect(res.statusCode).toBe(401);

    const forged = await call(batchesHandler, { batchId: 'batch-10-state-board', ...person(1), stepToken: 'v2.APP-X.4.9999999999999.deadbeef' });
    expect(forged.statusCode).toBe(401);
  });

  it('holds a seat once per application and is idempotent on retries', async () => {
    const p = person(1);
    const { token } = await reachStep4(p);
    const a = await call(batchesHandler, { batchId: 'batch-10-state-board', ...p, stepToken: token });
    const b = await call(batchesHandler, { batchId: 'batch-10-state-board', ...p, stepToken: token });
    expect(a.statusCode).toBe(200);
    expect(b.body.reservationId).toBe(a.body.reservationId);
    expect(b.body.seatsRemaining).toBe(2);
  });

  it('never sells more than 12 seats', async () => {
    const outcomes = [];
    for (let n = 1; n <= 5; n += 1) {
      const p = person(n);
      const { token } = await reachStep4(p, `10.1.0.${n}`);
      outcomes.push((await call(batchesHandler, { batchId: 'batch-10-state-board', ...p, stepToken: token }, { ip: `10.1.0.${n}` })).statusCode);
    }
    expect(outcomes.filter((s) => s === 200)).toHaveLength(3);
    expect(outcomes.filter((s) => s === 409)).toHaveLength(2);
  });

  it('frees a seat when a hold expires', async () => {
    fake.seed('reservations', 'APP-OLD__batch-10-state-board', {
      reservationId: 'RES-OLD', applicationId: 'APP-OLD', batchId: 'batch-10-state-board', phone: '9800000000',
      status: 'held', expiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    const listing = await call(batchesHandler, undefined, { method: 'GET' });
    expect(listing.body.batches.find((b) => b.id === 'batch-10-state-board').seatsRemaining).toBe(3);
  });

  it('rejects a batch that does not fit the student grade or board', async () => {
    const p = person(1, 'Class 10');
    const { token } = await reachStep4(p);
    const res = await call(batchesHandler, { batchId: 'batch-12-science-board', ...p, stepToken: token });
    expect(res.statusCode).toBe(422);
  });

  it('refuses a token used with a different mobile number', async () => {
    const { token } = await reachStep4(person(1));
    const res = await call(batchesHandler, { batchId: 'batch-10-state-board', ...person(2), stepToken: token });
    expect(res.statusCode).toBe(403);
  });
});

describe('Lead API', () => {
  const inquiry = (extra = {}) => ({ ...person(7), parentName: 'Parent', ...extra });

  it('stores a sanitized inquiry in the database', async () => {
    const res = await call(leadsHandler, inquiry({ studentName: '<script>alert(1)</script>Kaviya', notes: "x'; DROP" }), { ip: '10.2.0.1' });
    expect(res.statusCode).toBe(200);
    const stored = fake.all('leads')[0];
    expect(stored.studentName).not.toMatch(/[<>]/);
    expect(stored.notes).not.toMatch(/['";]/);
  });

  it('rejects oversized and invalid payloads', async () => {
    expect((await call(leadsHandler, inquiry({ notes: 'A'.repeat(9000) }), { ip: '10.2.0.2' })).statusCode).toBe(413);
    expect((await call(leadsHandler, inquiry({ phone: '123' }), { ip: '10.2.0.3' })).statusCode).toBe(400);
  });

  it('rejects automated spambots populating honeypot fields', async () => {
    const res = await call(leadsHandler, inquiry({ website_url: 'http://spam.ru' }), { ip: '10.2.0.7' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Automated submission rejected/i);
  });

  it('safeguards child secondary phone and medical alert fields', async () => {
    const res = await call(leadsHandler, inquiry({
      secondaryPhone: '+91 98424 51221',
      medicalAlert: 'Asthma inhaler in backpack'
    }), { ip: '10.2.0.8' });
    expect(res.statusCode).toBe(200);
    const stored = fake.all('leads').find(l => l.secondaryPhone === '9842451221');
    expect(stored).toBeDefined();
    expect(stored.secondaryPhone).toBe('9842451221');
    expect(stored.medicalAlert).toBe('Asthma inhaler in backpack');
  });

  it('rate limits bursts per client', async () => {
    let last;
    for (let i = 0; i < 11; i += 1) last = await call(leadsHandler, inquiry(), { ip: '10.2.0.9' });
    expect(last.statusCode).toBe(429);
  });

  it('confirms the held seat when the enrollment lead is saved', async () => {
    const p = person(3);
    const { token } = await reachStep4(p);
    const hold = await call(batchesHandler, { batchId: 'batch-10-state-board', ...p, stepToken: token });
    const lead = await call(leadsHandler, { ...p, batchId: 'batch-10-state-board', reservationId: hold.body.reservationId, stepToken: token }, { ip: '10.3.0.1' });
    expect(lead.statusCode).toBe(200);
    expect(fake.all('reservations')[0].status).toBe('confirmed');
  });

  it('rejects an enrollment lead without a valid hold', async () => {
    const p = person(4);
    const { token } = await reachStep4(p);
    const res = await call(leadsHandler, { ...p, batchId: 'batch-10-state-board', reservationId: 'RES-FAKE', stepToken: token }, { ip: '10.3.0.2' });
    expect(res.statusCode).toBe(409);
    const noToken = await call(leadsHandler, { ...p, batchId: 'batch-10-state-board', reservationId: 'RES-FAKE' }, { ip: '10.3.0.3' });
    expect(noToken.statusCode).toBe(401);
  });
});

describe('WhatsApp reminder API', () => {
  const auth = (token) => ({ headers: { authorization: `Bearer ${token}` }, ip: '10.4.0.1' });

  beforeEach(() => {
    fake.seed('academy_settings', 'main_config', {
      authorizedAdmins: [
        { email: 'coordinator@focusacademyperambalur.com', role: 'fee_manager', active: true },
      ],
    });
    fake.addAccount('good', { uid: 'u1', email: 'coordinator@focusacademyperambalur.com', email_verified: true });
    fake.addAccount('stranger', { uid: 'u2', email: 'stranger@example.com', email_verified: true });
    fake.addAccount('unverified', { uid: 'u3', email: 'coordinator@focusacademyperambalur.com', email_verified: false });
    fake.seed('students', 'STU-1', { studentName: 'Kaviya', guardianPhone: '9842451220' });
    fake.seed('fee_obligations', 'OBL-1', { studentId: 'STU-1', studentName: 'Kaviya', amountDue: 2200, amountPaid: 700, waivedAmount: 0, status: 'partially_paid', dueDate: '2026-11-05' });
  });

  it('rejects anonymous, unverified and unauthorized callers', async () => {
    expect((await call(whatsappHandler, { obligationId: 'OBL-1' })).statusCode).toBe(401);
    expect((await call(whatsappHandler, { obligationId: 'OBL-1' }, auth('stranger'))).statusCode).toBe(403);
    expect((await call(whatsappHandler, { obligationId: 'OBL-1' }, auth('unverified'))).statusCode).toBe(403);
    expect((await call(whatsappHandler, { obligationId: 'OBL-1' }, auth('nope'))).statusCode).toBe(401);
  });

  it('uses the balance and guardian number stored on the server, ignoring the request', async () => {
    const res = await call(whatsappHandler, { obligationId: 'OBL-1', amount: 1, phone: '9999999999' }, auth('good'));
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('₹1500');
    expect(res.body.clickToChatUrl).toContain('919842451220');
    expect(res.body.clickToChatUrl).not.toContain('9999999999');
  });

  it('does not invent obligations and sends at most one reminder per day', async () => {
    expect((await call(whatsappHandler, { obligationId: 'MADE-UP' }, auth('good'))).statusCode).toBe(404);
    expect((await call(whatsappHandler, { obligationId: 'OBL-1' }, auth('good'))).statusCode).toBe(200);
    expect((await call(whatsappHandler, { obligationId: 'OBL-1' }, auth('good'))).statusCode).toBe(409);
  });

  it('respects opt-out and cleared balances', async () => {
    fake.seed('students', 'STU-1', { studentName: 'Kaviya', guardianPhone: '9842451220', communicationConsent: false });
    expect((await call(whatsappHandler, { obligationId: 'OBL-1' }, auth('good'))).statusCode).toBe(403);
    fake.seed('students', 'STU-1', { studentName: 'Kaviya', guardianPhone: '9842451220' });
    fake.seed('fee_obligations', 'OBL-1', { studentId: 'STU-1', studentName: 'Kaviya', amountDue: 2200, amountPaid: 2200, status: 'paid' });
    expect((await call(whatsappHandler, { obligationId: 'OBL-1' }, auth('good'))).statusCode).toBe(409);
  });
});
