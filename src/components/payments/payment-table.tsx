'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, Search, Pencil, Trash2, MoreHorizontal, Wallet } from 'lucide-react'
import { createPayment, updatePayment, deletePayment, type PaymentFormData } from '@/app/actions/payments'
import { formatDate, formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = any

interface PaymentTableProps {
  payments: AnyRecord[]
  students: AnyRecord[]
  internships: AnyRecord[]
  employmentRecords: AnyRecord[]
}

const EMPTY: PaymentFormData = {
  student_id: '', internship_id: null, employment_id: null, amount: 0, payment_date: format(new Date(), 'yyyy-MM-dd'), payment_time: '', notes: '',
}

function monthKey(date: string) {
  return format(parseISO(date), 'yyyy-MM')
}

function monthLabel(key: string) {
  return format(parseISO(`${key}-01`), 'MMMM yyyy')
}

function PaymentFormDialog({ open, onClose, payment, students, internships, employmentRecords }: {
  open: boolean; onClose: () => void; payment: AnyRecord | null; students: AnyRecord[]; internships: AnyRecord[]; employmentRecords: AnyRecord[]
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<PaymentFormData>(payment ? {
    student_id: payment.student_id,
    internship_id: payment.internship_id,
    employment_id: payment.employment_id,
    amount: payment.amount,
    payment_date: payment.payment_date,
    payment_time: payment.payment_time ?? '',
    notes: payment.notes ?? '',
  } : EMPTY)

  const studentInternships = internships.filter(i => i.student_id === form.student_id)
  const studentEmploymentRecords = employmentRecords.filter(e => e.student_id === form.student_id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const result = payment ? await updatePayment(payment.id, form) : await createPayment(form)
    setSaving(false)
    if (result.error) toast.error(result.error)
    else { toast.success(payment ? 'Payment updated' : 'Payment confirmed'); setForm(EMPTY); onClose(); router.refresh() }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { setForm(EMPTY); onClose() } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{payment ? 'Edit Payment' : 'Confirm Allowance Payment'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Student *</label>
            <Select value={form.student_id} onValueChange={v => setForm(f => ({ ...f, student_id: v, internship_id: null, employment_id: null }))}>
              <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
              <SelectContent>
                {students.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.student_code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">If this allowance is coming from an internship or a full-time job, link it below (pick one, not both).</p>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Internship (optional)</label>
            <Select
              value={form.internship_id ?? 'none'}
              onValueChange={v => setForm(f => ({ ...f, internship_id: v === 'none' ? null : v, employment_id: v === 'none' ? f.employment_id : null }))}
              disabled={!form.student_id || studentInternships.length === 0}
            >
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {studentInternships.map(i => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.company?.company_name ?? 'Unknown'} — {i.position}{i.allowance != null ? ` (${formatCurrency(i.allowance)}/mo)` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Full-Time Job (optional)</label>
            <Select
              value={form.employment_id ?? 'none'}
              onValueChange={v => setForm(f => ({ ...f, employment_id: v === 'none' ? null : v, internship_id: v === 'none' ? f.internship_id : null }))}
              disabled={!form.student_id || studentEmploymentRecords.length === 0}
            >
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {studentEmploymentRecords.map(e => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.company_name ?? 'Unknown'} — {e.position}{e.salary != null ? ` (${formatCurrency(e.salary)}/mo)` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Amount (USD) *</label>
              <Input type="number" min={0} step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Date *</label>
              <Input type="date" value={form.payment_date} onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))} required />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Time</label>
            <Input type="time" value={form.payment_time ?? ''} onChange={e => setForm(f => ({ ...f, payment_time: e.target.value }))} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Notes</label>
            <Textarea rows={2} value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving || !form.student_id || form.amount <= 0}>
              {saving ? 'Saving…' : payment ? 'Save Changes' : 'Confirm Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function PaymentTable({ payments, students, internships, employmentRecords }: PaymentTableProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<AnyRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AnyRecord | null>(null)
  const [deleting, setDeleting] = useState(false)

  const monthTotals = useMemo(() => {
    const totals = new Map<string, number>()
    for (const p of payments) {
      const key = monthKey(p.payment_date)
      totals.set(key, (totals.get(key) ?? 0) + Number(p.amount))
    }
    const currentMonth = format(new Date(), 'yyyy-MM')
    if (!totals.has(currentMonth)) totals.set(currentMonth, 0)
    return [...totals.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [payments])

  const [selectedMonth, setSelectedMonth] = useState(() => monthTotals[0]?.[0] ?? format(new Date(), 'yyyy-MM'))

  const filtered = useMemo(() => payments.filter(p => {
    if (selectedMonth !== 'all' && monthKey(p.payment_date) !== selectedMonth) return false
    const q = search.toLowerCase()
    const name = `${p.student?.first_name ?? ''} ${p.student?.last_name ?? ''}`.toLowerCase()
    return !q || name.includes(q) || p.student?.student_code?.toLowerCase().includes(q)
  }), [payments, search, selectedMonth])

  const selectedTotal = selectedMonth === 'all'
    ? payments.reduce((sum, p) => sum + Number(p.amount), 0)
    : monthTotals.find(([k]) => k === selectedMonth)?.[1] ?? 0

  const allTimeTotal = payments.reduce((sum, p) => sum + Number(p.amount), 0)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const result = await deletePayment(deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
    if (result.error) toast.error(result.error)
    else { toast.success('Payment deleted'); router.refresh() }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Allowance Payments</h2>
          <p className="text-sm text-muted-foreground">Track allowance paid back to the school by students/companies</p>
        </div>
        <Button size="sm" onClick={() => { setEditTarget(null); setFormOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />Confirm Payment
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" />Selected Period</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(selectedTotal)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{selectedMonth === 'all' ? 'All time' : monthLabel(selectedMonth)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">All-Time Total</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(allTimeTotal)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{payments.length} payment{payments.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1.5">Browse Month</p>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              {monthTotals.map(([key, total]) => (
                <SelectItem key={key} value={key}>{monthLabel(key)} — {formatCurrency(total)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by student name or code..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">No payments found</TableCell></TableRow>
            ) : (
              filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.student?.first_name} {p.student?.last_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.internship ? (
                      <span><span className="text-[10px] uppercase tracking-wide text-blue-600 font-semibold mr-1">Internship</span>{p.internship.company?.company_name ?? ''} — {p.internship.position}</span>
                    ) : p.employment ? (
                      <span><span className="text-[10px] uppercase tracking-wide text-violet-600 font-semibold mr-1">Job</span>{p.employment.company_name ?? ''} — {p.employment.position}</span>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="font-semibold">{formatCurrency(p.amount)}</TableCell>
                  <TableCell className="text-sm">{formatDate(p.payment_date)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.payment_time ?? '—'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditTarget(p); setFormOpen(true) }}>
                          <Pencil className="mr-2 h-4 w-4" />Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          onClick={() => setDeleteTarget(p)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaymentFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        payment={editTarget}
        students={students}
        internships={internships}
        employmentRecords={employmentRecords}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Delete this {formatCurrency(deleteTarget?.amount)} payment for <strong>{deleteTarget?.student?.first_name} {deleteTarget?.student?.last_name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete} disabled={deleting}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
