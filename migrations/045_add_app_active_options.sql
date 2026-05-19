-- Add maintenance options to organization_profile
ALTER TABLE public.organization_profile 
ADD COLUMN IF NOT EXISTS is_app_active BOOLEAN DEFAULT false;

ALTER TABLE public.organization_profile 
ADD COLUMN IF NOT EXISTS maintenance_message TEXT DEFAULT 'De digitale beursgids opent binnenkort!';

ALTER TABLE public.organization_profile 
ADD COLUMN IF NOT EXISTS countdown_target_date TIMESTAMPTZ;

-- Drop function if exists
DROP FUNCTION IF EXISTS public.is_app_active();

-- Create a helper function for RLS policies
CREATE OR REPLACE FUNCTION public.is_app_active() 
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT is_app_active FROM public.organization_profile WHERE id = 1), false);
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
