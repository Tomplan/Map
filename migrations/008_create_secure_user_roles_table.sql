-- Create secure user_roles table for RLS policies
-- This replaces using user_metadata which is editable by end users

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'system_manager', 'event_manager')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own role
CREATE POLICY "Users can read own role"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Authenticated users can insert (needed for first super_admin bootstrap)
-- After bootstrap, you can restrict this further
CREATE POLICY "Authenticated users can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Only the user themselves or service role can update
CREATE POLICY "Users can update own role via service"
ON public.user_roles
FOR UPDATE
USING (auth.uid() = user_id OR auth.jwt()->>'role' = 'service_role');

-- Policy: Only service role can delete
CREATE POLICY "Service role can delete"
ON public.user_roles
FOR DELETE
USING (auth.jwt()->>'role' = 'service_role');

-- Bootstrap: Insert your super_admin user
-- IMPORTANT: Replace 'YOUR-UUID-HERE' with your actual user UUID
-- Get your UUID from: Supabase Dashboard > Authentication > Users
-- Example: INSERT INTO public.user_roles (user_id, role) VALUES ('8782c8be-50de-4599-a96c-4cd824281ae5', 'super_admin');
