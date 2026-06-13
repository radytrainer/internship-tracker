alter table public.companies add column if not exists has_mou boolean not null default false;
alter table public.companies add column if not exists is_blacklisted boolean not null default false;
