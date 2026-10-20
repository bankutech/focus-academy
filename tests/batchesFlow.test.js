import { describe, it, expect } from 'vitest';
import { 
  batchesData, 
  getBatchById, 
  getBatchesByGrade, 
  getBatchesBySlot, 
  getBatchesFiltered,
  resolveBoardForBatch
} from '../src/data/batchesData';

describe('Batches Data and Flow Filters', () => {
  it('contains valid batch objects with all required enrollment properties', () => {
    expect(batchesData.length).toBeGreaterThanOrEqual(6);
    for (const b of batchesData) {
      expect(b.id).toBeDefined();
      expect(b.name).toBeDefined();
      expect(b.grade).toBeDefined();
      expect(b.board).toBeDefined();
      expect(b.timing).toBeDefined();
      expect(b.capacity).toBe(12);
      expect(b.monthlyFee).toBeGreaterThan(0);
      expect(b.seatsRemaining).toBeGreaterThanOrEqual(0);
      expect(b.subjects.length).toBeGreaterThan(0);
    }
  });

  it('retrieves specific batch by ID accurately', () => {
    const b10 = getBatchById('batch-10-state-board');
    expect(b10).not.toBeNull();
    expect(b10?.grade).toBe('Class 10');
    expect(b10?.board).toContain('State Board');

    const invalid = getBatchById('non-existent-batch-id');
    expect(invalid).toBeNull();
  });

  it('filters batches by grade correctly', () => {
    const class10Batches = getBatchesByGrade('Class 10');
    expect(class10Batches.length).toBeGreaterThanOrEqual(2);
    expect(class10Batches.every(b => b.grade.includes('Class 10'))).toBe(true);
  });

  it('filters batches by slot accurately', () => {
    const slot2Batches = getBatchesBySlot('slot-2');
    expect(slot2Batches.length).toBeGreaterThan(0);
    expect(slot2Batches.every(b => b.slotId === 'slot-2')).toBe(true);
  });

  it('filters batches multi-dimensionally by grade and board', () => {
    const cbse10 = getBatchesFiltered({ grade: 'Class 10', board: 'CBSE Board' });
    expect(cbse10.length).toBeGreaterThanOrEqual(1);
    expect(cbse10[0].board).toContain('CBSE');
    expect(cbse10[0].grade).toContain('10');
  });

  it('filters middle school batches across Class 6, 7, and 8', () => {
    const c6 = getBatchesFiltered({ grade: 'Class 6', board: 'all' });
    const c7 = getBatchesFiltered({ grade: 'Class 7', board: 'all' });
    const c8 = getBatchesFiltered({ grade: 'Class 8', board: 'all' });
    expect(c6.length).toBeGreaterThan(0);
    expect(c7.length).toBeGreaterThan(0);
    expect(c8.length).toBeGreaterThan(0);
    expect(c6[0].id).toBe('batch-middle-foundation');
  });

  it('accurately preserves student chosen board during batch selection', () => {
    const multiBatch = getBatchById('batch-12-science-board');
    expect(multiBatch).not.toBeNull();

    const stateResolved = resolveBoardForBatch(multiBatch, 'TN State Board (Samacheer)');
    expect(stateResolved).toBe('TN State Board (Samacheer)');

    const cbseResolved = resolveBoardForBatch(multiBatch, 'CBSE Board');
    expect(cbseResolved).toBe('CBSE Board');

    const icseResolved = resolveBoardForBatch(multiBatch, 'ICSE Board');
    expect(icseResolved).toBe('ICSE Board');
  });
});
