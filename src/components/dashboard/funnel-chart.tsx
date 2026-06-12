'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DashboardKPIs } from '@/types/database.types'

interface FunnelChartProps {
  kpis: DashboardKPIs | null
}

export function FunnelChart({ kpis }: FunnelChartProps) {
  const total = kpis?.total_students || 1

  const stages = [
    { label: 'Total Students', value: kpis?.total_students ?? 0, color: 'bg-blue-500' },
    { label: 'Applications', value: kpis?.total_applications ?? 0, color: 'bg-indigo-500' },
    { label: 'Interviews Scheduled', value: (kpis?.interviews_scheduled ?? 0) + (kpis?.interviews_passed ?? 0), color: 'bg-purple-500' },
    { label: 'Interviews Passed', value: kpis?.interviews_passed ?? 0, color: 'bg-violet-500' },
    { label: 'Internship Active', value: kpis?.internship_active ?? 0, color: 'bg-cyan-500' },
    { label: 'Internship Completed', value: kpis?.internship_completed ?? 0, color: 'bg-teal-500' },
    { label: 'Employed', value: kpis?.employed ?? 0, color: 'bg-emerald-500' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Internship Funnel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {stages.map((stage, i) => {
          const pct = Math.min(100, Math.round((stage.value / total) * 100))
          const width = Math.max(10, 100 - i * 8)
          return (
            <div key={stage.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{stage.label}</span>
                <span className="text-xs font-semibold">{stage.value} ({pct}%)</span>
              </div>
              <div className="h-7 bg-muted rounded-md overflow-hidden">
                <div
                  className={`h-full ${stage.color} rounded-md flex items-center justify-end pr-2 transition-all duration-500`}
                  style={{ width: `${Math.max(5, (stage.value / (stages[0].value || 1)) * width)}%` }}
                >
                  <span className="text-[10px] font-bold text-white">{stage.value}</span>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
