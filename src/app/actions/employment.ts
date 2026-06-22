'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireInternshipOrEmploymentManager } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const employmentSchema = z.object({
  student_id: z.string().uuid(),
  company_name: z.string().min(1),
  position: z.string().min(1),
  employment_type: z.enum(['Full-Time', 'Part-Time', 'Contract']),
  salary: z.number().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  employment_status: z.enum(['Active', 'Resigned', 'Terminated']).default('Active'),
  notes: z.string().optional().nullable(),
})

export type EmploymentFormData = z.infer<typeof employmentSchema>

export async function createEmploymentRecord(data: EmploymentFormData) {
  const auth = await requireInternshipOrEmploymentManager()
  if ('error' in auth) return auth
  const supabase = createAdminClient()
  const parsed = employmentSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: 'Invalid data' }

  const { error } = await supabase.from('employment_records').insert(parsed.data)
  if (error) return { success: false, error: error.message }

  if (parsed.data.employment_status === 'Active') {
    await supabase.from('students').update({ status: 'Employed' }).eq('id', parsed.data.student_id)
  }

  revalidatePath('/employment')
  revalidatePath('/students')
  revalidatePath('/dashboard')
  return { success: true, error: null }
}

export async function updateEmploymentRecord(id: string, data: Partial<EmploymentFormData>) {
  const auth = await requireInternshipOrEmploymentManager()
  if ('error' in auth) return auth
  const supabase = createAdminClient()
  const { error } = await supabase.from('employment_records').update(data).eq('id', id)
  if (error) return { success: false, error: error.message }

  if (data.employment_status && data.student_id) {
    const newStatus = data.employment_status === 'Active' ? 'Employed' : 'Looking For Job'
    await supabase.from('students').update({ status: newStatus }).eq('id', data.student_id)
  }

  revalidatePath('/employment')
  revalidatePath('/dashboard')
  return { success: true, error: null }
}

export async function deleteEmploymentRecord(id: string) {
  const auth = await requireInternshipOrEmploymentManager()
  if ('error' in auth) return auth
  const supabase = createAdminClient()
  const { error } = await supabase.from('employment_records').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/employment')
  return { success: true, error: null }
}
