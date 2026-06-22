import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentProfile } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { PaymentTable } from '@/components/payments/payment-table'

export const revalidate = 0

export default async function PaymentsPage() {
  const { role } = await getCurrentProfile()
  if (role !== 'admin' && role !== 'education_team') redirect('/dashboard')

  const admin = createAdminClient()

  const [{ data: payments }, { data: students }, { data: internships }] = await Promise.all([
    admin
      .from('allowance_payments')
      .select('*, student:students(id, first_name, last_name, student_code), internship:internships(id, position, allowance, company:companies(company_name))')
      .order('payment_date', { ascending: false }),
    admin
      .from('students')
      .select('id, first_name, last_name, student_code')
      .order('first_name'),
    admin
      .from('internships')
      .select('id, student_id, position, allowance, company:companies(company_name)')
      .order('created_at', { ascending: false }),
  ])

  return <PaymentTable payments={payments ?? []} students={students ?? []} internships={internships ?? []} />
}
