import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xtkbvnnkovogqwcwdhkg.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0a2J2bm5rb3ZvZ3F3Y3dkaGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMzg5ODEsImV4cCI6MjA3NjgxNDk4MX0.71MqQy05baMcDaGI5Xq_fUbcjgGvA0rjnNuXtacEwKs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
