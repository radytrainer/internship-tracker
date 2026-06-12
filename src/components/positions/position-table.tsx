'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, Search, Pencil, Trash2, MoreHorizontal } from 'lucide-react'
import { PositionForm } from './position-form'
import { deletePosition } from '@/app/actions/companies'
import { toast } from 'sonner'
import type { AppRole } from '@/lib/roles'
import type { CompanyPosition } from '@/types/database.types'

interface PositionTableProps {
  positions: CompanyPosition[]
  companies: { id: string; company_name: string }[]
  role: AppRole
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = any

export function PositionTable({ positions, companies, role }: PositionTableProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterCompany, setFilterCompany] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editPosition, setEditPosition] = useState<CompanyPosition | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AnyRecord | null>(null)
  const [deleting, setDeleting] = useState(false)

  const canManage = role === 'admin'

  const filtered = useMemo(() => positions.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q || p.position_name.toLowerCase().includes(q) ||
      (p as AnyRecord).company?.company_name.toLowerCase().includes(q)
    const matchCompany = filterCompany === 'all' || p.company_id === filterCompany
    return matchSearch && matchCompany
  }), [positions, search, filterCompany])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const result = await deletePosition(deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
    if (result.error) toast.error(result.error)
    else { toast.success('Position deleted'); router.refresh() }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Company Positions</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} positions available</p>
        </div>
        <Button size="sm" onClick={() => { setEditPosition(null); setFormOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />Add Position
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search positions..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterCompany} onValueChange={setFilterCompany}>
          <SelectTrigger className="w-56"><SelectValue placeholder="All Companies" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Position</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Slots</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Description</TableHead>
              {canManage && <TableHead className="w-10"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={canManage ? 6 : 5} className="text-center text-muted-foreground py-10">No positions found</TableCell></TableRow>
            ) : (
              filtered.map(pos => {
                const p = pos as AnyRecord
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.position_name}</TableCell>
                    <TableCell>{p.company?.company_name ?? '—'}</TableCell>
                    <TableCell><Badge variant="outline">{p.max_students} students</Badge></TableCell>
                    <TableCell>
                      <Badge variant={p.is_active ? 'default' : 'secondary'} className={p.is_active ? 'bg-green-500' : ''}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{p.description ?? '—'}</TableCell>
                    {canManage && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditPosition(p as CompanyPosition); setFormOpen(true) }}>
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
            <AlertDialogTitle>Delete Position</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <strong>{deleteTarget?.position_name}</strong>? Applications for this position will also be deleted.
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

      <PositionForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditPosition(null); router.refresh() }}
        position={editPosition}
        companies={companies}
      />
    </div>
  )
}
