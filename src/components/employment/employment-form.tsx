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
import { createEmploymentRecord, updateEmploymentRecord } from '@/app/actions/employment'
import { toast } from 'sonner'
import type { EmploymentRecord } from '@/types/database.types'

const schema = z.object({
  student_id: z.string().uuid('Select a student'),
  company_name: z.string().min(1, 'Employer name required'),
  position: z.string().min(1, 'Job title required'),
  employment_type: z.enum(['Full-Time', 'Part-Time', 'Contract']),
  employment_status: z.enum(['Active', 'Resigned', 'Terminated']).default('Active'),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  salary: z.coerce.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
})

type FormValues = z.infer<typeof schema>

interface EmploymentFormProps {
  open: boolean
  onClose: () => void
  record: EmploymentRecord | null
  students: { id: string; first_name: string; last_name: string; student_code: string }[]
}

export function EmploymentForm({ open, onClose, record, students }: EmploymentFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      student_id: '', company_name: '', position: '',
      employment_type: 'Full-Time', employment_status: 'Active',
      start_date: '', end_date: '', salary: undefined, notes: '',
    },
  })

  useEffect(() => {
    if (record) {
      form.reset({
        student_id: record.student_id,
        company_name: record.company_name,
        position: record.position,
        employment_type: record.employment_type,
        employment_status: record.employment_status,
        start_date: record.start_date ?? '',
        end_date: record.end_date ?? '',
        salary: record.salary ?? undefined,
        notes: record.notes ?? '',
      })
    } else {
      form.reset({
        student_id: '', company_name: '', position: '',
        employment_type: 'Full-Time', employment_status: 'Active',
        start_date: '', end_date: '', salary: undefined, notes: '',
      })
    }
  }, [record, open, form])

  const onSubmit = async (values: FormValues) => {
    const result = record
      ? await updateEmploymentRecord(record.id, values)
      : await createEmploymentRecord(values)
    if (result.error) toast.error(result.error)
    else { toast.success(record ? 'Employment record updated' : 'Employment record created'); onClose() }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{record ? 'Edit Employment Record' : 'Add Employment Record'}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="student_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Student *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {students.map(s => <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.student_code})</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="company_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Employer *</FormLabel>
                  <FormControl><Input placeholder="Company name..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="position" render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title *</FormLabel>
                  <FormControl><Input placeholder="Software Engineer..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="employment_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {['Full-Time', 'Part-Time', 'Contract'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="employment_status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {['Active', 'Resigned', 'Terminated'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="start_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="end_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="salary" render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Salary ($)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} step={0.01} placeholder="0.00"
                    {...field}
                    value={field.value ?? ''}
                    onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                  />
                </FormControl>
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
                {record ? 'Save Changes' : 'Add Record'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

