CREATE TABLE IF NOT EXISTS public.public_map_data_version (
  id SMALLINT PRIMARY KEY CHECK (id = 1),
  version BIGINT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.public_map_data_version (id, version)
VALUES (1, 1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.public_map_data_version ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read map data version" ON public.public_map_data_version;
CREATE POLICY "Public can read map data version"
ON public.public_map_data_version
FOR SELECT
TO anon, authenticated
USING (true);

REVOKE ALL ON TABLE public.public_map_data_version FROM anon, authenticated;
GRANT SELECT ON TABLE public.public_map_data_version TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.bump_public_map_data_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.public_map_data_version
  SET version = version + 1, updated_at = NOW()
  WHERE id = 1;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.bump_public_map_data_version() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS bump_public_map_data_version ON public.markers_core;
CREATE TRIGGER bump_public_map_data_version
AFTER INSERT OR UPDATE OR DELETE ON public.markers_core
FOR EACH STATEMENT EXECUTE FUNCTION public.bump_public_map_data_version();

DROP TRIGGER IF EXISTS bump_public_map_data_version ON public.markers_appearance;
CREATE TRIGGER bump_public_map_data_version
AFTER INSERT OR UPDATE OR DELETE ON public.markers_appearance
FOR EACH STATEMENT EXECUTE FUNCTION public.bump_public_map_data_version();

DROP TRIGGER IF EXISTS bump_public_map_data_version ON public.markers_content;
CREATE TRIGGER bump_public_map_data_version
AFTER INSERT OR UPDATE OR DELETE ON public.markers_content
FOR EACH STATEMENT EXECUTE FUNCTION public.bump_public_map_data_version();

DROP TRIGGER IF EXISTS bump_public_map_data_version ON public.assignments;
CREATE TRIGGER bump_public_map_data_version
AFTER INSERT OR UPDATE OR DELETE ON public.assignments
FOR EACH STATEMENT EXECUTE FUNCTION public.bump_public_map_data_version();

DROP TRIGGER IF EXISTS bump_public_map_data_version ON public.event_subscriptions;
CREATE TRIGGER bump_public_map_data_version
AFTER INSERT OR UPDATE OR DELETE ON public.event_subscriptions
FOR EACH STATEMENT EXECUTE FUNCTION public.bump_public_map_data_version();

DROP TRIGGER IF EXISTS bump_public_map_data_version ON public.companies;
CREATE TRIGGER bump_public_map_data_version
AFTER INSERT OR UPDATE OR DELETE ON public.companies
FOR EACH STATEMENT EXECUTE FUNCTION public.bump_public_map_data_version();

DROP TRIGGER IF EXISTS bump_public_map_data_version ON public.company_translations;
CREATE TRIGGER bump_public_map_data_version
AFTER INSERT OR UPDATE OR DELETE ON public.company_translations
FOR EACH STATEMENT EXECUTE FUNCTION public.bump_public_map_data_version();