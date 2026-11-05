DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT pg_catalog.quote_ident(p.proname) || '(' || pg_catalog.pg_get_function_identity_arguments(p.oid) || ')' AS sig
        FROM pg_catalog.pg_proc p
        JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
    LOOP
        EXECUTE 'ALTER FUNCTION public.' || r.sig || ' SET search_path = public;';
    END LOOP;
END;
$$;
