/**
 * Clear Supabase auth data from localStorage
 *
 * Run this in browser console if auth is hanging:
 * import { clearSupabaseAuth } from './utils/clearSupabaseAuth'
 * clearSupabaseAuth()
 *
 * Or directly in console:
 * localStorage.removeItem('supabase.auth.token')
 * window.location.reload()
 */
export function clearSupabaseAuth() {
  console.log('Clearing Supabase auth data...');

  // Clear all Supabase auth keys
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('supabase.auth')) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach(key => {
    console.log(`Removing: ${key}`);
    localStorage.removeItem(key);
  });

  console.log('Auth data cleared. Reloading page...');
  window.location.reload();
}

// Make it available globally for console debugging
if (typeof window !== 'undefined') {
  window.clearSupabaseAuth = clearSupabaseAuth;
}
