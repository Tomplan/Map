import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// using the service role key to bypass RLS for DDL ops via postgres direct connection doesn't work through REST API directly unless we have a specific RPC.
