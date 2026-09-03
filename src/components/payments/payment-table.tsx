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
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Pencil, Trash2, MoreHorizontal, Wallet, CheckCircle2 } from 'lucide-react'
import { createPayment, updatePayment, deletePayment, type PaymentFormData } from '@/app/actions/payments'
import { formatDate, formatCurrency, allowanceMonthCap, schoolAllowanceShare, STUDENT_ALLOWANCE_KEEP, employmentPncPercent, employmentPncContribution } from '@/lib/utils'
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

function PaymentFormDialog({ open, onClose, payment, students, internships, employmentRecords, payments }: {
  open: boolean; onClose: () => void; payment: AnyRecord | null; students: AnyRecord[]; internships: AnyRecord[]; employmentRecords: AnyRecord[]; payments: AnyRecord[]
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

  const selectedInternship = internships.find(i => i.id === form.internship_id) ?? null
  const allowanceCap = selectedInternship ? allowanceMonthCap(selectedInternship.start_date, selectedInternship.end_date) : null
  const schoolAmount = selectedInternship ? schoolAllowanceShare(selectedInternship.allowance) : null
  const internshipOtherPayments = selectedInternship
    ? payments.filter(p => p.internship_id === selectedInternship.id && p.id !== payment?.id)
    : []
  const monthsUsed = internshipOtherPayments.length
  const capReached = allowanceCap != null && monthsUsed >= allowanceCap
  const internshipPaidAmount = internshipOtherPayments.reduce((s, p) => s + Number(p.amount), 0)
  const internshipTotalOwed = allowanceCap != null && schoolAmount != null ? schoolAmount * allowanceCap : null
  const internshipRemaining = internshipTotalOwed != null ? Math.max(0, internshipTotalOwed - internshipPaidAmount) : null

  const selectedEmployment = employmentRecords.find(e => e.id === form.employment_id) ?? null
  const employmentPercent = selectedEmployment ? employmentPncPercent(selectedEmployment.salary) : null
  const employmentAmount = selectedEmployment ? employmentPncContribution(selectedEmployment.salary) : null
  const employmentCap = selectedEmployment ? allowanceMonthCap(selectedEmployment.start_date, selectedEmployment.end_date) : null
  const employmentOtherPayments = selectedEmployment
    ? payments.filter(p => p.employment_id === selectedEmployment.id && p.id !== payment?.id)
    : []
  const employmentMonthsUsed = employmentOtherPayments.length
  const employmentCapReached = employmentCap != null && employmentMonthsUsed >= employmentCap
  const employmentPaidAmount = employmentOtherPayments.reduce((s, p) => s + Number(p.amount), 0)
  const employmentTotalOwed = employmentCap != null && employmentAmount != null ? employmentAmount * employmentCap : null
  const employmentRemaining = employmentTotalOwed != null ? Math.max(0, employmentTotalOwed - employmentPaidAmount) : null

  const maxAmount = selectedInternship ? schoolAmount : selectedEmployment ? employmentAmount : null

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
              onValueChange={v => {
                const internshipId = v === 'none' ? null : v
                const inter = internshipId ? internships.find(i => i.id === internshipId) ?? null : null
                setForm(f => ({
                  ...f,
                  internship_id: internshipId,
                  employment_id: internshipId ? null : f.employment_id,
                  amount: inter ? schoolAllowanceShare(inter.allowance) : f.amount,
                }))
              }}
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
            {selectedInternship && (
              <p className={`text-xs ${capReached ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                Student keeps {formatCurrency(STUDENT_ALLOWANCE_KEEP)} of {formatCurrency(selectedInternship.allowance)}/mo — up to {formatCurrency(schoolAmount)}/mo can go to the school.
                {' '}{monthsUsed} of {allowanceCap} month{allowanceCap === 1 ? '' : 's'} recorded — {formatCurrency(internshipRemaining)} of {formatCurrency(internshipTotalOwed)} left to pay.
                {capReached && ' This internship has reached its allowance payment limit.'}
                {!capReached && ' Lower the amount below if the student received a partial allowance this month.'}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Full-Time Job (optional)</label>
            <Select
              value={form.employment_id ?? 'none'}
              onValueChange={v => {
                const employmentId = v === 'none' ? null : v
                const emp = employmentId ? employmentRecords.find(e => e.id === employmentId) ?? null : null
                setForm(f => ({
                  ...f,
                  employment_id: employmentId,
                  internship_id: employmentId ? null : f.internship_id,
                  amount: emp ? employmentPncContribution(emp.salary) : f.amount,
                }))
              }}
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
            {selectedEmployment && (
              <p className={`text-xs ${employmentCapReached ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                Full-time employment contributes {Math.round((employmentPercent ?? 0) * 100)}% of {formatCurrency(selectedEmployment.salary)}/mo gross salary — up to {formatCurrency(employmentAmount)}/mo to PNC.
                {' '}{employmentMonthsUsed} of {employmentCap} month{employmentCap === 1 ? '' : 's'} recorded — {formatCurrency(employmentRemaining)} of {formatCurrency(employmentTotalOwed)} left to pay.
                {employmentCapReached && ' This full-time job has reached its allowance payment limit.'}
                {!employmentCapReached && ' Lower the amount below if the student contributed less this month.'}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Amount (USD) *</label>
              <Input
                type="number" min={0} max={maxAmount ?? undefined} step="0.01" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
                required
              />
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
            <Button type="submit" disabled={saving || !form.student_id || form.amount <= 0 || (maxAmount != null && form.amount > maxAmount) || capReached || employmentCapReached}>
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
  const [rowAmounts, setRowAmounts] = useState<Record<string, number>>({})
  const [rowDates, setRowDates] = useState<Record<string, string>>({})
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const dueMonth = selectedMonth === 'all' ? format(new Date(), 'yyyy-MM') : selectedMonth

  const dueList = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd')

    const internshipRows = internships
      .filter(i => i.allowance != null && (!i.start_date || i.start_date <= today))
      .map(i => {
        const cap = allowanceMonthCap(i.start_date, i.end_date)
        const internshipPayments = payments.filter(p => p.internship_id === i.id)
        if (internshipPayments.length >= cap) return null
        if (internshipPayments.some(p => monthKey(p.payment_date) === dueMonth)) return null
        const student = students.find(s => s.id === i.student_id)
        if (!student) return null
        const maxAmount = schoolAllowanceShare(i.allowance)
        const paidAmount = internshipPayments.reduce((s, p) => s + Number(p.amount), 0)
        const totalOwed = maxAmount * cap
        return {
          key: `internship-${i.id}`,
          type: 'internship' as const,
          internshipId: i.id as string,
          employmentId: null as string | null,
          studentId: i.student_id as string,
          studentName: `${student.first_name} ${student.last_name}`,
          studentCode: student.student_code as string,
          companyName: i.company?.company_name ?? 'Unknown company',
          position: i.position as string,
          startDate: i.start_date as string | null,
          endDate: i.end_date as string | null,
          maxAmount,
          monthsPaid: internshipPayments.length,
          cap,
          totalOwed,
          remaining: Math.max(0, totalOwed - paidAmount),
        }
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)

    const employmentRows = employmentRecords
      .filter(e => e.salary != null && (!e.start_date || e.start_date <= today) && (!e.end_date || e.end_date >= today))
      .map(e => {
        const cap = allowanceMonthCap(e.start_date, e.end_date)
        const employmentPayments = payments.filter(p => p.employment_id === e.id)
        if (employmentPayments.length >= cap) return null
        if (employmentPayments.some(p => monthKey(p.payment_date) === dueMonth)) return null
        const student = students.find(s => s.id === e.student_id)
        if (!student) return null
        const maxAmount = employmentPncContribution(e.salary)
        const paidAmount = employmentPayments.reduce((s, p) => s + Number(p.amount), 0)
        const totalOwed = maxAmount * cap
        return {
          key: `employment-${e.id}`,
          type: 'employment' as const,
          internshipId: null as string | null,
          employmentId: e.id as string,
          studentId: e.student_id as string,
          studentName: `${student.first_name} ${student.last_name}`,
          studentCode: student.student_code as string,
          companyName: e.company_name ?? 'Unknown company',
          position: e.position as string,
          startDate: e.start_date as string | null,
          endDate: e.end_date as string | null,
          maxAmount,
          monthsPaid: employmentPayments.length,
          cap,
          totalOwed,
          remaining: Math.max(0, totalOwed - paidAmount),
        }
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)

    return [...internshipRows, ...employmentRows]
  }, [internships, employmentRecords, payments, students, dueMonth])

  const handleQuickConfirm = async (row: (typeof dueList)[number]) => {
    const amount = rowAmounts[row.key] ?? row.maxAmount
    if (amount <= 0 || amount > row.maxAmount) return
    setConfirmingId(row.key)
    const result = await createPayment({
      student_id: row.studentId,
      internship_id: row.internshipId,
      employment_id: row.employmentId,
      amount,
      payment_date: rowDates[row.key] ?? format(new Date(), 'yyyy-MM-dd'),
      payment_time: '',
      notes: '',
    })
    setConfirmingId(null)
    if (result.error) toast.error(result.error)
    else {
      toast.success(`Payment confirmed for ${row.studentName}`)
      setRowAmounts(a => { const next = { ...a }; delete next[row.key]; return next })
      setRowDates(d => { const next = { ...d }; delete next[row.key]; return next })
      router.refresh()
    }
  }

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

      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold text-sm">Due for {monthLabel(dueMonth)}</h3>
            <p className="text-xs text-muted-foreground">Internship and full-time job students not yet paid this month — adjust the amount if they got a partial allowance, then confirm</p>
          </div>
          <Badge variant="secondary">{dueList.length}</Badge>
        </div>
        {dueList.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-green-500" />Everyone is paid up for this month
          </p>
        ) : (
          <div className="space-y-2">
            {dueList.map(row => {
              const amount = rowAmounts[row.key] ?? row.maxAmount
              const date = rowDates[row.key] ?? format(new Date(), 'yyyy-MM-dd')
              const invalid = amount <= 0 || amount > row.maxAmount
              return (
                <div key={row.key} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="font-medium text-sm truncate">{row.studentName}</p>
                      <span className="text-xs text-muted-foreground font-mono shrink-0">({row.studentCode})</span>
                      <Badge
                        variant="outline"
                        className={`shrink-0 px-1.5 py-0 h-4 text-[10px] ${row.type === 'internship' ? 'text-blue-700 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-900 dark:bg-blue-950/30' : 'text-violet-700 border-violet-200 bg-violet-50 dark:text-violet-400 dark:border-violet-900 dark:bg-violet-950/30'}`}
                      >
                        {row.type === 'internship' ? 'Internship' : 'Full-Time Job'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{row.companyName} — {row.position}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.startDate && `${formatDate(row.startDate)} – ${row.endDate ? formatDate(row.endDate) : 'present'} · `}
                      {row.monthsPaid}/{row.cap} paid · up to {formatCurrency(row.maxAmount)}/mo
                    </p>
                    <p className="text-xs font-medium">
                      {formatCurrency(row.remaining)} of {formatCurrency(row.totalOwed)} left to pay
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:shrink-0">
                    <Input
                      type="number" min={0} max={row.maxAmount} step="0.01" className="h-8 w-full sm:w-24"
                      value={amount}
                      onChange={e => setRowAmounts(a => ({ ...a, [row.key]: Number(e.target.value) }))}
                    />
                    <Input
                      type="date" className="h-8 w-full sm:w-36"
                      value={date}
                      onChange={e => setRowDates(d => ({ ...d, [row.key]: e.target.value }))}
                    />
                  </div>
                  <Button size="sm" className="w-full sm:w-auto" onClick={() => handleQuickConfirm(row)} disabled={confirmingId === row.key || invalid}>
                    {confirmingId === row.key ? 'Confirming…' : 'Confirm'}
                  </Button>
                </div>
              )
            })}
          </div>
        )}
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
        payments={payments}
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
