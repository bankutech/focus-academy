import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import FeeCalculator from '../src/components/FeeCalculator';
import StepProgress from '../src/components/common/StepProgress';
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
    
    const siblingBtn = screen.getByText(/2\+ Children \(10% Off\)/i);
    fireEvent.click(siblingBtn);

    expect(screen.getByText(/10% Sibling concession applied/i)).toBeDefined();

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
});
