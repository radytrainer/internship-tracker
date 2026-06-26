'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Pencil, Trash2, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { EmploymentForm } from './employment-form'
import { deleteEmploymentRecord } from '@/app/actions/employment'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import type { AppRole } from '@/lib/roles'
import type { EmploymentRecord } from '@/types/database.types'

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Resigned: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  Terminated: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const TYPE_COLORS: Record<string, string> = {
  'Full-Time': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Part-Time': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Contract': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = any

interface EmploymentTableProps {
  records: EmploymentRecord[]
  students: { id: string; first_name: string; last_name: string; student_code: string }[]
  companies: { id: string; company_name: string }[]
  role: AppRole
}

export function EmploymentTable({ records, students, role }: EmploymentTableProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editRecord, setEditRecord] = useState<EmploymentRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AnyRecord | null>(null)
  const [deleting, setDeleting] = useState(false)

  const canManage = role === 'admin' || role === 'ero_team' || role === 'pl_team'

  const filtered = useMemo(() => (records as AnyRecord[]).filter((record: AnyRecord) => {
    const q = search.toLowerCase()
    const student = students.find(s => s.id === record.student_id)
    const matchSearch = !q ||
      student?.first_name?.toLowerCase().includes(q) ||
      student?.last_name?.toLowerCase().includes(q) ||
      record.company_name?.toLowerCase().includes(q) ||
      record.position?.toLowerCase().includes(q)
    const matchStatus = filterStatus === 'all' || record.employment_status === filterStatus
    const matchType = filterType === 'all' || record.employment_type === filterType
    return matchSearch && matchStatus && matchType
  }), [records, students, search, filterStatus, filterType])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const result = await deleteEmploymentRecord(deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
    if (result.error) toast.error(result.error)
    else { toast.success('Employment record deleted'); router.refresh() }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{role === 'student' ? 'My Employment Records' : 'Employment Records'}</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} records</p>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => { setEditRecord(null); setFormOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" />Add Record
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative w-full sm:flex-1 sm:min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by student, employer, or role..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {['Active', 'Resigned', 'Terminated'].map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {['Full-Time', 'Part-Time', 'Contract'].map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Employer / Role</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Salary</TableHead>
              <TableHead>Status</TableHead>
              {canManage && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={canManage ? 7 : 6} className="text-center text-muted-foreground py-10">No employment records found</TableCell></TableRow>
            ) : (
              filtered.map((record: AnyRecord) => {
                const student = students.find(s => s.id === record.student_id)
                return (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{student?.first_name} {student?.last_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{student?.student_code}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{record.company_name}</p>
                        <p className="text-xs text-muted-foreground">{record.position}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', TYPE_COLORS[record.employment_type] ?? 'bg-muted text-muted-foreground')}>
                        {record.employment_type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{record.start_date ? formatDate(record.start_date) : '—'}</p>
                        {record.end_date && <p className="text-muted-foreground">→ {formatDate(record.end_date)}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {record.salary != null ? `${formatCurrency(record.salary)}/mo` : '—'}
                    </TableCell>
                    <TableCell>
                      <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', STATUS_COLORS[record.employment_status] ?? 'bg-muted text-muted-foreground')}>
                        {record.employment_status}
                      </span>
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditRecord(record as EmploymentRecord); setFormOpen(true) }}>
                              <Pencil className="mr-2 h-4 w-4" />Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              onClick={() => setDeleteTarget(record)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employment Record</AlertDialogTitle>
            <AlertDialogDescription>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              Delete the record for {(deleteTarget as any)?.student?.first_name ?? students.find(s => s.id === deleteTarget?.student_id)?.first_name} at {deleteTarget?.company_name}?
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

      {canManage && (
        <EmploymentForm
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditRecord(null); router.refresh() }}
          record={editRecord}
          students={students}
        />
      )}
    </div>
  )
}




