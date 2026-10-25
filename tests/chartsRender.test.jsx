import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DonutChart, BarChart } from '../src/components/admin/Charts';

describe('Admin chart components', () => {
  it('renders a labelled donut with a legend and shares that add up', () => {
    render(<DonutChart label="Fee position" data={[{ label: 'Collected', value: 3000, color: '#059669' }, { label: 'Overdue', value: 1000, color: '#E11D48' }]} />);
    expect(screen.getByRole('img', { name: 'Fee position' })).toBeDefined();
    expect(screen.getByText('Collected')).toBeDefined();
    expect(screen.getAllByText(/75%/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/25%/).length).toBeGreaterThan(0);
  });

  it('shows an empty state instead of a blank chart', () => {
    render(<DonutChart data={[{ label: 'Collected', value: 0, color: '#059669' }]} />);
    expect(screen.getByText('Nothing to chart yet.')).toBeDefined();
  });

  it('renders one bar per row with its value label', () => {
    render(<BarChart label="Seats" data={[{ label: 'C10', value: 9, max: 12, sub: '9/12' }, { label: 'C9', value: 12, max: 12, sub: '12/12' }]} />);
    expect(screen.getByRole('img', { name: 'Seats' })).toBeDefined();
    expect(screen.getByText('9/12')).toBeDefined();
    expect(screen.getByText('12/12')).toBeDefined();
  });
});
