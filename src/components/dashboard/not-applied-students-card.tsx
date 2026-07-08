'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'

interface NotAppliedStudent {
  id: string
  first_name: string
  last_name: string
  gender: string
  className: string | null
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

export function NotAppliedStudentsCard({ students }: { students: NotAppliedStudent[] }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-left w-full">
        <Card className="border-none bg-red-50 dark:bg-red-950/30 transition-transform hover:-translate-y-0.5 hover:shadow-md cursor-pointer">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Not yet applied</p>
              <p className="mt-1 text-2xl font-semibold text-red-600">{students.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Students with no internship/job application</p>
            </div>
            <div className="rounded-2xl bg-white/60 dark:bg-white/10 p-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col overflow-hidden">
          <SheetHeader className="p-6 pb-4 border-b bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 shrink-0">
            <SheetTitle>Not Yet Applied ({students.length})</SheetTitle>
            <SheetDescription>Students with no internship or job application submitted.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {students.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Every student has applied.</p>
            ) : (
              students.map(s => (
                <div key={s.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold"
                    style={{ background: avatarColor(`${s.first_name} ${s.last_name}`) }}
                  >
                    {initials(s.first_name, s.last_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{s.first_name} {s.last_name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className={s.gender === 'Female' ? 'border-pink-200 text-pink-700' : 'border-blue-200 text-blue-700'}>
                        {s.gender}
                      </Badge>
                      {s.className && <Badge variant="secondary">{s.className}</Badge>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
