import { BATCHES_DATA } from '../data/batchesData';

let memoryCache = null;
let lastFetchedAt = 0;
const CACHE_TTL_MS = 60000;

export const BatchService = {
  async getBatches() {
    const now = Date.now();
    if (memoryCache && (now - lastFetchedAt < CACHE_TTL_MS)) {
      return memoryCache;
    }

    try {
      const response = await fetch('/api/batches');
      if (!response.ok) {
        return BATCHES_DATA;
      }
      const data = await response.json();
      if (data && Array.isArray(data.batches) && data.batches.length > 0) {
        memoryCache = data.batches;
        lastFetchedAt = now;
        return data.batches;
      }
      return BATCHES_DATA;
    } catch {
      return BATCHES_DATA;
    }
  },

  async reserveSeat(batchId) {
    try {
      const response = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId })
      });
      if (!response.ok) return false;
      const res = await response.json();
      return Boolean(res.success);
    } catch {
      return false;
    }
  },

  async reserveSeatWithDetails(batchId, details = {}) {
    try {
      const response = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId,
          studentName: details.studentName,
          phone: details.phone,
          grade: details.grade,
          board: details.board
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return {
          success: false,
          error: data.error || `Reservation rejected with HTTP ${response.status}`
        };
      }
      return {
        success: Boolean(data.success),
        reservationId: data.reservationId,
        seatsRemaining: data.seatsRemaining
      };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Network error communicating with batch server'
      };
    }
  }
};
