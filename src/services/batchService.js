let memoryCache = null;
let lastFetchedAt = 0;
const CACHE_TTL_MS = 60000;
const FETCH_TIMEOUT_MS = 6000;

const PARENT_FRIENDLY = (fallback) => ({
  network: 'We could not reach the campus server. Please check your connection and try again.',
  unavailable: 'Live seat information is temporarily unavailable. Please call the campus desk on +91 98424 51220 to confirm availability.',
  notFound: 'This batch is no longer open for online booking. Please call the campus desk or choose another evening slot.',
  full: 'This batch has reached its 12-student limit. Please choose another evening slot or join the waitlist.',
  rejected: fallback || 'We could not complete the reservation. Please call the campus desk on +91 98424 51220.',
});

const mapServerError = (status, serverMessage) => {
  if (status === 404) return PARENT_FRIENDLY().notFound;
  if (status === 409) return PARENT_FRIENDLY().full;
  if (status === 401 || status === 403) return PARENT_FRIENDLY('Your admission session expired. Please go back a step and continue.');
  if (status === 422) return serverMessage || PARENT_FRIENDLY();
  return serverMessage || PARENT_FRIENDLY().rejected;
};

export const BatchService = {
  async getBatches() {
    const now = Date.now();
    if (memoryCache && now - lastFetchedAt < CACHE_TTL_MS) {
      return { batches: memoryCache, status: 'live', stale: false };
    }

    let response;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      response = await fetch('/api/batches', { signal: controller.signal });
      clearTimeout(timer);
    } catch {
      return { batches: [], status: 'unavailable', stale: false, error: PARENT_FRIENDLY().network };
    }

    if (!response.ok) {
      return { batches: [], status: 'unavailable', stale: false, error: PARENT_FRIENDLY().unavailable };
    }

    let payload;
    try {
      payload = await response.json();
    } catch {
      return { batches: [], status: 'unavailable', stale: false, error: PARENT_FRIENDLY().unavailable };
    }

    if (!payload || !Array.isArray(payload.batches)) {
      return { batches: [], status: 'unavailable', stale: false, error: PARENT_FRIENDLY().unavailable };
    }

    memoryCache = payload.batches;
    lastFetchedAt = now;
    return { batches: payload.batches, status: 'live', stale: false };
  },

  clearCache() {
    memoryCache = null;
    lastFetchedAt = 0;
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
    let response;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      response = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId,
          studentName: details.studentName,
          phone: details.phone,
          grade: details.grade,
          board: details.board,
          stepToken: details.stepToken,
          allowWaitlist: Boolean(details.allowWaitlist)
        }),
        signal: controller.signal
      });
      clearTimeout(timer);
    } catch {
      return { success: false, error: PARENT_FRIENDLY().network, retryable: true };
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        success: false,
        error: mapServerError(response.status, data.error),
        canWaitlist: Boolean(data.canWaitlist),
        retryable: response.status >= 500 || response.status === 0
      };
    }

    if (!data.success) {
      return { success: false, error: mapServerError(response.status, data.error) };
    }

    return {
      success: true,
      reservationId: data.reservationId,
      waitlisted: Boolean(data.waitlisted),
      waitlistPosition: data.waitlistPosition,
      seatsRemaining: data.seatsRemaining
    };
  }
};
