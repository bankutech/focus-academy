const CLIENT_SALT = 'fa-perambalur-admission-client-seed';
const CLIENT_TOKEN_TTL_MS = 2 * 60 * 60 * 1000;

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
  createClientStepToken(step, studentName = '', phone = '', ttlMs = CLIENT_TOKEN_TTL_MS) {
    const sanitizedPhone = String(phone).replace(/\D/g, '').slice(-10);
    const sanitizedName = String(studentName).trim();
    const timestamp = Date.now();
    const expiresAt = timestamp + ttlMs;
    const signature = computeSimpleHash(`${step}:${sanitizedPhone}:${sanitizedName}:${timestamp}:${expiresAt}:${CLIENT_SALT}`);
    return `v1.${step}.${timestamp}.${expiresAt}.${signature}`;
  },

  verifyClientStepToken(token, expectedStep, studentName = '', phone = '') {
    if (!token || typeof token !== 'string' || !token.startsWith('v1.')) {
      return false;
    }
    const parts = token.split('.');
    if (parts.length === 5) {
      const tokenStep = Number(parts[1]);
      const tokenTime = Number(parts[2]);
      const tokenExpiry = Number(parts[3]);
      const tokenSig = parts[4];

      if (Date.now() > tokenExpiry) {
        return false;
      }

      const sanitizedPhone = String(phone).replace(/\D/g, '').slice(-10);
      const sanitizedName = String(studentName).trim();
      const expectedSig = computeSimpleHash(`${tokenStep}:${sanitizedPhone}:${sanitizedName}:${tokenTime}:${tokenExpiry}:${CLIENT_SALT}`);
      return (tokenSig === expectedSig) && (tokenStep >= expectedStep);
    }

    if (parts.length === 4) {
      const tokenStep = Number(parts[1]);
      const tokenTime = Number(parts[2]);
      const tokenSig = parts[3];

      if (Date.now() - tokenTime > CLIENT_TOKEN_TTL_MS) {
        return false;
      }

      const sanitizedPhone = String(phone).replace(/\D/g, '').slice(-10);
      const sanitizedName = String(studentName).trim();
      const legacyExpected = computeSimpleHash(`${tokenStep}:${sanitizedPhone}:${sanitizedName}:${CLIENT_SALT}`);
      return (tokenSig === legacyExpected) && (tokenStep >= expectedStep);
    }

    return false;
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
