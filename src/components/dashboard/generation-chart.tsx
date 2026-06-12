'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface GenerationData {
  generation: string
  applications: number
  internships: number
  employed: number
}

interface GenerationChartProps { data: GenerationData[]; loading?: boolean }

export function GenerationChart({ data, loading }: GenerationChartProps) {
  if (loading) return <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Generation Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="generation" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 6 }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Legend iconType="square" iconSize={10} />
              <Bar dataKey="applications" name="Applications" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="internships" name="Internships" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="employed" name="Employed" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
