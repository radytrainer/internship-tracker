'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminOrEducation } from '@/lib/auth/server'
import { allowanceMonthCap, schoolAllowanceShare, employmentPncContribution, formatCurrency } from '@/lib/utils'
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

// internship-linked payments represent the portion paid to the school: normally allowance minus
// the student's $110 keep, capped at 4 monthly payments (or fewer if the internship is shorter).
// The amount is editable (some months the student doesn't get their full allowance), but it can
// never exceed that standard share, so the student's $110 keep is never eaten into.
async function validateInternshipAllowance(
  supabase: ReturnType<typeof createAdminClient>,
  internshipId: string,
  amount: number,
  excludePaymentId?: string
) {
  const { data: internship } = await supabase
    .from('internships')
    .select('allowance, start_date, end_date')
    .eq('id', internshipId)
    .single()
  if (!internship) return { error: 'Internship not found.' }

  const cap = allowanceMonthCap(internship.start_date, internship.end_date)
  let countQuery = supabase
    .from('allowance_payments')
    .select('id', { count: 'exact', head: true })
    .eq('internship_id', internshipId)
  if (excludePaymentId) countQuery = countQuery.neq('id', excludePaymentId)
  const { count } = await countQuery

  if ((count ?? 0) >= cap) {
    return { error: `This internship has already reached its ${cap}-month allowance payment limit.` }
  }

  const maxAmount = schoolAllowanceShare(internship.allowance)
  if (amount > maxAmount) {
    return { error: `Amount can't exceed ${formatCurrency(maxAmount)} — the student always keeps at least $110 of their allowance.` }
  }

  return { ok: true as const }
}

// full-time job payments follow the same 4-month cap (or fewer if the job placement is
// shorter), with the max monthly amount coming from the salary-based PNC contribution instead.
async function validateEmploymentAllowance(
  supabase: ReturnType<typeof createAdminClient>,
  employmentId: string,
  amount: number,
  excludePaymentId?: string
) {
  const { data: employment } = await supabase
    .from('employment_records')
    .select('salary, start_date, end_date')
    .eq('id', employmentId)
    .single()
  if (!employment) return { error: 'Employment record not found.' }

  const cap = allowanceMonthCap(employment.start_date, employment.end_date)
  let countQuery = supabase
    .from('allowance_payments')
    .select('id', { count: 'exact', head: true })
    .eq('employment_id', employmentId)
  if (excludePaymentId) countQuery = countQuery.neq('id', excludePaymentId)
  const { count } = await countQuery

  if ((count ?? 0) >= cap) {
    return { error: `This full-time job has already reached its ${cap}-month allowance payment limit.` }
  }

  const maxAmount = employmentPncContribution(employment.salary)
  if (amount > maxAmount) {
    return { error: `Amount can't exceed ${formatCurrency(maxAmount)} for this salary.` }
  }

  return { ok: true as const }
}

export async function createPayment(data: PaymentFormData) {
  const auth = await requireAdminOrEducation()
  if ('error' in auth) return { success: false, error: auth.error }
  const parsed = paymentSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const supabase = createAdminClient()

  if (parsed.data.internship_id) {
    const check = await validateInternshipAllowance(supabase, parsed.data.internship_id, parsed.data.amount)
    if ('error' in check) return { success: false, error: check.error }
  }
  if (parsed.data.employment_id) {
    const check = await validateEmploymentAllowance(supabase, parsed.data.employment_id, parsed.data.amount)
    if ('error' in check) return { success: false, error: check.error }
  }

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

  if (parsed.data.internship_id) {
    const check = await validateInternshipAllowance(supabase, parsed.data.internship_id, parsed.data.amount, id)
    if ('error' in check) return { success: false, error: check.error }
  }
  if (parsed.data.employment_id) {
    const check = await validateEmploymentAllowance(supabase, parsed.data.employment_id, parsed.data.amount, id)
    if ('error' in check) return { success: false, error: check.error }
  }

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
