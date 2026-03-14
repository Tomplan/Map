require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data: user, error: authErr } = await supabase.auth.signInWithPassword({ email: 'organisatie@4x4vakantiebeurs.nl', password: 'password' }); // Wait, I don't know the password. I will use the service role key if it's in the env? Let's check env!
}
