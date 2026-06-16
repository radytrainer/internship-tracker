import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentProfile } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { TrainerTable } from '@/components/trainers/trainer-table'

export const revalidate = 0

export default async function TrainersPage() {
  const { role } = await getCurrentProfile()
  if (role !== 'admin') redirect('/dashboard')

  const admin = createAdminClient()

  const [{ data: trainers }, { data: classes }] = await Promise.all([
    admin
      .from('profiles')
      .select('id, full_name, email, created_at')
      .eq('role', 'trainer')
      .order('full_name'),
    admin
      .from('classes')
      .select('id, name, trainer_id, generation:generations(name, year)')
      .order('name'),
  ])

  return (
    <TrainerTable
      trainers={trainers ?? []}
      classes={classes ?? []}
    />
  )
}
