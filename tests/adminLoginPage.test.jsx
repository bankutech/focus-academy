import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const fb = vi.hoisted(() => ({
  signInWithEmail: vi.fn(),
  signInWithGoogle: vi.fn(),
  createAdminUserWithEmail: vi.fn(),
  resendAdminVerification: vi.fn(),
  sendAdminPasswordReset: vi.fn(),
  logOutAdmin: vi.fn(async () => {}),
  onAdminAuthStateChanged: vi.fn(() => () => {}),
  isFirebaseConfigured: vi.fn(() => true),
  isUserAdmin: vi.fn((user) => String(user.email).endsWith('@focusacademyperambalur.com')),
}));

vi.mock('../src/services/firebase', () => fb);

import AdminLoginPage from '../src/pages/admin/AdminLoginPage';

const open = () => render(<MemoryRouter><AdminLoginPage /></MemoryRouter>);

const fill = (email, password) => {
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } });
};

const submit = () => fireEvent.click(screen.getAllByRole('button', { name: /^Sign in$|Try again in/ })[0]);

beforeEach(() => {
  sessionStorage.clear();
  Object.values(fb).forEach((fn) => fn.mockClear && fn.mockClear());
  fb.isFirebaseConfigured.mockReturnValue(true);
});

describe('Admin login page', () => {
  it('does not publish administrator email addresses or an allowlist', () => {
    open();
    expect(screen.queryByText(/Authorized Desks/i)).toBeNull();
    expect(screen.queryByText(/director|principal|coordinator/i)).toBeNull();
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeDefined();
  });

  it('shows one plain message for wrong password and unknown email', async () => {
    fb.signInWithEmail.mockRejectedValueOnce({ code: 'auth/wrong-password', message: 'Firebase: Error (auth/wrong-password).' });
    open();
    fill('director@focusacademyperambalur.com', 'nope-nope-1');
    submit();
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Email or password is incorrect.');
    expect(alert.textContent).not.toMatch(/Firebase|auth\//);
  });

  it('locks the form for a while after five failed attempts', async () => {
    fb.signInWithEmail.mockRejectedValue({ code: 'auth/invalid-credential' });
    open();
    fill('director@focusacademyperambalur.com', 'wrong-pass-1');
    for (let i = 0; i < 5; i += 1) {
      submit();
      await waitFor(() => expect(fb.signInWithEmail).toHaveBeenCalledTimes(i + 1));
      await screen.findByRole('alert');
    }
    const locked = await screen.findByRole('button', { name: /Try again in \d+s/ });
    expect(locked.disabled).toBe(true);
  });

  it('signs a valid but non-admin account straight back out', async () => {
    fb.signInWithEmail.mockResolvedValueOnce({ email: 'parent@gmail.com' });
    open();
    fill('parent@gmail.com', 'Correct-horse-9');
    submit();
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/not set up for administrator access/i);
    expect(fb.logOutAdmin).toHaveBeenCalled();
  });

  it('offers a fresh verification link when the email is unverified', async () => {
    fb.signInWithEmail.mockRejectedValueOnce({ code: 'auth/email-not-verified' });
    fb.resendAdminVerification.mockResolvedValueOnce({});
    open();
    fill('director@focusacademyperambalur.com', 'Correct-horse-9');
    submit();
    fireEvent.click(await screen.findByRole('button', { name: /new verification link/i }));
    await waitFor(() => expect(fb.resendAdminVerification).toHaveBeenCalledWith('director@focusacademyperambalur.com', 'Correct-horse-9'));
    expect((await screen.findByRole('status')).textContent).toMatch(/new verification link/i);
  });

  it('blocks weak passwords at registration and shows a strength meter', async () => {
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Campus' } });
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Admin' } });
    fireEvent.change(screen.getAllByLabelText('Email address')[0], { target: { value: 'coordinator@focusacademyperambalur.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'abc12' } });
    expect(screen.getByText('Too short')).toBeDefined();
    fireEvent.click(screen.getByLabelText(/I agree/));
    fireEvent.click(screen.getAllByRole('button', { name: 'Create account' })[0]);
    expect((await screen.findByRole('alert')).textContent).toMatch(/stronger password/i);
    expect(fb.createAdminUserWithEmail).not.toHaveBeenCalled();
  });

  it('does not reveal who is invited when an outsider tries to register', async () => {
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Some' } });
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'One' } });
    fireEvent.change(screen.getAllByLabelText('Email address')[0], { target: { value: 'someone@gmail.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Focus2026desk' } });
    fireEvent.click(screen.getByLabelText(/I agree/));
    fireEvent.click(screen.getAllByRole('button', { name: 'Create account' })[0]);
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/invited administrators/i);
    expect(fb.createAdminUserWithEmail).not.toHaveBeenCalled();
  });

  it('gives the same reset confirmation whether or not the account exists', async () => {
    fb.sendAdminPasswordReset.mockRejectedValueOnce({ code: 'auth/user-not-found' });
    open();
    fireEvent.click(screen.getByRole('button', { name: /Forgot password/ }));
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'ghost@focusacademyperambalur.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Send reset instructions/ }));
    expect((await screen.findByRole('status')).textContent).toMatch(/If an administrator account exists/);
    expect(screen.getByRole('button', { name: /Send again in \d+s/ }).disabled).toBe(true);
  });

  it('refuses to pretend to sign in when the auth service is not configured', async () => {
    fb.isFirebaseConfigured.mockReturnValue(false);
    open();
    expect(screen.getByText(/not configured on this deployment/i)).toBeDefined();
    fill('director@focusacademyperambalur.com', 'Correct-horse-9');
    submit();
    expect((await screen.findByRole('alert')).textContent).toMatch(/not configured/i);
    expect(fb.signInWithEmail).not.toHaveBeenCalled();
  });
});
