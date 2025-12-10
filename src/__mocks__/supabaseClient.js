// Centralized Jest mock implementation for supabaseClient
// Exports:
// - supabase: the mock client used by tests
// - __setQueryResponse(table, method, result): configure chained responses for a table
// - __resetMocks(): reset configured responses to defaults

let configured = {};

function reset() {
  configured = {};
}

function setQueryResponse(table, method, value) {
  configured[table] = configured[table] || {};
  configured[table][method] = value;
}

function getQueryResponse(table, method) {
  const tableCfg = configured[table] || {};
  return tableCfg[method];
}

function makeChain(table) {
  // Fully chainable API: select().in().eq().single(), etc.
  // Each method returns the same chain object unless it's expected
  // to resolve to final data (eq()/single()/then()). This mirrors
  // the Supabase client shape used by components and avoids
  // tests receiving Promises where chainable objects are expected.
  const chain = {
    select() {
      return chain;
    },
    in() {
      return chain;
    },
    or() {
      return chain;
    },
    order() {
      return chain;
    },
    limit() {
      return chain;
    },
    // eq() is chainable; .single() or .then() will return configured values
    eq() {
      return chain;
    },
    // sometimes tests call gt().single() or similar
    gt() {
      return chain;
    },
    or() {
      return chain;
    },
    single() {
      const payload =
        getQueryResponse(table, 'single') ??
        getQueryResponse(table, 'eq') ??
        getQueryResponse(table, 'select') ??
        null;
      return Promise.resolve({ data: payload, error: null });
    },
    // support .then so code that awaits the chain will receive configured data
    then(fn) {
      const payload =
        getQueryResponse(table, 'select') ??
        getQueryResponse(table, 'eq') ??
        getQueryResponse(table, 'in') ??
        [];
      return Promise.resolve({ data: payload, error: null }).then(fn);
    },
    catch() {
      return Promise.resolve({
        data: getQueryResponse(table, 'select') ?? getQueryResponse(table, 'eq') ?? [],
        error: null,
      });
    },
  };

  // If tests configured a custom select response object, prefer it.
  const selectCfg = getQueryResponse(table, 'select');
  if (selectCfg !== undefined) {
    // If the configured value is a function/object that already mimics the
    // supabase chain, return it directly; otherwise, let our chain use the
    // configured data on terminal methods (.then/.eq/.single).
    if (typeof selectCfg === 'object' || typeof selectCfg === 'function') return selectCfg;
  }

  return chain;
}

const supabase = {
  from(table) {
    // return a chainable object, but allow tests to set custom responses
    // When tests configure 'select' they are typically configuring the
    // *result of calling .select()*, so we need to return an object with
    // a .select() method that returns that configured value.
    const selectCfg = getQueryResponse(table, 'select');
    if (selectCfg !== undefined) {
      // If the configured value already mimics the full chain return shape
      // (i.e., has a .select function) return it directly
      if (selectCfg && typeof selectCfg.select === 'function') return selectCfg;

      // Otherwise, wrap the configured result so callers can call .select()
      // and receive the configured value
      return {
        select(...args) {
          // If tests provided a function as selectCfg, call it with args
          if (typeof selectCfg === 'function') return selectCfg(...args);
          return selectCfg;
        },
      };
    }

    return makeChain(table);
  },
  channel() {
    // Provide a simple channel with on(...).subscribe() chain
    return {
      on() {
        return {
          subscribe() {
            return { unsubscribe() {}, then() {} };
          },
        };
      },
    };
  },
  removeChannel() {
    return true;
  },
  storage: {
    from() {
      return { upload: async () => ({ data: null, error: null }) };
    },
  },
  auth: {
    signIn: async () => ({ data: null, error: null }),
    // Also support the newer supabase auth method used in app code
    signInWithPassword: async (payload) => ({ data: { user: null, session: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: (_cb) => ({ data: { subscription: { unsubscribe() {} } } }),
  },
};

module.exports = {
  supabase,
  __setQueryResponse: setQueryResponse,
  __resetMocks: reset,
};
