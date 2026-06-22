'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PositionGenderData { position: string; Male: number; Female: number }
interface GenderPositionChartProps { data: PositionGenderData[] }

export function GenderPositionChart({ data }: GenderPositionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Applications by Position &amp; Gender</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="position" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 6 }} />
              <Legend />
              <Bar dataKey="Male" stackId="gender" fill="#3b82f6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Female" stackId="gender" fill="#ec4899" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
