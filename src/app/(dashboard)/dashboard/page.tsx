import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/server'
import { KPICards } from '@/components/dashboard/kpi-cards'
import { FunnelChart } from '@/components/dashboard/funnel-chart'
import { GenderChart } from '@/components/dashboard/gender-chart'
import { GenerationChart } from '@/components/dashboard/generation-chart'
import { CompanyPerformance } from '@/components/dashboard/company-performance'
import { AllowanceSalaryChart } from '@/components/dashboard/allowance-salary-chart'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate, STUDENT_STATUS_COLORS, APPLICATION_STATUS_COLORS } from '@/lib/utils'
import { AlertTriangle, ArrowUpRight, Briefcase, Building2, CalendarDays, Clock, FileText, MessageSquare, UserRound } from 'lucide-react'

export const revalidate = 60

export default async function DashboardPage() {
  const supabase = await createClient()
  const { role, profile } = await getCurrentProfile()

  if (role === 'student') {
    const studentId = profile?.student_id
    const [{ data: student }, { data: applications }, { data: interviews }, { data: internships }, { data: employment }] = await Promise.all([
      supabase.from('students').select('id, first_name, last_name, student_code, status, class:classes(name), generation:generations(name)').eq('id', studentId ?? '').single(),
      supabase
        .from('internship_applications')
        .select('id, company_id, application_date, application_status, company:companies(company_name), position:company_positions(position_name, position_type)')
        .eq('student_id', studentId ?? '')
        .order('application_date', { ascending: false }),
      supabase
        .from('interviews')
        .select('id, interview_date, interview_time, interview_type, result, application:internship_applications(company:companies(company_name), position:company_positions(position_name))')
        .order('interview_date', { ascending: false }),
      supabase
        .from('internships')
        .select('id, position, start_date, end_date, internship_status, allowance, company:companies(company_name)')
        .eq('student_id', studentId ?? '')
        .order('start_date', { ascending: false }),
      supabase
        .from('employment_records')
        .select('id, company_name, position, employment_status, start_date, salary')
        .eq('student_id', studentId ?? '')
        .order('start_date', { ascending: false }),
    ])

    const apps = applications ?? []
    const ivs  = interviews ?? []

    // Derived stats
    const uniqueCompanies  = new Set(apps.map(a => a.company_id)).size
    const internshipApps   = apps.filter(a => one(a.position as { position_type: string }[] | null)?.position_type === 'Internship').length
    const fullTimeApps     = apps.filter(a => one(a.position as { position_type: string }[] | null)?.position_type === 'Full-Time Job').length
    const ivPassed         = ivs.filter(i => i.result === 'Passed').length
    const ivFailed         = ivs.filter(i => i.result === 'Failed').length
    const ivPending        = ivs.filter(i => i.result === 'Pending').length
    const accepted         = apps.filter(a => a.application_status === 'Accepted').length
    const rejected         = apps.filter(a => a.application_status === 'Rejected').length
    const nextInterview    = ivs.find(i => i.result === 'Pending')

    const statusOrder = ['Applied', 'Under Review', 'Interview Scheduled', 'Interview Passed', 'Interview Failed', 'Accepted', 'Rejected']
    const statusCounts = statusOrder.map(s => ({ status: s, count: apps.filter(a => a.application_status === s).length }))

    const statusColors: Record<string, string> = {
      'Applied':             'bg-blue-400',
      'Under Review':        'bg-yellow-400',
      'Interview Scheduled': 'bg-purple-400',
      'Interview Passed':    'bg-emerald-400',
      'Interview Failed':    'bg-red-400',
      'Accepted':            'bg-green-500',
      'Rejected':            'bg-gray-400',
    }

    return (
      <div className="space-y-6">
        {/* Welcome banner */}
        <Card className="overflow-hidden border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20">
          <CardContent className="p-5 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm text-muted-foreground">Welcome back</p>
              <p className="text-2xl font-bold">{student?.first_name} {student?.last_name}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="font-mono text-xs text-muted-foreground">{student?.student_code}</span>
                <Badge className={STUDENT_STATUS_COLORS[student?.status ?? 'Studying'] ?? 'bg-muted text-muted-foreground'}>
                  {student?.status ?? 'Studying'}
                </Badge>
                {one(student?.generation) && <Badge variant="secondary">{one(student?.generation)?.name}</Badge>}
                {one(student?.class) && <Badge variant="secondary">{one(student?.class)?.name}</Badge>}
              </div>
            </div>
            {nextInterview && (
              <div className="rounded-xl border border-purple-200 bg-purple-50 dark:bg-purple-950/30 px-4 py-3 text-sm shrink-0">
                <p className="text-xs text-purple-600 font-medium uppercase tracking-wide">Next Interview</p>
                <p className="font-semibold text-purple-900 dark:text-purple-200 mt-0.5">
                  {one(one(nextInterview.application)?.company)?.company_name ?? '—'}
                </p>
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  {formatDate(nextInterview.interview_date)}
                  {nextInterview.interview_time ? ` at ${nextInterview.interview_time}` : ''}
                  {nextInterview.interview_type ? ` · ${nextInterview.interview_type}` : ''}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stat grid row 1 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox label="Total Applications" value={apps.length}      color="text-blue-600"   bg="bg-blue-50 dark:bg-blue-950/30"   icon={FileText} />
          <StatBox label="Companies Applied"  value={uniqueCompanies}  color="text-indigo-600" bg="bg-indigo-50 dark:bg-indigo-950/30" icon={Building2} />
          <StatBox label="Interviews"         value={ivs.length}       color="text-purple-600" bg="bg-purple-50 dark:bg-purple-950/30" icon={MessageSquare} />
          <StatBox label="Accepted"           value={accepted}         color="text-green-600"  bg="bg-green-50 dark:bg-green-950/30"  icon={ArrowUpRight} />
        </div>

        {/* Stat grid row 2 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox label="Internship Apps"  value={internshipApps} color="text-cyan-600"   bg="bg-cyan-50 dark:bg-cyan-950/30"   icon={Briefcase} />
          <StatBox label="Full-Time Apps"   value={fullTimeApps}   color="text-violet-600" bg="bg-violet-50 dark:bg-violet-950/30" icon={UserRound} />
          <StatBox label="Interviews Passed" value={ivPassed}      color="text-emerald-600" bg="bg-emerald-50 dark:bg-emerald-950/30" icon={CalendarDays} />
          <StatBox label="Interviews Failed" value={ivFailed + rejected} color="text-red-600" bg="bg-red-50 dark:bg-red-950/30" icon={AlertTriangle} />
        </div>

        {/* Application status pipeline */}
        {apps.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Application Pipeline</CardTitle>
              <CardDescription>Breakdown of your {apps.length} application{apps.length !== 1 ? 's' : ''} by status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {statusCounts.filter(s => s.count > 0).map(({ status, count }) => (
                  <div key={status} className="flex items-center gap-3">
                    <div className="w-36 shrink-0 text-xs font-medium text-muted-foreground truncate">{status}</div>
                    <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${statusColors[status] ?? 'bg-gray-400'} transition-all`}
                        style={{ width: `${Math.round((count / apps.length) * 100)}%` }}
                      />
                    </div>
                    <div className="w-6 text-xs font-semibold text-right">{count}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>Pending interviews: <strong className="text-foreground">{ivPending}</strong></span>
                <span>Passed: <strong className="text-emerald-600">{ivPassed}</strong></span>
                <span>Failed: <strong className="text-red-500">{ivFailed}</strong></span>
                <span>Rejected: <strong className="text-gray-500">{rejected}</strong></span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 xl:grid-cols-2">
          {/* Recent applications */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Applications</CardTitle>
              <CardDescription>Your latest {Math.min(apps.length, 5)} of {apps.length} applications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {apps.length === 0 ? (
                <EmptyState text="No applications yet." />
              ) : (
                apps.slice(0, 5).map(app => {
                  const pos = one(app.position as { position_name: string; position_type: string }[] | null)
                  return (
                    <div key={app.id} className="flex items-center justify-between rounded-lg border p-3 gap-3">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{one(app.company)?.company_name ?? '—'}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {pos?.position_name ?? '—'}
                          {pos?.position_type && <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px]">{pos.position_type}</span>}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge className={APPLICATION_STATUS_COLORS[app.application_status] ?? 'bg-muted text-muted-foreground'}>
                          {app.application_status}
                        </Badge>
                        <p className="mt-1 text-xs text-muted-foreground">{formatDate(app.application_date)}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Interviews */}
          <Card>
            <CardHeader>
              <CardTitle>Interview History</CardTitle>
              <CardDescription>{ivs.length} total · {ivPassed} passed · {ivFailed} failed · {ivPending} pending</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {ivs.length === 0 ? (
                <EmptyState text="No interviews scheduled yet." />
              ) : (
                ivs.slice(0, 5).map(interview => (
                  <div key={interview.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{one(one(interview.application)?.company)?.company_name ?? '—'}</p>
                        <p className="text-xs text-muted-foreground truncate">{one(one(interview.application)?.position)?.position_name ?? '—'}</p>
                      </div>
                      <Badge variant={interview.result === 'Passed' ? 'default' : 'outline'}
                        className={interview.result === 'Passed' ? 'bg-green-500' : interview.result === 'Failed' ? 'border-red-300 text-red-600' : ''}>
                        {interview.result}
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {formatDate(interview.interview_date)}
                      {interview.interview_time ? ` at ${interview.interview_time}` : ''}
                      {interview.interview_type ? ` · ${interview.interview_type}` : ''}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Internship + Employment */}
        {((internships?.length ?? 0) > 0 || (employment?.length ?? 0) > 0) && (
          <div className="grid gap-4 xl:grid-cols-2">
            {(internships?.length ?? 0) > 0 && (
              <Card>
                <CardHeader><CardTitle>Internships</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {internships!.slice(0, 4).map(item => (
                    <div key={item.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{one(item.company)?.company_name ?? '—'}</p>
                          <p className="text-sm text-muted-foreground">{item.position}</p>
                        </div>
                        <Badge variant="outline">{item.internship_status}</Badge>
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {formatDate(item.start_date)}{item.end_date ? ` → ${formatDate(item.end_date)}` : ''}
                        {item.allowance != null ? ` · ${formatCurrency(item.allowance)}/mo` : ''}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            {(employment?.length ?? 0) > 0 && (
              <Card>
                <CardHeader><CardTitle>Employment</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {employment!.slice(0, 4).map(item => (
                    <div key={item.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{item.company_name}</p>
                          <p className="text-sm text-muted-foreground">{item.position}</p>
                        </div>
                        <Badge variant="outline">{item.employment_status}</Badge>
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {formatDate(item.start_date)}
                        {item.salary != null ? ` · ${formatCurrency(item.salary)}/mo` : ''}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    )
  }

  if (role === 'trainer') {
    const [{ count: totalStudents }, { count: totalApplications }, { count: pendingInterviews }, { data: topCompanies }, { data: topPositions }, { data: upcomingInterviews }, { data: recentApplications }] = await Promise.all([
      supabase.from('students').select('*', { count: 'exact', head: true }),
      supabase.from('internship_applications').select('*', { count: 'exact', head: true }),
      supabase.from('interviews').select('*', { count: 'exact', head: true }).eq('result', 'Pending'),
      supabase
        .from('internship_applications')
        .select('company_id, company:companies(company_name)')
        .limit(500),
      supabase
        .from('internship_applications')
        .select('position_id, position:company_positions(position_name, max_students), company:companies(company_name)')
        .limit(500),
      supabase
        .from('interviews')
        .select('id, interview_date, interview_time, application:internship_applications(student:students(first_name, last_name), company:companies(company_name), position:company_positions(position_name))')
        .eq('result', 'Pending')
        .order('interview_date', { ascending: true })
        .limit(6),
      supabase
        .from('internship_applications')
        .select('id, application_date, student:students(first_name, last_name), company:companies(company_name), position:company_positions(position_name), application_status')
        .order('application_date', { ascending: false })
        .limit(8),
    ])

    const topCompanyData = summarizeByKey(topCompanies ?? [], item => one(item.company)?.company_name ?? 'Unknown company')
      .slice(0, 6)

    const topPositionData = summarizeByKey(
      topPositions ?? [],
      item => `${one(item.position)?.position_name ?? 'Unknown position'}|${one(item.company)?.company_name ?? 'Unknown company'}|${one(item.position)?.max_students ?? 0}`
    )
      .map(item => {
        const [position, company, maxStudents] = item.label.split('|')
        return { position, company, maxStudents: Number(maxStudents), count: item.count }
      })
      .slice(0, 6)

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Students in pipeline" value={totalStudents ?? 0} hint="All students you can monitor" icon={UserRound} />
          <MetricCard label="Applications logged" value={totalApplications ?? 0} hint="Across all companies and positions" icon={Briefcase} />
          <MetricCard label="Pending interviews" value={pendingInterviews ?? 0} hint="Upcoming actions to track" icon={Clock} />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50">
            <CardHeader>
              <CardDescription>Trainer quick scan</CardDescription>
              <CardTitle>Where students are applying the most</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Top companies</p>
                {topCompanyData.length === 0 ? (
                  <EmptyState text="No company activity yet." />
                ) : (
                  topCompanyData.map(item => (
                    <div key={item.label} className="flex items-center justify-between rounded-lg border bg-white/80 p-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-amber-100 p-2 text-amber-700">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <p className="font-medium">{item.label}</p>
                      </div>
                      <Badge variant="secondary">{item.count} applies</Badge>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Top positions</p>
                {topPositionData.length === 0 ? (
                  <EmptyState text="No position activity yet." />
                ) : (
                  topPositionData.map(item => (
                    <div key={`${item.company}-${item.position}`} className="rounded-lg border bg-white/80 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{item.position}</p>
                        <Badge variant="secondary">{item.count} applies</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{item.company}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Capacity: {item.maxStudents || 'N/A'}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Interviews</CardTitle>
              <CardDescription>Fast follow-up list for trainer support.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(upcomingInterviews ?? []).length === 0 ? (
                <EmptyState text="No pending interviews." />
              ) : (
                upcomingInterviews!.map(item => (
                  <div key={item.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{one(one(item.application)?.student)?.first_name} {one(one(item.application)?.student)?.last_name}</p>
                      <Badge variant="outline">{formatDate(item.interview_date, 'MMM d')}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {one(one(item.application)?.company)?.company_name ?? 'Unknown company'} • {one(one(item.application)?.position)?.position_name ?? 'Unknown position'}
                    </p>
                    {item.interview_time && <p className="mt-1 text-xs text-muted-foreground">{item.interview_time}</p>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Student Activity</CardTitle>
            <CardDescription>Latest applications to review quickly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(recentApplications ?? []).length === 0 ? (
              <EmptyState text="No application activity yet." />
            ) : (
              recentApplications!.map(item => (
                <div key={item.id} className="flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">{one(item.student)?.first_name} {one(item.student)?.last_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {one(item.company)?.company_name ?? 'Unknown company'} • {one(item.position)?.position_name ?? 'Unknown position'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-muted-foreground">{formatDate(item.application_date)}</p>
                    <Badge className={APPLICATION_STATUS_COLORS[item.application_status] ?? 'bg-muted text-muted-foreground'}>
                      {item.application_status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const { data: kpis } = await supabase.rpc('get_dashboard_kpis')

  const { data: genderRaw } = await supabase.from('students').select('gender')
  const genderMap: Record<string, number> = {}
  for (const student of genderRaw ?? []) {
    genderMap[student.gender] = (genderMap[student.gender] ?? 0) + 1
  }
  const genderData = Object.entries(genderMap).map(([gender, count]) => ({ gender, count }))

  const { data: generations } = await supabase.from('generations').select('id, name').order('year')
  const generationData = await Promise.all(
    (generations ?? []).map(async generation => {
      const { data: generationStudents } = await supabase.from('students').select('id').eq('generation_id', generation.id)
      const studentIds = generationStudents?.map(item => item.id) ?? []

      const [{ count: appCount }, { count: internshipCount }, { count: employmentCount }] = await Promise.all([
        supabase.from('internship_applications').select('*', { count: 'exact', head: true }).in('student_id', studentIds),
        supabase.from('internships').select('*', { count: 'exact', head: true }).in('student_id', studentIds),
        supabase.from('employment_records').select('*', { count: 'exact', head: true }).in('student_id', studentIds),
      ])

      return {
        generation: generation.name.replace('Generation ', 'Gen '),
        applications: appCount ?? 0,
        internships: internshipCount ?? 0,
        employed: employmentCount ?? 0,
      }
    })
  )

  const { data: companies } = await supabase
    .from('companies')
    .select('id, company_name, internship_applications(count), internships(count)')
    .limit(10)

  const companyPerf = (companies ?? []).map((company: Record<string, unknown>) => ({
    id: company.id as string,
    company_name: company.company_name as string,
    application_count: (company.internship_applications as { count: number }[])?.[0]?.count ?? 0,
    internship_count: (company.internships as { count: number }[])?.[0]?.count ?? 0,
    employed_count: 0,
  })).sort((a, b) => b.application_count - a.application_count)

  const { data: internshipsRaw } = await supabase
    .from('internships')
    .select('allowance, companies(company_name)')
    .not('allowance', 'is', null)

  const allowanceByCompany = buildStatsByGroup(
    internshipsRaw ?? [],
    row => (one(row.companies as { company_name: string }[] | { company_name: string } | null)?.company_name ?? 'Unknown'),
    row => row.allowance as number
  )
  const avgAllowance = internshipsRaw?.length
    ? Math.round((internshipsRaw as { allowance: number }[]).reduce((sum, row) => sum + (row.allowance ?? 0), 0) / internshipsRaw.length)
    : 0

  const { data: employmentRaw } = await supabase
    .from('employment_records')
    .select('salary, company_name')
    .not('salary', 'is', null)

  const salaryByCompany = buildStatsByGroup(
    employmentRaw ?? [],
    row => row.company_name as string,
    row => row.salary as number
  )
  const avgSalary = employmentRaw?.length
    ? Math.round((employmentRaw as { salary: number }[]).reduce((sum, row) => sum + (row.salary ?? 0), 0) / employmentRaw.length)
    : 0

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const { data: upcomingInterviews } = await supabase
    .from('interviews')
    .select('*, internship_applications(student_id, students(first_name, last_name), companies(company_name))')
    .eq('interview_date', tomorrowStr)
    .eq('result', 'Pending')
    .limit(5)

  const { data: noJobStudents } = await supabase
    .from('students')
    .select('id, first_name, last_name, status')
    .eq('status', 'Looking For Job')
    .limit(5)

  return (
    <div className="space-y-6">
      <KPICards kpis={kpis} />

      {((upcomingInterviews?.length ?? 0) > 0 || (noJobStudents?.length ?? 0) > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {(upcomingInterviews?.length ?? 0) > 0 && (
            <Card className="border-yellow-200 dark:border-yellow-900 bg-yellow-50/50 dark:bg-yellow-950/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                  <Clock className="h-4 w-4" />
                  Interviews Tomorrow ({upcomingInterviews!.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {upcomingInterviews!.map((item: Record<string, unknown>) => {
                  const application = item.internship_applications as Record<string, unknown> | null
                  const student = application?.students as { first_name: string; last_name: string } | null
                  const company = application?.companies as { company_name: string } | null
                  return (
                    <div key={item.id as string} className="text-xs flex items-center justify-between">
                      <span>{student?.first_name} {student?.last_name}</span>
                      <span className="text-muted-foreground">{company?.company_name}</span>
                      <Badge variant="outline" className="text-[10px] py-0">{item.interview_type as string}</Badge>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {(noJobStudents?.length ?? 0) > 0 && (
            <Card className="border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-orange-700 dark:text-orange-400">
                  <AlertTriangle className="h-4 w-4" />
                  Students Looking For Job ({noJobStudents!.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {noJobStudents!.map(student => (
                  <div key={student.id} className="text-xs flex items-center justify-between">
                    <span>{student.first_name} {student.last_name}</span>
                    <Badge variant="outline" className="text-[10px] py-0">Needs Support</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FunnelChart kpis={kpis} />
        </div>
        <GenderChart data={genderData} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GenerationChart data={generationData} />
        <CompanyPerformance data={companyPerf} />
      </div>

      <AllowanceSalaryChart
        allowanceByCompany={allowanceByCompany}
        salaryByCompany={salaryByCompany}
        avgAllowance={avgAllowance}
        avgSalary={avgSalary}
      />
    </div>
  )
}

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string
  value: number | string
  hint: string
  icon: typeof UserRound
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
        <div className="rounded-2xl bg-muted p-3">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )
}

function StatBox({
  label, value, color, bg, icon: Icon,
}: {
  label: string
  value: number
  color: string
  bg: string
  icon: typeof UserRound
}) {
  return (
    <div className={`rounded-xl border p-4 flex items-center gap-3 ${bg}`}>
      <div className={`rounded-lg p-2 bg-white/60 dark:bg-white/10 shrink-0`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-muted-foreground leading-tight">{label}</p>
      </div>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">{text}</p>
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

function summarizeByKey<T>(rows: T[], getLabel: (row: T) => string) {
  const counts = new Map<string, number>()
  for (const row of rows) {
    const label = getLabel(row)
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
}

function buildStatsByGroup(
  data: Record<string, unknown>[],
  getKey: (row: Record<string, unknown>) => string,
  getValue: (row: Record<string, unknown>) => number
) {
  const map: Record<string, number[]> = {}
  for (const row of data) {
    const key = getKey(row)
    const value = getValue(row)
    if (!map[key]) map[key] = []
    map[key].push(value)
  }

  return Object.entries(map).map(([name, values]) => ({
    name,
    avg: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length),
    min: Math.min(...values),
    max: Math.max(...values),
  })).sort((a, b) => b.avg - a.avg).slice(0, 8)
}
