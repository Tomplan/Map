ALTER TABLE public.organization_profile
ADD COLUMN IF NOT EXISTS maintenance_message_nl TEXT,
ADD COLUMN IF NOT EXISTS maintenance_message_en TEXT,
ADD COLUMN IF NOT EXISTS maintenance_message_de TEXT,
ADD COLUMN IF NOT EXISTS maintenance_message_fallback_locale TEXT DEFAULT 'nl';

UPDATE public.organization_profile
SET maintenance_message_nl = COALESCE(maintenance_message_nl, maintenance_message)
WHERE id = 1;

UPDATE public.organization_profile
SET maintenance_message_fallback_locale = COALESCE(maintenance_message_fallback_locale, 'nl')
WHERE id = 1;