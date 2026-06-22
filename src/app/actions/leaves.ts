'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminOrEducation } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const leaveSchema = z.object({
  student_id: z.string().uuid(),
  internship_id: z.string().uuid().optional().nullable(),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  reason: z.string().optional().nullable(),
  status: z.enum(['Pending', 'Approved', 'Rejected']).default('Pending'),
  notes: z.string().optional().nullable(),
})

export type LeaveFormData = z.infer<typeof leaveSchema>

export async function createLeave(data: LeaveFormData) {
  const auth = await requireAdminOrEducation()
  if ('error' in auth) return { success: false, error: auth.error }
  const parsed = leaveSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const supabase = createAdminClient()
  const { error } = await supabase.from('student_leaves').insert({
    ...parsed.data,
    internship_id: parsed.data.internship_id || null,
  })
  if (error) return { success: false, error: error.message }
  revalidatePath('/leaves')
  return { success: true, error: null }
}

export async function updateLeave(id: string, data: LeaveFormData) {
  const auth = await requireAdminOrEducation()
  if ('error' in auth) return { success: false, error: auth.error }
  const parsed = leaveSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const supabase = createAdminClient()
  const { error } = await supabase.from('student_leaves').update({
    ...parsed.data,
    internship_id: parsed.data.internship_id || null,
  }).eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/leaves')
  return { success: true, error: null }
}

export async function updateLeaveStatus(id: string, status: 'Pending' | 'Approved' | 'Rejected') {
  const auth = await requireAdminOrEducation()
  if ('error' in auth) return { success: false, error: auth.error }

  const supabase = createAdminClient()
  const { error } = await supabase.from('student_leaves').update({
    status,
    reviewed_by: auth.user?.id ?? null,
    reviewed_at: new Date().toISOString(),
  }).eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/leaves')
  return { success: true, error: null }
}

export async function deleteLeave(id: string) {
  const auth = await requireAdminOrEducation()
  if ('error' in auth) return { success: false, error: auth.error }

  const supabase = createAdminClient()
  const { error } = await supabase.from('student_leaves').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/leaves')
  return { success: true, error: null }
}
