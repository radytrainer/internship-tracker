import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentProfile } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { PLTeamTable } from '@/components/pl-team/pl-team-table'

export const revalidate = 0

export default async function PLTeamPage() {
  const { role } = await getCurrentProfile()
  if (role !== 'admin') redirect('/dashboard')

  const admin = createAdminClient()

  const [{ data: staff }, { data: classes }] = await Promise.all([
    admin
      .from('profiles')
      .select('id, full_name, email, created_at')
      .eq('role', 'pl_team')
      .order('full_name'),
    admin
      .from('classes')
      .select('id, name, pl_staff_id, generation:generations(name, year)')
      .order('name'),
  ])

  return <PLTeamTable staff={staff ?? []} classes={classes ?? []} />
}
