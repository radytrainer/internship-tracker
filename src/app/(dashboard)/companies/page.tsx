import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentProfile } from '@/lib/auth/server'
import { CompanyTable } from '@/components/companies/company-table'

export const revalidate = 0

export default async function CompaniesPage() {
  const [{ role }, supabase] = [await getCurrentProfile(), createAdminClient()]
  let query = supabase
    .from('companies')
    .select(`*, company_positions(count), internship_applications(count)`)
    .order('company_name')

  if (role === 'student') {
    query = query.eq('is_visible', true)
  }

  const { data: companies } = await query

  return <CompanyTable companies={companies ?? []} role={role ?? 'admin'} />
}
