import { describe, it, expect } from 'vitest';

describe('Fee Calculation Engine', () => {
  const baseMonthlyFees = {
    'class-1-5': 1500,
    'class-6-8': 1800,
    'class-9-10': 2400,
    'class-11-12': 2800,
    'iit-jee-neet': 3200,
  };

  const boardMultiplier = {
    'State Board': 1.0,
    'CBSE': 1.05,
    'ICSE': 1.1,
  };

  const calculateFee = (grade, board, mode = 'classroom', hours = 4) => {
    const base = baseMonthlyFees[grade] || 2400;
    const bMult = boardMultiplier[board] || 1.0;
    const mMult = mode === 'classroom' ? 1.0 : 0.95;
    const hFactor = hours / 4;
    return Math.round(base * bMult * mMult * (hFactor > 0.8 ? hFactor : 0.8));
  };

  it('calculates standard monthly fee for Class 10 State Board', () => {
    const fee = calculateFee('class-9-10', 'State Board', 'classroom', 4);
    expect(fee).toBe(2400);
  });

  it('applies 5% premium for CBSE curriculum due to extended NCERT problem banks', () => {
    const fee = calculateFee('class-9-10', 'CBSE', 'classroom', 4);
    expect(fee).toBe(2520);
  });

  it('applies 5% concession for online interactive mode', () => {
    const fee = calculateFee('class-11-12', 'State Board', 'online', 4);
    expect(fee).toBe(2660);
  });

  it('scales fee proportionally with weekly class hours', () => {
    const standardFee = calculateFee('class-6-8', 'State Board', 'classroom', 4);
    const intensiveFee = calculateFee('class-6-8', 'State Board', 'classroom', 6);
    expect(standardFee).toBe(1800);
    expect(intensiveFee).toBe(2700);
  });

  it('correctly calculates 12% advance package discount', () => {
    const monthly = calculateFee('class-9-10', 'State Board', 'classroom', 4);
    const discounted = Math.round(monthly * 0.88);
    expect(discounted).toBe(2112);
  });
});
