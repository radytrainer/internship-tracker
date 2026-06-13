'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { AvatarUpload } from '@/components/ui/avatar-upload'
import { createStudent, updateStudent } from '@/app/actions/students'
import { toast } from 'sonner'
import type { Student, Class, Generation } from '@/types/database.types'

const schema = z.object({
  student_code: z.string().min(1, 'Required'),
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  gender: z.enum(['Male', 'Female']),
  phone: z.string().optional().nullable(),
  email: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
  class_id: z.string().uuid().optional().nullable(),
  generation_id: z.string().uuid().optional().nullable(),
  status: z.enum([
    'Studying', 'Looking For Internship', 'Internship Applied', 'Interview Scheduled',
    'Internship Accepted', 'Internship Active', 'Internship Completed', 'Looking For Job', 'Employed'
  ]),
  notes: z.string().optional().nullable(),
  avatar_url: z.string().url().optional().nullable().or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

interface StudentFormProps {
  open: boolean
  onClose: () => void
  student: Student | null
  classes: Class[]
  generations: Generation[]
}

const STATUSES = [
  'Studying', 'Looking For Internship', 'Internship Applied', 'Interview Scheduled',
  'Internship Accepted', 'Internship Active', 'Internship Completed', 'Looking For Job', 'Employed'
]

export function StudentForm({ open, onClose, student, classes, generations }: StudentFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      student_code: '', first_name: '', last_name: '', gender: 'Male',
      phone: '', email: '', class_id: null, generation_id: null,
      status: 'Studying', notes: '',
    },
  })

  useEffect(() => {
    if (student) {
      form.reset({
        student_code: student.student_code,
        first_name: student.first_name,
        last_name: student.last_name,
        gender: student.gender,
        phone: student.phone ?? '',
        email: student.email ?? '',
        class_id: student.class_id,
        generation_id: student.generation_id,
        status: student.status,
        notes: student.notes ?? '',
        avatar_url: (student as Student & { avatar_url?: string | null }).avatar_url ?? '',
      })
    } else {
      form.reset({ student_code: '', first_name: '', last_name: '', gender: 'Male', phone: '', email: '', class_id: null, generation_id: null, status: 'Studying', notes: '', avatar_url: '' })
    }
  }, [student, open, form])

  const onSubmit = async (values: FormValues) => {
    const result = student
      ? await updateStudent(student.id, values)
      : await createStudent(values)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(student ? 'Student updated' : 'Student created')
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{student ? 'Edit Student' : 'Add New Student'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* Avatar upload */}
            <FormField control={form.control} name="avatar_url" render={({ field }) => (
              <FormItem>
                <FormLabel>Profile Photo</FormLabel>
                <FormControl>
                  <AvatarUpload
                    value={field.value}
                    onChange={field.onChange}
                    name={`${form.watch('first_name')} ${form.watch('last_name')}`.trim() || 'Student'}
                    folder="students"
                    shape="circle"
                    size={80}
                  />
                </FormControl>
              </FormItem>
            )} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="student_code" render={({ field }) => (
                <FormItem>
                  <FormLabel>Student Code *</FormLabel>
                  <FormControl><Input placeholder="STD-001" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="gender" render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="first_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name *</FormLabel>
                  <FormControl><Input placeholder="John" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="last_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name *</FormLabel>
                  <FormControl><Input placeholder="Doe" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" placeholder="john@email.com" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl><Input placeholder="+1 555 0000" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="generation_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Generation</FormLabel>
                  <Select onValueChange={v => field.onChange(v === 'none' ? null : v)} value={field.value ?? 'none'}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select generation" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {generations.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="class_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Class</FormLabel>
                  <Select onValueChange={v => field.onChange(v === 'none' ? null : v)} value={field.value ?? 'none'}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem>
                <FormLabel>Status *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl><Textarea placeholder="Additional notes..." {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {student ? 'Save Changes' : 'Add Student'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

