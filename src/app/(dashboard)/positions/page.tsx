import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentProfile } from '@/lib/auth/server'
import { PositionTable } from '@/components/positions/position-table'

export const revalidate = 0

export default async function PositionsPage() {
  const { role } = await getCurrentProfile()
  if (role === 'student') redirect('/applications')

  const supabase = createAdminClient()
  const [{ data: positions }, { data: companies }, { data: apps }, { data: interviews }] = await Promise.all([
    supabase
      .from('company_positions')
      .select(`*, company:companies(company_name, industry)`)
      .order('created_at', { ascending: false }),
    supabase.from('companies').select('id, company_name').order('company_name'),
    supabase.from('internship_applications').select('id, position_id, application_status'),
    supabase.from('interviews').select('application_id, result'),
  ])

  // a passed interview is the source of truth — application_status can lag behind it
  const passedAppIds = new Set(
    (interviews ?? []).filter(i => i.result === 'Passed').map(i => i.application_id)
  )

  const filledCounts = new Map<string, number>()
  for (const app of apps ?? []) {
    const passed = app.application_status === 'Accepted'
      || app.application_status === 'Interview Passed'
      || passedAppIds.has(app.id)
    if (passed) {
      filledCounts.set(app.position_id, (filledCounts.get(app.position_id) ?? 0) + 1)
    }
  }

  const positionsWithFillCount = (positions ?? []).map(p => ({
    ...p,
    _current_applications: filledCounts.get(p.id) ?? 0,
  }))

  return <PositionTable positions={positionsWithFillCount} companies={companies ?? []} role={role ?? 'admin'} />
}
