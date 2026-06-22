-- Add a dedicated "education_team" role, distinct from the legacy "career_staff"
-- value (which is the existing admin account and must keep full admin access).
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin', 'career_staff', 'trainer', 'student', 'education_team'));

-- =====================================================
-- STUDENT LEAVES (leave taken during an internship/job)
-- =====================================================
create table public.student_leaves (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.students(id) on delete cascade not null,
  internship_id uuid references public.internships(id) on delete set null,
  start_date date not null,
  end_date date not null,
  reason text,
  status text check (status in ('Pending', 'Approved', 'Rejected')) not null default 'Pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_student_leaves_student on public.student_leaves(student_id);
create index idx_student_leaves_internship on public.student_leaves(internship_id);
create index idx_student_leaves_status on public.student_leaves(status);

create trigger set_student_leaves_updated_at before update on public.student_leaves
  for each row execute function public.handle_updated_at();

-- =====================================================
-- ALLOWANCE PAYMENTS (portion of student allowance paid back to school)
-- =====================================================
create table public.allowance_payments (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.students(id) on delete cascade not null,
  internship_id uuid references public.internships(id) on delete set null,
  amount numeric(12,2) not null,
  payment_date date not null default current_date,
  payment_time time,
  confirmed_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_allowance_payments_student on public.allowance_payments(student_id);
create index idx_allowance_payments_internship on public.allowance_payments(internship_id);
create index idx_allowance_payments_date on public.allowance_payments(payment_date);

create trigger set_allowance_payments_updated_at before update on public.allowance_payments
  for each row execute function public.handle_updated_at();

-- =====================================================
-- RLS
-- =====================================================
alter table public.student_leaves enable row level security;
alter table public.allowance_payments enable row level security;

create or replace function public.is_admin_or_education()
returns boolean language sql security definer stable as $$
  select role in ('admin', 'career_staff', 'education_team') from public.profiles where id = auth.uid();
$$;

create policy "Education staff can view leaves"
  on public.student_leaves for select
  using (public.is_admin_or_education());

create policy "Students can view own leaves"
  on public.student_leaves for select
  using (
    student_id = (select student_id from public.profiles where id = auth.uid())
  );

create policy "Education staff can insert leaves"
  on public.student_leaves for insert
  with check (public.is_admin_or_education());

create policy "Education staff can update leaves"
  on public.student_leaves for update
  using (public.is_admin_or_education());

create policy "Education staff can delete leaves"
  on public.student_leaves for delete
  using (public.is_admin_or_education());

create policy "Education staff can view allowance payments"
  on public.allowance_payments for select
  using (public.is_admin_or_education());

create policy "Students can view own allowance payments"
  on public.allowance_payments for select
  using (
    student_id = (select student_id from public.profiles where id = auth.uid())
  );

create policy "Education staff can insert allowance payments"
  on public.allowance_payments for insert
  with check (public.is_admin_or_education());

create policy "Education staff can update allowance payments"
  on public.allowance_payments for update
  using (public.is_admin_or_education());

create policy "Education staff can delete allowance payments"
  on public.allowance_payments for delete
  using (public.is_admin_or_education());

-- Education team also needs read access to students/internships to fill out these forms
create policy "Education staff can view students"
  on public.students for select
  using (public.is_admin_or_education());

create policy "Education staff can view internships"
  on public.internships for select
  using (public.is_admin_or_education());
