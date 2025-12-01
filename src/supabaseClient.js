import { createClient } from '@supabase/supabase-js'

// Safely obtain Vite environment values when available, and fall back to
// process.env for tests/Node. We avoid direct top-level `import.meta` usage so
// Jest (CommonJS) doesn't fail parsing the file.
let env = {}
if (typeof process !== 'undefined' && process.env && Object.keys(process.env).length) {
  env = process.env
} else {
  try {
    // Attempt to read import.meta.env at runtime (works inside Vite-built ESM).
    // Use indirect eval so bundlers don't statically parse `import.meta` here.
    // If this platform doesn't support `import.meta`, the eval will throw and
    // we fall back to an empty object.
    // eslint-disable-next-line no-eval
    env = (0, eval)('import.meta.env') || {}
  } catch (e) {
    env = {}
  }
}

const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY

const isTestEnv = typeof process !== 'undefined' && process.env && (process.env.JEST_WORKER_ID !== undefined || process.env.NODE_ENV === 'test')

let supabase

if (isTestEnv) {
  // shallow, resilient mock for unit tests. Provide simple chainable methods
  // used in tests to avoid network calls and keep tests deterministic.
  const chainable = () => {
    const api = {
      select() { return api },
      in() { return api },
      eq() { return Promise.resolve({ data: [], error: null }) },
      order() { return api },
      limit() { return api },
      single() { return Promise.resolve({ data: null, error: null }) },
      then(fn) { return Promise.resolve({ data: [] }).then(fn) },
    }
    return api
  }

  supabase = {
    from: function () { return chainable() },
    channel: function () { return { on: function () { return { subscribe: function () { return {} } } } } },
    removeChannel: function () { return true },
    storage: { from: function () { return { upload: async function () { return { data: null, error: null } } } } },
    auth: { signIn: async function () { return { data: null, error: null } } },
  }

} else {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
    )
  }

  supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist session in localStorage (default, but explicit for clarity)
    storageKey: 'supabase.auth.token',
    storage: window.localStorage,
    // Auto-refresh tokens before they expire
    autoRefreshToken: true,
    // Persist session across browser restarts
    persistSession: true,
    // Detect session in URL (for password reset, email confirmation)
    detectSessionInUrl: true,
  },
  });
}

export { supabase }
