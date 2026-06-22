-- Track outreach progress with each company (emailed, follow up, confirmed/declined need for interns)
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS outreach_status TEXT NOT NULL DEFAULT 'not_contacted'
  CHECK (outreach_status IN ('not_contacted', 'contacted', 'follow_up', 'confirmed', 'declined'));
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS last_contacted_at DATE;

CREATE INDEX IF NOT EXISTS idx_companies_outreach_status ON public.companies(outreach_status);
