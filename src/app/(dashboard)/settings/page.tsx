import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { normalizeRole } from '@/lib/roles'
import { SettingsClient } from '@/components/settings/settings-client'
import { TrainerClassManager } from '@/components/settings/trainer-class-manager'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const role = normalizeRole(profile?.role)

  let classes = null
  let trainers = null

  if (role === 'admin') {
    const admin = createAdminClient()
    const [{ data: classData }, { data: trainerData }] = await Promise.all([
      admin
        .from('classes')
        .select('id, name, trainer_id, generation:generations(name, year), trainer:profiles!classes_trainer_id_fkey(id, full_name, email)')
        .order('name'),
      admin
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'trainer')
        .order('full_name'),
    ])
    classes = classData
    trainers = trainerData
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <SettingsClient profile={profile} userEmail={user.email ?? ''} />
      {role === 'admin' && (
        <TrainerClassManager
          classes={classes ?? []}
          trainers={trainers ?? []}
        />
      )}
    </div>
  )
}
