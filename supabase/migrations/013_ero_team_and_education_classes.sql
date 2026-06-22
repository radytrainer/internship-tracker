-- Add the "ero_team" role: same staff-level read access as trainer, scoped via nav
-- to dashboard/students/companies/positions/applications/interviews/internships/employment/reports.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin', 'career_staff', 'trainer', 'student', 'education_team', 'ero_team'));

create or replace function public.is_admin_or_staff()
returns boolean language sql security definer stable as $$
  select role in ('admin', 'career_staff', 'trainer', 'ero_team') from public.profiles where id = auth.uid();
$$;

-- Let education team members be assigned to classes, same pattern as trainer_id,
-- so they can manage students by class like trainers do.
alter table public.classes add column if not exists education_staff_id uuid references public.profiles(id) on delete set null;
create index if not exists idx_classes_education_staff on public.classes(education_staff_id);
