'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface StatData { name: string; avg: number; min: number; max: number }

interface AllowanceSalaryChartProps {
  allowanceByCompany: StatData[]
  salaryByCompany: StatData[]
  avgAllowance: number
  avgSalary: number
}

const fmt = (v: number) => `$${v.toLocaleString()}`

export function AllowanceSalaryChart({ allowanceByCompany, salaryByCompany, avgAllowance, avgSalary }: AllowanceSalaryChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Allowance & Salary Analytics</CardTitle>
        <div className="flex gap-4 text-sm">
          <span>Avg Allowance: <strong className="text-green-600">{fmt(avgAllowance)}</strong></span>
          <span>Avg Salary: <strong className="text-blue-600">{fmt(avgSalary)}</strong></span>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="allowance">
          <TabsList className="mb-4">
            <TabsTrigger value="allowance">Internship Allowance</TabsTrigger>
            <TabsTrigger value="salary">Employment Salary</TabsTrigger>
          </TabsList>
          <TabsContent value="allowance">
            <Chart data={allowanceByCompany} color="#10b981" label="Allowance" />
          </TabsContent>
          <TabsContent value="salary">
            <Chart data={salaryByCompany} color="#3b82f6" label="Salary" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function Chart({ data, color, label }: { data: StatData[]; color: string; label: string }) {
  if (data.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data.slice(0, 8)} margin={{ top: 5, right: 10, left: 0, bottom: 30 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" />
        <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
        <Tooltip formatter={(v: number) => [fmt(v), label]} contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 6 }} />
        <Bar dataKey="avg" name={`Avg ${label}`} fill={color} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
