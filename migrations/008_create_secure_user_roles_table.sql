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

-- Policy: Only super_admins can insert/update/delete roles
CREATE POLICY "Super admins can manage roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- Migrate existing roles from user_metadata to user_roles table
-- This is a one-time migration - run manually for each user
-- Example: INSERT INTO public.user_roles (user_id, role) VALUES ('user-uuid-here', 'super_admin');

-- You'll need to manually insert your super_admin user:
-- Go to Supabase Dashboard > Authentication > Users
-- Copy your user UUID
-- Then run: INSERT INTO public.user_roles (user_id, role) VALUES ('YOUR-UUID-HERE', 'super_admin');
