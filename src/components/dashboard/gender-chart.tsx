'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface GenderData { gender: string; count: number }
interface GenderChartProps { data: GenderData[]; loading?: boolean }

const COLORS = ['#3b82f6', '#ec4899']

export function GenderChart({ data, loading }: GenderChartProps) {
  if (loading) return <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>

  const chartData = data.map(d => ({ name: d.gender, value: d.count }))
  const total = chartData.reduce((s, d) => s + d.value, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Students by Gender</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
        ) : (
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="60%" height={180}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                  {chartData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [v, 'Students']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {chartData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ background: COLORS[i] }} />
                    <span className="text-sm">{d.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{d.value}</p>
                    <p className="text-xs text-muted-foreground">{Math.round((d.value / total) * 100)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
