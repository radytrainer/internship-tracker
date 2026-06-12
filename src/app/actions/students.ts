'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const studentSchema = z.object({
  student_code: z.string().min(1),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  gender: z.enum(['Male', 'Female']),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  class_id: z.string().uuid().optional().nullable(),
  generation_id: z.string().uuid().optional().nullable(),
  status: z.enum([
    'Studying', 'Looking For Internship', 'Internship Applied',
    'Interview Scheduled', 'Internship Accepted', 'Internship Active',
    'Internship Completed', 'Looking For Job', 'Employed'
  ]),
  notes: z.string().optional().nullable(),
  avatar_url: z.string().url().optional().nullable().or(z.literal('')),
})

export type StudentFormData = z.infer<typeof studentSchema>

export async function createStudent(data: StudentFormData) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth
  const supabase = createAdminClient()
  const parsed = studentSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: 'Invalid data' }

  const { email, ...rest } = parsed.data
  const { error } = await supabase.from('students').insert({ ...rest, email: email || null })
  if (error) return { success: false, error: error.message }
  revalidatePath('/students')
  revalidatePath('/dashboard')
  return { success: true, error: null }
}

export async function updateStudent(id: string, data: StudentFormData) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth
  const supabase = createAdminClient()
  const parsed = studentSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: 'Invalid data' }

  const { email, ...rest } = parsed.data
  const { error } = await supabase.from('students').update({ ...rest, email: email || null }).eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/students')
  revalidatePath('/dashboard')
  return { success: true, error: null }
}

export async function deleteStudent(id: string) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth
  const supabase = createAdminClient()
  const { error } = await supabase.from('students').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/students')
  revalidatePath('/dashboard')
  return { success: true, error: null }
}

export async function updateStudentStatus(id: string, status: string) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth
  const supabase = createAdminClient()
  const { error } = await supabase.from('students').update({ status }).eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/students')
  revalidatePath('/dashboard')
  return { success: true, error: null }
}

export async function deleteAllStudents() {
  const auth = await requireAdmin()
  if ('error' in auth) return auth
  const supabase = createAdminClient()
  const { error } = await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) return { success: false, error: error.message }
  revalidatePath('/students')
  revalidatePath('/dashboard')
  return { success: true, error: null }
}

export async function bulkImportStudents(rows: StudentFormData[]) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth
  const supabase = createAdminClient()
  const valid = rows
    .map(r => studentSchema.safeParse(r))
    .filter((r): r is { success: true; data: StudentFormData } => r.success)
    .map(r => ({ ...r.data, email: r.data.email || null }))

  if (valid.length === 0) return { success: false, error: 'No valid rows to import', inserted: 0 }

  const { error } = await supabase.from('students').insert(valid)
  if (error) return { success: false, error: error.message, inserted: 0 }
  revalidatePath('/students')
  revalidatePath('/dashboard')
  return { success: true, error: null, inserted: valid.length }
}

async function provisionAuthAccount(supabase: ReturnType<typeof createAdminClient>, studentId: string) {
  const { data: student } = await supabase
    .from('students')
    .select('id, email, first_name, last_name')
    .eq('id', studentId)
    .single()

  if (!student?.email) return { success: false, error: 'Student has no email address' }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: student.email,
    password: 'password123',
    email_confirm: true,
    user_metadata: { full_name: `${student.first_name} ${student.last_name}` },
  })

  if (authError) {
    if (authError.message.toLowerCase().includes('already')) {
      return { success: false, error: 'An account with this email already exists' }
    }
    return { success: false, error: authError.message }
  }

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: authData.user.id,
    email: student.email,
    full_name: `${student.first_name} ${student.last_name}`,
    role: 'student',
    student_id: student.id,
  })

  if (profileError) return { success: false, error: profileError.message }
  return { success: true, error: null }
}

export async function createStudentAuthAccount(studentId: string) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth
  const supabase = createAdminClient()
  const result = await provisionAuthAccount(supabase, studentId)
  if (result.success) revalidatePath('/students')
  return result
}

export async function createAllStudentAuthAccounts() {
  const auth = await requireAdmin()
  if ('error' in auth) return auth
  const supabase = createAdminClient()

  const { data: students } = await supabase
    .from('students')
    .select('id')
    .not('email', 'is', null)

  if (!students?.length) return { success: false, error: 'No students with email found', created: 0, skipped: 0 }

  let created = 0
  let skipped = 0

  for (const s of students) {
    const result = await provisionAuthAccount(supabase, s.id)
    if (result.success) created++
    else skipped++
  }

  revalidatePath('/students')
  return { success: true, error: null, created, skipped }
}
