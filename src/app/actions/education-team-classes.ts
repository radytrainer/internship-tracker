'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'

export async function assignEducationStaffToClass(classId: string, staffId: string | null) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('classes')
    .update({ education_staff_id: staffId })
    .eq('id', classId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/education-team')
  revalidatePath('/students')
  return { success: true, error: null }
}
