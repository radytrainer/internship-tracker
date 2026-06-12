import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { normalizeRole, type AppRole } from '@/lib/roles'
import type { Profile, UserRole } from '@/types/database.types'

export async function getCurrentProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, profile: null, role: null as AppRole | null }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  return {
    user,
    profile: profile ?? null,
    role: normalizeRole(profile?.role as UserRole | null | undefined),
  }
}

export async function requireAdmin() {
  const context = await getCurrentProfile()
  if (context.role !== 'admin') return { error: 'Only admins can perform this action.' }
  return context
}

export async function requireAdminOrStudent() {
  const context = await getCurrentProfile()
  if (!context.role || context.role === 'trainer') return { error: 'You do not have permission.' }
  return context
}
