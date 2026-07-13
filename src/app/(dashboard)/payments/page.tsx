import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentProfile } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { PaymentTable } from '@/components/payments/payment-table'
import { PassedInterviewCard } from '@/components/payments/passed-interview-card'
import { internshipAllowanceMonthCap, schoolAllowanceShare } from '@/lib/utils'

export const revalidate = 0

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

export default async function PaymentsPage() {
  const { role } = await getCurrentProfile()
  if (role !== 'admin' && role !== 'education_team') redirect('/dashboard')

  const admin = createAdminClient()

  const [{ data: payments }, { data: students }, { data: internships }, { data: employmentRecords }, { data: passedInterviews }] = await Promise.all([
    admin
      .from('allowance_payments')
      .select('*, student:students(id, first_name, last_name, student_code), internship:internships(id, position, allowance, company:companies(company_name)), employment:employment_records(id, position, company_name, salary)')
      .order('payment_date', { ascending: false }),
    admin
      .from('students')
      .select('id, first_name, last_name, student_code')
      .order('first_name'),
    admin
      .from('internships')
      .select('id, student_id, position, allowance, start_date, end_date, company:companies(company_name)')
      .order('created_at', { ascending: false }),
    admin
      .from('employment_records')
      .select('id, student_id, position, company_name, salary')
      .order('created_at', { ascending: false }),
    admin
      .from('interviews')
      .select('interview_date, application:internship_applications(student_id, company:companies(company_name), position:company_positions(position_name))')
      .eq('result', 'Passed')
      .order('interview_date', { ascending: false }),
  ])

  // Most recent passed interview per student, enriched with their internship allowance/payment status
  const seenStudents = new Set<string>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const passedInterviewStudents = (passedInterviews ?? []).reduce((list: any[], row: any) => {
    const application = one(row.application)
    const studentId = application?.student_id
    if (!studentId || seenStudents.has(studentId)) return list
    seenStudents.add(studentId)

    const student = (students ?? []).find(s => s.id === studentId)
    if (!student) return list

    const internship = (internships ?? []).find(i => i.student_id === studentId && i.allowance != null) ?? null
    const internshipInfo = internship ? (() => {
      const cap = internshipAllowanceMonthCap(internship.start_date, internship.end_date)
      const schoolShare = schoolAllowanceShare(internship.allowance)
      const monthsPaid = (payments ?? []).filter(p => p.internship_id === internship.id).length
      return { allowance: internship.allowance, schoolShare, cap, monthsPaid, remaining: Math.max(0, cap - monthsPaid) }
    })() : null

    list.push({
      id: student.id,
      first_name: student.first_name,
      last_name: student.last_name,
      student_code: student.student_code,
      companyName: one(application.company)?.company_name ?? null,
      position: one(application.position)?.position_name ?? null,
      interviewDate: row.interview_date,
      internship: internshipInfo,
    })
    return list
  }, [])
    .sort((a, b) => {
      const rank = (s: typeof a) => s.internship === null ? 0 : s.internship.remaining > 0 ? 1 : 2
      return rank(a) - rank(b)
    })

  return (
    <div className="space-y-6">
      <PassedInterviewCard students={passedInterviewStudents} />
      <PaymentTable
        payments={payments ?? []}
        students={students ?? []}
        internships={internships ?? []}
        employmentRecords={employmentRecords ?? []}
      />
    </div>
  )
}
