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

let supabase;

if (isTestEnv) {
  // shallow, resilient mock for unit tests. Provide simple chainable methods
  // used in tests to avoid network calls and keep tests deterministic.
  const chainable = () => {
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
  };

  supabase = {
    from: function () {
      return chainable();
    },
    channel: function () {
      // Chainable channel mock for tests: supports .on(...).on(...).subscribe()
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
  };
} else {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Don't throw in runtime — many development environments (or CI) may not
    // have Supabase creds available. Export a resilient no-op client instead
    // so the app can still run, and features that require Supabase will
    // behave gracefully. This prevents uncaught runtime errors in the browser.
    //
    // If you do need a working Supabase client for local development, set
    // VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in a `.env` or
    // `.env.local` file at the project root. Example:
    //
    // VITE_SUPABASE_URL=https://xxxx.supabase.co
    // VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key
    console.warn(
      'Supabase is not configured: missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Falling back to a non-operational supabase client. (env source: ' +
        envSource +
        ')',
    );

    // Minimal graceful fallback used at runtime when configured values are missing
    const chainable = () => {
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
          return Promise.resolve({ data: null, error: null }).then(fn);
        },
      };
      return api;
    };

    supabase = {
      from: function () {
        return chainable();
      },
      channel: function () {
        // Graceful chainable runtime fallback for environments without a working supabase
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
        // Provide modern supabase-js methods used by app UI. When missing
        // runtime credentials are present we keep these no-op and return
        // informative errors so callers can handle the situation gracefully.
        signInWithPassword: async function () {
          console.warn(
            'Supabase auth called but Supabase is not configured. Returning no-op error from signInWithPassword.',
          );
          return { data: null, error: new Error('Supabase auth not configured') };
        },
        // Some older call sites use `signIn` historically; keep an alias
        signIn: async function () {
          console.warn('Supabase auth.signIn called but Supabase is not configured.');
          return { data: null, error: new Error('Supabase auth not configured') };
        },
      },
    };
  } else {
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

    // Expose a dev-only global for interactive debugging in the browser
    // so developers can run `window.__supabase_client__` in DevTools.
    // Only expose when not running tests.
    if (!isTestEnv && typeof globalThis !== 'undefined') {
      try {
        globalThis.__supabase_client__ = supabase;
      } catch (e) {
        // ignore failures to set global
      }
    }
  }
}

export { supabase };

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
