import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase1 = createClient(supabaseUrl, supabaseKey);
const supabase2 = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Client 1 with key user_1
  const c1 = supabase1.channel('global_visitors', { config: { presence: { key: 'user_1' } } });
  
  // Client 2 with key user_2
  const c2 = supabase2.channel('global_visitors', { config: { presence: { key: 'user_2' } } });

  c1.on('presence', { event: 'sync' }, () => {
    const state = c1.presenceState();
    console.log('[Client 1 Sync Event] state keys:', Object.keys(state).length);
    let admins = [];
    Object.entries(state).forEach(([k, p]) => {
      if (p[0].is_admin) admins.push(p[0].email);
    });
    console.log('[Client 1 Sync Event] Admins array:', admins);
    
    // Test the uniqueAdmin deduplication logic we placed into useVisitorPresence.js manually here:
    // This is EXACTLY how it is running in Map right now:
    const uniqueAdminsByEmail = Array.from(new Map(admins.map(a => [a, { email: a }])).values());
    console.log('[Client 1 Sync Event] UNIQUE Admin Count:', uniqueAdminsByEmail.length);
    console.log('----------------');
  });

  console.log('Connecting Client 1...');
  c1.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      console.log('Client 1 joined, tracking...');
      await c1.track({ is_admin: true, email: 'admin_one@test.com' });
    }
  });

  setTimeout(() => {
    console.log('Connecting Client 2 with completely different email...');
    c2.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Client 2 joined, tracking...');
        await c2.track({ is_admin: true, email: 'admin_TWO@test.com' });
      }
    });
  }, 1000);
  
  // Wait a few seconds then kill it
  setTimeout(() => process.exit(0), 4000);
}
run();
