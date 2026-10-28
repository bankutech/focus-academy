const MAX_FUNNEL_STEP = 4;
const SYNC_TIMEOUT_MS = 6000;

export const SessionAuthService = {
  async syncStep(step, flow, applicationId) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SYNC_TIMEOUT_MS);
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step,
          applicationId,
          studentName: flow.studentName,
          phone: flow.phone,
          grade: flow.grade,
          board: flow.board,
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.token) {
        const error = new Error(data.error || 'We could not verify your admission progress. Please try again.');
        error.status = response.status;
        throw error;
      }
      return { applicationId: data.applicationId, stepToken: data.token, step: data.step };
    } catch (err) {
      clearTimeout(timer);
      if (err?.name === 'AbortError') {
        const timeoutError = new Error('Session verification took too long to respond. Please try again.');
        timeoutError.status = 504;
        throw timeoutError;
      }
      throw err;
    }
  },

  async syncUpTo(targetStep, flow) {
    const target = Math.min(Number(targetStep) || 1, MAX_FUNNEL_STEP);
    const cleanPhone = String(flow.phone || '').replace(/\D/g, '').slice(-10);
    const cleanName = String(flow.studentName || '').toLowerCase().trim();
    const currentIdentity = `${cleanPhone}::${cleanName}`;
    const samePerson = flow.syncedIdentity ? flow.syncedIdentity === currentIdentity : (flow.syncedPhone === cleanPhone && flow.syncedName === cleanName);
    let applicationId = samePerson ? flow.applicationId : undefined;
    let current = samePerson ? Number(flow.syncedStep) || 1 : 1;
    let result = { applicationId, stepToken: samePerson ? flow.stepToken : undefined, step: current };
    let hasRecovered = false;
    while (current < target) {
      try {
        result = await this.syncStep(current + 1, flow, applicationId);
        applicationId = result.applicationId;
        current = result.step;
      } catch (err) {
        if (applicationId && !hasRecovered && (err.status === 403 || err.status === 409)) {
          hasRecovered = true;
          applicationId = undefined;
          current = 1;
          continue;
        }
        throw err;
      }
    }
    return {
      applicationId: result.applicationId,
      stepToken: result.stepToken,
      syncedStep: current,
      syncedPhone: cleanPhone,
      syncedName: cleanName,
      syncedIdentity: currentIdentity,
    };
  },
};
