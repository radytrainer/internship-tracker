'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, Search, Pencil, Trash2, MoreHorizontal, Check, X } from 'lucide-react'
import { createLeave, updateLeave, updateLeaveStatus, deleteLeave, type LeaveFormData } from '@/app/actions/leaves'
import { cn, formatDate, LEAVE_STATUS_COLORS } from '@/lib/utils'
import { toast } from 'sonner'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = any

interface LeaveTableProps {
  leaves: AnyRecord[]
  students: AnyRecord[]
  internships: AnyRecord[]
}

const EMPTY: LeaveFormData = {
  student_id: '', internship_id: null, start_date: '', end_date: '', reason: '', status: 'Pending', notes: '',
}

function LeaveFormDialog({ open, onClose, leave, students, internships }: {
  open: boolean; onClose: () => void; leave: AnyRecord | null; students: AnyRecord[]; internships: AnyRecord[]
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<LeaveFormData>(leave ? {
    student_id: leave.student_id,
    internship_id: leave.internship_id,
    start_date: leave.start_date,
    end_date: leave.end_date,
    reason: leave.reason ?? '',
    status: leave.status,
    notes: leave.notes ?? '',
  } : EMPTY)

  const studentInternships = internships.filter(i => i.student_id === form.student_id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const result = leave ? await updateLeave(leave.id, form) : await createLeave(form)
    setSaving(false)
    if (result.error) toast.error(result.error)
    else { toast.success(leave ? 'Leave updated' : 'Leave request logged'); setForm(EMPTY); onClose(); router.refresh() }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { setForm(EMPTY); onClose() } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{leave ? 'Edit Leave Request' : 'Log Leave Request'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Student *</label>
            <Select value={form.student_id} onValueChange={v => setForm(f => ({ ...f, student_id: v, internship_id: null }))}>
              <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
              <SelectContent>
                {students.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.student_code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Internship / Job (optional)</label>
            <Select
              value={form.internship_id ?? 'none'}
              onValueChange={v => setForm(f => ({ ...f, internship_id: v === 'none' ? null : v }))}
              disabled={!form.student_id || studentInternships.length === 0}
            >
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {studentInternships.map(i => (
                  <SelectItem key={i.id} value={i.id}>{i.company?.company_name ?? 'Unknown'} — {i.position}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Start Date *</label>
              <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">End Date *</label>
              <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} required />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Reason</label>
            <Textarea rows={2} value={form.reason ?? ''} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Status</label>
            <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as LeaveFormData['status'] }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Notes</label>
            <Textarea rows={2} value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving || !form.student_id}>
              {saving ? 'Saving…' : leave ? 'Save Changes' : 'Log Leave'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function LeaveTable({ leaves, students, internships }: LeaveTableProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<AnyRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AnyRecord | null>(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = useMemo(() => leaves.filter(l => {
    const q = search.toLowerCase()
    const name = `${l.student?.first_name ?? ''} ${l.student?.last_name ?? ''}`.toLowerCase()
    return !q || name.includes(q) || l.student?.student_code?.toLowerCase().includes(q)
  }), [leaves, search])

  const handleStatusChange = async (id: string, status: 'Pending' | 'Approved' | 'Rejected') => {
    const result = await updateLeaveStatus(id, status)
    if (result.error) toast.error(result.error)
    else { toast.success(`Leave ${status.toLowerCase()}`); router.refresh() }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const result = await deleteLeave(deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
    if (result.error) toast.error(result.error)
    else { toast.success('Leave deleted'); router.refresh() }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Leave Requests</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} of {leaves.length} requests</p>
        </div>
        <Button size="sm" onClick={() => { setEditTarget(null); setFormOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />Log Leave
        </Button>
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
              <TableHead>Internship / Job</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">No leave requests found</TableCell></TableRow>
            ) : (
              filtered.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.student?.first_name} {l.student?.last_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {l.internship ? `${l.internship.company?.company_name ?? ''} — ${l.internship.position}` : '—'}
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(l.start_date)} → {formatDate(l.end_date)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{l.reason || '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', LEAVE_STATUS_COLORS[l.status])}>
                        {l.status}
                      </span>
                      {l.status === 'Pending' && (
                        <>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-green-600" title="Approve" onClick={() => handleStatusChange(l.id, 'Approved')}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-red-600" title="Reject" onClick={() => handleStatusChange(l.id, 'Rejected')}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditTarget(l); setFormOpen(true) }}>
                          <Pencil className="mr-2 h-4 w-4" />Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          onClick={() => setDeleteTarget(l)}
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

      <LeaveFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        leave={editTarget}
        students={students}
        internships={internships}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Leave Request</AlertDialogTitle>
            <AlertDialogDescription>
              Delete this leave request for <strong>{deleteTarget?.student?.first_name} {deleteTarget?.student?.last_name}</strong>?
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
