'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileSpreadsheet, FileText, CalendarDays, Users2, GraduationCap } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { exportToExcel, exportReportPDF } from '@/lib/export'
import { toast } from 'sonner'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = any

interface GroupStat { key: string; total: number; count: number }
interface LeaveGroupStat { key: string; total: number; pending: number; approved: number; rejected: number }

interface EducationReportSectionProps {
  payments: AnyRecord[]
  allowanceByMonth: GroupStat[]
  allowanceByGender: GroupStat[]
  allowanceByClass: GroupStat[]
  leaveByGender: LeaveGroupStat[]
  leaveByClass: LeaveGroupStat[]
  scopeLabel?: string
  summary: {
    pendingLeaves: number
    approvedLeaves: number
    rejectedLeaves: number
    totalLeaves: number
    totalAllTime: number
    totalThisMonth: number
  }
}

const GENDER_COLORS: Record<string, string> = { Male: '#3b82f6', Female: '#ec4899', Unknown: '#94a3b8' }

function monthLabel(key: string) {
  if (key === 'Unknown') return 'Unknown'
  return format(parseISO(`${key}-01`), 'MMM yyyy')
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

function RankedList({ data, valueLabel, formatValue, color }: { data: GroupStat[]; valueLabel: string; formatValue: (n: number) => string; color: string }) {
  if (data.length === 0) return <p className="text-sm text-muted-foreground text-center py-6">No data available</p>
  const max = Math.max(...data.map(d => d.total), 1)
  return (
    <div className="space-y-2.5">
      {data.map(d => (
        <div key={d.key} className="flex items-center gap-3">
          <div className="w-24 shrink-0 text-xs font-medium truncate" title={d.key}>{d.key}</div>
          <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(4, (d.total / max) * 100)}%`, background: color }} />
          </div>
          <div className="w-28 shrink-0 text-right text-xs">
            <span className="font-semibold">{formatValue(d.total)}</span>
            <span className="text-muted-foreground"> · {d.count} {valueLabel}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function GenderSplit({ data, formatValue, unit }: { data: GroupStat[]; formatValue: (n: number) => string; unit: string }) {
  const total = data.reduce((s, d) => s + d.total, 0)
  if (data.length === 0 || total === 0) return <p className="text-sm text-muted-foreground text-center py-6">No data available</p>
  return (
    <div className="space-y-3">
      {data.map(d => (
        <div key={d.key}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full" style={{ background: GENDER_COLORS[d.key] ?? '#94a3b8' }} />
              <span className="text-sm font-medium">{d.key}</span>
            </div>
            <span className="text-sm"><span className="font-semibold">{formatValue(d.total)}</span> <span className="text-muted-foreground">· {d.count} {unit}</span></span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${(d.total / total) * 100}%`, background: GENDER_COLORS[d.key] ?? '#94a3b8' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function LeaveRankedList({ data }: { data: LeaveGroupStat[] }) {
  if (data.length === 0) return <p className="text-sm text-muted-foreground text-center py-6">No data available</p>
  const max = Math.max(...data.map(d => d.total), 1)
  return (
    <div className="space-y-2.5">
      {data.map(d => (
        <div key={d.key} className="flex items-center gap-3">
          <div className="w-24 shrink-0 text-xs font-medium truncate" title={d.key}>{d.key}</div>
          <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${Math.max(4, (d.total / max) * 100)}%` }} />
          </div>
          <div className="w-40 shrink-0 flex items-center justify-end gap-1 text-[10px]">
            <span className="font-semibold text-xs mr-1">{d.total}</span>
            {d.pending > 0 && <span className="rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 px-1.5 py-0.5">{d.pending}P</span>}
            {d.approved > 0 && <span className="rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-1.5 py-0.5">{d.approved}A</span>}
            {d.rejected > 0 && <span className="rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 px-1.5 py-0.5">{d.rejected}R</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

export function EducationReportSection({
  payments, allowanceByMonth, allowanceByGender, allowanceByClass, leaveByGender, leaveByClass, scopeLabel, summary,
}: EducationReportSectionProps) {
  const [exportingPdf, setExportingPdf] = useState(false)

  const monthChartData = allowanceByMonth.map(m => ({ name: monthLabel(m.key), total: m.total, count: m.count }))

  const handleExportExcel = () => {
    if (payments.length === 0) { toast.error('No allowance payments to export'); return }
    const rows = payments.map(p => {
      const s = one(p.student)
      return {
        'Student': `${s?.first_name ?? ''} ${s?.last_name ?? ''}`.trim(),
        'Student Code': s?.student_code ?? '',
        'Gender': s?.gender ?? '',
        'Class': one(s?.class)?.name ?? '',
        'Amount': Number(p.amount),
        'Payment Date': p.payment_date,
      }
    })
    exportToExcel(rows, 'allowance-payments')
    toast.success('Allowance payments exported')
  }

  const handleExportPdf = async () => {
    setExportingPdf(true)
    try {
      await exportReportPDF({
        title: 'Allowance & Leave Report',
        subtitle: scopeLabel ?? 'My Class',
        kpis: [
          { label: 'Allowance All-Time', value: formatCurrency(summary.totalAllTime) },
          { label: 'Allowance This Month', value: formatCurrency(summary.totalThisMonth) },
          { label: 'Total Leave Requests', value: String(summary.totalLeaves) },
          { label: 'Pending Leaves', value: String(summary.pendingLeaves) },
        ],
        sections: [
          {
            title: 'Allowance by Month',
            headers: ['Month', 'Total Paid', 'Payments'],
            rows: allowanceByMonth.map(m => [monthLabel(m.key), formatCurrency(m.total), m.count]),
          },
          {
            title: 'Allowance by Gender',
            headers: ['Gender', 'Total Paid', 'Payments'],
            rows: allowanceByGender.map(g => [g.key, formatCurrency(g.total), g.count]),
          },
          {
            title: 'Allowance by Class',
            headers: ['Class', 'Total Paid', 'Payments'],
            rows: allowanceByClass.map(c => [c.key, formatCurrency(c.total), c.count]),
          },
          {
            title: 'Leave Requests by Gender',
            headers: ['Gender', 'Total', 'Pending', 'Approved', 'Rejected'],
            rows: leaveByGender.map(g => [g.key, g.total, g.pending, g.approved, g.rejected]),
          },
          {
            title: 'Leave Requests by Class',
            headers: ['Class', 'Total', 'Pending', 'Approved', 'Rejected'],
            rows: leaveByClass.map(c => [c.key, c.total, c.pending, c.approved, c.rejected]),
          },
        ],
        filename: 'allowance-leave-report',
      })
      toast.success('Report exported')
    } finally {
      setExportingPdf(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Detailed Reports</h2>
          <p className="text-sm text-muted-foreground">Allowance and leave activity for {scopeLabel ?? 'your class'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />Export Allowance (Excel)
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportPdf} disabled={exportingPdf}>
            <FileText className="mr-2 h-4 w-4" />{exportingPdf ? 'Exporting…' : 'Export Report (PDF)'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><CalendarDays className="h-4 w-4 text-teal-600" />Allowance by Month</CardTitle>
          <CardDescription>All months with confirmed allowance payments</CardDescription>
        </CardHeader>
        <CardContent>
          {monthChartData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
          ) : (
            <div className="overflow-x-auto">
              <div style={{ minWidth: monthChartData.length * 80 }}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`} />
                    <Tooltip formatter={(v: number) => [formatCurrency(v), 'Total Paid']} contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 6 }} />
                    <Bar dataKey="total" name="Total Paid" fill="#14b8a6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Users2 className="h-4 w-4 text-blue-600" />Allowance by Gender</CardTitle>
          </CardHeader>
          <CardContent>
            <GenderSplit data={allowanceByGender} formatValue={formatCurrency} unit="payments" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><GraduationCap className="h-4 w-4 text-indigo-600" />Allowance by Class</CardTitle>
          </CardHeader>
          <CardContent>
            <RankedList data={allowanceByClass} valueLabel="payments" formatValue={formatCurrency} color="#6366f1" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Users2 className="h-4 w-4 text-blue-600" />Leave Requests by Gender</CardTitle>
          </CardHeader>
          <CardContent>
            <GenderSplit data={leaveByGender.map(g => ({ key: g.key, total: g.total, count: g.total }))} formatValue={n => String(n)} unit="requests" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><GraduationCap className="h-4 w-4 text-indigo-600" />Leave Requests by Class</CardTitle>
            <CardDescription>P = Pending · A = Approved · R = Rejected</CardDescription>
          </CardHeader>
          <CardContent>
            <LeaveRankedList data={leaveByClass} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
