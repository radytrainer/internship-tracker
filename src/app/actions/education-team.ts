'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const educationStaffSchema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type EducationStaffFormData = z.infer<typeof educationStaffSchema>

export async function createEducationStaff(data: EducationStaffFormData) {
  const auth = await requireAdmin()
  if ('error' in auth) return { success: false, error: auth.error }

  const parsed = educationStaffSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const supabase = createAdminClient()

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.full_name },
  })

  if (authError) {
    if (authError.message.toLowerCase().includes('already')) {
      return { success: false, error: 'An account with this email already exists.' }
    }
    return { success: false, error: authError.message }
  }

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: authUser.user.id,
    email: parsed.data.email,
    full_name: parsed.data.full_name,
    role: 'education_team',
    student_id: null,
  })

  if (profileError) return { success: false, error: profileError.message }

  revalidatePath('/education-team')
  return { success: true, error: null }
}

export async function updateEducationStaff(id: string, full_name: string) {
  const auth = await requireAdmin()
  if ('error' in auth) return { success: false, error: auth.error }

  const supabase = createAdminClient()
  const { error } = await supabase.from('profiles').update({ full_name }).eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/education-team')
  return { success: true, error: null }
}

export async function deleteEducationStaff(id: string) {
  const auth = await requireAdmin()
  if ('error' in auth) return { success: false, error: auth.error }

  const supabase = createAdminClient()
  const { error } = await supabase.auth.admin.deleteUser(id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/education-team')
  return { success: true, error: null }
}
