-- Track whether the student found the internship themselves or staff arranged it via outreach
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS source TEXT
  CHECK (source IN ('Student Found', 'Staff Outreach'));

CREATE INDEX IF NOT EXISTS idx_internships_source ON public.internships(source);
