import { supabase } from '../supabaseClient';

// One shared poller for all visitor-facing hooks: a single tiny request instead of a websocket per visitor.
const POLL_BASE_MS = 60 * 1000;
const POLL_JITTER_MS = 30 * 1000;
const FALLBACK_RELOAD_MS = 5 * 60 * 1000;
const READY_TIMEOUT_MS = 2000;

const listeners = new Set();
let started = false;
let timer = null;
let version = null;
let lastOkAt = 0;
let inFlight = false;
let readyPromise = Promise.resolve();

async function fetchVersion() {
  try {
    const { data, error } = await supabase
      .from('public_map_data_version')
      .select('version')
      .maybeSingle();
    if (error || data?.version == null) return null;
    return data.version;
  } catch {
    return null;
  }
}

function notify() {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch {
      // a failing listener must not block the others
    }
  });
}

async function check() {
  if (inFlight) return;
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

  inFlight = true;
  try {
    const next = await fetchVersion();
    const now = Date.now();
    if (next === null) {
      // Version table unavailable: fall back to a full reload every few minutes.
      if (now - lastOkAt >= FALLBACK_RELOAD_MS) {
        lastOkAt = now;
        notify();
      }
      return;
    }
    lastOkAt = now;
    const changed = version !== null && next !== version;
    version = next;
    if (changed) notify();
  } finally {
    inFlight = false;
  }
}

function schedule() {
  timer = setTimeout(
    async () => {
      await check();
      if (started) schedule();
    },
    POLL_BASE_MS + Math.random() * POLL_JITTER_MS,
  );
}

function handleVisibility() {
  if (document.visibilityState === 'visible') check();
}

function start() {
  started = true;
  version = null;
  lastOkAt = Date.now();
  // Baseline must be known before the first data load, otherwise a change in between is missed.
  readyPromise = Promise.race([
    fetchVersion().then((v) => {
      if (v !== null) {
        version = v;
        lastOkAt = Date.now();
      }
    }),
    new Promise((resolve) => setTimeout(resolve, READY_TIMEOUT_MS)),
  ]);
  schedule();
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibility);
  }
}

function stop() {
  started = false;
  clearTimeout(timer);
  timer = null;
  if (typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', handleVisibility);
  }
}

/**
 * Calls `onChange` whenever public map/program data changed (or periodically if the version
 * table is unreachable). `ready` resolves once the baseline version is known.
 */
export function subscribePublicDataVersion(onChange) {
  listeners.add(onChange);
  if (!started) start();
  return {
    ready: readyPromise,
    unsubscribe() {
      listeners.delete(onChange);
      if (listeners.size === 0) stop();
    },
  };
}
