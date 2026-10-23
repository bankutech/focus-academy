import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import FeeCalculator from '../src/components/FeeCalculator';
import StepProgress from '../src/components/common/StepProgress';
import Navbar from '../src/components/Navbar';
import Footer from '../src/components/Footer';
import MobileQuickBar from '../src/components/common/MobileQuickBar';
import LoadingScreen from '../src/components/common/LoadingScreen';
import { AppProvider } from '../src/context/AppContext';

describe('React Component DOM Integration Tests', () => {
  it('renders FeeCalculator and verifies interactive sibling discount calculation and trial modal callback', () => {
    const handleSelectPackage = vi.fn();
    const handleOpenDemoModal = vi.fn();

    render(
      <FeeCalculator 
        onSelectPackage={handleSelectPackage} 
        onOpenDemoModal={handleOpenDemoModal} 
      />
    );

    expect(screen.getByText(/Estimated Monthly Fee/i)).toBeDefined();
    
    const siblingBtn = screen.getByText(/2\+ Children \(15% Off\)/i);
    fireEvent.click(siblingBtn);

    expect(screen.getByText(/15% Sibling concession applied/i)).toBeDefined();

    const bookTrialBtn = screen.getByRole('button', { name: /Book 1-Day Free Trial at this Rate/i });
    fireEvent.click(bookTrialBtn);

    expect(handleSelectPackage).toHaveBeenCalledTimes(1);
    expect(handleOpenDemoModal).toHaveBeenCalledTimes(1);
    expect(handleOpenDemoModal).toHaveBeenCalledWith('Class 10 State Board (SSLC)');
  });

  it('renders StepProgress and highlights active step while linking completed steps', () => {
    render(
      <BrowserRouter>
        <AppProvider>
          <StepProgress currentStep={3} />
        </AppProvider>
      </BrowserRouter>
    );

    const step1Link = screen.getByRole('link', { name: /1\. Student Details/i });
    expect(step1Link.getAttribute('href')).toBe('/student-details');

    const step2Link = screen.getByRole('link', { name: /2\. Exam Prep/i });
    expect(step2Link.getAttribute('href')).toBe('/exam-prep');

    const step3Text = screen.getByText(/3\. Batches/i);
    expect(step3Text.tagName.toLowerCase()).toBe('span');
  });

  it('renders Navbar and validates all navigation links, direct call trigger and demo modal button', () => {
    render(
      <BrowserRouter>
        <AppProvider>
          <Navbar />
        </AppProvider>
      </BrowserRouter>
    );

    const allLinks = screen.getAllByRole('link');
    const brandLink = allLinks.find((l) => l.getAttribute('href') === '/');
    expect(brandLink).toBeDefined();

    expect(screen.getByRole('link', { name: /^About$/i }).getAttribute('href')).toBe('/about');
    expect(screen.getByRole('link', { name: /^Courses$/i }).getAttribute('href')).toBe('/courses');
    expect(screen.getByRole('link', { name: /^Timings$/i }).getAttribute('href')).toBe('/timings');
    expect(screen.getAllByRole('link', { name: /^Fees$/i }).every((l) => l.getAttribute('href') === '/fees')).toBe(true);
    expect(screen.getByRole('link', { name: /^Contact$/i }).getAttribute('href')).toBe('/contact');

    const phoneLink = screen.getByRole('link', { name: /\+91 98424 51220/i });
    expect(phoneLink.getAttribute('href')).toBe('tel:+919842451220');

    const checkSeatsLink = screen.getByRole('link', { name: /Check Batch Seats/i });
    expect(checkSeatsLink.getAttribute('href')).toBe('/student-details');

    const menuBtn = screen.getByRole('button', { name: /Open navigation menu/i });
    expect(menuBtn).toBeDefined();
    fireEvent.click(menuBtn);

    const closeBtn = screen.getByRole('button', { name: /Close navigation menu/i });
    expect(closeBtn).toBeDefined();

    const mobileCheckSeats = screen.getByRole('link', { name: /Check Batch Seats & Timings/i });
    expect(mobileCheckSeats.getAttribute('href')).toBe('/student-details');

    fireEvent.click(closeBtn);
  });

  it('renders MobileQuickBar and verifies Call and WhatsApp actions', () => {
    render(<MobileQuickBar />);

    const callLink = screen.getByRole('link', { name: /Call/i });
    expect(callLink.getAttribute('href')).toBe('tel:+919842451220');

    const whatsappLink = screen.getByRole('link', { name: /WhatsApp/i });
    expect(whatsappLink.getAttribute('href')).toContain('https://wa.me/919842451220');
    expect(whatsappLink.getAttribute('target')).toBe('_blank');
    expect(whatsappLink.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('renders Footer and verifies all quick links and contact actions', () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );

    expect(screen.getByRole('link', { name: /^Home$/i }).getAttribute('href')).toBe('/');
    expect(screen.getByRole('link', { name: /^About$/i }).getAttribute('href')).toBe('/about');
    expect(screen.getByRole('link', { name: /^Courses$/i }).getAttribute('href')).toBe('/courses');
    expect(screen.getByRole('link', { name: /^Timings$/i }).getAttribute('href')).toBe('/timings');
    expect(screen.getByRole('link', { name: /^Fees$/i }).getAttribute('href')).toBe('/fees');
    expect(screen.getByRole('link', { name: /^Contact$/i }).getAttribute('href')).toBe('/contact');

    const phoneLink = screen.getByRole('link', { name: /\+91 98424 51220/i });
    expect(phoneLink.getAttribute('href')).toBe('tel:+919842451220');

    const whatsappLink = screen.getByRole('link', { name: /Direct WhatsApp Helpdesk/i });
    expect(whatsappLink.getAttribute('href')).toContain('https://wa.me/919842451220');
  });

  it('renders LoadingScreen with Focus Academy branding and message', () => {
    render(<LoadingScreen message="Loading custom test message..." />);
    expect(screen.getByRole('status')).toBeDefined();
    expect(screen.getByText(/Focus Academy/i)).toBeDefined();
    expect(screen.getByText(/Thoramangalam • Perambalur/i)).toBeDefined();
    expect(screen.getByText('FA')).toBeDefined();
    expect(screen.getByText(/Loading custom test message.../i)).toBeDefined();
  });

  it('renders LoadingScreen in initialMode with live progress percentage', () => {
    render(<LoadingScreen message="Preparing initial portal..." initialMode />);
    expect(screen.getByText(/Preparing initial portal.../i)).toBeDefined();
    expect(screen.getByText(/%/)).toBeDefined();
  });
});
