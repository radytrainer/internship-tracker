-- Lets staff override the computed (monthly amount * month cap) total a student owes,
-- for cases that need a manual adjustment instead of the standard formula
alter table public.internships add column if not exists allowance_total_override numeric(12,2);
alter table public.employment_records add column if not exists allowance_total_override numeric(12,2);
