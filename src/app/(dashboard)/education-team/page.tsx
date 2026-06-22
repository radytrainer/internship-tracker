import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentProfile } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { EducationTeamTable } from '@/components/education-team/education-team-table'

export const revalidate = 0

export default async function EducationTeamPage() {
  const { role } = await getCurrentProfile()
  if (role !== 'admin') redirect('/dashboard')

  const admin = createAdminClient()

  const { data: staff } = await admin
    .from('profiles')
    .select('id, full_name, email, created_at')
    .eq('role', 'education_team')
    .order('full_name')

  return <EducationTeamTable staff={staff ?? []} />
}
