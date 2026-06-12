'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const interviewSchema = z.object({
  application_id: z.string().uuid(),
  interview_date: z.string(),
  interview_time: z.string().optional().nullable(),
  interview_type: z.enum(['Online', 'On Site']),
  location: z.string().optional().nullable(),
  result: z.enum(['Pending', 'Passed', 'Failed']).default('Pending'),
  feedback: z.string().optional().nullable(),
  interviewer: z.string().optional().nullable(),
})

export type InterviewFormData = z.infer<typeof interviewSchema>

export async function createInterview(data: InterviewFormData) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth
  const supabase = createAdminClient()
  const parsed = interviewSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: 'Invalid data' }

  const { error } = await supabase.from('interviews').insert(parsed.data)
  if (error) return { success: false, error: error.message }

  await supabase
    .from('internship_applications')
    .update({ application_status: 'Interview Scheduled' })
    .eq('id', parsed.data.application_id)

  const { data: app } = await supabase
    .from('internship_applications')
    .select('student_id')
    .eq('id', parsed.data.application_id)
    .single()

  if (app) {
    await supabase.from('students').update({ status: 'Interview Scheduled' }).eq('id', app.student_id)
  }

  revalidatePath('/interviews')
  revalidatePath('/applications')
  revalidatePath('/dashboard')
  return { success: true, error: null }
}

export async function updateInterview(id: string, data: Partial<InterviewFormData>) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth
  const supabase = createAdminClient()
  const { error } = await supabase.from('interviews').update(data).eq('id', id)
  if (error) return { success: false, error: error.message }

  if (data.result && data.application_id) {
    const appStatus = data.result === 'Passed' ? 'Interview Passed'
      : data.result === 'Failed' ? 'Interview Failed'
      : 'Interview Scheduled'
    await supabase.from('internship_applications').update({ application_status: appStatus }).eq('id', data.application_id)

    if (data.result === 'Passed') {
      const { data: app } = await supabase.from('internship_applications').select('student_id').eq('id', data.application_id).single()
      if (app) await supabase.from('students').update({ status: 'Interview Scheduled' }).eq('id', app.student_id)
    }
  }

  revalidatePath('/interviews')
  revalidatePath('/dashboard')
  return { success: true, error: null }
}

export async function deleteInterview(id: string) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth
  const supabase = createAdminClient()
  const { error } = await supabase.from('interviews').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/interviews')
  return { success: true, error: null }
}
