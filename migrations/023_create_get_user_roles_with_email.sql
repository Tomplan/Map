-- Migration to create an RPC function for fetching user roles with emails
-- Since auth.users is normally not accessible from the public schema due to RLS and schema separation,
-- a SECURITY DEFINER function allows us to bypass read-only restrictions for authorized admin panels.

-- First, make sure the role exists for user roles if not already present
-- (This assumes the object_role type or equivalent exists, otherwise we just return TEXT for role)

-- Drop the function first in case the return type signature has changed
DROP FUNCTION IF EXISTS get_user_roles_with_email();

CREATE OR REPLACE FUNCTION get_user_roles_with_email()
RETURNS TABLE (
    user_id UUID,
    role TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    email TEXT,
    last_sign_in_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the current user is an admin
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role IN ('super_admin', 'system_manager', 'event_manager')
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN QUERY
    SELECT 
        au.id as user_id,
        COALESCE(ur.role::TEXT, 'none') as role,
        COALESCE(ur.created_at, au.created_at) as created_at,
        COALESCE(ur.updated_at, au.updated_at) as updated_at,
        au.email::TEXT,
        au.last_sign_in_at
    FROM auth.users au
    LEFT JOIN public.user_roles ur ON ur.user_id = au.id;
END;
$$;

-- Secure the function by revoking public execute rights
REVOKE EXECUTE ON FUNCTION get_user_roles_with_email() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_user_roles_with_email() TO authenticated;
