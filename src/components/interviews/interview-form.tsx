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
import { createInterview, updateInterview } from '@/app/actions/interviews'
import { toast } from 'sonner'
import type { Interview } from '@/types/database.types'
import type { AppRole } from '@/lib/roles'

const schema = z.object({
  application_id: z.string().uuid('Select an application'),
  interview_date: z.string().min(1, 'Required'),
  interview_time: z.string().optional().nullable(),
  interview_type: z.enum(['Online', 'On Site']),
  location: z.string().optional().nullable(),
  interviewer: z.string().optional().nullable(),
  result: z.enum(['Pending', 'Passed', 'Failed']).default('Pending'),
  feedback: z.string().optional().nullable(),
})

type FormValues = z.infer<typeof schema>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApplicationOption = any

interface InterviewFormProps {
  open: boolean; onClose: () => void; interview: Interview | null
  applications: ApplicationOption[]; role?: AppRole
}

export function InterviewForm({ open, onClose, interview, applications, role }: InterviewFormProps) {
  const isStudent = role === 'student'
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      application_id: '', interview_date: '', interview_time: '',
      interview_type: 'Online', location: '',
      interviewer: '', result: 'Pending', feedback: '',
    },
  })

  useEffect(() => {
    if (interview) {
      form.reset({
        application_id: interview.application_id,
        interview_date: interview.interview_date,
        interview_time: interview.interview_time ?? '',
        interview_type: interview.interview_type,
        location: interview.location ?? '',
        interviewer: interview.interviewer ?? '',
        result: interview.result,
        feedback: interview.feedback ?? '',
      })
    } else {
      form.reset({
        application_id: '', interview_date: '', interview_time: '',
        interview_type: 'Online', location: '',
        interviewer: '', result: 'Pending', feedback: '',
      })
    }
  }, [interview, open, form])

  const onSubmit = async (values: FormValues) => {
    const result = interview ? await updateInterview(interview.id, values) : await createInterview(values)
    if (result.error) toast.error(result.error)
    else { toast.success(interview ? 'Interview updated' : 'Interview scheduled'); onClose() }
  }

  const getAppLabel = (a: ApplicationOption) =>
    `${a.student?.first_name ?? ''} ${a.student?.last_name ?? ''} — ${a.company?.company_name ?? ''} / ${a.position?.position_name ?? ''}`

  // students who already accepted a placement don't need another interview scheduled,
  // but keep the currently-linked application selectable when editing
  const applicationOptions = applications.filter((a: ApplicationOption) =>
    a.application_status !== 'Accepted' || a.id === interview?.application_id
  )

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{interview ? 'Edit Interview' : 'Schedule Interview'}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="application_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Application *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select application" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {applicationOptions.map((a: ApplicationOption) => (
                      <SelectItem key={a.id} value={a.id}>{getAppLabel(a)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="interview_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date *</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="interview_time" render={({ field }) => (
                <FormItem>
                  <FormLabel>Time</FormLabel>
                  <FormControl><Input type="time" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className={`grid gap-4 ${isStudent ? 'grid-cols-1' : 'sm:grid-cols-2'}`}>
              <FormField control={form.control} name="interview_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {['Online', 'On Site'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              {!isStudent && (
                <FormField control={form.control} name="result" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Result *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {['Pending', 'Passed', 'Failed'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
            </div>
            <FormField control={form.control} name="location" render={({ field }) => (
              <FormItem>
                <FormLabel>Location / Link</FormLabel>
                <FormControl><Input placeholder="Office address or meeting link..." {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="interviewer" render={({ field }) => (
              <FormItem>
                <FormLabel>Interviewer Name</FormLabel>
                <FormControl><Input placeholder="HR Manager name..." {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            {!isStudent && (
              <FormField control={form.control} name="feedback" render={({ field }) => (
                <FormItem>
                  <FormLabel>Feedback / Notes</FormLabel>
                  <FormControl><Textarea placeholder="Interview feedback..." {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {interview ? 'Save Changes' : 'Schedule Interview'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

