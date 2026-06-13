'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin, requireAdminOrStudent } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const companySchema = z.object({
  company_name: z.string().min(1),
  industry: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  contact_person: z.string().optional().nullable(),
  contact_email: z.string().email().optional().nullable().or(z.literal('')),
  contact_phone: z.string().optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal('')),
  max_students_per_company: z.number().int().min(0).default(10),
  is_visible: z.boolean().default(true),
  has_mou: z.boolean().default(false),
  is_blacklisted: z.boolean().default(false),
  notes: z.string().optional().nullable(),
  logo_url: z.string().url().optional().nullable().or(z.literal('')),
})

const positionSchema = z.object({
  company_id: z.string().uuid(),
  position_name: z.string().min(1),
  max_students: z.number().int().min(1).default(5),
  intake_date: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
})

export type CompanyFormData = z.infer<typeof companySchema>
export type PositionFormData = z.infer<typeof positionSchema>

export async function createCompany(data: CompanyFormData) {
  const auth = await requireAdminOrStudent()
  if ('error' in auth) return auth
  const supabase = createAdminClient()
  const parsed = companySchema.safeParse(data)
  if (!parsed.success) return { success: false, error: 'Invalid data' }

  const d = parsed.data
  const { error } = await supabase.from('companies').insert({
    ...d,
    contact_email: d.contact_email || null,
    website: d.website || null,
  })
  if (error) return { success: false, error: error.message }
  revalidatePath('/companies')
  return { success: true, error: null }
}

export async function updateCompany(id: string, data: CompanyFormData) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth
  const supabase = createAdminClient()
  const parsed = companySchema.safeParse(data)
  if (!parsed.success) return { success: false, error: 'Invalid data' }

  const d = parsed.data
  const { error } = await supabase.from('companies').update({
    ...d,
    contact_email: d.contact_email || null,
    website: d.website || null,
  }).eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/companies')
  return { success: true, error: null }
}

export async function deleteCompany(id: string) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth
  const supabase = createAdminClient()
  const { error } = await supabase.from('companies').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/companies')
  return { success: true, error: null }
}

export async function createPosition(data: PositionFormData) {
  const auth = await requireAdminOrStudent()
  if ('error' in auth) return auth
  const supabase = createAdminClient()
  const parsed = positionSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: 'Invalid data' }

  const { error } = await supabase.from('company_positions').insert(parsed.data)
  if (error) return { success: false, error: error.message }
  revalidatePath('/positions')
  revalidatePath('/companies')
  return { success: true, error: null }
}

export async function updatePosition(id: string, data: PositionFormData) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth
  const supabase = createAdminClient()
  const parsed = positionSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: 'Invalid data' }

  const { error } = await supabase.from('company_positions').update(parsed.data).eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/positions')
  return { success: true, error: null }
}

export async function deletePosition(id: string) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth
  const supabase = createAdminClient()
  const { error } = await supabase.from('company_positions').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/positions')
  return { success: true, error: null }
}

export async function toggleCompanyVisibility(id: string, is_visible: boolean) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth
  const supabase = createAdminClient()
  const { error } = await supabase.from('companies').update({ is_visible }).eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/companies')
  return { success: true, error: null }
}

export async function toggleCompanyMOU(id: string, has_mou: boolean) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth
  const supabase = createAdminClient()
  const { error } = await supabase.from('companies').update({ has_mou }).eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/companies')
  return { success: true, error: null }
}

export async function toggleCompanyBlacklist(id: string, is_blacklisted: boolean) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth
  const supabase = createAdminClient()
  const { error } = await supabase.from('companies').update({ is_blacklisted }).eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/companies')
  return { success: true, error: null }
}
