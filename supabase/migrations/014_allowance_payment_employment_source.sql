-- Allowance payments can come from either an internship or a full-time job
alter table public.allowance_payments add column if not exists employment_id uuid references public.employment_records(id) on delete set null;
create index if not exists idx_allowance_payments_employment on public.allowance_payments(employment_id);
