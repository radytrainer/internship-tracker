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
  max_students: z.coerce.number().int().min(1).default(5),
  description: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
})

type FormValues = z.infer<typeof schema>

export function PositionForm({ open, onClose, position, companies }: {
  open: boolean; onClose: () => void; position: CompanyPosition | null; companies: { id: string; company_name: string }[]
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { company_id: '', position_name: '', max_students: 5, description: '', is_active: true },
  })

  useEffect(() => {
    if (position) {
      form.reset({ company_id: position.company_id, position_name: position.position_name, max_students: position.max_students, description: position.description ?? '', is_active: position.is_active })
    } else {
      form.reset({ company_id: '', position_name: '', max_students: 5, description: '', is_active: true })
    }
  }, [position, open, form])

  const onSubmit = async (values: FormValues) => {
    const result = position ? await updatePosition(position.id, values) : await createPosition(values)
    if (result.error) toast.error(result.error)
    else { toast.success(position ? 'Position updated' : 'Position created'); onClose() }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-lg">
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
            <FormField control={form.control} name="position_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Position Name *</FormLabel>
                <FormControl><Input placeholder="Frontend Developer Intern" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="max_students" render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Students *</FormLabel>
                  <FormControl><Input type="number" min={1} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="is_active" render={({ field }) => (
                <FormItem className="flex flex-col justify-end">
                  <FormLabel>Active</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2 h-10">
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                      <span className="text-sm text-muted-foreground">{field.value ? 'Active' : 'Inactive'}</span>
                    </div>
                  </FormControl>
                </FormItem>
              )} />
            </div>
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
