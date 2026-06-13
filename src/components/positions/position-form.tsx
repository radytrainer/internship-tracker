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
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'
import { createPosition, updatePosition } from '@/app/actions/companies'
import { toast } from 'sonner'
import type { CompanyPosition } from '@/types/database.types'

const schema = z.object({
  company_id: z.string().uuid('Select a company'),
  position_name: z.string().min(1, 'Required'),
  position_type: z.enum(['Internship', 'Full-Time Job']).default('Internship'),
  max_students: z.coerce.number().int().min(1).default(5),
  intake_date: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
})

type FormValues = z.infer<typeof schema>

export function PositionForm({ open, onClose, position, companies }: {
  open: boolean; onClose: () => void; position: CompanyPosition | null; companies: { id: string; company_name: string }[]
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { company_id: '', position_name: '', position_type: 'Internship', max_students: 5, intake_date: '', description: '', is_active: true },
  })

  useEffect(() => {
    if (position) {
      form.reset({
        company_id: position.company_id,
        position_name: position.position_name,
        position_type: (position.position_type as 'Internship' | 'Full-Time Job') ?? 'Internship',
        max_students: position.max_students,
        intake_date: position.intake_date ?? '',
        description: position.description ?? '',
        is_active: position.is_active,
      })
    } else {
      form.reset({ company_id: '', position_name: '', position_type: 'Internship', max_students: 5, intake_date: '', description: '', is_active: true })
    }
  }, [position, open, form])

  const onSubmit = async (values: FormValues) => {
    const result = position ? await updatePosition(position.id, values) : await createPosition(values)
    if (result.error) toast.error(result.error)
    else { toast.success(position ? 'Position updated' : 'Position created'); onClose() }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{position ? 'Edit Position' : 'Add New Position'}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="position_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Position Name *</FormLabel>
                  <FormControl><Input placeholder="Frontend Developer Intern" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="position_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Internship">Internship</SelectItem>
                      <SelectItem value="Full-Time Job">Full-Time Job</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="max_students" render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Students *</FormLabel>
                  <FormControl><Input type="number" min={1} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="intake_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Deadline</FormLabel>
                  <FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl>
                  <p className="text-xs text-muted-foreground">Application deadline for this batch</p>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="is_active" render={({ field }) => (
              <FormItem className="flex items-center gap-3">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="!mt-0">Active</FormLabel>
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea placeholder="Position description..." {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {position ? 'Save Changes' : 'Add Position'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

