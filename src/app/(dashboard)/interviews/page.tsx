import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentProfile, getTrainerClassIds } from '@/lib/auth/server'
import { InterviewTable } from '@/components/interviews/interview-table'

export const revalidate = 0

export default async function InterviewsPage() {
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

  let interviewsQuery = admin
    .from('interviews')
    .select('*, application:internship_applications(id, application_status, student_id, student:students(first_name, last_name, student_code), company:companies(company_name), position:company_positions(position_name))')
    .order('interview_date', { ascending: false })

  let appsQuery = admin
    .from('internship_applications')
    .select('id, student_id, company_id, application_status, student:students(first_name, last_name, student_code), company:companies(company_name), position:company_positions(position_name)')
    .order('created_at', { ascending: false })

  if (studentFilter) {
    appsQuery = appsQuery.in('student_id', studentFilter)
  }

  const [{ data: interviews }, { data: applications }, { data: companies }] = await Promise.all([
    interviewsQuery,
    appsQuery,
    admin.from('companies').select('id, company_name').order('company_name'),
  ])

  // Filter interviews by allowed students (join-based filter)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let filteredInterviews = (interviews ?? []) as any[]
  if (studentFilter) {
    filteredInterviews = filteredInterviews.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (iv: any) => studentFilter.includes(iv.application?.student_id)
    )
  }

  // Students only see their own applications in the schedule form
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allApps = (applications ?? []) as any[]
  const visibleApps = role === 'student' && profile?.student_id
    ? allApps.filter(a => a.student_id === profile.student_id)
    : allApps

  return (
    <InterviewTable
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      interviews={filteredInterviews as any[]}
      applications={visibleApps}
      companies={companies ?? []}
      role={role ?? 'admin'}
    />
  )
}
