import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/server'
import { InterviewTable } from '@/components/interviews/interview-table'

export const revalidate = 0

export default async function InterviewsPage() {
  const supabase = await createClient()
  const { role } = await getCurrentProfile()
  const [{ data: interviews }, { data: applications }, { data: companies }] = await Promise.all([
    supabase
      .from('interviews')
      .select(`*, application:internship_applications(id, application_status, student:students(first_name, last_name, student_code), company:companies(company_name), position:company_positions(position_name))`)
      .order('interview_date', { ascending: false }),
    supabase
      .from('internship_applications')
      .select('id, student_id, company_id, application_status, student:students(first_name, last_name, student_code), company:companies(company_name), position:company_positions(position_name)')
      .order('created_at', { ascending: false }),
    supabase.from('companies').select('id, company_name').order('company_name'),
  ])

  return (
    <InterviewTable
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      interviews={(interviews ?? []) as any[]}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      applications={(applications ?? []) as any[]}
      companies={companies ?? []}
      role={role ?? 'admin'}
    />
  )
}
