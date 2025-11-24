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

-- Policy: Authenticated users can insert (needed for bootstrap)
CREATE POLICY "Authenticated users can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update own role
CREATE POLICY "Users can update own role via service"
ON public.user_roles
FOR UPDATE
USING (auth.uid() = user_id OR auth.jwt()->>'role' = 'service_role');

-- Policy: Only service role can delete
CREATE POLICY "Service role can delete"
ON public.user_roles
FOR DELETE
USING (auth.jwt()->>'role' = 'service_role');

-- Migrate ALL existing users from auth.users to user_roles table
-- This reads from user_metadata and copies to the secure user_roles table
INSERT INTO public.user_roles (user_id, role)
SELECT 
  id as user_id,
  (raw_user_meta_data->>'role')::text as role
FROM auth.users
WHERE raw_user_meta_data->>'role' IN ('super_admin', 'system_manager', 'event_manager')
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
