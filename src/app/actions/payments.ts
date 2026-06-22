'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminOrEducation } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const paymentSchema = z.object({
  student_id: z.string().uuid(),
  internship_id: z.string().uuid().optional().nullable(),
  employment_id: z.string().uuid().optional().nullable(),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  payment_date: z.string().min(1),
  payment_time: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export type PaymentFormData = z.infer<typeof paymentSchema>

export async function createPayment(data: PaymentFormData) {
  const auth = await requireAdminOrEducation()
  if ('error' in auth) return { success: false, error: auth.error }
  const parsed = paymentSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const supabase = createAdminClient()
  const { error } = await supabase.from('allowance_payments').insert({
    ...parsed.data,
    internship_id: parsed.data.internship_id || null,
    employment_id: parsed.data.employment_id || null,
    payment_time: parsed.data.payment_time || null,
    confirmed_by: auth.user?.id ?? null,
  })
  if (error) return { success: false, error: error.message }
  revalidatePath('/payments')
  return { success: true, error: null }
}

export async function updatePayment(id: string, data: PaymentFormData) {
  const auth = await requireAdminOrEducation()
  if ('error' in auth) return { success: false, error: auth.error }
  const parsed = paymentSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const supabase = createAdminClient()
  const { error } = await supabase.from('allowance_payments').update({
    ...parsed.data,
    internship_id: parsed.data.internship_id || null,
    employment_id: parsed.data.employment_id || null,
    payment_time: parsed.data.payment_time || null,
  }).eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/payments')
  return { success: true, error: null }
}

export async function deletePayment(id: string) {
  const auth = await requireAdminOrEducation()
  if ('error' in auth) return { success: false, error: auth.error }

  const supabase = createAdminClient()
  const { error } = await supabase.from('allowance_payments').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/payments')
  return { success: true, error: null }
}
