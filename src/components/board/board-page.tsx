'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { GraduationCap, Building2, Globe, Mail, Phone, MapPin, LogIn, ChevronRight, TrendingUp, Sparkles } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = any

const STATUS_COLORS: Record<string, string> = {
  'Applied':            'bg-blue-100 text-blue-700',
  'Under Review':       'bg-yellow-100 text-yellow-700',
  'Interview Scheduled':'bg-purple-100 text-purple-700',
  'Interview Passed':   'bg-emerald-100 text-emerald-700',
  'Interview Failed':   'bg-red-100 text-red-700',
  'Accepted':           'bg-green-100 text-green-700',
  'Rejected':           'bg-gray-100 text-gray-600',
}

const RESULT_COLORS: Record<string, string> = {
  'Pending': 'bg-yellow-100 text-yellow-700',
  'Passed':  'bg-green-100 text-green-700',
  'Failed':  'bg-red-100 text-red-700',
}

function avatarColor(name: string) {
  const colors = [
    'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500',
    'bg-pink-500', 'bg-rose-500', 'bg-orange-500', 'bg-teal-500',
  ]
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % colors.length
  return colors[h]
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('')
}

function fmt(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

interface BoardPageProps {
  topCompanies: AnyRecord[]
  availableCompanies: AnyRecord[]
}

function CompanyCard({ company, rank, mode, onClick }: {
  company: AnyRecord
  rank: number
  mode: 'popular' | 'available'
  onClick: () => void
}) {
  const isAvailableMode = mode === 'available'
  const metric = isAvailableMode ? company.total_remaining : company.total_applications
  const metricLabel = isAvailableMode ? 'remaining' : 'applied'
  const accentColor = isAvailableMode
    ? 'text-emerald-700'
    : (company.isFull ? 'text-red-600' : 'text-blue-700')
  const accentSub = isAvailableMode
    ? 'text-emerald-500'
    : (company.isFull ? 'text-red-400' : 'text-blue-500')

  return (
    <button
      onClick={onClick}
      className={`relative group bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 text-left p-5 space-y-3 ${
        !isAvailableMode && company.isFull
          ? 'border-2 border-red-400 ring-2 ring-red-100'
          : isAvailableMode
          ? 'border border-emerald-200 hover:border-emerald-400'
          : 'border border-gray-200 hover:border-blue-200'
      }`}
    >
      {!isAvailableMode && company.isFull && (
        <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full z-10">
          FULL
        </span>
      )}

      {/* Company header */}
      <div className="flex items-start gap-3">
        {company.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={company.logo_url} alt={company.company_name} className="h-12 w-12 rounded-xl object-cover shrink-0" />
        ) : (
          <div className={`h-12 w-12 rounded-xl ${avatarColor(company.company_name)} flex items-center justify-center shrink-0 text-white font-bold text-lg`}>
            {initials(company.company_name)}
          </div>
        )}
        <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-muted-foreground">#{rank + 1}</span>
              <h3 className="font-semibold text-gray-900 truncate">{company.company_name}</h3>
            </div>
            {company.industry && (
              <a href={company.industry} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline mt-0.5">
                Telegram
              </a>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className={`text-2xl font-bold leading-none ${accentColor}`}>{metric}</p>
            <p className={`text-xs mt-0.5 ${accentSub}`}>{metricLabel}</p>
          </div>
        </div>
      </div>

      {/* Positions */}
      {company.positions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Positions</p>
          {company.positions.slice(0, 4).map((p: AnyRecord) => {
            const positionFull = p.application_count >= p.max_students * 2
            const remaining = Math.max(0, p.max_students * 2 - p.application_count)
            return (
              <div key={p.id} className="flex items-center justify-between text-sm gap-2">
                <span className="text-gray-700 truncate flex-1">
                  {p.position_name}
                  {p.intake_date && <span className="text-xs text-muted-foreground ml-1">({new Date(p.intake_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })})</span>}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">needs {p.max_students}</span>
                {isAvailableMode ? (
                  <span className={`text-xs font-semibold rounded-full px-2 py-0.5 shrink-0 ${
                    positionFull ? 'bg-red-100 text-red-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {remaining} left
                  </span>
                ) : (
                  <span className={`text-xs font-semibold rounded-full px-2 py-0.5 shrink-0 ${
                    positionFull ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {p.application_count}/{p.max_students * 2}
                  </span>
                )}
              </div>
            )
          })}
          {company.positions.length > 4 && (
            <p className="text-xs text-muted-foreground">+{company.positions.length - 4} more positions</p>
          )}
        </div>
      )}

      <div className={`flex items-center justify-end text-xs font-medium gap-1 pt-1 ${
        isAvailableMode ? 'text-emerald-500 group-hover:text-emerald-700' : 'text-blue-500 group-hover:text-blue-700'
      }`}>
        View details <ChevronRight className="h-3.5 w-3.5" />
      </div>
    </button>
  )
}

function CompanyGrid({ companies, mode, onSelect }: {
  companies: AnyRecord[]
  mode: 'popular' | 'available'
  onSelect: (c: AnyRecord) => void
}) {
  if (companies.length === 0) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        <Building2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p>{mode === 'available' ? 'All positions are currently full.' : 'No applications yet.'}</p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {companies.map((company, rank) => (
        <CompanyCard key={company.id} company={company} rank={rank} mode={mode} onClick={() => onSelect(company)} />
      ))}
    </div>
  )
}

export function BoardPage({ topCompanies, availableCompanies }: BoardPageProps) {
  const [selected, setSelected] = useState<AnyRecord | null>(null)
  const [showAllAvailable, setShowAllAvailable] = useState(false)

  const visibleAvailable = showAllAvailable ? availableCompanies : availableCompanies.slice(0, 10)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur sticky top-0 z-10 border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">InternTrack</span>
          </div>
          <Link href="/login">
            <Button size="sm" variant="outline" className="gap-2">
              <LogIn className="h-4 w-4" />Staff Login
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Tabs defaultValue="popular">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="h-10">
              <TabsTrigger value="popular" className="gap-2">
                <TrendingUp className="h-4 w-4" />Most Applied
              </TabsTrigger>
              <TabsTrigger value="available" className="gap-2">
                <Sparkles className="h-4 w-4" />Most Available
              </TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <TabsContent value="popular" className="mt-0">
                <Badge variant="secondary" className="text-sm px-3 py-1">{topCompanies.length} companies</Badge>
              </TabsContent>
              <TabsContent value="available" className="mt-0">
                <Badge variant="secondary" className="text-sm px-3 py-1 bg-emerald-100 text-emerald-700">{availableCompanies.length} companies</Badge>
              </TabsContent>
            </div>
          </div>

          <TabsContent value="popular">
            <p className="text-sm text-muted-foreground mb-4">Top 10 companies with the most student applications</p>
            <CompanyGrid companies={topCompanies} mode="popular" onSelect={setSelected} />
          </TabsContent>

          <TabsContent value="available">
            <p className="text-sm text-muted-foreground mb-4">
              {showAllAvailable
                ? `All ${availableCompanies.length} companies with open slots`
                : `Top 10 of ${availableCompanies.length} companies with open slots`}
            </p>
            <CompanyGrid companies={visibleAvailable} mode="available" onSelect={setSelected} />
            {availableCompanies.length > 10 && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowAllAvailable(v => !v)}
                  className="gap-2"
                >
                  {showAllAvailable
                    ? 'Show Top 10 Only'
                    : `View All ${availableCompanies.length} Companies`}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Detail sheet — shared across both tabs */}
      <Sheet open={!!selected} onOpenChange={open => { if (!open) setSelected(null) }}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
          {selected && (
            <>
              <SheetHeader className={`p-6 pb-4 border-b ${selected.isFull ? 'bg-gradient-to-r from-red-50 to-rose-50' : 'bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
                <div className="flex items-center gap-4">
                  {selected.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selected.logo_url} alt={selected.company_name} className="h-14 w-14 rounded-2xl object-cover shrink-0" />
                  ) : (
                    <div className={`h-14 w-14 rounded-2xl ${avatarColor(selected.company_name)} flex items-center justify-center text-white font-bold text-xl shrink-0`}>
                      {initials(selected.company_name)}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <SheetTitle className="text-xl">{selected.company_name}</SheetTitle>
                      {selected.isFull && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">FULL</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                      {selected.industry && (
                        <a href={selected.industry} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-500 hover:underline">
                          Telegram
                        </a>
                      )}
                      <span className={`font-semibold ${selected.isFull ? 'text-red-600' : 'text-blue-600'}`}>
                        {selected.total_applications} applied
                      </span>
                      {selected.total_remaining > 0 && (
                        <span className="font-semibold text-emerald-600">
                          {selected.total_remaining} remaining
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
                  {selected.website && (
                    <a href={selected.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-blue-600">
                      <Globe className="h-3.5 w-3.5" />{selected.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  {selected.contact_email && (
                    <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{selected.contact_email}</span>
                  )}
                  {selected.contact_phone && (
                    <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{selected.contact_phone}</span>
                  )}
                  {selected.address && (
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{selected.address}</span>
                  )}
                </div>
              </SheetHeader>

              <div className="px-6 pt-4 pb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Positions</p>
                <div className="flex flex-wrap gap-2">
                  {selected.positions.map((p: AnyRecord) => {
                    const positionFull = p.application_count >= p.max_students * 2
                    const remaining = Math.max(0, p.max_students * 2 - p.application_count)
                    return (
                      <div key={p.id} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm ${positionFull ? 'bg-red-50' : 'bg-muted'}`}>
                        <span className="font-medium">
                          {p.position_name}
                          {p.intake_date && <span className="text-xs font-normal text-muted-foreground ml-1">({new Date(p.intake_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })})</span>}
                        </span>
                        <Badge variant="outline" className="text-xs">needs {p.max_students}</Badge>
                        <Badge variant={positionFull ? 'destructive' : 'secondary'} className="text-xs">
                          {p.application_count}/{p.max_students * 2} applied
                        </Badge>
                        {!positionFull && (
                          <Badge className="text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            {remaining} left
                          </Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex-1 overflow-auto px-6 pb-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 mt-4">
                  All Applications ({selected.applications.length})
                </p>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs">Student</TableHead>
                        <TableHead className="text-xs">Position</TableHead>
                        <TableHead className="text-xs">Applied</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Interview</TableHead>
                        <TableHead className="text-xs">Result</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selected.applications.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-sm">
                            No applications yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        selected.applications.map((app: AnyRecord) => (
                          <TableRow key={app.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">
                                  {app.student ? `${app.student.first_name} ${app.student.last_name}` : '—'}
                                </p>
                                {app.student?.student_code && (
                                  <p className="text-xs font-mono text-muted-foreground">{app.student.student_code}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {app.position?.position_name ?? '—'}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {fmt(app.application_date)}
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[app.application_status] ?? 'bg-gray-100 text-gray-600'}`}>
                                {app.application_status}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {app.interview ? fmt(app.interview.interview_date) : '—'}
                              {app.interview?.interview_type && (
                                <p className="text-xs opacity-70">{app.interview.interview_type}</p>
                              )}
                            </TableCell>
                            <TableCell>
                              {app.interview ? (
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${RESULT_COLORS[app.interview.result] ?? 'bg-gray-100 text-gray-600'}`}>
                                  {app.interview.result}
                                </span>
                              ) : '—'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
