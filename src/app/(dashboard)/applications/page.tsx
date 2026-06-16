import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentProfile, getTrainerClassIds } from '@/lib/auth/server'
import { ApplicationTable } from '@/components/applications/application-table'

export const revalidate = 0

export default async function ApplicationsPage() {
  const { role, profile } = await getCurrentProfile()
  const admin = createAdminClient()

  // Resolve which student IDs this user can see
  let allowedStudentIds: string[] | null = null
  if (role === 'trainer' && profile) {
    const classIds = await getTrainerClassIds(profile.id)
    const { data: classStudents } = await admin
      .from('students')
      .select('id')
      .in('class_id', classIds.length > 0 ? classIds : ['00000000-0000-0000-0000-000000000000'])
    allowedStudentIds = (classStudents ?? []).map(s => s.id)
  }

  const studentFilter = allowedStudentIds !== null
    ? allowedStudentIds.length > 0 ? allowedStudentIds : ['00000000-0000-0000-0000-000000000000']
    : null

  let appsQuery = admin
    .from('internship_applications')
    .select('*, student:students(first_name, last_name, student_code), company:companies(company_name), position:company_positions(position_name, max_students, intake_date)')
    .order('created_at', { ascending: false })

  let studentsQuery = admin
    .from('students')
    .select('id, first_name, last_name, student_code')
    .order('first_name')

  if (studentFilter) {
    appsQuery = appsQuery.in('student_id', studentFilter)
    studentsQuery = studentsQuery.in('id', studentFilter)
  }

  const [{ data: applications }, { data: students }, { data: companies }, { data: positions }] = await Promise.all([
    appsQuery,
    studentsQuery,
    admin.from('companies').select('id, company_name').order('company_name'),
    admin.from('company_positions').select('id, position_name, company_id, max_students, intake_date, is_active').order('position_name'),
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
