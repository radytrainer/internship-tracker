import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentProfile } from '@/lib/auth/server'
import { PositionTable } from '@/components/positions/position-table'

export const revalidate = 0

export default async function PositionsPage() {
  const { role } = await getCurrentProfile()
  if (role === 'student') redirect('/applications')

  const supabase = createAdminClient()
  const [{ data: positions }, { data: companies }, { data: passedApps }] = await Promise.all([
    supabase
      .from('company_positions')
      .select(`*, company:companies(company_name, industry)`)
      .order('created_at', { ascending: false }),
    supabase.from('companies').select('id, company_name').order('company_name'),
    supabase
      .from('internship_applications')
      .select('position_id')
      .in('application_status', ['Interview Passed', 'Accepted']),
  ])

  const filledCounts = new Map<string, number>()
  for (const app of passedApps ?? []) {
    filledCounts.set(app.position_id, (filledCounts.get(app.position_id) ?? 0) + 1)
  }

  const positionsWithFillCount = (positions ?? []).map(p => ({
    ...p,
    _current_applications: filledCounts.get(p.id) ?? 0,
  }))

  return <PositionTable positions={positionsWithFillCount} companies={companies ?? []} role={role ?? 'admin'} />
}
