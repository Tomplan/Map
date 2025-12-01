// Centralized Jest mock implementation for supabaseClient
// Exports:
// - supabase: the mock client used by tests
// - __setQueryResponse(table, method, result): configure chained responses for a table
// - __resetMocks(): reset configured responses to defaults

let configured = {}

function reset() {
  configured = {}
}

function setQueryResponse(table, method, value) {
  configured[table] = configured[table] || {}
  configured[table][method] = value
}

function getQueryResponse(table, method) {
  const tableCfg = configured[table] || {}
  return tableCfg[method]
}

function makeChain(table) {
  return {
    select() {
      const selectCfg = getQueryResponse(table, 'select')
      if (selectCfg === undefined) {
        return {
          in: () => Promise.resolve({ data: getQueryResponse(table, 'in') || [], error: null }),
          eq: () => ({ single: () => Promise.resolve({ data: getQueryResponse(table, 'eq') || [], error: null }) }),
          gt: () => ({ single: () => Promise.resolve({ data: getQueryResponse(table, 'gt') || { count: 0 }, error: null }) }),
          single: () => Promise.resolve({ data: getQueryResponse(table, 'single') || null, error: null }),
        }
      }
      return selectCfg
    },
    // Some call sites use eq/in directly on the returned object rather than via select()
    eq() { return Promise.resolve({ data: getQueryResponse(table, 'eq') || [], error: null }) },
    in() { return Promise.resolve({ data: getQueryResponse(table, 'in') || [], error: null }) },
    single() { return Promise.resolve({ data: getQueryResponse(table, 'single') || null, error: null }) },
  }
}

const supabase = {
  from(table) {
    // return a chainable object, but allow tests to set custom responses
    const selectCfg = getQueryResponse(table, 'select')
    if (selectCfg) return selectCfg
    return makeChain(table)
  },
  channel() {
    // Provide a simple channel with on(...).subscribe() chain
    return {
      on() {
        return { subscribe() { return { unsubscribe() {}, then() {} } } }
      }
    }
  },
  removeChannel() {
    return true
  },
  storage: {
    from() {
      return { upload: async () => ({ data: null, error: null }) }
    }
  },
  auth: {
    signIn: async () => ({ data: null, error: null })
  }
}

module.exports = {
  supabase,
  __setQueryResponse: setQueryResponse,
  __resetMocks: reset
}
