'use client'

import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, Users, Briefcase, TrendingUp, Building } from 'lucide-react'
import { exportToExcel, exportToCSV } from '@/lib/export'
import { formatCurrency, formatNumber } from '@/lib/utils'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = any

interface ReportsClientProps {
  generations: AnyRecord[]
  students: AnyRecord[]
  applications: AnyRecord[]
  internships: AnyRecord[]
  employment: AnyRecord[]
  companies: AnyRecord[]
}

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6']

export function ReportsClient({ generations, students, applications, internships, employment, companies }: ReportsClientProps) {
  const [filterGen, setFilterGen] = useState('all')

  const filteredStudents = useMemo(() =>
    filterGen === 'all' ? students : students.filter((s: AnyRecord) => s.generation_id === filterGen),
    [students, filterGen]
  )

  const genComparisonData = useMemo(() => generations.map((gen: AnyRecord) => {
    const genStudents = students.filter((s: AnyRecord) => s.generation_id === gen.id)
    const genStudentIds = new Set(genStudents.map((s: AnyRecord) => s.id))
    const genApps = applications.filter((a: AnyRecord) => genStudentIds.has(a.student_id))
    const genInternships = internships.filter((i: AnyRecord) => genStudentIds.has(i.student_id) && i.internship_status === 'Completed')
    const genEmployed = employment.filter((e: AnyRecord) => genStudentIds.has(e.student_id) && e.employment_status === 'Active')
    return {
      name: gen.name ?? gen.generation_name,
      Students: genStudents.length,
      Applications: genApps.length,
      Internships: genInternships.length,
      Employed: genEmployed.length,
    }
  }), [generations, students, applications, internships, employment])

  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredStudents.forEach((s: AnyRecord) => { counts[s.status] = (counts[s.status] ?? 0) + 1 })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [filteredStudents])

  const companyStats = useMemo(() => {
    const stats: Record<string, { name: string; applications: number; accepted: number; internships: number }> = {}
    applications.forEach((a: AnyRecord) => {
      const cid = a.company_id
      const cName = companies.find((c: AnyRecord) => c.id === cid)?.company_name ?? cid
      if (!stats[cid]) stats[cid] = { name: cName, applications: 0, accepted: 0, internships: 0 }
      stats[cid].applications++
      if (a.application_status === 'Accepted') stats[cid].accepted++
    })
    internships.forEach((i: AnyRecord) => {
      if (stats[i.company_id]) stats[i.company_id].internships++
    })
    return Object.values(stats).sort((a, b) => b.applications - a.applications).slice(0, 10)
  }, [applications, internships, companies])

  const salaryStats = useMemo(() => {
    const salaries = employment
      .filter((e: AnyRecord) => e.salary != null && e.employment_status === 'Active')
      .map((e: AnyRecord) => e.salary as number)
    if (salaries.length === 0) return { avg: 0, min: 0, max: 0, count: 0 }
    salaries.sort((a: number, b: number) => a - b)
    return {
      avg: salaries.reduce((s: number, v: number) => s + v, 0) / salaries.length,
      min: salaries[0], max: salaries[salaries.length - 1], count: salaries.length,
    }
  }, [employment])

  const allowanceStats = useMemo(() => {
    const vals = internships
      .filter((i: AnyRecord) => i.allowance != null)
      .map((i: AnyRecord) => i.allowance as number)
    if (vals.length === 0) return { avg: 0, min: 0, max: 0, count: 0 }
    vals.sort((a: number, b: number) => a - b)
    return {
      avg: vals.reduce((s: number, v: number) => s + v, 0) / vals.length,
      min: vals[0], max: vals[vals.length - 1], count: vals.length,
    }
  }, [internships])

  const employmentRate = filteredStudents.length > 0
    ? Math.round((filteredStudents.filter((s: AnyRecord) => s.status === 'Employed').length / filteredStudents.length) * 100)
    : 0

  const exportReport = (format: 'excel' | 'csv') => {
    const data = students.map((s: AnyRecord) => ({
      'Student Code': s.student_code, 'Name': `${s.first_name} ${s.last_name}`,
      'Gender': s.gender, 'Status': s.status,
    }))
    if (format === 'excel') exportToExcel(data, 'internship-tracker-report')
    else exportToCSV(data, 'internship-tracker-report')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Reports & Analytics</h2>
          <p className="text-sm text-muted-foreground">Comprehensive insights across all cohorts</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterGen} onValueChange={setFilterGen}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All Generations" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Generations</SelectItem>
              {generations.map((g: AnyRecord) => <SelectItem key={g.id} value={g.id}>{g.name ?? g.generation_name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => exportReport('excel')}>
            <Download className="mr-2 h-4 w-4" />Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportReport('csv')}>
            <Download className="mr-2 h-4 w-4" />CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: formatNumber(filteredStudents.length), icon: Users, color: 'text-blue-500' },
          { label: 'Employment Rate', value: `${employmentRate}%`, icon: TrendingUp, color: 'text-green-500' },
          { label: 'Avg Salary', value: formatCurrency(salaryStats.avg), icon: Briefcase, color: 'text-purple-500' },
          { label: 'Partner Companies', value: formatNumber(companies.length), icon: Building, color: 'text-orange-500' },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                </div>
                <kpi.icon className={`h-8 w-8 ${kpi.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="generation">
        <TabsList>
          <TabsTrigger value="generation">Generation Comparison</TabsTrigger>
          <TabsTrigger value="status">Student Status</TabsTrigger>
          <TabsTrigger value="companies">Top Companies</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
        </TabsList>

        <TabsContent value="generation">
          <Card>
            <CardHeader><CardTitle>Generation Comparison</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={genComparisonData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="Students" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Applications" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Internships" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Employed" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Status Distribution</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={120} paddingAngle={3} dataKey="value" nameKey="name"
                      label={({ name, percent }) => `${name} ${Math.round((percent ?? 0) * 100)}%`}>
                      {statusBreakdown.map((_: AnyRecord, idx: number) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Status Breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3 mt-2">
                  {statusBreakdown.map((item: { name: string; value: number }, idx: number) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ background: COLORS[idx % COLORS.length] }} />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{item.value}</span>
                        <span className="text-xs text-muted-foreground">
                          ({filteredStudents.length > 0 ? Math.round((item.value / filteredStudents.length) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="companies">
          <Card>
            <CardHeader><CardTitle>Top 10 Companies by Applications</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={companyStats} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={95} />
                  <Tooltip contentStyle={{ borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="applications" fill="#6366f1" radius={[0, 4, 4, 0]} name="Applications" />
                  <Bar dataKey="accepted" fill="#22c55e" radius={[0, 4, 4, 0]} name="Accepted" />
                  <Bar dataKey="internships" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Internships" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financials">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Monthly Allowance (Internships)</CardTitle></CardHeader>
              <CardContent className="space-y-4 pt-2">
                {[
                  { label: 'Average', value: formatCurrency(allowanceStats.avg) },
                  { label: 'Minimum', value: formatCurrency(allowanceStats.min) },
                  { label: 'Maximum', value: formatCurrency(allowanceStats.max) },
                  { label: 'Interns with Allowance', value: `${allowanceStats.count} students` },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center py-2 border-b last:border-0">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-semibold">{row.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Monthly Salary (Employment)</CardTitle></CardHeader>
              <CardContent className="space-y-4 pt-2">
                {[
                  { label: 'Average', value: formatCurrency(salaryStats.avg) },
                  { label: 'Minimum', value: formatCurrency(salaryStats.min) },
                  { label: 'Maximum', value: formatCurrency(salaryStats.max) },
                  { label: 'Employed with Salary Data', value: `${salaryStats.count} students` },
                  { label: 'Employment Rate', value: `${employmentRate}%` },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center py-2 border-b last:border-0">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-semibold">{row.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
