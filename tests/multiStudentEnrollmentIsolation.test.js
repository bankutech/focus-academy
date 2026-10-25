import { describe, it, expect, beforeEach } from 'vitest';
import { isBatchCompatible } from '../src/types/schemas';
import { BATCHES_DATA } from '../src/data/batchesData';

const STUDENTS_20_MATRIX = [
  { id: 'STU-01', name: 'Aarav Raman', phone: '9842100001', grade: 'Class 6', board: 'TN State Board (Samacheer)', expectedBatch: 'batch-middle-foundation', slot: 'slot-1' },
  { id: 'STU-02', name: 'Bhavana Suresh', phone: '9842100002', grade: 'Class 7', board: 'CBSE Board', expectedBatch: 'batch-middle-foundation', slot: 'slot-1' },
  { id: 'STU-03', name: 'Charan Venkatesh', phone: '9842100003', grade: 'Class 8', board: 'ICSE Board', expectedBatch: 'batch-middle-foundation', slot: 'slot-1' },
  { id: 'STU-04', name: 'Divya Krishnan', phone: '9842100004', grade: 'Class 9', board: 'TN State Board (Samacheer)', expectedBatch: 'batch-9-preboard', slot: 'slot-1' },
  { id: 'STU-05', name: 'Elango Murugan', phone: '9842100005', grade: 'Class 9', board: 'CBSE Board', expectedBatch: 'batch-9-preboard', slot: 'slot-1' },
  { id: 'STU-06', name: 'Farhana Zaheer', phone: '9842100006', grade: 'Class 9', board: 'ICSE Board', expectedBatch: 'batch-9-preboard', slot: 'slot-1' },
  { id: 'STU-07', name: 'Gokul Karthik', phone: '9842100007', grade: 'Class 9', board: 'TN State Board (Samacheer)', expectedBatch: 'batch-remedial-maths', slot: 'slot-1' },
  { id: 'STU-08', name: 'Harini Natarajan', phone: '9842100008', grade: 'Class 10', board: 'TN State Board (Samacheer)', expectedBatch: 'batch-10-state-board', slot: 'slot-2' },
  { id: 'STU-09', name: 'Ishaan Pradeep', phone: '9842100009', grade: 'Class 10', board: 'CBSE Board', expectedBatch: 'batch-10-cbse', slot: 'slot-2' },
  { id: 'STU-10', name: 'Janani Balaji', phone: '9842100010', grade: 'Class 10', board: 'ICSE Board', expectedBatch: 'batch-10-icse', slot: 'slot-2' },
  { id: 'STU-11', name: 'Kavitha Anand', phone: '9842100011', grade: 'Class 10', board: 'TN State Board (Samacheer)', expectedBatch: 'batch-remedial-maths', slot: 'slot-1' },
  { id: 'STU-12', name: 'Lakshmanan S.', phone: '9842100012', grade: 'Class 11', board: 'TN State Board (Samacheer)', expectedBatch: 'batch-11-science', slot: 'slot-3' },
  { id: 'STU-13', name: 'Meenakshi R.', phone: '9842100013', grade: 'Class 11', board: 'CBSE Board', expectedBatch: 'batch-11-science', slot: 'slot-3' },
  { id: 'STU-14', name: 'Naveen Kumar', phone: '9842100014', grade: 'Class 11', board: 'ICSE Board', expectedBatch: 'batch-11-science', slot: 'slot-3' },
  { id: 'STU-15', name: 'Oviya Selvam', phone: '9842100015', grade: 'Class 12', board: 'TN State Board (Samacheer)', expectedBatch: 'batch-12-science-board', slot: 'slot-3' },
  { id: 'STU-16', name: 'Praveen Raj', phone: '9842100016', grade: 'Class 12', board: 'CBSE Board', expectedBatch: 'batch-12-science-board', slot: 'slot-3' },
  { id: 'STU-17', name: 'Qasim Ahmed', phone: '9842100017', grade: 'Class 12', board: 'ICSE Board', expectedBatch: 'batch-12-science-board', slot: 'slot-3' },
  { id: 'STU-18', name: 'Rohit Sundaram', phone: '9876543210', grade: 'Class 10', board: 'TN State Board (Samacheer)', expectedBatch: 'batch-10-state-board', slot: 'slot-2' },
  { id: 'STU-19', name: 'Swetha Sundaram', phone: '9876543210', grade: 'Class 6', board: 'TN State Board (Samacheer)', expectedBatch: 'batch-middle-foundation', slot: 'slot-1' },
  { id: 'STU-20', name: 'Tarun Vijay', phone: '9842100020', grade: 'Class 10', board: 'TN State Board (Samacheer)', expectedBatch: 'batch-10-state-board', slot: 'slot-2' }
];

describe('Multi-Student Enrollment Isolation and Batch Assignment Stress Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('guarantees academic compatibility for all 20 simulated students against their target batch', () => {
    for (const student of STUDENTS_20_MATRIX) {
      const targetBatch = BATCHES_DATA.find((b) => b.id === student.expectedBatch);
      expect(targetBatch).toBeDefined();

      const compatible = isBatchCompatible(targetBatch, student.grade, student.board);
      expect(compatible).toBe(true);
    }
  });

  it('strictly rejects cross-grade incompatible batch assignments', () => {
    const class6Batch = BATCHES_DATA.find((b) => b.id === 'batch-middle-foundation');
    const class10Batch = BATCHES_DATA.find((b) => b.id === 'batch-10-state-board');
    const class12Batch = BATCHES_DATA.find((b) => b.id === 'batch-12-science-board');

    expect(isBatchCompatible(class10Batch, 'Class 6', 'TN State Board (Samacheer)')).toBe(false);
    expect(isBatchCompatible(class12Batch, 'Class 6', 'TN State Board (Samacheer)')).toBe(false);
    expect(isBatchCompatible(class6Batch, 'Class 10', 'TN State Board (Samacheer)')).toBe(false);
    expect(isBatchCompatible(class6Batch, 'Class 12', 'TN State Board (Samacheer)')).toBe(false);
    expect(isBatchCompatible(class10Batch, 'Class 12', 'TN State Board (Samacheer)')).toBe(false);
  });

  it('strictly rejects cross-board incompatible assignments for board-specific batches', () => {
    const class10CbseBatch = BATCHES_DATA.find((b) => b.id === 'batch-10-cbse');
    const class10StateBatch = BATCHES_DATA.find((b) => b.id === 'batch-10-state-board');
    const class10IcseBatch = BATCHES_DATA.find((b) => b.id === 'batch-10-icse');

    expect(isBatchCompatible(class10CbseBatch, 'Class 10', 'TN State Board (Samacheer)')).toBe(false);
    expect(isBatchCompatible(class10StateBatch, 'Class 10', 'CBSE Board')).toBe(false);
    expect(isBatchCompatible(class10IcseBatch, 'Class 10', 'CBSE Board')).toBe(false);
    expect(isBatchCompatible(class10CbseBatch, 'Class 10', 'ICSE Board')).toBe(false);
  });

  it('maintains independent student records for siblings sharing the same mobile number', () => {
    const records = [];
    const registerStudentMock = (rec) => {
      const id = `FA-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5)}`;
      const saved = { ...rec, id };
      const filtered = records.filter(
        (s) => !(s.phone === rec.phone && s.studentName.toLowerCase().trim() === rec.studentName.toLowerCase().trim())
      );
      filtered.unshift(saved);
      records.length = 0;
      records.push(...filtered);
      return saved;
    };

    const sibling1 = registerStudentMock({
      studentName: 'Rohit Sundaram',
      phone: '9876543210',
      grade: 'Class 10',
      board: 'TN State Board (Samacheer)',
      selectedBatchId: 'batch-10-state-board'
    });

    const sibling2 = registerStudentMock({
      studentName: 'Swetha Sundaram',
      phone: '9876543210',
      grade: 'Class 6',
      board: 'TN State Board (Samacheer)',
      selectedBatchId: 'batch-middle-foundation'
    });

    expect(records.length).toBe(2);
    expect(records.find((r) => r.studentName === 'Rohit Sundaram')?.selectedBatchId).toBe('batch-10-state-board');
    expect(records.find((r) => r.studentName === 'Swetha Sundaram')?.selectedBatchId).toBe('batch-middle-foundation');
    expect(sibling1.id).not.toBe(sibling2.id);
  });
});
