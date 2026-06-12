'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users, FileText, MessageSquare, CheckCircle,
  ClipboardList, Briefcase, Award, Building2,
  TrendingUp, ArrowUpRight
} from 'lucide-react'
import type { DashboardKPIs } from '@/types/database.types'

const kpiConfig = [
  { key: 'total_students', label: 'Total Students', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' },
  { key: 'total_companies', label: 'Partner Companies', icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950' },
  { key: 'total_applications', label: 'Applications', icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950' },
  { key: 'interviews_scheduled', label: 'Interviews Pending', icon: MessageSquare, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950' },
  { key: 'interviews_passed', label: 'Interviews Passed', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950' },
  { key: 'internship_accepted', label: 'Internship Accepted', icon: ClipboardList, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950' },
  { key: 'internship_active', label: 'Active Internships', icon: Briefcase, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950' },
  { key: 'employed', label: 'Employed Graduates', icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950' },
] as const

interface KPICardsProps {
  kpis: DashboardKPIs | null
  loading?: boolean
}

export function KPICards({ kpis, loading }: KPICardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpiConfig.map(({ key, label, icon: Icon, color, bg }) => {
        const value = kpis?.[key as keyof DashboardKPIs] ?? 0
        const pct = kpis?.total_students ? Math.round((value / kpis.total_students) * 100) : 0

        return (
          <Card key={key} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                {key !== 'total_students' && key !== 'total_companies' && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                    {pct}%
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold">{value.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
