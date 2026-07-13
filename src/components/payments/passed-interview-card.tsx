'use client'

import { useState } from 'react'
import { UserCheck, CheckCircle2, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'

interface PassedInterviewStudent {
  id: string
  first_name: string
  last_name: string
  student_code: string
  companyName: string | null
  position: string | null
  interviewDate: string | null
  internship: null | { allowance: number; schoolShare: number; cap: number; monthsPaid: number; remaining: number }
}

function avatarColor(name: string) {
  const colors = ['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444', '#22c55e']
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % colors.length
  return colors[h]
}

function initials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}

export function PassedInterviewCard({ students }: { students: PassedInterviewStudent[] }) {
  const [open, setOpen] = useState(false)
  const needsSetup = students.filter(s => s.internship === null).length
  const needsPayment = students.filter(s => s.internship && s.internship.remaining > 0).length

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-left w-full">
        <Card className="border-none bg-blue-50 dark:bg-blue-950/30 transition-transform hover:-translate-y-0.5 hover:shadow-md cursor-pointer">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Passed interview</p>
              <p className="mt-1 text-2xl font-semibold text-blue-600">{students.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {needsSetup > 0 && `${needsSetup} awaiting internship setup`}
                {needsSetup > 0 && needsPayment > 0 && ' · '}
                {needsPayment > 0 && `${needsPayment} with payments due`}
                {needsSetup === 0 && needsPayment === 0 && 'All allowance payments up to date'}
              </p>
            </div>
            <div className="rounded-2xl bg-white/60 dark:bg-white/10 p-3">
              <UserCheck className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col overflow-hidden">
          <SheetHeader className="p-6 pb-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 shrink-0">
            <SheetTitle>Passed Interview ({students.length})</SheetTitle>
            <SheetDescription>Students to track for allowance payments — $110/mo kept by the student, the rest paid to the school.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {students.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No students have passed an interview yet.</p>
            ) : (
              students.map(s => (
                <div key={s.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold"
                      style={{ background: avatarColor(`${s.first_name} ${s.last_name}`) }}
                    >
                      {initials(s.first_name, s.last_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{s.first_name} {s.last_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {s.companyName ?? 'Unknown company'}{s.position ? ` — ${s.position}` : ''}
                        {s.interviewDate && ` · ${formatDate(s.interviewDate)}`}
                      </p>
                    </div>
                  </div>

                  {s.internship === null ? (
                    <Badge variant="outline" className="gap-1 text-amber-700 border-amber-200 bg-amber-50 dark:text-amber-400 dark:border-amber-900 dark:bg-amber-950/30">
                      <Clock className="h-3 w-3" />Awaiting internship setup
                    </Badge>
                  ) : s.internship.remaining > 0 ? (
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        Keeps {formatCurrency(110)} of {formatCurrency(s.internship.allowance)}/mo — {formatCurrency(s.internship.schoolShare)}/mo to school
                      </p>
                      <Badge className="shrink-0 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border-transparent">
                        {s.internship.monthsPaid}/{s.internship.cap} paid
                      </Badge>
                    </div>
                  ) : (
                    <Badge className="gap-1 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-transparent">
                      <CheckCircle2 className="h-3 w-3" />Fully paid ({s.internship.cap}/{s.internship.cap})
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
