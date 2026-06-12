import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentProfile } from '@/lib/auth/server'
import { PositionTable } from '@/components/positions/position-table'

export const revalidate = 0

export default async function PositionsPage() {
  const [{ role }, supabase] = [await getCurrentProfile(), createAdminClient()]
  const [{ data: positions }, { data: companies }] = await Promise.all([
    supabase
      .from('company_positions')
      .select(`*, company:companies(company_name, industry)`)
      .order('created_at', { ascending: false }),
    supabase.from('companies').select('id, company_name').order('company_name'),
  ])

  return <PositionTable positions={positions ?? []} companies={companies ?? []} role={role ?? 'admin'} />
}
