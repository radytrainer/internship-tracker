'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface GenderStat { name: string; avg: number; min: number; max: number }

interface GenderSalaryChartProps {
  allowanceByGender: GenderStat[]
  salaryByGender: GenderStat[]
}

const fmt = (v: number) => `$${v.toLocaleString()}`

export function GenderSalaryChart({ allowanceByGender, salaryByGender }: GenderSalaryChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Allowance &amp; Salary Range by Gender</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="allowance">
          <TabsList className="mb-4">
            <TabsTrigger value="allowance">Internship Allowance</TabsTrigger>
            <TabsTrigger value="salary">Employment Salary</TabsTrigger>
          </TabsList>
          <TabsContent value="allowance">
            <Chart data={allowanceByGender} />
          </TabsContent>
          <TabsContent value="salary">
            <Chart data={salaryByGender} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function Chart({ data }: { data: GenderStat[] }) {
  if (data.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
  return (
    <>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 6 }} />
          <Legend />
          <Bar dataKey="min" name="Min" fill="#94a3b8" radius={[3, 3, 0, 0]} />
          <Bar dataKey="avg" name="Avg" fill="#6366f1" radius={[3, 3, 0, 0]} />
          <Bar dataKey="max" name="Max" fill="#10b981" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        {data.map(d => (
          <div key={d.name} className="rounded-lg border p-2">
            <p className="font-medium">{d.name}</p>
            <p className="text-xs text-muted-foreground">{fmt(d.min)} – {fmt(d.max)} (avg {fmt(d.avg)})</p>
          </div>
        ))}
      </div>
    </>
  )
}
