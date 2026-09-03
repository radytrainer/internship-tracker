import { Card, CardContent } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  color = 'text-foreground',
  bg = 'bg-card',
}: {
  label: string
  value: number | string
  hint: string
  icon: LucideIcon
  color?: string
  bg?: string
}) {
  return (
    <Card className={`border-none ${bg}`}>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={`mt-1 text-2xl font-semibold ${color}`}>{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
        <div className="rounded-2xl bg-white/60 dark:bg-white/10 p-3">
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </CardContent>
    </Card>
  )
}

export function StatBox({
  label, value, color, bg, icon: Icon,
}: {
  label: string
  value: number
  color: string
  bg: string
  icon: LucideIcon
}) {
  return (
    <div className={`rounded-xl border p-4 flex items-center gap-3 ${bg}`}>
      <div className="rounded-lg p-2 bg-white/60 dark:bg-white/10 shrink-0">
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-muted-foreground leading-tight">{label}</p>
      </div>
    </div>
  )
}

export function EmptyState({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">{text}</p>
}

export function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}
