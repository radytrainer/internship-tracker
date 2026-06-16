'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Pencil, Trash2, GraduationCap, UserCheck } from 'lucide-react'
import { createTrainer, updateTrainer, deleteTrainer } from '@/app/actions/trainers'
import { assignTrainerToClass } from '@/app/actions/trainer-classes'
import { toast } from 'sonner'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = any

interface TrainerTableProps {
  trainers: AnyRecord[]
  classes: AnyRecord[]
}

function CreateTrainerDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', password: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const result = await createTrainer(form)
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Trainer account created')
      setForm({ full_name: '', email: '', password: '' })
      onClose()
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Trainer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Full Name</label>
            <Input
              placeholder="e.g. Sokha Chea"
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              placeholder="trainer@school.edu"
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
              {saving ? 'Creating…' : 'Create Trainer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditTrainerDialog({ trainer, onClose }: { trainer: AnyRecord; onClose: () => void }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(trainer.full_name ?? '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const result = await updateTrainer(trainer.id, name)
    setSaving(false)
    if (result.error) toast.error(result.error)
    else { toast.success('Trainer updated'); onClose(); router.refresh() }
  }

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Trainer</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Full Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <Input value={trainer.email ?? ''} disabled className="bg-muted" />
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

export function TrainerTable({ trainers, classes }: TrainerTableProps) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<AnyRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AnyRecord | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [assigningClass, setAssigningClass] = useState<Record<string, boolean>>({})

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const result = await deleteTrainer(deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
    if (result.error) toast.error(result.error)
    else { toast.success('Trainer deleted'); router.refresh() }
  }

  const handleClassAssign = async (classId: string, trainerId: string, currentTrainerId: string | null) => {
    // If this class already belongs to this trainer, unassign; otherwise assign
    const newTrainerId = currentTrainerId === trainerId ? null : trainerId
    setAssigningClass(prev => ({ ...prev, [classId]: true }))
    const result = await assignTrainerToClass(classId, newTrainerId)
    setAssigningClass(prev => ({ ...prev, [classId]: false }))
    if (result.error) toast.error(result.error)
    else { toast.success(newTrainerId ? 'Class assigned' : 'Class removed'); router.refresh() }
  }

  const getAssignedClasses = (trainerId: string) =>
    classes.filter((c: AnyRecord) => c.trainer_id === trainerId)

  const unassignedClasses = (trainerId: string) =>
    classes.filter((c: AnyRecord) => !c.trainer_id || c.trainer_id === trainerId)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Trainers</h2>
          <p className="text-sm text-muted-foreground">{trainers.length} trainer{trainers.length !== 1 ? 's' : ''}</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />Add Trainer
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trainer</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Assigned Classes</TableHead>
              <TableHead>Add Class</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trainers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                  No trainers yet. Click &quot;Add Trainer&quot; to create one.
                </TableCell>
              </TableRow>
            ) : (
              trainers.map((trainer: AnyRecord) => {
                const assigned = getAssignedClasses(trainer.id)
                const available = classes.filter((c: AnyRecord) => !c.trainer_id)
                return (
                  <TableRow key={trainer.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                          <UserCheck className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="font-medium">{trainer.full_name ?? '—'}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">{trainer.email}</TableCell>

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
                              onClick={() => handleClassAssign(cls.id, trainer.id, cls.trainer_id)}
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
                        onValueChange={classId => handleClassAssign(classId, trainer.id, null)}
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
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditTarget(trainer)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(trainer)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <CreateTrainerDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      {editTarget && <EditTrainerDialog trainer={editTarget} onClose={() => setEditTarget(null)} />}

      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trainer</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <strong>{deleteTarget?.full_name}</strong>? Their login account will be removed and all class assignments cleared.
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
