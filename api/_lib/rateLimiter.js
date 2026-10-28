const requestBuckets = new Map();

export const checkRateLimit = (ip, limit = 60, windowMs = 60000) => {
  const now = Date.now();
  const cleanKey = String(ip || 'unknown').trim();
  const bucket = requestBuckets.get(cleanKey);

  if (!bucket || now - bucket.startTime > windowMs) {
    requestBuckets.set(cleanKey, { count: 1, startTime: now });
    return { allowed: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count };
};

export const resetRateLimit = () => {
  requestBuckets.clear();
};
