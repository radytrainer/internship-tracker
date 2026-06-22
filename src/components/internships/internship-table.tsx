'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Pencil, Trash2, CheckCircle, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { InternshipForm } from './internship-form'
import { deleteInternship } from '@/app/actions/internships'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import type { AppRole } from '@/lib/roles'
import type { Internship } from '@/types/database.types'

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Terminated: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = any

interface InternshipTableProps {
  internships: Internship[]
  students: { id: string; first_name: string; last_name: string; student_code: string }[]
  companies: { id: string; company_name: string }[]
  role: AppRole
}

export function InternshipTable({ internships, students, companies, role }: InternshipTableProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCompany, setFilterCompany] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editInternship, setEditInternship] = useState<Internship | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AnyRecord | null>(null)
  const [deleting, setDeleting] = useState(false)

  const canManage = role === 'admin' || role === 'ero_team'

  const filtered = useMemo(() => (internships as AnyRecord[]).filter((iv: AnyRecord) => {
    const q = search.toLowerCase()
    const student = students.find(s => s.id === iv.student_id)
    const company = companies.find(c => c.id === iv.company_id)
    const matchSearch = !q ||
      student?.first_name?.toLowerCase().includes(q) ||
      student?.last_name?.toLowerCase().includes(q) ||
      company?.company_name?.toLowerCase().includes(q) ||
      iv.position?.toLowerCase().includes(q)
    const matchStatus = filterStatus === 'all' || iv.internship_status === filterStatus
    const matchCompany = filterCompany === 'all' || iv.company_id === filterCompany
    return matchSearch && matchStatus && matchCompany
  }), [internships, students, companies, search, filterStatus, filterCompany])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const result = await deleteInternship(deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
    if (result.error) toast.error(result.error)
    else { toast.success('Internship deleted'); router.refresh() }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{role === 'student' ? 'My Internship' : 'Internships'}</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} internship records</p>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => { setEditInternship(null); setFormOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" />New Internship
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative w-full sm:flex-1 sm:min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by student, company, or position..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {['Active', 'Completed', 'Terminated'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
              <TableHead>Student</TableHead>
              <TableHead>Company / Position</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Allowance</TableHead>
              <TableHead>Tutor</TableHead>
              <TableHead>Agreement</TableHead>
              <TableHead>Status</TableHead>
              {canManage && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={canManage ? 8 : 7} className="text-center text-muted-foreground py-10">No internship records found</TableCell></TableRow>
            ) : (
              filtered.map((iv: AnyRecord) => {
                const student = students.find(s => s.id === iv.student_id)
                const company = companies.find(c => c.id === iv.company_id)
                return (
                  <TableRow key={iv.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{student?.first_name} {student?.last_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{student?.student_code}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{company?.company_name ?? 'â€”'}</p>
                        <p className="text-xs text-muted-foreground">{iv.position ?? 'â€”'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{iv.start_date ? formatDate(iv.start_date) : 'â€”'}</p>
                        {iv.end_date && <p className="text-muted-foreground">â†’ {formatDate(iv.end_date)}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {iv.allowance != null ? `${formatCurrency(iv.allowance)}/mo` : 'â€”'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{iv.tutor ?? 'â€”'}</TableCell>
                    <TableCell>
                      {iv.agreement_signed
                        ? <CheckCircle className="h-4 w-4 text-green-500" />
                        : <span className="text-xs text-muted-foreground">Pending</span>
                      }
                    </TableCell>
                    <TableCell>
                      <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', STATUS_COLORS[iv.internship_status] ?? 'bg-muted text-muted-foreground')}>
                        {iv.internship_status}
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
                            <DropdownMenuItem onClick={() => { setEditInternship(iv as Internship); setFormOpen(true) }}>
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
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Internship</AlertDialogTitle>
            <AlertDialogDescription>Delete this internship record?</AlertDialogDescription>
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
        <InternshipForm
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditInternship(null); router.refresh() }}
          internship={editInternship}
          students={students}
          companies={companies}
        />
      )}
    </div>
  )
}




