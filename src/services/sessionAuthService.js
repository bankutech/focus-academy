const CLIENT_SALT = 'fa-perambalur-admission-client-seed';

function computeSimpleHash(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export const SessionAuthService = {
  createClientStepToken(step, studentName = '', phone = '') {
    const sanitizedPhone = String(phone).replace(/\D/g, '').slice(-10);
    const sanitizedName = String(studentName).trim();
    const timestamp = Date.now();
    const signature = computeSimpleHash(`${step}:${sanitizedPhone}:${sanitizedName}:${CLIENT_SALT}`);
    return `v1.${step}.${timestamp}.${signature}`;
  },

  verifyClientStepToken(token, expectedStep, studentName = '', phone = '') {
    if (!token || typeof token !== 'string' || !token.startsWith('v1.')) {
      return false;
    }
    const parts = token.split('.');
    if (parts.length !== 4) {
      return false;
    }
    const tokenStep = Number(parts[1]);
    const tokenSig = parts[3];
    const sanitizedPhone = String(phone).replace(/\D/g, '').slice(-10);
    const sanitizedName = String(studentName).trim();
    const expectedSig = computeSimpleHash(`${tokenStep}:${sanitizedPhone}:${sanitizedName}:${CLIENT_SALT}`);

    return (tokenSig === expectedSig) && (tokenStep >= expectedStep);
  },

  async requestServerStepToken(step, studentName = '', phone = '') {
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step, studentName, phone })
      });
      if (!response.ok) {
        return this.createClientStepToken(step, studentName, phone);
      }
      const data = await response.json();
      return data.token || this.createClientStepToken(step, studentName, phone);
    } catch {
      return this.createClientStepToken(step, studentName, phone);
    }
  }
};
