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
import { createInternship, updateInternship } from '@/app/actions/internships'
import { toast } from 'sonner'
import type { Internship } from '@/types/database.types'

const schema = z.object({
  student_id: z.string().uuid('Select a student'),
  company_id: z.string().uuid('Select a company'),
  position: z.string().min(1, 'Position title required'),
  allowance: z.coerce.number().min(0).optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  agreement_signed: z.boolean().default(false),
  supervisor: z.string().optional().nullable(),
  supervisor_phone: z.string().optional().nullable(),
  supervisor_email: z.string().email().optional().nullable().or(z.literal('')),
  tutor: z.string().optional().nullable(),
  internship_status: z.enum(['Active', 'Completed', 'Terminated']).default('Active'),
  notes: z.string().optional().nullable(),
})

type FormValues = z.infer<typeof schema>

interface InternshipFormProps {
  open: boolean
  onClose: () => void
  internship: Internship | null
  students: { id: string; first_name: string; last_name: string; student_code: string }[]
  companies: { id: string; company_name: string }[]
}

export function InternshipForm({ open, onClose, internship, students, companies }: InternshipFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      student_id: '', company_id: '', position: '',
      allowance: undefined, start_date: '', end_date: '',
      agreement_signed: false, supervisor: '', supervisor_phone: '',
      supervisor_email: '', tutor: '', internship_status: 'Active', notes: '',
    },
  })

  useEffect(() => {
    if (internship) {
      form.reset({
        student_id: internship.student_id,
        company_id: internship.company_id,
        position: internship.position,
        allowance: internship.allowance ?? undefined,
        start_date: internship.start_date ?? '',
        end_date: internship.end_date ?? '',
        agreement_signed: internship.agreement_signed,
        supervisor: internship.supervisor ?? '',
        supervisor_phone: internship.supervisor_phone ?? '',
        supervisor_email: internship.supervisor_email ?? '',
        tutor: internship.tutor ?? '',
        internship_status: internship.internship_status,
        notes: internship.notes ?? '',
      })
    } else {
      form.reset({
        student_id: '', company_id: '', position: '',
        allowance: undefined, start_date: '', end_date: '',
        agreement_signed: false, supervisor: '', supervisor_phone: '',
        supervisor_email: '', tutor: '', internship_status: 'Active', notes: '',
      })
    }
  }, [internship, open, form])

  const onSubmit = async (values: FormValues) => {
    const result = internship
      ? await updateInternship(internship.id, values)
      : await createInternship(values)
    if (result.error) toast.error(result.error)
    else { toast.success(internship ? 'Internship updated' : 'Internship created'); onClose() }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{internship ? 'Edit Internship' : 'Create Internship Record'}</DialogTitle></DialogHeader>
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
            <FormField control={form.control} name="company_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Company *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="position" render={({ field }) => (
              <FormItem>
                <FormLabel>Position Title *</FormLabel>
                <FormControl><Input placeholder="Frontend Developer Intern..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="internship_status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {['Active', 'Completed', 'Terminated'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="allowance" render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Allowance ($)</FormLabel>
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="supervisor" render={({ field }) => (
                <FormItem>
                  <FormLabel>Supervisor Name</FormLabel>
                  <FormControl><Input placeholder="Supervisor..." {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="supervisor_phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Supervisor Phone</FormLabel>
                  <FormControl><Input placeholder="+855..." {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="supervisor_email" render={({ field }) => (
              <FormItem>
                <FormLabel>Supervisor Email</FormLabel>
                <FormControl><Input type="email" placeholder="supervisor@company.com" {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="tutor" render={({ field }) => (
              <FormItem>
                <FormLabel>Tutor</FormLabel>
                <FormControl><Input placeholder="Tutor name..." {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="agreement_signed" render={({ field }) => (
              <FormItem className="flex items-center gap-3">
                <FormControl>
                  <input type="checkbox" checked={field.value} onChange={e => field.onChange(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                </FormControl>
                <FormLabel className="!mt-0">Agreement signed</FormLabel>
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
                {internship ? 'Save Changes' : 'Create Internship'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
