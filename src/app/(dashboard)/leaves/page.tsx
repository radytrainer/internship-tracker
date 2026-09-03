import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentProfile, getEducationStaffClassIds } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { LeaveTable } from '@/components/leaves/leave-table'

export const revalidate = 0

export default async function LeavesPage() {
  const { role, profile } = await getCurrentProfile()
  if (role !== 'admin' && role !== 'education_team') redirect('/dashboard')

  const admin = createAdminClient()

  const [{ data: leaves }, { data: allStudents }, { data: allInternships }, classIds] = await Promise.all([
    admin
      .from('student_leaves')
      .select('*, student:students(id, first_name, last_name, student_code), internship:internships(id, position, company:companies(company_name))')
      .order('start_date', { ascending: false }),
    admin
      .from('students')
      .select('id, first_name, last_name, student_code, class_id')
      .order('first_name'),
    admin
      .from('internships')
      .select('id, student_id, position, company:companies(company_name)')
      .order('created_at', { ascending: false }),
    role === 'education_team' && profile ? getEducationStaffClassIds(profile.id) : Promise.resolve(null),
  ])

  const students = classIds ? (allStudents ?? []).filter(s => classIds.includes(s.class_id)) : (allStudents ?? [])
  const studentIds = new Set(students.map(s => s.id))
  const internships = (allInternships ?? []).filter(i => studentIds.has(i.student_id))
  const scopedLeaves = (leaves ?? []).filter(l => studentIds.has(l.student_id))

  return <LeaveTable leaves={scopedLeaves} students={students} internships={internships} />
}
