import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/server'
import { ApplicationTable } from '@/components/applications/application-table'

export const revalidate = 0

export default async function ApplicationsPage() {
  const supabase = await createClient()
  const { role, profile } = await getCurrentProfile()
  const [{ data: applications }, { data: students }, { data: companies }, { data: positions }] = await Promise.all([
    supabase
      .from('internship_applications')
      .select(`*, student:students(first_name, last_name, student_code), company:companies(company_name), position:company_positions(position_name, max_students)`)
      .order('created_at', { ascending: false }),
    supabase.from('students').select('id, first_name, last_name, student_code').order('first_name'),
    supabase.from('companies').select('id, company_name').order('company_name'),
    supabase.from('company_positions').select('id, position_name, company_id, max_students, is_active').order('position_name'),
  ])

  return (
    <ApplicationTable
      applications={applications ?? []}
      students={students ?? []}
      companies={companies ?? []}
      positions={positions ?? []}
      role={role ?? 'admin'}
      currentStudentId={profile?.student_id ?? null}
    />
  )
}
