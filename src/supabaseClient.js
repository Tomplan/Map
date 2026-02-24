import { createClient } from '@supabase/supabase-js';

// Safely obtain Vite environment values when available, and fall back to
// process.env for tests/Node. We avoid direct top-level `import.meta` usage so
// Jest (CommonJS) doesn't fail parsing the file.
// Prefer browser build-time env (Vite -> `import.meta.env`) when available.
// Fall back to process.env for Node (tests/CI).
// Prefer runtime-provided global bridge (set in `src/main.jsx` by Vite) so
// this file avoids referencing `import.meta` directly (which confuses Jest
// in some environments). Tests/Node can still provide values via process.env.
let env = {};
if (
  typeof globalThis !== 'undefined' &&
  globalThis.__SUPABASE_CONFIG__ &&
  Object.keys(globalThis.__SUPABASE_CONFIG__).length
) {
  env = globalThis.__SUPABASE_CONFIG__;
} else if (typeof globalThis !== 'undefined' && typeof __VITE_SUPABASE_URL__ !== 'undefined') {
  // Vite define() injected tokens (compile-time replacements) may be
  // present as globals (for preview/prod). Use them if available.
  env = {
    VITE_SUPABASE_URL:
      typeof __VITE_SUPABASE_URL__ !== 'undefined' ? __VITE_SUPABASE_URL__ : undefined,
    VITE_SUPABASE_ANON_KEY:
      typeof __VITE_SUPABASE_ANON_KEY__ !== 'undefined' ? __VITE_SUPABASE_ANON_KEY__ : undefined,
    VITE_ADMIN_EMAIL:
      typeof __VITE_ADMIN_EMAIL__ !== 'undefined' ? __VITE_ADMIN_EMAIL__ : undefined,
    VITE_ADMIN_PASSWORD:
      typeof __VITE_ADMIN_PASSWORD__ !== 'undefined' ? __VITE_ADMIN_PASSWORD__ : undefined,
  };
} else if (typeof process !== 'undefined' && process.env && Object.keys(process.env).length) {
  env = process.env;
} else {
  env = {};
}

// helpful runtime debug: show where we sourced the env values from
const envSource =
  typeof globalThis !== 'undefined' &&
  globalThis.__SUPABASE_CONFIG__ &&
  Object.keys(globalThis.__SUPABASE_CONFIG__).length
    ? 'globalThis.__SUPABASE_CONFIG__'
    : typeof globalThis !== 'undefined' && typeof __VITE_SUPABASE_URL__ !== 'undefined'
      ? '__VITE_DEFINE_GLOBALS__'
      : typeof process !== 'undefined' && process.env && Object.keys(process.env).length
        ? 'process.env'
        : 'none';

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

const isTestEnv =
  typeof process !== 'undefined' &&
  process.env &&
  (process.env.JEST_WORKER_ID !== undefined || process.env.NODE_ENV === 'test');

// Lazy-initialized supabase client. We create the client only when `getSupabase`
// is called which allows the app to delay expensive network/WS setups until a
// feature actually needs Supabase. Tests still get a deterministic mock client.
let _internalSupabase = null;

function makeChainable() {
  const api = {
    select() {
      return api;
    },
    in() {
      return api;
    },
    or() {
      return api;
    },
    eq() {
      return api;
    },
    order() {
      return api;
    },
    limit() {
      return api;
    },
    single() {
      return Promise.resolve({ data: null, error: null });
    },
    then(fn) {
      return Promise.resolve({ data: [] }).then(fn);
    },
  };
  return api;
}

function makeTestClient() {
  _internalSupabase = {
    from: function () {
      return makeChainable();
    },
    channel: function () {
      return (function () {
        const obj = {
          on() {
            return obj;
          },
          subscribe() {
            return obj;
          },
        };
        return obj;
      })();
    },
    removeChannel: function () {
      return true;
    },
    storage: {
      from: function () {
        return {
          upload: async function () {
            return { data: null, error: null };
          },
        };
      },
    },
    auth: {
      signIn: async function () {
        return { data: null, error: null };
      },
    },
    // Add getUser to match Supabase client API used by hooks/tests
    auth: {
      signIn: async function () {
        return { data: null, error: null };
      },
      getUser: async function () {
        return { data: { user: null }, error: null };
      },
      getSession: async function () {
        return { data: { session: null }, error: null };
      },
      onAuthStateChange: function () {
        return { data: { subscription: { unsubscribe() {} } } };
      },
    },
  };
  return _internalSupabase;
}

function makeRuntimeFallback() {
  _internalSupabase = {
    from: function () {
      return makeChainable();
    },
    channel: function () {
      const obj = {
        on() {
          return obj;
        },
        subscribe() {
          return obj;
        },
        unsubscribe() {},
      };
      return obj;
    },
    removeChannel: function () {
      return true;
    },
    storage: {
      from: function () {
        return {
          upload: async function () {
            return { data: null, error: new Error('Supabase storage not configured') };
          },
        };
      },
    },
    auth: {
      getSession: async function () {
        return { data: { session: null }, error: null };
      },
      onAuthStateChange: function (cb) {
        return { data: { subscription: { unsubscribe() {} } } };
      },
      getUser: async function () {
        return { data: { user: null }, error: null };
      },
      signInWithPassword: async function () {
        console.warn(
          'Supabase auth called but Supabase is not configured. Returning no-op error from signInWithPassword.',
        );
        return { data: null, error: new Error('Supabase auth not configured') };
      },
      signIn: async function () {
        console.warn('Supabase auth.signIn called but Supabase is not configured.');
        return { data: null, error: new Error('Supabase auth not configured') };
      },
    },
  };
  return _internalSupabase;
}

function createRuntimeClient() {
  _internalSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storageKey: 'supabase.auth.token',
      storage: window.localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  if (!isTestEnv && typeof globalThis !== 'undefined') {
    try {
      globalThis.__supabase_client__ = _internalSupabase;
    } catch (e) {
      // ignore failures to set global
    }
  }

  return _internalSupabase;
}

export function getSupabase() {
  if (_internalSupabase) return _internalSupabase;

  if (isTestEnv) return makeTestClient();

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      'Supabase is not configured: missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Falling back to a non-operational supabase client. (env source: ' +
        envSource +
        ')',
    );
    return makeRuntimeFallback();
  }

  return createRuntimeClient();
}

// Export a proxy so existing `import { supabase }` call sites continue to work
// and will lazily initialize the client when first used.
export const supabase = new Proxy(
  {},
  {
    get(_, prop) {
      const client = getSupabase();
      // Return bound functions where appropriate
      const value = client[prop];
      if (typeof value === 'function') return value.bind(client);
      return value;
    },
    set(_, prop, val) {
      const client = getSupabase();
      client[prop] = val;
      return true;
    },
  },
);

// Export a tiny helper so unit tests can verify where the runtime env
// was detected without the tests having to inspect private variables.
// This helps protect against regressions where the runtime bridge or
// define-globals get removed accidentally.
export function __getSupabaseRuntimeInfo() {
  return {
    envSource,
    supabaseUrl: supabaseUrl || null,
    supabaseAnonKey: supabaseAnonKey || null,
  };
}
