'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Pencil, Trash2, Download, Upload, MoreHorizontal, MoreVertical, UserPlus, Users, Eye, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { StudentForm } from './student-form'
import { StudentImport } from './student-import'
import { StudentDetailSheet } from './student-detail-sheet'
import { deleteStudent, deleteAllStudents, createStudentAuthAccount, createAllStudentAuthAccounts } from '@/app/actions/students'
import { cn, formatDate, STUDENT_STATUS_COLORS } from '@/lib/utils'
import { exportToCSV, exportToExcel } from '@/lib/export'
import type { AppRole } from '@/lib/roles'
import type { Student, Class, Generation } from '@/types/database.types'

function avatarColor(name: string) {
  const colors = ['#3b82f6','#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#ef4444','#22c55e']
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % colors.length
  return colors[h]
}

function initials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}

const PASSED_STATUSES = new Set(['Internship Completed', 'Employed'])

interface StudentTableProps {
  students: Student[]
  classes: Class[]
  generations: Generation[]
  role: AppRole
  studentIdsWithAccount?: Set<string>
}

export function StudentTable({ students, classes, generations, role, studentIdsWithAccount = new Set() }: StudentTableProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterGender, setFilterGender] = useState('all')
  const [filterGeneration, setFilterGeneration] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editStudent, setEditStudent] = useState<Student | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null)
  const [deleteAllOpen, setDeleteAllOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [creatingLoginFor, setCreatingLoginFor] = useState<string | null>(null)
  const [creatingAllLogins, setCreatingAllLogins] = useState(false)
  const [viewStudent, setViewStudent] = useState<Student | null>(null)

  const canManage = role === 'admin'

  const handleCreateLogin = async (studentId: string) => {
    setCreatingLoginFor(studentId)
    const result = await createStudentAuthAccount(studentId)
    setCreatingLoginFor(null)
    if (result.error) toast.error(result.error)
    else { toast.success('Login created — email + password123'); router.refresh() }
  }

  const handleCreateAllLogins = async () => {
    setCreatingAllLogins(true)
    const result = await createAllStudentAuthAccounts()
    setCreatingAllLogins(false)
    if (result.error) toast.error(result.error)
    else toast.success(`Done — ${(result as { created?: number }).created ?? 0} created, ${(result as { skipped?: number }).skipped ?? 0} skipped`)
    router.refresh()
  }

  const filtered = useMemo(() => students.filter(student => {
    const q = search.toLowerCase()
    const matchesSearch = !q ||
      student.first_name.toLowerCase().includes(q) ||
      student.last_name.toLowerCase().includes(q) ||
      student.student_code.toLowerCase().includes(q) ||
      student.email?.toLowerCase().includes(q)
    const matchesStatus = filterStatus === 'all' || student.status === filterStatus
    const matchesGender = filterGender === 'all' || student.gender === filterGender
    const matchesGen = filterGeneration === 'all' || student.generation_id === filterGeneration
    return matchesSearch && matchesStatus && matchesGender && matchesGen
  }), [students, search, filterStatus, filterGender, filterGeneration])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const result = await deleteStudent(deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
    if (result.error) toast.error(result.error)
    else { toast.success('Student deleted'); router.refresh() }
  }

  const handleDeleteAll = async () => {
    setDeleting(true)
    const result = await deleteAllStudents()
    setDeleting(false)
    setDeleteAllOpen(false)
    if (result.error) toast.error(result.error)
    else { toast.success('All students deleted'); router.refresh() }
  }

  const handleExport = (format: 'excel' | 'csv') => {
    const data = filtered.map(student => ({
      'Student Code': student.student_code,
      'First Name': student.first_name,
      'Last Name': student.last_name,
      'Gender': student.gender,
      'Email': student.email ?? '',
      'Phone': student.phone ?? '',
      'Class': (student as Student & { class?: { name: string } }).class?.name ?? '',
      'Generation': (student as Student & { generation?: { name: string } }).generation?.name ?? '',
      'Status': student.status,
      'Created': formatDate(student.created_at),
    }))

    if (format === 'excel') exportToExcel(data, 'students')
    else exportToCSV(data, 'students')
  }

  const statuses = [
    'Studying', 'Looking For Internship', 'Internship Applied', 'Interview Scheduled',
    'Internship Accepted', 'Internship Active', 'Internship Completed', 'Looking For Job', 'Employed'
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Students</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            {filtered.length} of {students.length} students
            <span className="inline-flex items-center gap-1 ml-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />completed internship or employed</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Export</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('excel')}>Export Excel</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>Export CSV</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {canManage && (
            <>
              <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />Import Excel
              </Button>

              <Button size="sm" onClick={() => { setEditStudent(null); setFormOpen(true) }}>
                <Plus className="mr-2 h-4 w-4" />Add Student
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleCreateAllLogins} disabled={creatingAllLogins}>
                    <Users className="mr-2 h-4 w-4" />
                    {creatingAllLogins ? 'Creating…' : 'Create Logins for All Students'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    onClick={() => setDeleteAllOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete All Students
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative w-full sm:flex-1 sm:min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, code, email..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterGender} onValueChange={setFilterGender}>
          <SelectTrigger className="w-full sm:w-32"><SelectValue placeholder="Gender" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Male">Male</SelectItem>
            <SelectItem value="Female">Female</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterGeneration} onValueChange={setFilterGeneration}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Generation" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Generations</SelectItem>
            {generations.map(generation => <SelectItem key={generation.id} value={generation.id}>{generation.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Generation</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Contact</TableHead>
              {canManage && <TableHead className="w-10"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 8 : 7} className="text-center text-muted-foreground py-10">
                  No students found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(student => {
                const enrichedStudent = student as Student & { class?: { name: string }; generation?: { name: string } }
                const hasPassed = PASSED_STATUSES.has(enrichedStudent.status)
                return (
                  <TableRow key={enrichedStudent.id} className={hasPassed ? 'bg-emerald-50 dark:bg-emerald-950/20' : ''}>
                    <TableCell className="font-mono text-xs font-semibold text-muted-foreground">{enrichedStudent.student_code}</TableCell>
                    <TableCell>
                      <button
                        className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity w-full"
                        onClick={() => setViewStudent(enrichedStudent)}
                      >
                        {(enrichedStudent as Student & { avatar_url?: string | null }).avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={(enrichedStudent as Student & { avatar_url?: string | null }).avatar_url!} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
                            style={{ background: avatarColor(`${enrichedStudent.first_name} ${enrichedStudent.last_name}`) }}>
                            {initials(enrichedStudent.first_name, enrichedStudent.last_name)}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium">{enrichedStudent.first_name} {enrichedStudent.last_name}</p>
                            {hasPassed && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
                          </div>
                          {enrichedStudent.email && <p className="text-xs text-muted-foreground">{enrichedStudent.email}</p>}
                        </div>
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={enrichedStudent.gender === 'Female' ? 'border-pink-200 text-pink-700' : 'border-blue-200 text-blue-700'}>
                        {enrichedStudent.gender}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{enrichedStudent.class?.name ?? '—'}</TableCell>
                    <TableCell className="text-sm">{enrichedStudent.generation?.name ?? '—'}</TableCell>
                    <TableCell>
                      <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', STUDENT_STATUS_COLORS[enrichedStudent.status])}>
                        {enrichedStudent.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{enrichedStudent.phone ?? '—'}</TableCell>
                    {canManage && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewStudent(enrichedStudent)}>
                              <Eye className="mr-2 h-4 w-4" />View Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setEditStudent(enrichedStudent); setFormOpen(true) }}>
                              <Pencil className="mr-2 h-4 w-4" />Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {enrichedStudent.email && (
                              <DropdownMenuItem
                                onClick={() => handleCreateLogin(enrichedStudent.id)}
                                disabled={creatingLoginFor === enrichedStudent.id}
                              >
                                <UserPlus className="mr-2 h-4 w-4" />
                                {studentIdsWithAccount.has(enrichedStudent.id)
                                  ? 'Reset Password to Default'
                                  : creatingLoginFor === enrichedStudent.id ? 'Creating…' : 'Create Login'}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              onClick={() => setDeleteTarget(enrichedStudent)}
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

      {canManage && (
        <>
          <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Student</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete <strong>{deleteTarget?.first_name} {deleteTarget?.last_name}</strong>?
                  This will also delete all their applications, interviews, and records.
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

          <AlertDialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete All Students</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all <strong>{students.length} students</strong> and their associated
                  applications, interviews, internships, and employment records. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleDeleteAll}
                  disabled={deleting}
                >
                  Delete All {students.length} Students
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <StudentForm
            open={formOpen}
            onClose={() => { setFormOpen(false); setEditStudent(null) }}
            student={editStudent}
            classes={classes}
            generations={generations}
          />

          <StudentImport
            open={importOpen}
            onClose={() => setImportOpen(false)}
            classes={classes}
            generations={generations}
          />
        </>
      )}

      <StudentDetailSheet
        student={viewStudent}
        open={!!viewStudent}
        onClose={() => setViewStudent(null)}
      />
    </div>
  )
}


