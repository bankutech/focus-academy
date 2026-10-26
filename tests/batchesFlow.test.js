import { describe, it, expect } from 'vitest';
import { 
  batchesData, 
  getBatchById, 
  getBatchesByGrade, 
  getBatchesBySlot, 
  getBatchesFiltered,
  resolveBoardForBatch,
  isBatchRecommendedForTrack
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

  it('verifies Class 10 Foundation Olympiad and Class 12 NEET/JEE batches exist with proper configuration', () => {
    const olympiadBatch = getBatchById('batch-10-foundation-olympiad');
    expect(olympiadBatch).not.toBeNull();
    expect(olympiadBatch?.grade).toBe('Class 10');
    expect(olympiadBatch?.capacity).toBe(12);
    expect(olympiadBatch?.slotId).toBe('slot-1');
    expect(olympiadBatch?.prepTrackId).toBe('foundation-olympiad');

    const neetJeeBatch = getBatchById('batch-12-neet-jee');
    expect(neetJeeBatch).not.toBeNull();
    expect(neetJeeBatch?.grade).toBe('Class 12');
    expect(neetJeeBatch?.capacity).toBe(12);
    expect(neetJeeBatch?.slotId).toBe('slot-3');
    expect(neetJeeBatch?.prepTrackId).toBe('neet-jee-foundations');
  });

  it('accurately identifies recommended batch based on student Step 2 exam prep track', () => {
    const bOlympiad = getBatchById('batch-10-foundation-olympiad');
    const bRemedial = getBatchById('batch-remedial-maths');
    const bSslcState = getBatchById('batch-10-state-board');
    const bSslcCbse = getBatchById('batch-10-cbse');
    const bSslcIcse = getBatchById('batch-10-icse');
    const bHsc = getBatchById('batch-12-science-board');
    const bNeetJee = getBatchById('batch-12-neet-jee');
    const bMiddle = getBatchById('batch-middle-foundation');

    expect(isBatchRecommendedForTrack(bOlympiad, 'foundation-olympiad', 'TN State Board (Samacheer)')).toBe(true);
    expect(isBatchRecommendedForTrack(bRemedial, 'foundation-olympiad', 'TN State Board (Samacheer)')).toBe(false);

    expect(isBatchRecommendedForTrack(bRemedial, 'concept-mastery', 'TN State Board (Samacheer)')).toBe(true);
    expect(isBatchRecommendedForTrack(bSslcState, 'concept-mastery', 'TN State Board (Samacheer)')).toBe(false);

    expect(isBatchRecommendedForTrack(bSslcState, 'sslc-95-plus', 'TN State Board (Samacheer)')).toBe(true);
    expect(isBatchRecommendedForTrack(bSslcCbse, 'sslc-95-plus', 'CBSE Board')).toBe(true);
    expect(isBatchRecommendedForTrack(bSslcIcse, 'sslc-95-plus', 'ICSE Board')).toBe(true);

    expect(isBatchRecommendedForTrack(bNeetJee, 'neet-jee-foundations', 'TN State Board (Samacheer)')).toBe(true);
    expect(isBatchRecommendedForTrack(bHsc, 'neet-jee-foundations', 'TN State Board (Samacheer)')).toBe(false);

    expect(isBatchRecommendedForTrack(bHsc, 'hsc-board-95', 'TN State Board (Samacheer)')).toBe(true);
    expect(isBatchRecommendedForTrack(bMiddle, 'middle-school-foundations', 'CBSE Board')).toBe(true);
  });

  it('supports recommendation fallback using examPrepTitle when examPrepId is omitted', () => {
    const bOlympiad = getBatchById('batch-10-foundation-olympiad');
    const bNeetJee = getBatchById('batch-12-neet-jee');
    const bRemedial = getBatchById('batch-remedial-maths');

    expect(isBatchRecommendedForTrack(bOlympiad, null, 'CBSE Board', 'Early Foundation (IIT / NEET Orientation)')).toBe(true);
    expect(isBatchRecommendedForTrack(bNeetJee, null, 'CBSE Board', 'NEET & JEE Main Integrated Numerical Focus')).toBe(true);
    expect(isBatchRecommendedForTrack(bRemedial, null, 'CBSE Board', 'Core Conceptual Foundations & Remedial Clinic')).toBe(true);
  });
});

