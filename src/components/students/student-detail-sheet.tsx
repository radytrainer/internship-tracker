'use client'

import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { Loader2, Mail, Phone, Building2, FileText, MessageSquare, Briefcase, Award } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn, STUDENT_STATUS_COLORS, APPLICATION_STATUS_COLORS } from '@/lib/utils'
import type { Student } from '@/types/database.types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = any

function avatarColor(name: string) {
  const colors = ['#3b82f6','#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#ef4444','#22c55e']
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % colors.length
  return colors[h]
}

function initials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}

function fmt(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const RESULT_COLORS: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-700',
  Passed:  'bg-green-100 text-green-700',
  Failed:  'bg-red-100 text-red-700',
}

const INTERNSHIP_STATUS_COLORS: Record<string, string> = {
  Active:     'bg-green-100 text-green-700',
  Completed:  'bg-blue-100 text-blue-700',
  Terminated: 'bg-red-100 text-red-700',
}

interface StudentDetailSheetProps {
  student: (Student & AnyRecord) | null
  open: boolean
  onClose: () => void
}

interface StudentData {
  applications: AnyRecord[]
  interviews: AnyRecord[]
  internships: AnyRecord[]
  employment: AnyRecord[]
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-3 gap-1">
      <Icon className={`h-5 w-5 ${color}`} />
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground text-center leading-tight">{label}</p>
    </div>
  )
}

export function StudentDetailSheet({ student, open, onClose }: StudentDetailSheetProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<StudentData | null>(null)

  useEffect(() => {
    if (!open || !student) { setData(null); return }
    const fetchData = async () => {
      setLoading(true)
      const supabase = createClient()
      const [appsRes, ivsRes, internsRes, empRes] = await Promise.all([
        supabase
          .from('internship_applications')
          .select(`*, company:companies(company_name, logo_url), position:company_positions(position_name, position_type)`)
          .eq('student_id', student.id)
          .order('application_date', { ascending: false }),
        supabase
          .from('interviews')
          .select(`*, application:internship_applications(company_id, position_id, company:companies(company_name), position:company_positions(position_name))`)
          .in(
            'application_id',
            // fetch all app ids for this student first, or filter after
            (await supabase.from('internship_applications').select('id').eq('student_id', student.id)).data?.map(a => a.id) ?? []
          )
          .order('interview_date', { ascending: false }),
        supabase
          .from('internships')
          .select(`*, company:companies(company_name)`)
          .eq('student_id', student.id)
          .order('start_date', { ascending: false }),
        supabase
          .from('employment_records')
          .select(`*, company:companies(company_name)`)
          .eq('student_id', student.id)
          .order('start_date', { ascending: false }),
      ])
      setData({
        applications: appsRes.data ?? [],
        interviews: ivsRes.data ?? [],
        internships: internsRes.data ?? [],
        employment: empRes.data ?? [],
      })
      setLoading(false)
    }
    fetchData()
  }, [open, student])

  const uniqueCompanies = data
    ? new Set(data.applications.map((a: AnyRecord) => a.company_id)).size
    : 0

  const acceptedApps = data?.applications.filter((a: AnyRecord) => a.application_status === 'Accepted').length ?? 0

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose() }}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col overflow-hidden">
        {student && (
          <>
            {/* Header */}
            <SheetHeader className="p-6 pb-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 shrink-0">
              <div className="flex items-center gap-4">
                {(student as AnyRecord).avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={(student as AnyRecord).avatar_url} alt="" className="h-16 w-16 rounded-full object-cover shrink-0 ring-2 ring-white" />
                ) : (
                  <div
                    className="h-16 w-16 rounded-full flex items-center justify-center shrink-0 text-white text-xl font-bold ring-2 ring-white"
                    style={{ background: avatarColor(`${student.first_name} ${student.last_name}`) }}
                  >
                    {initials(student.first_name, student.last_name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <SheetTitle className="text-xl">{student.first_name} {student.last_name}</SheetTitle>
                  <p className="text-sm font-mono text-muted-foreground">{student.student_code}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', STUDENT_STATUS_COLORS[student.status])}>
                      {student.status}
                    </span>
                    <Badge variant="outline" className={student.gender === 'Female' ? 'border-pink-200 text-pink-700' : 'border-blue-200 text-blue-700'}>
                      {student.gender}
                    </Badge>
                    {(student as AnyRecord).class?.name && (
                      <Badge variant="secondary">{(student as AnyRecord).class.name}</Badge>
                    )}
                    {(student as AnyRecord).generation?.name && (
                      <Badge variant="secondary">{(student as AnyRecord).generation.name}</Badge>
                    )}
                  </div>
                  <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
                    {student.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{student.email}</span>}
                    {student.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{student.phone}</span>}
                  </div>
                </div>
              </div>
            </SheetHeader>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-20 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />Loading…
                </div>
              ) : data && (
                <div className="p-6 space-y-6">
                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-3">
                    <StatCard icon={FileText}     label="Applications"    value={data.applications.length}  color="text-blue-600" />
                    <StatCard icon={Building2}    label="Companies"       value={uniqueCompanies}            color="text-indigo-600" />
                    <StatCard icon={MessageSquare} label="Interviews"     value={data.interviews.length}    color="text-purple-600" />
                    <StatCard icon={Briefcase}    label="Accepted"        value={acceptedApps}              color="text-green-600" />
                  </div>

                  {/* Applications */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />Applications ({data.applications.length})
                    </p>
                    {data.applications.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No applications yet.</p>
                    ) : (
                      <div className="rounded-lg border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="text-xs">Company</TableHead>
                              <TableHead className="text-xs">Position</TableHead>
                              <TableHead className="text-xs">Date</TableHead>
                              <TableHead className="text-xs">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.applications.map((app: AnyRecord) => (
                              <TableRow key={app.id}>
                                <TableCell className="text-sm font-medium">{app.company?.company_name ?? '—'}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {app.position?.position_name ?? '—'}
                                  {app.position?.position_type && (
                                    <span className="ml-1.5 text-[10px] rounded-full px-1.5 py-0.5 bg-muted text-muted-foreground">{app.position.position_type}</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmt(app.application_date)}</TableCell>
                                <TableCell>
                                  <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', APPLICATION_STATUS_COLORS[app.application_status] ?? 'bg-gray-100 text-gray-600')}>
                                    {app.application_status}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Interviews */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />Interviews ({data.interviews.length})
                    </p>
                    {data.interviews.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No interviews yet.</p>
                    ) : (
                      <div className="rounded-lg border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="text-xs">Company</TableHead>
                              <TableHead className="text-xs">Position</TableHead>
                              <TableHead className="text-xs">Date</TableHead>
                              <TableHead className="text-xs">Type</TableHead>
                              <TableHead className="text-xs">Result</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.interviews.map((iv: AnyRecord) => (
                              <TableRow key={iv.id}>
                                <TableCell className="text-sm font-medium">{iv.application?.company?.company_name ?? '—'}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{iv.application?.position?.position_name ?? '—'}</TableCell>
                                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmt(iv.interview_date)}</TableCell>
                                <TableCell className="text-xs">{iv.interview_type}</TableCell>
                                <TableCell>
                                  <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', RESULT_COLORS[iv.result] ?? 'bg-gray-100 text-gray-600')}>
                                    {iv.result}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>

                  {/* Internships */}
                  {data.internships.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5" />Internships ({data.internships.length})
                        </p>
                        <div className="rounded-lg border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead className="text-xs">Company</TableHead>
                                <TableHead className="text-xs">Start</TableHead>
                                <TableHead className="text-xs">End</TableHead>
                                <TableHead className="text-xs">Status</TableHead>
                                <TableHead className="text-xs">Tutor</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {data.internships.map((iv: AnyRecord) => (
                                <TableRow key={iv.id}>
                                  <TableCell className="text-sm font-medium">{iv.company?.company_name ?? '—'}</TableCell>
                                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmt(iv.start_date)}</TableCell>
                                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmt(iv.end_date)}</TableCell>
                                  <TableCell>
                                    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', INTERNSHIP_STATUS_COLORS[iv.status] ?? 'bg-gray-100 text-gray-600')}>
                                      {iv.status}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">{iv.tutor ?? '—'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Employment */}
                  {data.employment.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <Award className="h-3.5 w-3.5" />Employment ({data.employment.length})
                        </p>
                        <div className="rounded-lg border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead className="text-xs">Company</TableHead>
                                <TableHead className="text-xs">Role</TableHead>
                                <TableHead className="text-xs">Start</TableHead>
                                <TableHead className="text-xs">Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {data.employment.map((emp: AnyRecord) => (
                                <TableRow key={emp.id}>
                                  <TableCell className="text-sm font-medium">{emp.company?.company_name ?? '—'}</TableCell>
                                  <TableCell className="text-sm text-muted-foreground">{emp.job_title ?? '—'}</TableCell>
                                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmt(emp.start_date)}</TableCell>
                                  <TableCell>
                                    <Badge variant="secondary">{emp.employment_status}</Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
