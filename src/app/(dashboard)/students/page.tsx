import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentProfile } from '@/lib/auth/server'
import { StudentTable } from '@/components/students/student-table'

export const revalidate = 0

export default async function StudentsPage() {
  const { role } = await getCurrentProfile()
  const admin = createAdminClient()

  const [{ data: students }, { data: classes }, { data: generations }, { data: profiles }] = await Promise.all([
    admin.from('students').select(`*, class:classes(name), generation:generations(name, year)`).order('created_at', { ascending: false }),
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
