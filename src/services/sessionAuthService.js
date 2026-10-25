const MAX_FUNNEL_STEP = 4;

export const SessionAuthService = {
  async syncStep(step, flow, applicationId) {
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
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.token) {
      const error = new Error(data.error || 'We could not verify your admission progress. Please try again.');
      error.status = response.status;
      throw error;
    }
    return { applicationId: data.applicationId, stepToken: data.token, step: data.step };
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
    while (current < target) {
      result = await this.syncStep(current + 1, flow, applicationId);
      applicationId = result.applicationId;
      current = result.step;
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
