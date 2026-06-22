'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, MoreHorizontal, Pencil, Trash2, Handshake, GraduationCap } from 'lucide-react'
import { createPLStaff, updatePLStaff, deletePLStaff } from '@/app/actions/pl-team'
import { assignPLStaffToClass } from '@/app/actions/pl-team-classes'
import { toast } from 'sonner'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = any

interface PLTeamTableProps { staff: AnyRecord[]; classes: AnyRecord[] }

function CreateStaffDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', password: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const result = await createPLStaff(form)
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('PL Team account created')
      setForm({ full_name: '', email: '', password: '' })
      onClose()
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add PL Team Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Full Name</label>
            <Input
              placeholder="e.g. Vutha Lim"
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              placeholder="staff@school.edu"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              minLength={8}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Creating…' : 'Create Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditStaffDialog({ staff, onClose }: { staff: AnyRecord; onClose: () => void }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(staff.full_name ?? '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const result = await updatePLStaff(staff.id, name)
    setSaving(false)
    if (result.error) toast.error(result.error)
    else { toast.success('Updated'); onClose(); router.refresh() }
  }

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit PL Team Member</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Full Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <Input value={staff.email ?? ''} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Email cannot be changed here</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function PLTeamTable({ staff, classes }: PLTeamTableProps) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<AnyRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AnyRecord | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [assigningClass, setAssigningClass] = useState<Record<string, boolean>>({})

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const result = await deletePLStaff(deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
    if (result.error) toast.error(result.error)
    else { toast.success('Account deleted'); router.refresh() }
  }

  const handleClassAssign = async (classId: string, staffId: string, currentStaffId: string | null) => {
    const newStaffId = currentStaffId === staffId ? null : staffId
    setAssigningClass(prev => ({ ...prev, [classId]: true }))
    const result = await assignPLStaffToClass(classId, newStaffId)
    setAssigningClass(prev => ({ ...prev, [classId]: false }))
    if (result.error) toast.error(result.error)
    else { toast.success(newStaffId ? 'Class assigned' : 'Class removed'); router.refresh() }
  }

  const getAssignedClasses = (staffId: string) =>
    classes.filter((c: AnyRecord) => c.pl_staff_id === staffId)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">PL Team</h2>
          <p className="text-sm text-muted-foreground">{staff.length} member{staff.length !== 1 ? 's' : ''} — manages internship agreements, supervisors, tutors, allowance &amp; employment</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />Add Member
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Assigned Classes</TableHead>
              <TableHead>Add Class</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                  No PL Team members yet. Click &quot;Add Member&quot; to create one.
                </TableCell>
              </TableRow>
            ) : (
              staff.map((member: AnyRecord) => {
                const assigned = getAssignedClasses(member.id)
                const available = classes.filter((c: AnyRecord) => !c.pl_staff_id)
                return (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                        <Handshake className="h-4 w-4 text-orange-600" />
                      </div>
                      <span className="font-medium">{member.full_name ?? '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{member.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {assigned.length === 0 ? (
                        <span className="text-xs text-muted-foreground">None</span>
                      ) : (
                        assigned.map((cls: AnyRecord) => (
                          <Badge
                            key={cls.id}
                            variant="secondary"
                            className="gap-1 cursor-pointer hover:bg-red-100 hover:text-red-700 transition-colors text-xs"
                            onClick={() => handleClassAssign(cls.id, member.id, cls.pl_staff_id)}
                            title="Click to remove"
                          >
                            <GraduationCap className="h-3 w-3" />
                            {cls.name}
                            {assigningClass[cls.id] && ' …'}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value=""
                      onValueChange={classId => handleClassAssign(classId, member.id, null)}
                      disabled={available.length === 0}
                    >
                      <SelectTrigger className="h-7 w-40 text-xs">
                        <SelectValue placeholder={available.length === 0 ? 'All assigned' : 'Assign class…'} />
                      </SelectTrigger>
                      <SelectContent>
                        {available.map((c: AnyRecord) => (
                          <SelectItem key={c.id} value={c.id} className="text-xs">
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditTarget(member)}>
                          <Pencil className="mr-2 h-3.5 w-3.5" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(member)}
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <CreateStaffDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      {editTarget && <EditStaffDialog staff={editTarget} onClose={() => setEditTarget(null)} />}

      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete PL Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <strong>{deleteTarget?.full_name}</strong>? Their login account will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleting}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
