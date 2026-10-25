const todayKey = () => new Date().toISOString().split('T')[0];

const balanceOf = (o) => Math.max(0, Number(o.amountDue || 0) - Number(o.amountPaid || 0) - Number(o.waivedAmount || 0));

export const feeStatusBreakdown = (obligations = []) => {
  const today = todayKey();
  const totals = { paid: 0, partial: 0, pending: 0, overdue: 0, waived: 0 };
  obligations.forEach((o) => {
    if (o.status === 'cancelled') return;
    const balance = balanceOf(o);
    const paid = Number(o.amountPaid || 0);
    totals.waived += Number(o.waivedAmount || 0);
    totals.paid += paid;
    if (balance <= 0) return;
    if (o.dueDate && o.dueDate < today) totals.overdue += balance;
    else if (paid > 0) totals.partial += balance;
    else totals.pending += balance;
  });
  return [
    { label: 'Collected', value: totals.paid, color: '#059669' },
    { label: 'Partly paid, balance', value: totals.partial, color: '#D97706' },
    { label: 'Pending', value: totals.pending, color: '#0F172A' },
    { label: 'Overdue', value: totals.overdue, color: '#E11D48' },
    { label: 'Waived', value: totals.waived, color: '#94A3B8' },
  ];
};

export const batchOccupancy = (batches = []) =>
  batches
    .filter((b) => !b.isArchived)
    .map((b) => {
      const capacity = Number(b.capacity) || 12;
      const enrolled = Number(b.enrolledCount) || 0;
      const ratio = enrolled / capacity;
      return {
        label: String(b.name || b.id).replace(/\s*-\s*.*$/, '').replace(/^Class\s/, 'C'),
        fullLabel: b.name,
        value: enrolled,
        max: capacity,
        color: ratio >= 1 ? '#E11D48' : ratio >= 0.75 ? '#EA580C' : '#0F172A',
        sub: `${enrolled}/${capacity}`,
      };
    });

export const monthlyCollections = (payments = [], months = 6, now = new Date()) => {
  const buckets = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleString('en-IN', { month: 'short' }),
      value: 0,
    });
  }
  payments.forEach((p) => {
    if (p.isReversed || p.reversed) return;
    const bucket = buckets.find((b) => String(p.paymentDate || '').startsWith(b.key));
    if (bucket) bucket.value += Number(p.amount || 0);
  });
  return buckets.map((b, i) => ({ ...b, color: i === buckets.length - 1 ? '#EA580C' : '#0F172A' }));
};

const METHOD_COLORS = { cash: '#059669', upi: '#EA580C', bank_transfer: '#0F172A', cheque: '#D97706', card: '#64748B' };

export const paymentMethodSplit = (payments = []) => {
  const totals = {};
  payments.forEach((p) => {
    if (p.isReversed || p.reversed) return;
    const key = String(p.paymentMethod || 'cash').toLowerCase();
    totals[key] = (totals[key] || 0) + Number(p.amount || 0);
  });
  return Object.entries(totals).map(([key, value]) => ({
    label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    value,
    color: METHOD_COLORS[key] || '#94A3B8',
  }));
};

export const studentsByGrade = (students = []) => {
  const totals = {};
  students.forEach((s) => {
    if (s.status && s.status !== 'active') return;
    const key = s.grade || 'Unassigned';
    totals[key] = (totals[key] || 0) + 1;
  });
  const order = (g) => {
    const n = parseInt(String(g).replace(/\D/g, ''), 10);
    return Number.isNaN(n) ? 99 : n;
  };
  return Object.entries(totals)
    .sort((a, b) => order(a[0]) - order(b[0]))
    .map(([label, value]) => ({ label: label.replace('Classes ', 'C'), fullLabel: label, value, color: '#0F172A' }));
};

export const outstandingByBatch = (obligations = [], batches = []) => {
  const names = new Map(batches.map((b) => [b.id, String(b.name || b.id).replace(/\s*-\s*.*$/, '')]));
  const totals = new Map();
  obligations.forEach((o) => {
    if (o.status === 'cancelled') return;
    const balance = balanceOf(o);
    if (balance > 0) totals.set(o.batchId, (totals.get(o.batchId) || 0) + balance);
  });
  return [...totals.entries()]
    .map(([id, value]) => ({ label: (names.get(id) || id).replace(/^Class\s/, 'C'), fullLabel: names.get(id) || id, value, color: '#E11D48' }))
    .sort((a, b) => b.value - a.value);
};

export const rupees = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
