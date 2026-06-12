import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/server'
import { EmploymentTable } from '@/components/employment/employment-table'

export const revalidate = 0

export default async function EmploymentPage() {
  const supabase = await createClient()
  const { role } = await getCurrentProfile()
  const [{ data: records }, { data: students }] = await Promise.all([
    supabase.from('employment_records').select('*').order('start_date', { ascending: false }),
    supabase.from('students').select('id, first_name, last_name, student_code').order('first_name'),
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
