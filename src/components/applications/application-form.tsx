'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createApplication, createApplicationWithOverride, updateApplication } from '@/app/actions/applications'
import type { AppRole } from '@/lib/roles'
import type { InternshipApplication } from '@/types/database.types'

const schema = z.object({
  student_id: z.string().min(1, 'Select a student'),
  company_id: z.string().uuid('Select a company'),
  position_id: z.string().uuid('Select a position'),
  application_date: z.string(),
  application_status: z.enum(['Applied', 'Under Review', 'Interview Scheduled', 'Interview Passed', 'Interview Failed', 'Accepted', 'Rejected']),
  notes: z.string().optional().nullable(),
})

type FormValues = z.infer<typeof schema>

interface ApplicationFormProps {
  open: boolean
  onClose: () => void
  application: InternshipApplication | null
  students: { id: string; first_name: string; last_name: string; student_code: string }[]
  companies: { id: string; company_name: string }[]
  positions: { id: string; position_name: string; company_id: string; max_students: number; intake_date?: string | null; is_active: boolean }[]
  role: AppRole
  currentStudentId: string | null
}

export function ApplicationForm({
  open,
  onClose,
  application,
  students,
  companies,
  positions,
  role,
  currentStudentId,
}: ApplicationFormProps) {
  const [capacityWarning, setCapacityWarning] = useState<string | null>(null)
  const [pendingData, setPendingData] = useState<FormValues | null>(null)
  const isStudent = role === 'student'

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      student_id: '',
      company_id: '',
      position_id: '',
      application_date: new Date().toISOString().split('T')[0],
      application_status: 'Applied',
      notes: '',
    },
  })

  const selectedCompanyId = form.watch('company_id')
  const filteredPositions = positions.filter(p => p.company_id === selectedCompanyId && p.is_active)

  useEffect(() => {
    if (application) {
      form.reset({
        student_id: isStudent ? (currentStudentId ?? application.student_id) : application.student_id,
        company_id: application.company_id,
        position_id: application.position_id,
        application_date: application.application_date,
        application_status: application.application_status,
        notes: application.notes ?? '',
      })
      return
    }

    form.reset({
      student_id: isStudent ? (currentStudentId ?? '') : '',
      company_id: '',
      position_id: '',
      application_date: new Date().toISOString().split('T')[0],
      application_status: 'Applied',
      notes: '',
    })
  }, [application, currentStudentId, form, isStudent, open])

  const onSubmit = async (values: FormValues) => {
    if (application) {
      const result = await updateApplication(application.id, values)
      if (result.error) toast.error(result.error)
      else { toast.success('Application updated'); onClose() }
      return
    }

    const result = await createApplication(values)
    if ('capacityWarning' in result && result.capacityWarning) {
      setCapacityWarning(result.error ?? 'Capacity reached')
      setPendingData(values)
      return
    }

    if (result.error) toast.error(result.error)
    else { toast.success('Application created'); onClose() }
  }

  const handleOverride = async () => {
    if (!pendingData) return
    const result = await createApplicationWithOverride(pendingData)
    if (result.error) toast.error(result.error)
    else {
      toast.success('Application created (capacity override)')
      setCapacityWarning(null)
      setPendingData(null)
      onClose()
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{application ? 'Edit Application' : (isStudent ? 'Add My Application' : 'New Application')}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {!isStudent && (
                <FormField control={form.control} name="student_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {students.map(student => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.first_name} {student.last_name} ({student.student_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              <FormField control={form.control} name="company_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Company *</FormLabel>
                  <Select onValueChange={value => { field.onChange(value); form.setValue('position_id', '') }} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {companies.map(company => <SelectItem key={company.id} value={company.id}>{company.company_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="position_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Position *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCompanyId}>
                    <FormControl><SelectTrigger><SelectValue placeholder={selectedCompanyId ? 'Select position' : 'Select company first'} /></SelectTrigger></FormControl>
                    <SelectContent>
                      {filteredPositions.map(position => (
                        <SelectItem key={position.id} value={position.id}>
                          {position.position_name}
                          {position.intake_date && ` â€” ${new Date(position.intake_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`}
                          {` (max ${position.max_students})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <div className={`grid gap-4 ${isStudent ? 'grid-cols-1' : 'sm:grid-cols-2'}`}>
                <FormField control={form.control} name="application_date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application Date *</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {!isStudent && (
                  <FormField control={form.control} name="application_status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {['Applied', 'Under Review', 'Interview Scheduled', 'Interview Passed', 'Interview Failed', 'Accepted', 'Rejected'].map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
              </div>

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
                  {application ? 'Save Changes' : 'Submit Application'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!capacityWarning} onOpenChange={() => setCapacityWarning(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Position Capacity Reached
            </AlertDialogTitle>
            <AlertDialogDescription>
              {capacityWarning}
              {role !== 'admin' && ' Please choose another position or ask an administrator for help.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCapacityWarning(null)}>Cancel</AlertDialogCancel>
            {role === 'admin' && (
              <AlertDialogAction onClick={handleOverride} className="bg-orange-600 hover:bg-orange-700">
                Override & Submit
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

