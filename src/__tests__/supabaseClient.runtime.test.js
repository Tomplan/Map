/* eslint-env jest */
describe('supabaseClient runtime env detection', () => {
  const origNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    // cleanup globals and reset module cache
    delete global.__SUPABASE_CONFIG__;
    delete global.__VITE_SUPABASE_URL__;
    delete global.__VITE_SUPABASE_ANON_KEY__;
    process.env.NODE_ENV = origNodeEnv;
    jest.resetModules();
  });

  test('prefers globalThis.__SUPABASE_CONFIG__ when present', async () => {
    process.env.NODE_ENV = 'development';
    global.__SUPABASE_CONFIG__ = {
      VITE_SUPABASE_URL: 'https://bridge.example',
      VITE_SUPABASE_ANON_KEY: 'bridge-key',
    };

    // freshly import the module so it picks up the runtime globals
    const { __getSupabaseRuntimeInfo } = await import('../supabaseClient');
    const info = __getSupabaseRuntimeInfo();
    expect(info.envSource).toBe('globalThis.__SUPABASE_CONFIG__');
    expect(info.supabaseUrl).toBe('https://bridge.example');
    expect(info.supabaseAnonKey).toBe('bridge-key');
  });

  test('falls back to Vite define globals when bridge is absent', async () => {
    process.env.NODE_ENV = 'development';
    // Emulate Vite define() compiled globals available at runtime
    global.__VITE_SUPABASE_URL__ = 'https://vite-define.example';
    global.__VITE_SUPABASE_ANON_KEY__ = 'vite-key';

    const { __getSupabaseRuntimeInfo } = await import('../supabaseClient');
    const info = __getSupabaseRuntimeInfo();
    expect(info.envSource).toBe('__VITE_DEFINE_GLOBALS__');
    expect(info.supabaseUrl).toBe('https://vite-define.example');
    expect(info.supabaseAnonKey).toBe('vite-key');
  });

  test('falls back to process.env when no globals exist', async () => {
    process.env.NODE_ENV = 'development';
    process.env.VITE_SUPABASE_URL = 'https://process.example';
    process.env.VITE_SUPABASE_ANON_KEY = 'process-key';

    const { __getSupabaseRuntimeInfo } = await import('../supabaseClient');
    const info = __getSupabaseRuntimeInfo();
    expect(info.envSource).toBe('process.env');
    expect(info.supabaseUrl).toBe('https://process.example');
    expect(info.supabaseAnonKey).toBe('process-key');
  });
});
