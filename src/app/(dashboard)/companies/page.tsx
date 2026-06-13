import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentProfile } from '@/lib/auth/server'
import { CompanyTable } from '@/components/companies/company-table'

export const revalidate = 0

export default async function CompaniesPage() {
  const { role } = await getCurrentProfile()
  if (role === 'student') redirect('/applications')

  const supabase = createAdminClient()
  const { data: companies } = await supabase
    .from('companies')
    .select(`*, company_positions(count), internship_applications(count)`)
    .order('company_name')

  return <CompanyTable companies={companies ?? []} role={role ?? 'admin'} />
}
