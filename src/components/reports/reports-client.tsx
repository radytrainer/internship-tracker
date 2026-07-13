'use client'

import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Download, Users, Briefcase, TrendingUp, Building, Building2, ShieldCheck, UserCheck, ChevronRight } from 'lucide-react'
import { exportToExcel, exportToCSV } from '@/lib/export'
import { cn, formatCurrency, formatNumber } from '@/lib/utils'

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
  const [companySheet, setCompanySheet] = useState<'mou' | 'non-mou' | null>(null)

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

  const statusGenderBreakdown = useMemo(() => {
    const counts: Record<string, { male: number; female: number; other: number }> = {}
    filteredStudents.forEach((s: AnyRecord) => {
      if (!s.status) return
      if (!counts[s.status]) counts[s.status] = { male: 0, female: 0, other: 0 }
      const g = (s.gender ?? '').toLowerCase()
      if (g === 'male' || g === 'm') counts[s.status].male++
      else if (g === 'female' || g === 'f') counts[s.status].female++
      else counts[s.status].other++
    })
    return Object.entries(counts).map(([status, { male, female, other }]) => ({
      status, male, female, other, total: male + female + other,
    }))
  }, [filteredStudents])

  const genderSummary = useMemo(() => {
    let male = 0, female = 0
    filteredStudents.forEach((s: AnyRecord) => {
      const g = (s.gender ?? '').toLowerCase()
      if (g === 'male' || g === 'm') male++
      else if (g === 'female' || g === 'f') female++
    })
    return [
      { name: 'Male', value: male },
      { name: 'Female', value: female },
    ]
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

  // Companies with a signed MOU that have actually taken on at least one intern
  const mouCompanyIds = useMemo(() =>
    new Set(companies.filter((c: AnyRecord) => c.has_mou).map((c: AnyRecord) => c.id)),
    [companies]
  )

  // Number of distinct students placed at each company
  const studentCountByCompany = useMemo(() => {
    const map: Record<string, Set<string>> = {}
    internships.forEach((i: AnyRecord) => {
      if (!map[i.company_id]) map[i.company_id] = new Set()
      map[i.company_id].add(i.student_id)
    })
    return map
  }, [internships])

  const mouCompanyList = useMemo(() =>
    companies
      .filter((c: AnyRecord) => c.has_mou && (studentCountByCompany[c.id]?.size ?? 0) > 0)
      .map((c: AnyRecord) => ({ id: c.id, name: c.company_name, studentCount: studentCountByCompany[c.id].size }))
      .sort((a, b) => b.studentCount - a.studentCount),
    [companies, studentCountByCompany]
  )
  const nonMouCompanyList = useMemo(() =>
    companies
      .filter((c: AnyRecord) => !c.has_mou && (studentCountByCompany[c.id]?.size ?? 0) > 0)
      .map((c: AnyRecord) => ({ id: c.id, name: c.company_name, studentCount: studentCountByCompany[c.id].size }))
      .sort((a, b) => b.studentCount - a.studentCount),
    [companies, studentCountByCompany]
  )

  const mouCompaniesPlaced = mouCompanyList.length
  const nonMouCompaniesPlaced = nonMouCompanyList.length
  const nonMouCompanyCount = companies.length - mouCompanyIds.size
  const mouPlacedPct = mouCompanyIds.size > 0 ? Math.round((mouCompaniesPlaced / mouCompanyIds.size) * 100) : 0
  const nonMouPlacedPct = nonMouCompanyCount > 0 ? Math.round((nonMouCompaniesPlaced / nonMouCompanyCount) * 100) : 0

  const activeCompanySheet = companySheet === 'mou'
    ? { title: 'MOU Companies with Interns', description: 'Companies with a signed MOU that have taken on interns.', list: mouCompanyList }
    : companySheet === 'non-mou'
    ? { title: 'Non-MOU Companies with Interns', description: 'Companies without an MOU that have still taken on interns.', list: nonMouCompanyList }
    : null

  // Distinct students who have found/secured an internship placement
  const studentsFoundInternship = useMemo(() =>
    new Set(internships.map((i: AnyRecord) => i.student_id)).size,
    [internships]
  )

  // Breakdown of internships the student sourced themselves vs. staff arranged via outreach
  const internshipSourceStats = useMemo(() => {
    const studentFound = internships.filter((i: AnyRecord) => i.source === 'Student Found').length
    const staffOutreach = internships.filter((i: AnyRecord) => i.source === 'Staff Outreach').length
    return { studentFound, staffOutreach, notSet: internships.length - studentFound - staffOutreach }
  }, [internships])

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

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {[
          { label: 'Total Students', value: formatNumber(filteredStudents.length), icon: Users, gradient: 'from-blue-500 to-blue-700', shadow: 'shadow-blue-200 dark:shadow-blue-900' },
          { label: 'Employment Rate', value: `${employmentRate}%`, icon: TrendingUp, gradient: 'from-green-500 to-green-700', shadow: 'shadow-green-200 dark:shadow-green-900' },
          { label: 'Avg Salary', value: formatCurrency(salaryStats.avg), icon: Briefcase, gradient: 'from-purple-500 to-purple-700', shadow: 'shadow-purple-200 dark:shadow-purple-900' },
          { label: 'Partner Companies', value: formatNumber(companies.length), icon: Building, gradient: 'from-orange-400 to-orange-600', shadow: 'shadow-orange-200 dark:shadow-orange-900' },
          { label: 'MOU Companies Placed', value: `${mouCompaniesPlaced} / ${mouCompanyIds.size}`, sub: `${mouPlacedPct}% placed`, icon: ShieldCheck, gradient: 'from-emerald-500 to-emerald-700', shadow: 'shadow-emerald-200 dark:shadow-emerald-900', onClick: () => setCompanySheet('mou') },
          { label: 'Non-MOU Companies Placed', value: `${nonMouCompaniesPlaced} / ${nonMouCompanyCount}`, sub: `${nonMouPlacedPct}% placed`, icon: Building2, gradient: 'from-slate-500 to-slate-700', shadow: 'shadow-slate-200 dark:shadow-slate-900', onClick: () => setCompanySheet('non-mou') },
          { label: 'Students Found Internship', value: formatNumber(studentsFoundInternship), icon: UserCheck, gradient: 'from-teal-500 to-teal-700', shadow: 'shadow-teal-200 dark:shadow-teal-900' },
        ].map(kpi => {
          const card = (
            <div className={cn(
              'relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl h-full',
              kpi.gradient, kpi.shadow
            )}>
              <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white/80 truncate">{kpi.label}</p>
                  <p className="mt-1.5 text-2xl font-bold text-white leading-none">{kpi.value}</p>
                  {kpi.sub && <p className="mt-1.5 text-xs text-white/70">{kpi.sub}</p>}
                </div>
                <div className="shrink-0 rounded-xl bg-white/20 p-2.5">
                  <kpi.icon className="h-5 w-5 text-white" />
                </div>
              </div>
              {kpi.onClick && (
                <div className="mt-3 flex items-center gap-0.5 text-xs font-medium text-white/70">
                  View companies<ChevronRight className="h-3 w-3" />
                </div>
              )}
            </div>
          )
          return kpi.onClick ? (
            <button key={kpi.label} type="button" onClick={kpi.onClick} className="text-left">{card}</button>
          ) : (
            <div key={kpi.label}>{card}</div>
          )
        })}
      </div>

      <Sheet open={companySheet !== null} onOpenChange={open => { if (!open) setCompanySheet(null) }}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col overflow-hidden">
          <SheetHeader className="p-6 pb-4 border-b shrink-0">
            <SheetTitle>{activeCompanySheet?.title} ({activeCompanySheet?.list.length ?? 0})</SheetTitle>
            <SheetDescription>{activeCompanySheet?.description}</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {!activeCompanySheet || activeCompanySheet.list.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No companies found.</p>
            ) : (
              activeCompanySheet.list.map(c => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border p-3">
                  <p className="font-medium truncate">{c.name}</p>
                  <Badge variant="secondary">{c.studentCount} student{c.studentCount === 1 ? '' : 's'}</Badge>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

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
          <div className="space-y-4">
            {/* Gender by Status — grouped horizontal bar chart */}
            <Card>
              <CardHeader><CardTitle>Students by Status &amp; Gender</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={Math.max(320, statusGenderBreakdown.length * 52)}>
                  <BarChart data={statusGenderBreakdown} layout="vertical" margin={{ top: 5, right: 40, left: 8, bottom: 5 }} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                    <YAxis dataKey="status" type="category" width={172} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px' }} />
                    <Legend />
                    <Bar dataKey="male" name="Male" fill="#3b82f6" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 11, fill: '#3b82f6' }} />
                    <Bar dataKey="female" name="Female" fill="#ec4899" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 11, fill: '#ec4899' }} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status distribution pie + overall gender donut */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle>Status Distribution</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={3} dataKey="value" nameKey="name"
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(1)}%`}>
                        {statusBreakdown.map((_: AnyRecord, idx: number) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Overall Gender Split</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={genderSummary} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={4} dataKey="value" nameKey="name" label={false} labelLine={false}>
                        <Cell fill="#3b82f6" />
                        <Cell fill="#ec4899" />
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} students`, name]} contentStyle={{ borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-8 mt-3">
                    {genderSummary.map((g, i) => {
                      const total = genderSummary.reduce((s, x) => s + x.value, 0)
                      const pct = total > 0 ? Math.round((g.value / total) * 100) : 0
                      return (
                        <div key={g.name} className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            <div className="h-3 w-3 rounded-full" style={{ background: i === 0 ? '#3b82f6' : '#ec4899' }} />
                            {g.name}
                          </div>
                          <span className="text-2xl font-bold" style={{ color: i === 0 ? '#3b82f6' : '#ec4899' }}>{g.value}</span>
                          <span className="text-xs text-muted-foreground">{pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="companies">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
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
            <Card>
              <CardHeader><CardTitle>Internship Source</CardTitle></CardHeader>
              <CardContent className="space-y-4 pt-2">
                {[
                  { label: 'Student Found', value: formatNumber(internshipSourceStats.studentFound) },
                  { label: 'Staff Outreach', value: formatNumber(internshipSourceStats.staffOutreach) },
                  { label: 'Not Set', value: formatNumber(internshipSourceStats.notSet) },
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
