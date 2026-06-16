'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'

export async function assignTrainerToClass(classId: string, trainerId: string | null) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('classes')
    .update({ trainer_id: trainerId })
    .eq('id', classId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/settings')
  return { success: true, error: null }
}

export async function getClassesWithTrainers() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('classes')
    .select('*, generation:generations(name, year), trainer:profiles!classes_trainer_id_fkey(id, full_name, email)')
    .order('name')

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function getTrainerProfiles() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('role', 'trainer')
    .order('full_name')

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}
