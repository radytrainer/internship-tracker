'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, Search, Pencil, Trash2, ExternalLink, MoreHorizontal, Send, Eye, EyeOff, ShieldCheck, ShieldOff, Ban, CircleCheck } from 'lucide-react'
import { CompanyForm } from './company-form'
import { deleteCompany, toggleCompanyVisibility, toggleCompanyMOU, toggleCompanyBlacklist } from '@/app/actions/companies'
import { toast } from 'sonner'
import type { AppRole } from '@/lib/roles'
import type { Company } from '@/types/database.types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = any

function colorFromName(name: string) {
  const colors = ['#3b82f6','#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#ef4444','#22c55e']
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % colors.length
  return colors[h]
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}

interface CompanyTableProps { companies: Company[]; role: AppRole }

export function CompanyTable({ companies, role }: CompanyTableProps) {
  const canManage = role === 'admin'
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editCompany, setEditCompany] = useState<Company | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = useMemo(() => companies.filter(c => {
    const q = search.toLowerCase()
    return !q || c.company_name.toLowerCase().includes(q) || c.industry?.toLowerCase().includes(q) || c.contact_person?.toLowerCase().includes(q)
  }), [companies, search])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const result = await deleteCompany(deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
    if (result.error) toast.error(result.error)
    else { toast.success('Company deleted'); router.refresh() }
  }

  const handleToggleVisibility = async (id: string, current: boolean) => {
    const result = await toggleCompanyVisibility(id, !current)
    if (result.error) toast.error(result.error)
    else { toast.success(!current ? 'Company visible to students' : 'Company hidden from students'); router.refresh() }
  }

  const handleToggleMOU = async (id: string, current: boolean) => {
    const result = await toggleCompanyMOU(id, !current)
    if (result.error) toast.error(result.error)
    else { toast.success(!current ? 'MOU added' : 'MOU removed'); router.refresh() }
  }

  const handleToggleBlacklist = async (id: string, current: boolean) => {
    const result = await toggleCompanyBlacklist(id, !current)
    if (result.error) toast.error(result.error)
    else { toast.success(!current ? 'Company blacklisted' : 'Company removed from blacklist'); router.refresh() }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Companies</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} partner companies</p>
        </div>
        <Button size="sm" onClick={() => { setEditCompany(null); setFormOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />Add Company
        </Button>
      </div>

      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search companies..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Telegram</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Max Students</TableHead>
              <TableHead>Positions</TableHead>
              <TableHead>Applications</TableHead>
              {canManage && <TableHead className="w-10"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">No companies found</TableCell></TableRow>
            ) : (
              filtered.map(company => {
                const c = company as AnyRecord
                const posCount = c.company_positions?.[0]?.count ?? 0
                const appCount = c.internship_applications?.[0]?.count ?? 0
                const isHidden = c.is_visible === false
                const isBlacklisted = c.is_blacklisted === true
                const hasMOU = c.has_mou === true
                return (
                  <TableRow key={c.id} className={isBlacklisted ? 'bg-red-50 dark:bg-red-950/20' : isHidden ? 'opacity-50' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {c.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.logo_url} alt={c.company_name} className="h-9 w-9 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold"
                            style={{ background: colorFromName(c.company_name) }}>
                            {initials(c.company_name)}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-medium">{c.company_name}</p>
                            {isHidden && <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                            {hasMOU && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-[10px] font-semibold px-1.5 py-0.5">
                                <ShieldCheck className="h-2.5 w-2.5" />MOU
                              </span>
                            )}
                            {isBlacklisted && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-[10px] font-semibold px-1.5 py-0.5">
                                <Ban className="h-2.5 w-2.5" />Blacklisted
                              </span>
                            )}
                          </div>
                          {c.website && (
                            <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 flex items-center gap-1 hover:underline">
                              <ExternalLink className="h-3 w-3" />Website
                            </a>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {c.industry
                        ? <a href={c.industry} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-500 hover:underline text-sm"><Send className="h-3 w-3" />Telegram</a>
                        : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {c.contact_person && <p className="font-medium">{c.contact_person}</p>}
                        {c.contact_email && <p className="text-xs text-muted-foreground">{c.contact_email}</p>}
                        {c.contact_phone && <p className="text-xs text-muted-foreground">{c.contact_phone}</p>}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{c.max_students_per_company}</Badge></TableCell>
                    <TableCell><Badge variant="secondary">{posCount}</Badge></TableCell>
                    <TableCell><Badge>{appCount}</Badge></TableCell>
                    {canManage && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditCompany(c); setFormOpen(true) }}>
                              <Pencil className="mr-2 h-4 w-4" />Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleVisibility(c.id, c.is_visible !== false)}>
                              {c.is_visible === false
                                ? <><Eye className="mr-2 h-4 w-4" />Show to students</>
                                : <><EyeOff className="mr-2 h-4 w-4" />Hide from students</>
                              }
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleMOU(c.id, hasMOU)}>
                              {hasMOU
                                ? <><ShieldOff className="mr-2 h-4 w-4" />Remove MOU</>
                                : <><ShieldCheck className="mr-2 h-4 w-4 text-green-600" />Mark as MOU</>
                              }
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleBlacklist(c.id, isBlacklisted)}
                              className={isBlacklisted ? '' : 'text-red-600 focus:text-red-600 focus:bg-red-50'}
                            >
                              {isBlacklisted
                                ? <><CircleCheck className="mr-2 h-4 w-4" />Remove from blacklist</>
                                : <><Ban className="mr-2 h-4 w-4" />Add to blacklist</>
                              }
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              onClick={() => setDeleteTarget(c)}
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

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <strong>{deleteTarget?.company_name}</strong>? This will also delete all positions and applications linked to this company.
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

      <CompanyForm open={formOpen} onClose={() => { setFormOpen(false); setEditCompany(null); router.refresh() }} company={editCompany} />
    </div>
  )
}



