import { supabase } from './src/supabaseClient.js';
console.log(await supabase.auth.getSession());
