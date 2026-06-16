import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentProfile, getTrainerClassIds } from '@/lib/auth/server'
import { InternshipTable } from '@/components/internships/internship-table'

export const revalidate = 0

export default async function InternshipsPage() {
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

  let internshipsQuery = admin
    .from('internships')
    .select('*')
    .order('start_date', { ascending: false })

  let studentsQuery = admin
    .from('students')
    .select('id, first_name, last_name, student_code')
    .order('first_name')

  if (studentFilter) {
    internshipsQuery = internshipsQuery.in('student_id', studentFilter)
    studentsQuery = studentsQuery.in('id', studentFilter)
  }

  const [{ data: internships }, { data: students }, { data: companies }] = await Promise.all([
    internshipsQuery,
    studentsQuery,
    admin.from('companies').select('id, company_name').order('company_name'),
  ])

  return (
    <InternshipTable
      internships={internships ?? []}
      students={students ?? []}
      companies={companies ?? []}
      role={role ?? 'admin'}
    />
  )
}
