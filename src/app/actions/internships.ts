'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireInternshipOrEmploymentManager } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const internshipSchema = z.object({
  student_id: z.string().uuid(),
  company_id: z.string().uuid(),
  position: z.string().min(1),
  allowance: z.number().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  agreement_signed: z.boolean().default(false),
  agreement_signed_date: z.string().optional().nullable(),
  supervisor: z.string().optional().nullable(),
  supervisor_phone: z.string().optional().nullable(),
  supervisor_email: z.string().email().optional().nullable().or(z.literal('')),
  tutor: z.string().optional().nullable(),
  internship_status: z.enum(['Active', 'Completed', 'Terminated']).default('Active'),
  notes: z.string().optional().nullable(),
})

export type InternshipFormData = z.infer<typeof internshipSchema>

export async function createInternship(data: InternshipFormData) {
  const auth = await requireInternshipOrEmploymentManager()
  if ('error' in auth) return auth
  const supabase = createAdminClient()
  const parsed = internshipSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: 'Invalid data' }

  const d = parsed.data
  const { error } = await supabase.from('internships').insert({
    ...d,
    supervisor_email: d.supervisor_email || null,
  })
  if (error) return { success: false, error: error.message }

  const newStatus = d.internship_status === 'Completed' ? 'Internship Completed' : 'Internship Active'
  await supabase.from('students').update({ status: newStatus }).eq('id', d.student_id)

  revalidatePath('/internships')
  revalidatePath('/students')
  revalidatePath('/dashboard')
  return { success: true, error: null }
}

export async function updateInternship(id: string, data: Partial<InternshipFormData>) {
  const auth = await requireInternshipOrEmploymentManager()
  if ('error' in auth) return auth
  const supabase = createAdminClient()
  const supervisor_email = data.supervisor_email || null
  const { error } = await supabase.from('internships').update({ ...data, supervisor_email }).eq('id', id)
  if (error) return { success: false, error: error.message }

  if (data.internship_status && data.student_id) {
    const newStatus = data.internship_status === 'Active' ? 'Internship Active'
      : data.internship_status === 'Completed' ? 'Internship Completed'
      : 'Looking For Job'
    await supabase.from('students').update({ status: newStatus }).eq('id', data.student_id)
  }

  revalidatePath('/internships')
  revalidatePath('/students')
  revalidatePath('/dashboard')
  return { success: true, error: null }
}

export async function deleteInternship(id: string) {
  const auth = await requireInternshipOrEmploymentManager()
  if ('error' in auth) return auth
  const supabase = createAdminClient()
  const { error } = await supabase.from('internships').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/internships')
  return { success: true, error: null }
}
