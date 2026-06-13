'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { AvatarUpload } from '@/components/ui/avatar-upload'
import { createCompany, updateCompany } from '@/app/actions/companies'
import { toast } from 'sonner'
import type { Company } from '@/types/database.types'

const schema = z.object({
  company_name: z.string().min(1, 'Required'),
  industry: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  contact_person: z.string().optional().nullable(),
  contact_email: z.string().email().optional().nullable().or(z.literal('')),
  contact_phone: z.string().optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal('')),
  max_students_per_company: z.coerce.number().int().min(0).default(10),
  is_visible: z.boolean().default(true),
  has_mou: z.boolean().default(false),
  is_blacklisted: z.boolean().default(false),
  notes: z.string().optional().nullable(),
  logo_url: z.string().url().optional().nullable().or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

const EMPTY: FormValues = {
  company_name: '', industry: '', address: '', contact_person: '',
  contact_email: '', contact_phone: '', website: '',
  max_students_per_company: 10, is_visible: true, has_mou: false, is_blacklisted: false,
  notes: '', logo_url: '',
}

export function CompanyForm({ open, onClose, company }: { open: boolean; onClose: () => void; company: (Company & { logo_url?: string | null }) | null }) {
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY })

  useEffect(() => {
    if (company) {
      form.reset({
        company_name: company.company_name,
        industry: company.industry ?? '',
        address: company.address ?? '',
        contact_person: company.contact_person ?? '',
        contact_email: company.contact_email ?? '',
        contact_phone: company.contact_phone ?? '',
        website: company.website ?? '',
        max_students_per_company: company.max_students_per_company,
        is_visible: company.is_visible ?? true,
        has_mou: company.has_mou ?? false,
        is_blacklisted: company.is_blacklisted ?? false,
        notes: company.notes ?? '',
        logo_url: company.logo_url ?? '',
      })
    } else {
      form.reset(EMPTY)
    }
  }, [company, open, form])

  const onSubmit = async (values: FormValues) => {
    const result = company ? await updateCompany(company.id, values) : await createCompany(values)
    if (result.error) toast.error(result.error)
    else { toast.success(company ? 'Company updated' : 'Company created'); onClose() }
  }

  const name = form.watch('company_name') || 'C'

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{company ? 'Edit Company' : 'Add New Company'}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            {/* Logo upload */}
            <FormField control={form.control} name="logo_url" render={({ field }) => (
              <FormItem>
                <FormLabel>Company Logo</FormLabel>
                <FormControl>
                  <AvatarUpload
                    value={field.value}
                    onChange={field.onChange}
                    name={name}
                    folder="companies"
                    shape="square"
                    size={80}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="company_name" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Company Name *</FormLabel>
                  <FormControl><Input placeholder="ABC Technology Ltd." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="industry" render={({ field }) => (
                <FormItem>
                  <FormLabel>Telegram Link</FormLabel>
                  <FormControl><Input placeholder="https://t.me/channelname" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="website" render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl><Input placeholder="https://company.com" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Address</FormLabel>
                  <FormControl><Input placeholder="123 Street, City" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="contact_person" render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person</FormLabel>
                  <FormControl><Input placeholder="Jane Smith" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="contact_phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Phone</FormLabel>
                  <FormControl><Input placeholder="+855 12 345 678" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="contact_email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl><Input type="email" placeholder="hr@company.com" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="max_students_per_company" render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Students</FormLabel>
                  <FormControl><Input type="number" min={0} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="is_visible" render={({ field }) => (
                <FormItem className="flex items-center gap-3 col-span-2 rounded-lg border p-3 bg-muted/30">
                  <FormControl>
                    <input type="checkbox" checked={field.value} onChange={e => field.onChange(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                  </FormControl>
                  <div>
                    <FormLabel className="!mt-0">Visible to students</FormLabel>
                    <p className="text-xs text-muted-foreground">When unchecked, students cannot see this company</p>
                  </div>
                </FormItem>
              )} />

              <FormField control={form.control} name="has_mou" render={({ field }) => (
                <FormItem className="flex items-center gap-3 rounded-lg border p-3 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                  <FormControl>
                    <input type="checkbox" checked={field.value} onChange={e => field.onChange(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                  </FormControl>
                  <div>
                    <FormLabel className="!mt-0 text-green-800 dark:text-green-300">Has MOU</FormLabel>
                    <p className="text-xs text-green-700/70 dark:text-green-400/70">Company has a signed Memorandum of Understanding</p>
                  </div>
                </FormItem>
              )} />

              <FormField control={form.control} name="is_blacklisted" render={({ field }) => (
                <FormItem className="flex items-center gap-3 rounded-lg border p-3 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                  <FormControl>
                    <input type="checkbox" checked={field.value} onChange={e => field.onChange(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                  </FormControl>
                  <div>
                    <FormLabel className="!mt-0 text-red-800 dark:text-red-300">Blacklisted</FormLabel>
                    <p className="text-xs text-red-700/70 dark:text-red-400/70">Company is flagged — students will not be able to apply</p>
                  </div>
                </FormItem>
              )} />

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Notes</FormLabel>
                  <FormControl><Textarea rows={3} {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {company ? 'Save Changes' : 'Add Company'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
