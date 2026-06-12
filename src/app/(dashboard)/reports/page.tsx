import { createClient } from '@/lib/supabase/server'
import { ReportsClient } from '@/components/reports/reports-client'

export const revalidate = 60

export default async function ReportsPage() {
  const supabase = await createClient()

  const [
    { data: generations },
    { data: students },
    { data: applications },
    { data: internships },
    { data: employment },
    { data: companies },
  ] = await Promise.all([
    supabase.from('generations').select('id, name, year').order('year'),
    supabase.from('students').select('id, student_code, first_name, last_name, gender, status, class_id, generation_id').order('first_name'),
    supabase.from('internship_applications').select('id, student_id, company_id, application_status, application_date').order('application_date'),
    supabase.from('internships').select('id, student_id, company_id, internship_status, allowance, start_date, end_date').order('start_date'),
    supabase.from('employment_records').select('id, student_id, company_name, position, employment_type, employment_status, salary, start_date').order('start_date'),
    supabase.from('companies').select('id, company_name, industry').order('company_name'),
  ])

  // Flatten generation data for each student by joining generations table
  const generationMap = Object.fromEntries((generations ?? []).map(g => [g.id, g]))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enrichedStudents = (students ?? []).map((s: any) => ({
    ...s,
    generation: s.generation_id ? generationMap[s.generation_id] : null,
  }))

  return (
    <ReportsClient
      generations={generations ?? []}
      students={enrichedStudents}
      applications={applications ?? []}
      internships={internships ?? []}
      employment={employment ?? []}
      companies={companies ?? []}
    />
  )
}
