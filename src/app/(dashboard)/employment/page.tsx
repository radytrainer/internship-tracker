import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentProfile, getTrainerClassIds } from '@/lib/auth/server'
import { EmploymentTable } from '@/components/employment/employment-table'

export const revalidate = 0

export default async function EmploymentPage() {
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

  let recordsQuery = admin
    .from('employment_records')
    .select('*')
    .order('start_date', { ascending: false })

  let studentsQuery = admin
    .from('students')
    .select('id, first_name, last_name, student_code')
    .order('first_name')

  if (studentFilter) {
    recordsQuery = recordsQuery.in('student_id', studentFilter)
    studentsQuery = studentsQuery.in('id', studentFilter)
  }

  const [{ data: records }, { data: students }] = await Promise.all([
    recordsQuery,
    studentsQuery,
  ])

  return (
    <EmploymentTable
      records={records ?? []}
      students={students ?? []}
      companies={[]}
      role={role ?? 'admin'}
    />
  )
}
