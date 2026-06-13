alter table public.company_positions
  add column if not exists position_type text not null default 'Internship';
