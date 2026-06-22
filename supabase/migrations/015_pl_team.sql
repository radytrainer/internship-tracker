-- Add the "pl_team" role: manages students by class (like trainer/education_team),
-- and has full manage permission on internships (agreement, supervisor, tutor,
-- allowance, start/end date) and employment records.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin', 'career_staff', 'trainer', 'student', 'education_team', 'ero_team', 'pl_team'));

create or replace function public.is_admin_or_staff()
returns boolean language sql security definer stable as $$
  select role in ('admin', 'career_staff', 'trainer', 'ero_team', 'pl_team') from public.profiles where id = auth.uid();
$$;

alter table public.classes add column if not exists pl_staff_id uuid references public.profiles(id) on delete set null;
create index if not exists idx_classes_pl_staff on public.classes(pl_staff_id);
