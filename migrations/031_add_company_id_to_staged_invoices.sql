-- Add company_id FK to staged_invoices so confirmed invoice→company links are persisted.
-- SET NULL on delete keeps the invoice row intact if the company is later removed.

ALTER TABLE public.staged_invoices
  ADD COLUMN company_id INTEGER REFERENCES public.companies(id) ON DELETE SET NULL;

-- Index speeds up joins when looking up all invoices for a given company.
CREATE INDEX IF NOT EXISTS staged_invoices_company_id_idx
  ON public.staged_invoices (company_id);
