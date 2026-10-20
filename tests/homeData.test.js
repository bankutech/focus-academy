import { describe, it, expect } from 'vitest';
import { 
  HOME_PROGRAMS, 
  HOME_BATCH_SLOTS, 
  HOME_ADMISSION_STEPS, 
  HOME_FEATURES 
} from '../src/data/homeData';

describe('Home Data Structures', () => {
  it('provides complete program tracks with valid grades and subjects', () => {
    expect(HOME_PROGRAMS.length).toBeGreaterThanOrEqual(3);
    for (const prog of HOME_PROGRAMS) {
      expect(prog.id).toBeDefined();
      expect(prog.title).toBeDefined();
      expect(prog.batchSize).toBeDefined();
      expect(typeof prog.batchSize).toBe('string');
    }
  });

  it('defines 3 disciplined evening batches spanning 4:30 PM to 9:00 PM', () => {
    expect(HOME_BATCH_SLOTS.length).toBe(3);
    expect(HOME_BATCH_SLOTS[0].time).toBe('4:30 PM – 6:00 PM');
    expect(HOME_BATCH_SLOTS[1].time).toBe('6:00 PM – 7:30 PM');
    expect(HOME_BATCH_SLOTS[2].time).toBe('7:30 PM – 9:00 PM');
    for (const slot of HOME_BATCH_SLOTS) {
      expect(slot.seats).toContain('12 Students');
    }
  });

  it('provides a 5-step admission flow starting with student details and ending at enrollment', () => {
    expect(HOME_ADMISSION_STEPS.length).toBe(5);
    expect(HOME_ADMISSION_STEPS[0].link).toBe('/student-details');
    expect(HOME_ADMISSION_STEPS[1].link).toBe('/exam-prep');
    expect(HOME_ADMISSION_STEPS[2].link).toBe('/batches');
    expect(HOME_ADMISSION_STEPS[3].link).toBe('/batches');
    expect(HOME_ADMISSION_STEPS[4].link).toBe('/enroll');
  });

  it('includes key classroom features and standards', () => {
    expect(HOME_FEATURES.length).toBe(4);
    const titles = HOME_FEATURES.map((f) => f.title);
    expect(titles.some((t) => t.includes('Small Batch'))).toBe(true);
    expect(titles.some((t) => t.includes('Evening Batches'))).toBe(true);
  });
});
