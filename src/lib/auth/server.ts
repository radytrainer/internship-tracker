import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

export async function requireAdminOrTrainer() {
  const context = await getCurrentProfile()
  if (context.role !== 'admin' && context.role !== 'trainer' && context.role !== 'ero_team') {
    return { error: 'You do not have permission to perform this action.' }
  }
  return context
}

export async function requireAdminOrStudent() {
  const context = await getCurrentProfile()
  if (context.role !== 'admin' && context.role !== 'student' && context.role !== 'ero_team') return { error: 'You do not have permission.' }
  return context
}

export async function requireAdminOrEducation() {
  const context = await getCurrentProfile()
  if (context.role !== 'admin' && context.role !== 'education_team') {
    return { error: 'You do not have permission to perform this action.' }
  }
  return context
}

export async function requireAdminOrEro() {
  const context = await getCurrentProfile()
  if (context.role !== 'admin' && context.role !== 'ero_team') {
    return { error: 'You do not have permission to perform this action.' }
  }
  return context
}

export async function requireInternshipOrEmploymentManager() {
  const context = await getCurrentProfile()
  if (context.role !== 'admin' && context.role !== 'trainer' && context.role !== 'ero_team' && context.role !== 'pl_team') {
    return { error: 'You do not have permission to perform this action.' }
  }
  return context
}

export async function getTrainerClassIds(profileId: string): Promise<string[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('classes')
    .select('id')
    .eq('trainer_id', profileId)
  return (data ?? []).map((c: { id: string }) => c.id)
}

export async function getEducationStaffClassIds(profileId: string): Promise<string[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('classes')
    .select('id')
    .eq('education_staff_id', profileId)
  return (data ?? []).map((c: { id: string }) => c.id)
}

export async function getPLStaffClassIds(profileId: string): Promise<string[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('classes')
    .select('id')
    .eq('pl_staff_id', profileId)
  return (data ?? []).map((c: { id: string }) => c.id)
}
