-- Migration to create an RPC function to securely delete a user from auth.users
-- Since auth.users is protected, only an RPC with SECURITY DEFINER can delete from it
-- from the client-side. The function checks if the calling user is an authorized admin.

CREATE OR REPLACE FUNCTION delete_auth_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the current user is an admin allowed to delete
    -- super_admins and system_managers can delete
    -- event_managers CANNOT delete
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role IN ('super_admin', 'system_manager')
    ) THEN
        RAISE EXCEPTION 'Access denied: Event Managers cannot delete users';
    END IF;

    -- Prevent non-super_admins from deleting super_admins
    IF EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_roles.user_id = target_user_id 
        AND user_roles.role = 'super_admin'
    ) AND NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'super_admin'
    ) THEN
        RAISE EXCEPTION 'Only super admins can delete super admins';
    END IF;

    -- Note: Deleting from auth.users will naturally cascade to public.user_roles 
    -- if the foreign key has ON DELETE CASCADE. If not, we can delete from user_roles here too.
    DELETE FROM public.user_roles WHERE user_id = target_user_id;
    DELETE FROM auth.users WHERE id = target_user_id;

END;
$$;

-- Secure the function by revoking public execute rights
REVOKE EXECUTE ON FUNCTION delete_auth_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_auth_user(UUID) TO authenticated;
