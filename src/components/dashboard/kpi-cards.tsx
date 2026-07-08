'use client'

import { Skeleton } from '@/components/ui/skeleton'
import {
  Users, FileText, MessageSquare, CheckCircle,
  ClipboardList, Briefcase, Award, Building2,
  XCircle, Handshake
} from 'lucide-react'
import type { DashboardKPIs } from '@/types/database.types'

const kpiConfig = [
  {
    key: 'total_students',
    label: 'Total Students',
    icon: Users,
    gradient: 'from-blue-500 to-blue-700',
    shadow: 'shadow-blue-200 dark:shadow-blue-900',
  },
  {
    key: 'total_companies',
    label: 'Partner Companies',
    icon: Building2,
    gradient: 'from-violet-500 to-purple-700',
    shadow: 'shadow-violet-200 dark:shadow-violet-900',
  },
  {
    key: 'total_applications',
    label: 'Applications',
    icon: FileText,
    gradient: 'from-orange-400 to-orange-600',
    shadow: 'shadow-orange-200 dark:shadow-orange-900',
  },
  {
    key: 'interviews_scheduled',
    label: 'Interviews Pending',
    icon: MessageSquare,
    gradient: 'from-amber-400 to-yellow-600',
    shadow: 'shadow-amber-200 dark:shadow-amber-900',
  },
  {
    key: 'interviews_passed',
    label: 'Interviews Passed',
    icon: CheckCircle,
    gradient: 'from-green-500 to-green-700',
    shadow: 'shadow-green-200 dark:shadow-green-900',
  },
  {
    key: 'internship_accepted',
    label: 'Internship Accepted',
    icon: ClipboardList,
    gradient: 'from-cyan-500 to-cyan-700',
    shadow: 'shadow-cyan-200 dark:shadow-cyan-900',
  },
  {
    key: 'internship_active',
    label: 'Active Internships',
    icon: Briefcase,
    gradient: 'from-teal-500 to-teal-700',
    shadow: 'shadow-teal-200 dark:shadow-teal-900',
  },
  {
    key: 'employed',
    label: 'Employed Graduates',
    icon: Award,
    gradient: 'from-emerald-500 to-emerald-700',
    shadow: 'shadow-emerald-200 dark:shadow-emerald-900',
  },
  {
    key: 'interviews_failed',
    label: 'Interview Failed',
    icon: XCircle,
    gradient: 'from-red-500 to-rose-700',
    shadow: 'shadow-red-200 dark:shadow-red-900',
  },
  {
    key: 'companies_with_internship',
    label: 'Companies Accepting Interns',
    icon: Handshake,
    gradient: 'from-slate-500 to-slate-700',
    shadow: 'shadow-slate-200 dark:shadow-slate-900',
  },
] as const

interface KPICardsProps {
  kpis: DashboardKPIs | null
  loading?: boolean
}

export function KPICards({ kpis, loading }: KPICardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-muted h-28 animate-pulse" />
        ))}
      </div>
    )
  }

  const total = kpis?.total_students ?? 0

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
      {kpiConfig.map(({ key, label, icon: Icon, gradient, shadow }) => {
        const value = kpis?.[key as keyof DashboardKPIs] ?? 0
        const pct = total > 0 && key !== 'total_students' && key !== 'total_companies'
          ? Math.round((value / total) * 100)
          : null

        return (
          <div
            key={key}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 shadow-lg ${shadow} transition-transform hover:-translate-y-0.5 hover:shadow-xl`}
          >
            {/* Background circle decoration */}
            <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />

            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white/80 truncate">{label}</p>
                <p className="mt-1.5 text-3xl font-bold text-white leading-none">
                  {value.toLocaleString()}
                </p>
                {pct !== null && (
                  <p className="mt-1.5 text-xs text-white/60">{pct}% of total</p>
                )}
              </div>
              <div className="shrink-0 rounded-xl bg-white/20 p-2.5">
                <Icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
