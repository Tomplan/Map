let suppressedUntil = 0;
let timeoutId = null;

export function suppressNextBackdropClick(durationMs = 300) {
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  suppressedUntil = now + durationMs;
  if (timeoutId) clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    suppressedUntil = 0;
    timeoutId = null;
  }, durationMs);
}

export function isBackdropClickSuppressed() {
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  return suppressedUntil > now;
}

export default { suppressNextBackdropClick, isBackdropClickSuppressed };
