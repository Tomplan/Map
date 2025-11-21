-- Migration 012: Create company_translations table for multi-language content
-- Purpose: Enable content translations for company info field
-- This allows managers to provide company info in multiple languages (NL, EN, etc.)

-- Create company_translations table
CREATE TABLE IF NOT EXISTS public.company_translations (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES public.Companies(id) ON DELETE CASCADE,
  language_code VARCHAR(5) NOT NULL,  -- 'nl', 'en', 'fr', 'de', etc.
  info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, language_code)
);

-- Add indexes for performance
CREATE INDEX idx_company_translations_company_id ON public.company_translations(company_id);
CREATE INDEX idx_company_translations_language_code ON public.company_translations(language_code);
CREATE INDEX idx_company_translations_company_language ON public.company_translations(company_id, language_code);

-- Add trigger for updated_at
CREATE TRIGGER update_company_translations_updated_at 
BEFORE UPDATE ON public.company_translations 
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.company_translations ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all translations (for public display)
CREATE POLICY "Authenticated users can read company translations"
ON public.company_translations
FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can insert/update/delete translations (admin interface)
CREATE POLICY "Authenticated users can manage company translations"
ON public.company_translations
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Migrate existing Companies.info to company_translations (Dutch as default)
-- Only migrate non-empty info fields
INSERT INTO public.company_translations (company_id, language_code, info)
SELECT 
  id, 
  'nl' as language_code,  -- Default language is Dutch
  info
FROM public.Companies
WHERE info IS NOT NULL AND info != ''
ON CONFLICT (company_id, language_code) DO NOTHING;

-- Add comment to old info column (deprecate but keep for backward compatibility)
COMMENT ON COLUMN public.Companies.info IS 'DEPRECATED: Use company_translations table instead. Kept for backward compatibility.';
