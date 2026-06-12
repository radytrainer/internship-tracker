-- =====================================================
-- Row Level Security Policies
-- =====================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.generations enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.companies enable row level security;
alter table public.company_positions enable row level security;
alter table public.internship_applications enable row level security;
alter table public.interviews enable row level security;
alter table public.internships enable row level security;
alter table public.employment_records enable row level security;

-- =====================================================
-- HELPER FUNCTION: Get current user role
-- =====================================================
create or replace function public.get_user_role()
returns text language sql security definer stable as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin_or_staff()
returns boolean language sql security definer stable as $$
  select role in ('admin', 'career_staff', 'trainer') from public.profiles where id = auth.uid();
$$;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.get_user_role() = 'admin');

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admins can update all profiles"
  on public.profiles for update
  using (public.get_user_role() = 'admin');

create policy "Admins can insert profiles"
  on public.profiles for insert
  with check (public.get_user_role() = 'admin');

-- =====================================================
-- GENERATIONS POLICIES
-- =====================================================
create policy "Authenticated users can view generations"
  on public.generations for select
  using (auth.role() = 'authenticated');

create policy "Admins and staff can manage generations"
  on public.generations for all
  using (public.is_admin_or_staff());

-- =====================================================
-- CLASSES POLICIES
-- =====================================================
create policy "Authenticated users can view classes"
  on public.classes for select
  using (auth.role() = 'authenticated');

create policy "Admins and staff can manage classes"
  on public.classes for all
  using (public.is_admin_or_staff());

-- =====================================================
-- STUDENTS POLICIES
-- =====================================================
create policy "Staff can view all students"
  on public.students for select
  using (public.is_admin_or_staff());

create policy "Students can view own record"
  on public.students for select
  using (
    id = (select student_id from public.profiles where id = auth.uid())
  );

create policy "Staff can insert students"
  on public.students for insert
  with check (public.is_admin_or_staff());

create policy "Staff can update students"
  on public.students for update
  using (public.is_admin_or_staff());

create policy "Admins can delete students"
  on public.students for delete
  using (public.get_user_role() = 'admin');

-- =====================================================
-- COMPANIES POLICIES
-- =====================================================
create policy "Authenticated users can view companies"
  on public.companies for select
  using (auth.role() = 'authenticated');

create policy "Staff can insert companies"
  on public.companies for insert
  with check (public.is_admin_or_staff());

create policy "Staff can update companies"
  on public.companies for update
  using (public.is_admin_or_staff());

create policy "Staff can delete companies"
  on public.companies for delete
  using (public.is_admin_or_staff());

-- =====================================================
-- COMPANY POSITIONS POLICIES
-- =====================================================
create policy "Authenticated users can view positions"
  on public.company_positions for select
  using (auth.role() = 'authenticated');

create policy "Staff can insert positions"
  on public.company_positions for insert
  with check (public.is_admin_or_staff());

create policy "Staff can update positions"
  on public.company_positions for update
  using (public.is_admin_or_staff());

create policy "Staff can delete positions"
  on public.company_positions for delete
  using (public.is_admin_or_staff());

-- =====================================================
-- INTERNSHIP APPLICATIONS POLICIES
-- =====================================================
create policy "Staff can view all applications"
  on public.internship_applications for select
  using (public.is_admin_or_staff());

create policy "Students can view own applications"
  on public.internship_applications for select
  using (
    student_id = (select student_id from public.profiles where id = auth.uid())
  );

create policy "Staff can insert applications"
  on public.internship_applications for insert
  with check (public.is_admin_or_staff());

create policy "Staff can update applications"
  on public.internship_applications for update
  using (public.is_admin_or_staff());

create policy "Staff can delete applications"
  on public.internship_applications for delete
  using (public.is_admin_or_staff());

-- =====================================================
-- INTERVIEWS POLICIES
-- =====================================================
create policy "Staff can view all interviews"
  on public.interviews for select
  using (public.is_admin_or_staff());

create policy "Students can view own interviews"
  on public.interviews for select
  using (
    application_id in (
      select id from public.internship_applications
      where student_id = (select student_id from public.profiles where id = auth.uid())
    )
  );

create policy "Staff can insert interviews"
  on public.interviews for insert
  with check (public.is_admin_or_staff());

create policy "Staff can update interviews"
  on public.interviews for update
  using (public.is_admin_or_staff());

create policy "Staff can delete interviews"
  on public.interviews for delete
  using (public.is_admin_or_staff());

-- =====================================================
-- INTERNSHIPS POLICIES
-- =====================================================
create policy "Staff can view all internships"
  on public.internships for select
  using (public.is_admin_or_staff());

create policy "Students can view own internships"
  on public.internships for select
  using (
    student_id = (select student_id from public.profiles where id = auth.uid())
  );

create policy "Staff can insert internships"
  on public.internships for insert
  with check (public.is_admin_or_staff());

create policy "Staff can update internships"
  on public.internships for update
  using (public.is_admin_or_staff());

create policy "Staff can delete internships"
  on public.internships for delete
  using (public.is_admin_or_staff());

-- =====================================================
-- EMPLOYMENT RECORDS POLICIES
-- =====================================================
create policy "Staff can view all employment records"
  on public.employment_records for select
  using (public.is_admin_or_staff());

create policy "Students can view own employment records"
  on public.employment_records for select
  using (
    student_id = (select student_id from public.profiles where id = auth.uid())
  );

create policy "Staff can insert employment records"
  on public.employment_records for insert
  with check (public.is_admin_or_staff());

create policy "Staff can update employment records"
  on public.employment_records for update
  using (public.is_admin_or_staff());

create policy "Staff can delete employment records"
  on public.employment_records for delete
  using (public.is_admin_or_staff());

-- =====================================================
-- STORAGE: Agreement files bucket
-- =====================================================
insert into storage.buckets (id, name, public)
values ('agreements', 'agreements', false)
on conflict (id) do nothing;

create policy "Staff can upload agreements"
  on storage.objects for insert
  with check (
    bucket_id = 'agreements' and
    auth.role() = 'authenticated' and
    public.is_admin_or_staff()
  );

create policy "Staff can view agreements"
  on storage.objects for select
  using (
    bucket_id = 'agreements' and
    auth.role() = 'authenticated'
  );

create policy "Admins can delete agreements"
  on storage.objects for delete
  using (
    bucket_id = 'agreements' and
    public.get_user_role() = 'admin'
  );
