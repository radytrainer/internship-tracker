'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Pencil, Trash2, Calendar, Clock, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { InterviewForm } from './interview-form'
import { deleteInterview } from '@/app/actions/interviews'
import { cn, formatDate } from '@/lib/utils'
import type { AppRole } from '@/lib/roles'
import type { Interview } from '@/types/database.types'

const RESULT_COLORS: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  Passed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const TYPE_COLORS: Record<string, string> = {
  Online: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'On Site': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = any

interface InterviewTableProps {
  interviews: AnyRecord[]
  applications: AnyRecord[]
  companies: { id: string; company_name: string }[]
  role: AppRole
}

export function InterviewTable({ interviews, applications, companies, role }: InterviewTableProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterResult, setFilterResult] = useState('all')
  const [filterCompany, setFilterCompany] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editInterview, setEditInterview] = useState<Interview | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AnyRecord | null>(null)
  const [deleting, setDeleting] = useState(false)

  const canManage = role === 'admin' || role === 'trainer' || role === 'ero_team' || role === 'pl_team'
  const canSchedule = role !== 'student'
  const showStudentColumn = role !== 'student'

  const filtered = useMemo(() => interviews.filter((iv: AnyRecord) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      iv.application?.student?.first_name?.toLowerCase().includes(q) ||
      iv.application?.student?.last_name?.toLowerCase().includes(q) ||
      iv.application?.company?.company_name?.toLowerCase().includes(q)
    const matchResult = filterResult === 'all' || iv.result === filterResult
    const matchCompany = filterCompany === 'all' || iv.application?.company?.company_name === companies.find(c => c.id === filterCompany)?.company_name
    return matchSearch && matchResult && matchCompany
  }), [interviews, search, filterResult, filterCompany, companies])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const result = await deleteInterview(deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
    if (result.error) toast.error(result.error)
    else { toast.success('Interview deleted'); router.refresh() }
  }

  const today = new Date().toISOString().split('T')[0]
  const colSpan = (showStudentColumn ? 1 : 0) + 5 + (canManage ? 1 : 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{role === 'student' ? 'My Interviews' : 'Interviews'}</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} interviews</p>
        </div>
        {canSchedule && (
          <Button size="sm" onClick={() => { setEditInterview(null); setFormOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" />Schedule Interview
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative w-full sm:flex-1 sm:min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by student or company..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterResult} onValueChange={setFilterResult}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All Results" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Results</SelectItem>
            {['Pending', 'Passed', 'Failed'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCompany} onValueChange={setFilterCompany}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="All Companies" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {showStudentColumn && <TableHead>Student</TableHead>}
              <TableHead>Company / Position</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Interviewer</TableHead>
              <TableHead>Result</TableHead>
              {canManage && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={colSpan} className="text-center text-muted-foreground py-10">No interviews found</TableCell></TableRow>
            ) : (
              filtered.map((iv: AnyRecord) => (
                <TableRow key={iv.id} className={iv.interview_date === today ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}>
                  {showStudentColumn && (
                    <TableCell>
                      <div>
                        <p className="font-medium">{iv.application?.student?.first_name} {iv.application?.student?.last_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{iv.application?.student?.student_code}</p>
                      </div>
                    </TableCell>
                  )}
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{iv.application?.company?.company_name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{iv.application?.position?.position_name ?? '—'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {formatDate(iv.interview_date)}
                        {iv.interview_date === today && <span className="text-xs bg-yellow-200 dark:bg-yellow-800 px-1 rounded font-semibold text-yellow-800 dark:text-yellow-200">Today</span>}
                      </div>
                      {iv.interview_time && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />{iv.interview_time}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', TYPE_COLORS[iv.interview_type] ?? 'bg-muted text-muted-foreground')}>
                      {iv.interview_type}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{iv.interviewer ?? '—'}</TableCell>
                  <TableCell>
                    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', RESULT_COLORS[iv.result] ?? 'bg-muted text-muted-foreground')}>
                      {iv.result}
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
                          <DropdownMenuItem onClick={() => { setEditInterview(iv as Interview); setFormOpen(true) }}>
                            <Pencil className="mr-2 h-4 w-4" />Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            onClick={() => setDeleteTarget(iv)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Interview</AlertDialogTitle>
            <AlertDialogDescription>Delete this interview record?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete} disabled={deleting}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {canSchedule && (
        <InterviewForm
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditInterview(null); router.refresh() }}
          interview={editInterview}
          applications={applications}
          role={role}
        />
      )}
    </div>
  )
}




