'use client'

import { useMemo, useState } from 'react'
import { Users, Building2 } from 'lucide-react'
import { PaymentTable } from '@/components/payments/payment-table'
import { PassedInterviewCard } from '@/components/payments/passed-interview-card'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = any

interface PaymentsClientProps {
  payments: AnyRecord[]
  students: AnyRecord[]
  internships: AnyRecord[]
  employmentRecords: AnyRecord[]
  passedInterviewStudents: AnyRecord[]
  showScopeToggle: boolean
  restrictedStudentIds: string[] | null
}

export function PaymentsClient({
  payments, students, internships, employmentRecords, passedInterviewStudents, showScopeToggle, restrictedStudentIds,
}: PaymentsClientProps) {
  const [scope, setScope] = useState<'mine' | 'all'>('mine')

  const activeIds = useMemo(() => {
    if (!showScopeToggle || scope === 'all' || !restrictedStudentIds) return null
    return new Set(restrictedStudentIds)
  }, [showScopeToggle, scope, restrictedStudentIds])

  const scopedStudents = useMemo(() => activeIds ? students.filter(s => activeIds.has(s.id)) : students, [students, activeIds])
  const scopedInternships = useMemo(() => activeIds ? internships.filter(i => activeIds.has(i.student_id)) : internships, [internships, activeIds])
  const scopedEmploymentRecords = useMemo(() => activeIds ? employmentRecords.filter(e => activeIds.has(e.student_id)) : employmentRecords, [employmentRecords, activeIds])
  const scopedPayments = useMemo(() => activeIds ? payments.filter(p => activeIds.has(p.student_id)) : payments, [payments, activeIds])
  const scopedPassedInterviewStudents = useMemo(
    () => activeIds ? passedInterviewStudents.filter(s => activeIds.has(s.id)) : passedInterviewStudents,
    [passedInterviewStudents, activeIds]
  )

  return (
    <div className="space-y-6">
      {showScopeToggle && (
        <div className="inline-flex items-center rounded-lg border bg-card p-1 gap-1">
          <button
            type="button"
            onClick={() => setScope('mine')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${scope === 'mine' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Users className="h-3.5 w-3.5" />My Class
          </button>
          <button
            type="button"
            onClick={() => setScope('all')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${scope === 'all' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Building2 className="h-3.5 w-3.5" />All Classes
          </button>
        </div>
      )}

      <PassedInterviewCard students={scopedPassedInterviewStudents} />
      <PaymentTable
        payments={scopedPayments}
        students={scopedStudents}
        internships={scopedInternships}
        employmentRecords={scopedEmploymentRecords}
      />
    </div>
  )
}
