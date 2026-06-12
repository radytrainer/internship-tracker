'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, TrendingUp } from 'lucide-react'

interface CompanyPerf {
  id: string
  company_name: string
  application_count: number
  internship_count: number
  employed_count: number
}

interface CompanyPerformanceProps { data: CompanyPerf[] }

export function CompanyPerformance({ data }: CompanyPerformanceProps) {
  const top = data.slice(0, 8)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-500" />
          Top Companies
        </CardTitle>
      </CardHeader>
      <CardContent>
        {top.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No company data available</p>
        ) : (
          <div className="space-y-3">
            {top.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center shrink-0">
                  <Building2 className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.company_name}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-xs px-1.5 py-0">{c.application_count} apps</Badge>
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">{c.internship_count} interns</Badge>
                  {c.employed_count > 0 && (
                    <Badge className="text-xs px-1.5 py-0 bg-emerald-500">{c.employed_count} hired</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
