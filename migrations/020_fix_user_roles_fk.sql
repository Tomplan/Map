-- Fix foreign key constraint on user_roles table
-- The error "Key (user_id)=(...) is not present in table 'users'" suggests user_roles references a table named 'users' in public schema
-- instead of referencing auth.users in the auth schema.

DO $$ 
DECLARE
    constraint_record RECORD;
BEGIN
    -- Drop existing foreign key constraint on user_id if it exists
    -- We search for constraints on user_roles that involve user_id
    FOR constraint_record IN 
        SELECT tc.constraint_name 
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.table_name = 'user_roles' 
          AND kcu.column_name = 'user_id'
          AND tc.constraint_type = 'FOREIGN KEY'
    LOOP
        EXECUTE 'ALTER TABLE user_roles DROP CONSTRAINT ' || constraint_record.constraint_name;
    END LOOP;
END $$;

-- Add correct foreign key constraint to auth.users
ALTER TABLE user_roles
ADD CONSTRAINT user_roles_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;
