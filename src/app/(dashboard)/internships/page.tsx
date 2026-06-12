import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/server'
import { InternshipTable } from '@/components/internships/internship-table'

export const revalidate = 0

export default async function InternshipsPage() {
  const supabase = await createClient()
  const { role } = await getCurrentProfile()
  const [{ data: internships }, { data: students }, { data: companies }] = await Promise.all([
    supabase.from('internships').select('*').order('start_date', { ascending: false }),
    supabase.from('students').select('id, first_name, last_name, student_code').order('first_name'),
    supabase.from('companies').select('id, company_name').order('company_name'),
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
