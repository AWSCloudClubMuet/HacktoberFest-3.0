export function createRateLimiter({ max, windowMs }) {
  const attempts = new Map();

  function recent(key) {
    const now = Date.now();
    const list = (attempts.get(key) || []).filter((time) => now - time < windowMs);
    if (list.length) attempts.set(key, list);
    else attempts.delete(key);
    return list;
  }

  return {
    isBlocked: (key) => recent(key).length >= max,
    record(key) {
      const list = recent(key);
      list.push(Date.now());
      attempts.set(key, list);
    },
    clear: (key) => attempts.delete(key),
  };
}
