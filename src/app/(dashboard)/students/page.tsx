import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentProfile, getTrainerClassIds } from '@/lib/auth/server'
import { StudentTable } from '@/components/students/student-table'

export const revalidate = 0

export default async function StudentsPage() {
  const { role, profile } = await getCurrentProfile()
  const admin = createAdminClient()

  let studentsQuery = admin
    .from('students')
    .select('*, class:classes(name), generation:generations(name, year)')
    .order('created_at', { ascending: false })

  if (role === 'trainer' && profile) {
    const classIds = await getTrainerClassIds(profile.id)
    studentsQuery = studentsQuery.in('class_id', classIds.length > 0 ? classIds : ['00000000-0000-0000-0000-000000000000'])
  }

  const [{ data: students }, { data: classes }, { data: generations }, { data: profiles }] = await Promise.all([
    studentsQuery,
    admin.from('classes').select('*, generation:generations(name)').order('name'),
    admin.from('generations').select('*').order('year'),
    admin.from('profiles').select('student_id').not('student_id', 'is', null),
  ])

  const studentIdsWithAccount = new Set((profiles ?? []).map(p => p.student_id).filter(Boolean))

  return (
    <StudentTable
      students={students ?? []}
      classes={classes ?? []}
      generations={generations ?? []}
      role={role ?? 'admin'}
      studentIdsWithAccount={studentIdsWithAccount as Set<string>}
    />
  )
}
