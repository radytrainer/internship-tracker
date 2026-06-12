-- =====================================================
-- Student Write Policies
-- Allow students to insert/update their own data
-- =====================================================

-- Students can insert companies they find
create policy "Students can insert companies"
  on public.companies for insert
  with check (
    (select role from public.profiles where id = auth.uid()) = 'student'
  );

-- Students can insert positions they find
create policy "Students can insert positions"
  on public.company_positions for insert
  with check (
    (select role from public.profiles where id = auth.uid()) = 'student'
  );

-- Students can submit their own applications
create policy "Students can insert own applications"
  on public.internship_applications for insert
  with check (
    student_id = (select student_id from public.profiles where id = auth.uid())
    and (select role from public.profiles where id = auth.uid()) = 'student'
  );

-- Students can update their own applications (e.g., withdraw)
create policy "Students can update own applications"
  on public.internship_applications for update
  using (
    student_id = (select student_id from public.profiles where id = auth.uid())
    and (select role from public.profiles where id = auth.uid()) = 'student'
  );

-- Students can insert their own internship records
create policy "Students can insert own internships"
  on public.internships for insert
  with check (
    student_id = (select student_id from public.profiles where id = auth.uid())
    and (select role from public.profiles where id = auth.uid()) = 'student'
  );

-- Students can update their own internship records
create policy "Students can update own internships"
  on public.internships for update
  using (
    student_id = (select student_id from public.profiles where id = auth.uid())
    and (select role from public.profiles where id = auth.uid()) = 'student'
  );

-- Students can insert their own employment records
create policy "Students can insert own employment records"
  on public.employment_records for insert
  with check (
    student_id = (select student_id from public.profiles where id = auth.uid())
    and (select role from public.profiles where id = auth.uid()) = 'student'
  );

-- Students can update their own employment records
create policy "Students can update own employment records"
  on public.employment_records for update
  using (
    student_id = (select student_id from public.profiles where id = auth.uid())
    and (select role from public.profiles where id = auth.uid()) = 'student'
  );

-- Students can update their own interviews (e.g., confirm attendance)
create policy "Students can update own interviews"
  on public.interviews for update
  using (
    application_id in (
      select id from public.internship_applications
      where student_id = (select student_id from public.profiles where id = auth.uid())
    )
    and (select role from public.profiles where id = auth.uid()) = 'student'
  );
