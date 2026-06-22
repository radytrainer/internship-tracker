import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentProfile } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { LeaveTable } from '@/components/leaves/leave-table'

export const revalidate = 0

export default async function LeavesPage() {
  const { role } = await getCurrentProfile()
  if (role !== 'admin' && role !== 'education_team') redirect('/dashboard')

  const admin = createAdminClient()

  const [{ data: leaves }, { data: students }, { data: internships }] = await Promise.all([
    admin
      .from('student_leaves')
      .select('*, student:students(id, first_name, last_name, student_code), internship:internships(id, position, company:companies(company_name))')
      .order('start_date', { ascending: false }),
    admin
      .from('students')
      .select('id, first_name, last_name, student_code')
      .order('first_name'),
    admin
      .from('internships')
      .select('id, student_id, position, company:companies(company_name)')
      .order('created_at', { ascending: false }),
  ])

  return <LeaveTable leaves={leaves ?? []} students={students ?? []} internships={internships ?? []} />
}
