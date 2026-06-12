-- =====================================================
-- Student Internship Tracker - Database Schema
-- =====================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =====================================================
-- PROFILES (extends auth.users)
-- =====================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  role text check (role in ('admin', 'career_staff', 'trainer', 'student')) not null default 'career_staff',
  student_id uuid,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================
-- GENERATIONS
-- =====================================================
create table public.generations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  year integer not null,
  created_at timestamptz not null default now()
);

-- =====================================================
-- CLASSES
-- =====================================================
create table public.classes (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  generation_id uuid references public.generations(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- =====================================================
-- STUDENTS
-- =====================================================
create table public.students (
  id uuid default gen_random_uuid() primary key,
  student_code text unique not null,
  first_name text not null,
  last_name text not null,
  gender text check (gender in ('Male', 'Female')) not null,
  phone text,
  email text unique,
  class_id uuid references public.classes(id) on delete set null,
  generation_id uuid references public.generations(id) on delete set null,
  status text check (status in (
    'Studying',
    'Looking For Internship',
    'Internship Applied',
    'Interview Scheduled',
    'Internship Accepted',
    'Internship Active',
    'Internship Completed',
    'Looking For Job',
    'Employed'
  )) not null default 'Studying',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================
-- COMPANIES
-- =====================================================
create table public.companies (
  id uuid default gen_random_uuid() primary key,
  company_name text not null,
  industry text,
  address text,
  contact_person text,
  contact_email text,
  contact_phone text,
  website text,
  max_students_per_company integer not null default 10,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================
-- COMPANY POSITIONS
-- =====================================================
create table public.company_positions (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  position_name text not null,
  max_students integer not null default 5,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- =====================================================
-- INTERNSHIP APPLICATIONS
-- =====================================================
create table public.internship_applications (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.students(id) on delete cascade not null,
  company_id uuid references public.companies(id) on delete cascade not null,
  position_id uuid references public.company_positions(id) on delete cascade not null,
  application_date date not null default current_date,
  application_status text check (application_status in (
    'Applied',
    'Under Review',
    'Interview Scheduled',
    'Interview Passed',
    'Interview Failed',
    'Accepted',
    'Rejected'
  )) not null default 'Applied',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Prevent duplicate applications (same student + company + position)
  unique(student_id, company_id, position_id)
);

-- =====================================================
-- INTERVIEWS
-- =====================================================
create table public.interviews (
  id uuid default gen_random_uuid() primary key,
  application_id uuid references public.internship_applications(id) on delete cascade not null,
  interview_date date not null,
  interview_time time,
  interview_type text check (interview_type in ('Online', 'On Site')) not null default 'Online',
  location text,
  result text check (result in ('Pending', 'Passed', 'Failed')) not null default 'Pending',
  feedback text,
  interviewer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================
-- INTERNSHIPS
-- =====================================================
create table public.internships (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.students(id) on delete cascade not null,
  company_id uuid references public.companies(id) on delete cascade not null,
  position text not null,
  allowance numeric(12,2),
  start_date date,
  end_date date,
  agreement_signed boolean not null default false,
  agreement_signed_date date,
  agreement_file_url text,
  supervisor text,
  supervisor_phone text,
  supervisor_email text,
  internship_status text check (internship_status in ('Active', 'Completed', 'Terminated')) not null default 'Active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================
-- EMPLOYMENT RECORDS
-- =====================================================
create table public.employment_records (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.students(id) on delete cascade not null,
  company_name text not null,
  position text not null,
  employment_type text check (employment_type in ('Full-Time', 'Part-Time', 'Contract')) not null default 'Full-Time',
  salary numeric(12,2),
  start_date date,
  end_date date,
  employment_status text check (employment_status in ('Active', 'Resigned', 'Terminated')) not null default 'Active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================
-- ADD FOREIGN KEY for profiles.student_id
-- =====================================================
alter table public.profiles
  add constraint profiles_student_id_fkey
  foreign key (student_id) references public.students(id) on delete set null;

-- =====================================================
-- INDEXES for performance
-- =====================================================
create index idx_classes_generation on public.classes(generation_id);
create index idx_students_class on public.students(class_id);
create index idx_students_generation on public.students(generation_id);
create index idx_students_status on public.students(status);
create index idx_students_gender on public.students(gender);
create index idx_company_positions_company on public.company_positions(company_id);
create index idx_applications_student on public.internship_applications(student_id);
create index idx_applications_company on public.internship_applications(company_id);
create index idx_applications_position on public.internship_applications(position_id);
create index idx_applications_status on public.internship_applications(application_status);
create index idx_interviews_application on public.interviews(application_id);
create index idx_interviews_date on public.interviews(interview_date);
create index idx_internships_student on public.internships(student_id);
create index idx_internships_company on public.internships(company_id);
create index idx_internships_status on public.internships(internship_status);
create index idx_employment_student on public.employment_records(student_id);
create index idx_employment_status on public.employment_records(employment_status);

-- =====================================================
-- TRIGGERS: updated_at auto-update
-- =====================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_students_updated_at before update on public.students
  for each row execute function public.handle_updated_at();

create trigger set_companies_updated_at before update on public.companies
  for each row execute function public.handle_updated_at();

create trigger set_applications_updated_at before update on public.internship_applications
  for each row execute function public.handle_updated_at();

create trigger set_interviews_updated_at before update on public.interviews
  for each row execute function public.handle_updated_at();

create trigger set_internships_updated_at before update on public.internships
  for each row execute function public.handle_updated_at();

create trigger set_employment_updated_at before update on public.employment_records
  for each row execute function public.handle_updated_at();

-- =====================================================
-- TRIGGER: Auto-create profile on new user signup
-- =====================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'career_staff')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================
-- FUNCTION: Check position capacity
-- =====================================================
create or replace function public.check_position_capacity(
  p_position_id uuid,
  p_exclude_application_id uuid default null
)
returns json language plpgsql security definer as $$
declare
  v_max_students integer;
  v_current_count integer;
begin
  select max_students into v_max_students
  from public.company_positions
  where id = p_position_id;

  select count(*) into v_current_count
  from public.internship_applications
  where position_id = p_position_id
    and application_status not in ('Rejected', 'Interview Failed')
    and (p_exclude_application_id is null or id != p_exclude_application_id);

  return json_build_object(
    'max_students', v_max_students,
    'current_count', v_current_count,
    'is_full', v_current_count >= v_max_students,
    'available_slots', greatest(0, v_max_students - v_current_count)
  );
end;
$$;

-- =====================================================
-- FUNCTION: Get dashboard KPIs
-- =====================================================
create or replace function public.get_dashboard_kpis()
returns json language plpgsql security definer as $$
declare
  v_result json;
begin
  select json_build_object(
    'total_students', (select count(*) from public.students),
    'looking_for_internship', (select count(*) from public.students where status = 'Looking For Internship'),
    'internship_applied', (select count(*) from public.students where status = 'Internship Applied'),
    'interview_scheduled', (select count(*) from public.students where status = 'Interview Scheduled'),
    'internship_accepted', (select count(*) from public.students where status = 'Internship Accepted'),
    'internship_active', (select count(*) from public.students where status = 'Internship Active'),
    'internship_completed', (select count(*) from public.students where status = 'Internship Completed'),
    'employed', (select count(*) from public.students where status = 'Employed'),
    'total_companies', (select count(*) from public.companies),
    'total_applications', (select count(*) from public.internship_applications),
    'interviews_scheduled', (select count(*) from public.interviews where result = 'Pending'),
    'interviews_passed', (select count(*) from public.interviews where result = 'Passed')
  ) into v_result;

  return v_result;
end;
$$;

-- =====================================================
-- SEED DATA: Generations & Classes
-- =====================================================
insert into public.generations (name, year) values
  ('Generation 2026', 2026),
  ('Generation 2027', 2027),
  ('Generation 2028', 2028);

insert into public.classes (name, generation_id) values
  ('Web 26 A', (select id from public.generations where year = 2026)),
  ('Web 26 B', (select id from public.generations where year = 2026)),
  ('Web 26 C', (select id from public.generations where year = 2026)),
  ('Web 27 A', (select id from public.generations where year = 2027)),
  ('Web 27 B', (select id from public.generations where year = 2027)),
  ('Web 27 C', (select id from public.generations where year = 2027)),
  ('SNAC', (select id from public.generations where year = 2028));
