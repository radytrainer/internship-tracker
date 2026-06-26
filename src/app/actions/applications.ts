'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentProfile } from '@/lib/auth/server'

const applicationSchema = z.object({
  student_id: z.string().uuid(),
  company_id: z.string().uuid(),
  position_id: z.string().uuid(),
  application_date: z.string(),
  application_status: z.enum([
    'Applied', 'Under Review', 'Interview Scheduled',
    'Interview Passed', 'Interview Failed', 'Accepted', 'Rejected'
  ]),
  notes: z.string().optional().nullable(),
})

export type ApplicationFormData = z.infer<typeof applicationSchema>

async function authorizeApplicationWrite(studentId?: string) {
  const { role, profile } = await getCurrentProfile()

  if (!role) return { success: false, error: 'Not authenticated.' }

  if (role === 'student') {
    if (!profile?.student_id) return { success: false, error: 'Your account is not linked to a student record.' }
    if (studentId && profile.student_id !== studentId) {
      return { success: false, error: 'You can only manage your own applications.' }
    }
    return { role, studentId: profile.student_id }
  }

  // admin and trainer can manage applications
  return { role, studentId: studentId ?? profile?.student_id ?? null }
}

async function canManageExistingApplication(id: string) {
  const auth = await authorizeApplicationWrite()
  if ('error' in auth) return auth

  if (auth.role === 'admin' || auth.role === 'trainer') return auth

  const supabase = createAdminClient()
  const { data: existing } = await supabase
    .from('internship_applications')
    .select('student_id')
    .eq('id', id)
    .single()

  if (!existing || existing.student_id !== auth.studentId) {
    return { success: false, error: 'You can only manage your own applications.' }
  }

  return auth
}

export async function createApplication(data: ApplicationFormData) {
  const parsed = applicationSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: 'Invalid data' }

  const auth = await authorizeApplicationWrite(parsed.data.student_id)
  if ('error' in auth) return auth

  const supabase = createAdminClient()
  const payload = {
    ...parsed.data,
    student_id: auth.role === 'student' ? auth.studentId! : parsed.data.student_id,
    application_status: auth.role === 'student' ? 'Applied' as const : parsed.data.application_status,
  }

  const { data: existing } = await supabase
    .from('internship_applications')
    .select('id')
    .eq('student_id', payload.student_id)
    .eq('company_id', payload.company_id)
    .eq('position_id', payload.position_id)
    .single()

  if (existing) return { success: false, error: 'This student has already applied to this position at this company.' }

  const [{ data: posData }, { count: appCount }] = await Promise.all([
    supabase.from('company_positions').select('max_students, position_name').eq('id', payload.position_id).single(),
    supabase.from('internship_applications').select('id', { count: 'exact', head: true }).eq('position_id', payload.position_id),
  ])

  const slots = posData?.max_students ?? 1
  const maxApplications = slots * 2
  if ((appCount ?? 0) >= maxApplications) {
    return {
      success: false,
      error: `"${posData?.position_name}" is full. This position needs ${slots} staff and accepts at most ${maxApplications} applications. Already at ${appCount}.`,
      capacityWarning: true,
    }
  }

  const { error } = await supabase.from('internship_applications').insert(payload)
  if (error) return { success: false, error: error.message }

  await supabase.from('students').update({ status: 'Internship Applied' }).eq('id', payload.student_id)

  revalidatePath('/applications')
  revalidatePath('/students')
  revalidatePath('/dashboard')
  return { success: true, error: null }
}

export async function createApplicationWithOverride(data: ApplicationFormData) {
  const parsed = applicationSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: 'Invalid data' }

  const { role } = await getCurrentProfile()
  if (role !== 'admin') return { success: false, error: 'Only admins can override position capacity.' }

  const supabase = createAdminClient()
  const { error } = await supabase.from('internship_applications').insert(parsed.data)
  if (error) return { success: false, error: error.message }

  await supabase.from('students').update({ status: 'Internship Applied' }).eq('id', parsed.data.student_id)

  revalidatePath('/applications')
  revalidatePath('/dashboard')
  return { success: true, error: null }
}

export async function updateApplication(id: string, data: Partial<ApplicationFormData>) {
  const auth = await canManageExistingApplication(id)
  if ('error' in auth) return auth

  const supabase = createAdminClient()
  const payload = auth.role === 'student'
    ? {
        company_id: data.company_id,
        position_id: data.position_id,
        application_date: data.application_date,
        notes: data.notes,
      }
    : data

  const { error } = await supabase.from('internship_applications').update(payload).eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/applications')
  revalidatePath('/dashboard')
  return { success: true, error: null }
}

export async function deleteApplication(id: string) {
  const auth = await canManageExistingApplication(id)
  if ('error' in auth) return auth

  const supabase = createAdminClient()
  const { error } = await supabase.from('internship_applications').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/applications')
  revalidatePath('/dashboard')
  return { success: true, error: null }
}
