-- Migration to create staged_invoices for ETL imports from PDF

CREATE TABLE IF NOT EXISTS public.staged_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  stands_count INTEGER DEFAULT 0,
  meals_count INTEGER DEFAULT 0,
  area_preference TEXT,
  notes TEXT,
  is_relevant BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.staged_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for event managers" ON public.staged_invoices
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('super_admin', 'system_manager', 'event_manager')
        )
    );

CREATE POLICY "Enable write access for system/super admins" ON public.staged_invoices
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('super_admin', 'system_manager', 'event_manager')
        )
    );
