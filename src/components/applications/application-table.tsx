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
import { ApplicationForm } from './application-form'
import { deleteApplication } from '@/app/actions/applications'
import { APPLICATION_STATUS_COLORS, cn, formatDate } from '@/lib/utils'
import type { AppRole } from '@/lib/roles'
import type { InternshipApplication } from '@/types/database.types'

interface ApplicationTableProps {
  applications: InternshipApplication[]
  students: { id: string; first_name: string; last_name: string; student_code: string }[]
  companies: { id: string; company_name: string }[]
  positions: { id: string; position_name: string; company_id: string; max_students: number; intake_date?: string | null; is_active: boolean }[]
  role: AppRole
  currentStudentId: string | null
}

export function ApplicationTable({
  applications,
  students,
  companies,
  positions,
  role,
  currentStudentId,
}: ApplicationTableProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCompany, setFilterCompany] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editApp, setEditApp] = useState<InternshipApplication | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<InternshipApplication | null>(null)
  const [deleting, setDeleting] = useState(false)

  const canManage = role === 'admin' || role === 'trainer'
  const showStudentColumn = role !== 'student'
  const pageTitle = showStudentColumn ? 'Internship Applications' : 'My Applications'
  const pageSubtitle = showStudentColumn ? 'applications' : 'records in your tracker'

  const filtered = useMemo(() => applications.filter(a => {
    const app = a as InternshipApplication & {
      student?: { first_name: string; last_name: string; student_code: string }
      company?: { company_name: string }
      position?: { position_name: string }
    }
    const q = search.toLowerCase()
    const matchSearch = !q ||
      app.student?.first_name.toLowerCase().includes(q) ||
      app.student?.last_name.toLowerCase().includes(q) ||
      app.student?.student_code.toLowerCase().includes(q) ||
      app.company?.company_name.toLowerCase().includes(q)
    const matchStatus = filterStatus === 'all' || a.application_status === filterStatus
    const matchCompany = filterCompany === 'all' || a.company_id === filterCompany
    return matchSearch && matchStatus && matchCompany
  }), [applications, search, filterStatus, filterCompany])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const result = await deleteApplication(deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
    if (result.error) toast.error(result.error)
    else { toast.success('Application deleted'); router.refresh() }
  }

  const statuses = ['Applied', 'Under Review', 'Interview Scheduled', 'Interview Passed', 'Interview Failed', 'Accepted', 'Rejected']
  const emptyColspan = (showStudentColumn ? 1 : 0) + 4 + (canManage ? 1 : 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{pageTitle}</h2>
          <p className="text-sm text-muted-foreground">
            {filtered.length} {pageSubtitle}
          </p>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => { setEditApp(null); setFormOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" />New Application
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative w-full sm:flex-1 sm:min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by student or company..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
              <TableHead>Company</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              {canManage && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={emptyColspan} className="text-center text-muted-foreground py-10">No applications found</TableCell></TableRow>
            ) : (
              filtered.map(app => {
                const a = app as InternshipApplication & {
                  student?: { first_name: string; last_name: string; student_code: string }
                  company?: { company_name: string }
                  position?: { position_name: string }
                }

                return (
                  <TableRow key={a.id}>
                    {showStudentColumn && (
                      <TableCell>
                        <div>
                          <p className="font-medium">{a.student?.first_name} {a.student?.last_name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{a.student?.student_code}</p>
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="font-medium">{a.company?.company_name ?? 'â€”'}</TableCell>
                    <TableCell className="text-sm">
                      {a.position?.position_name ?? 'â€”'}
                      {(a.position as any)?.intake_date && (
                        <span className="block text-xs text-muted-foreground">
                          {new Date((a.position as any).intake_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(a.application_date)}</TableCell>
                    <TableCell>
                      <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', APPLICATION_STATUS_COLORS[a.application_status])}>
                        {a.application_status}
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
                            <DropdownMenuItem onClick={() => { setEditApp(a); setFormOpen(true) }}>
                              <Pencil className="mr-2 h-4 w-4" />Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              onClick={() => setDeleteTarget(a)}
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
            <AlertDialogTitle>Delete Application</AlertDialogTitle>
            <AlertDialogDescription>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              Delete this application from {(deleteTarget as any)?.student?.first_name} {(deleteTarget as any)?.student?.last_name}?
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

      <ApplicationForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditApp(null); router.refresh() }}
        application={editApp}
        students={students}
        companies={companies}
        positions={positions}
        role={role}
        currentStudentId={currentStudentId}
      />
    </div>
  )
}




