'use client'

import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { AlertTriangle, CalendarDays, CalendarOff, CheckCircle2, FileText, GraduationCap, Wallet } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EducationReportSection } from './education-report-section'
import { MetricCard, StatBox, EmptyState, one } from './shared'
import { formatCurrency, formatDate, LEAVE_STATUS_COLORS } from '@/lib/utils'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = any

interface EducationDashboardClientProps {
  leaves: AnyRecord[]
  payments: AnyRecord[]
  myClasses: { id: string; name: string }[]
  allClasses: { id: string; name: string }[]
}

type StudentRef =
  | { gender: string | null; class_id: string | null; class: { name: string }[] | { name: string } | null }
  | { gender: string | null; class_id: string | null; class: { name: string }[] | { name: string } | null }[]
  | null

function studentGroupInfo(ref: StudentRef) {
  const s = one(ref)
  return {
    gender: s?.gender ?? 'Unknown',
    classId: s?.class_id ?? null,
    className: one(s?.class ?? null)?.name ?? 'No class',
  }
}

function sumByGroup<T>(rows: T[], getKey: (row: T) => string, getValue: (row: T) => number) {
  const map = new Map<string, { total: number; count: number }>()
  for (const row of rows) {
    const key = getKey(row)
    const value = getValue(row)
    const entry = map.get(key) ?? { total: 0, count: 0 }
    entry.total += value
    entry.count += 1
    map.set(key, entry)
  }
  return Array.from(map.entries()).map(([key, v]) => ({ key, ...v }))
}

function groupLeavesBy<T extends { status: string }>(rows: T[], getKey: (row: T) => string) {
  const map = new Map<string, { total: number; pending: number; approved: number; rejected: number }>()
  for (const row of rows) {
    const key = getKey(row)
    const entry = map.get(key) ?? { total: 0, pending: 0, approved: 0, rejected: 0 }
    entry.total += 1
    if (row.status === 'Pending') entry.pending += 1
    else if (row.status === 'Approved') entry.approved += 1
    else if (row.status === 'Rejected') entry.rejected += 1
    map.set(key, entry)
  }
  return Array.from(map.entries()).map(([key, v]) => ({ key, ...v }))
}

function monthKey(date: string | null | undefined) {
  return date ? date.slice(0, 7) : 'Unknown'
}

function monthLabel(key: string) {
  if (key === 'all') return 'All Time'
  return format(parseISO(`${key}-01`), 'MMMM yyyy')
}

export function EducationDashboardClient({ leaves, payments, myClasses, allClasses }: EducationDashboardClientProps) {
  const [classFilter, setClassFilter] = useState(myClasses.length > 0 ? 'mine' : 'all')
  const [monthFilter, setMonthFilter] = useState('all')

  const student = (ref: unknown) => studentGroupInfo(ref as StudentRef)
  const myClassIdSet = useMemo(() => new Set(myClasses.map(c => c.id)), [myClasses])

  const classFilterLabel = classFilter === 'mine' ? 'My Classes' : classFilter === 'all' ? 'All Classes' : (allClasses.find(c => c.id === classFilter)?.name ?? '')

  const availableMonths = useMemo(() => {
    const set = new Set<string>()
    for (const p of payments) if (p.payment_date) set.add(monthKey(p.payment_date))
    for (const l of leaves) if (l.start_date) set.add(monthKey(l.start_date))
    set.add(format(new Date(), 'yyyy-MM'))
    return Array.from(set).sort((a, b) => b.localeCompare(a))
  }, [payments, leaves])

  const classFiltered = useMemo(() => {
    if (classFilter === 'all') return { leaves, payments }
    if (classFilter === 'mine') {
      return {
        leaves: leaves.filter(l => myClassIdSet.has(student(l.student).classId ?? '')),
        payments: payments.filter(p => myClassIdSet.has(student(p.student).classId ?? '')),
      }
    }
    return {
      leaves: leaves.filter(l => student(l.student).classId === classFilter),
      payments: payments.filter(p => student(p.student).classId === classFilter),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaves, payments, classFilter, myClassIdSet])

  const filtered = useMemo(() => {
    if (monthFilter === 'all') return classFiltered
    return {
      leaves: classFiltered.leaves.filter(l => monthKey(l.start_date) === monthFilter),
      payments: classFiltered.payments.filter(p => monthKey(p.payment_date) === monthFilter),
    }
  }, [classFiltered, monthFilter])

  const pendingLeaves = filtered.leaves.filter(l => l.status === 'Pending').length
  const approvedLeaves = filtered.leaves.filter(l => l.status === 'Approved').length
  const rejectedLeaves = filtered.leaves.filter(l => l.status === 'Rejected').length

  const totalSelected = filtered.payments.reduce((sum: number, p: AnyRecord) => sum + Number(p.amount), 0)
  const totalAllTime = classFiltered.payments.reduce((sum: number, p: AnyRecord) => sum + Number(p.amount), 0)

  const allowanceByMonth = sumByGroup(
    classFiltered.payments,
    (p: AnyRecord) => monthKey(p.payment_date),
    (p: AnyRecord) => Number(p.amount)
  ).sort((a, b) => a.key.localeCompare(b.key))

  const allowanceByGender = sumByGroup(filtered.payments, p => student(p.student).gender, p => Number(p.amount))
  const allowanceByClass = sumByGroup(filtered.payments, p => student(p.student).className, p => Number(p.amount))
    .sort((a, b) => b.total - a.total)

  const leaveByGender = groupLeavesBy(filtered.leaves, l => student(l.student).gender)
  const leaveByClass = groupLeavesBy(filtered.leaves, l => student(l.student).className)
    .sort((a, b) => b.total - a.total)

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-3 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {myClasses.length > 0 && <SelectItem value="mine">My Classes</SelectItem>}
              <SelectItem value="all">All Classes</SelectItem>
              {allClasses.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              {availableMonths.map(m => (
                <SelectItem key={m} value={m}>{monthLabel(m)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox label="Pending Leave Requests" value={pendingLeaves} color="text-yellow-600" bg="bg-yellow-50 dark:bg-yellow-950/30" icon={CalendarOff} />
        <StatBox label="Approved Leaves" value={approvedLeaves} color="text-green-600" bg="bg-green-50 dark:bg-green-950/30" icon={CheckCircle2} />
        <StatBox label="Rejected Leaves" value={rejectedLeaves} color="text-red-600" bg="bg-red-50 dark:bg-red-950/30" icon={AlertTriangle} />
        <StatBox label="Total Leave Requests" value={filtered.leaves.length} color="text-slate-600" bg="bg-slate-50 dark:bg-slate-900/30" icon={FileText} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          label="Allowance Paid (Selected Period)"
          value={formatCurrency(totalSelected)}
          hint={`${filtered.payments.length} payment${filtered.payments.length !== 1 ? 's' : ''} · ${monthLabel(monthFilter)} · ${classFilterLabel}`}
          icon={Wallet} color="text-teal-600" bg="bg-teal-50 dark:bg-teal-950/30"
        />
        <MetricCard
          label="Allowance Paid All-Time"
          value={formatCurrency(totalAllTime)}
          hint={`${classFiltered.payments.length} payment${classFiltered.payments.length !== 1 ? 's' : ''} total · ${classFilterLabel}`}
          icon={Wallet} color="text-indigo-600" bg="bg-indigo-50 dark:bg-indigo-950/30"
        />
      </div>

      <EducationReportSection
        payments={filtered.payments}
        allowanceByMonth={allowanceByMonth}
        allowanceByGender={allowanceByGender}
        allowanceByClass={allowanceByClass}
        leaveByGender={leaveByGender}
        leaveByClass={leaveByClass}
        scopeLabel={classFilterLabel}
        summary={{ pendingLeaves, approvedLeaves, rejectedLeaves, totalLeaves: filtered.leaves.length, totalAllTime, totalThisMonth: totalSelected }}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Leave Requests</CardTitle>
            <CardDescription>Latest {Math.min(filtered.leaves.length, 5)} of {filtered.leaves.length}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {filtered.leaves.length === 0 ? (
              <EmptyState text="No leave requests yet." />
            ) : (
              filtered.leaves.slice(0, 5).map((l: AnyRecord) => (
                <div key={l.id} className="flex items-center justify-between rounded-lg border p-3 gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{one(l.student)?.first_name} {one(l.student)?.last_name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(l.start_date)} → {formatDate(l.end_date)}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${LEAVE_STATUS_COLORS[l.status] ?? ''}`}>
                    {l.status}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Allowance Payments</CardTitle>
            <CardDescription>Latest {Math.min(filtered.payments.length, 5)} of {filtered.payments.length}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {filtered.payments.length === 0 ? (
              <EmptyState text="No payments confirmed yet." />
            ) : (
              filtered.payments.slice(0, 5).map((p: AnyRecord) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border p-3 gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{one(p.student)?.first_name} {one(p.student)?.last_name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(p.payment_date)}</p>
                  </div>
                  <p className="font-semibold shrink-0">{formatCurrency(p.amount)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
