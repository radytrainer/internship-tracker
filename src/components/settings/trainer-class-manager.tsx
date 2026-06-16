'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { GraduationCap, UserCheck } from 'lucide-react'
import { assignTrainerToClass } from '@/app/actions/trainer-classes'
import { toast } from 'sonner'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = any

interface TrainerProfile {
  id: string
  full_name: string | null
  email: string | null
}

interface TrainerClassManagerProps {
  classes: AnyRecord[]
  trainers: TrainerProfile[]
}

export function TrainerClassManager({ classes, trainers }: TrainerClassManagerProps) {
  const [optimistic, setOptimistic] = useState<Record<string, string | null | undefined>>({})
  const [, startTransition] = useTransition()

  const getTrainerId = (cls: AnyRecord): string | null =>
    cls.id in optimistic ? (optimistic[cls.id] ?? null) : (cls.trainer_id ?? null)

  const handleAssign = (classId: string, value: string) => {
    const trainerId = value === 'none' ? null : value
    setOptimistic(prev => ({ ...prev, [classId]: trainerId }))

    startTransition(async () => {
      const result = await assignTrainerToClass(classId, trainerId)
      if (result.error) {
        toast.error(result.error)
        setOptimistic(prev => ({ ...prev, [classId]: undefined }))
      } else {
        toast.success(trainerId ? 'Trainer assigned' : 'Trainer removed')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Trainer Class Assignment</CardTitle>
        </div>
        <CardDescription>Assign trainers to manage specific classes and their students</CardDescription>
      </CardHeader>
      <CardContent>
        {classes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No classes found. Create classes first.</p>
        ) : (
          <div className="space-y-3">
            {classes.map((cls: AnyRecord) => {
              const assignedId = getTrainerId(cls)
              const assignedTrainer = trainers.find(t => t.id === assignedId)
              const gen = Array.isArray(cls.generation) ? cls.generation[0] : cls.generation

              return (
                <div key={cls.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <div className="flex items-center gap-2 w-36 shrink-0">
                    <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{cls.name}</p>
                      {gen && <p className="text-xs text-muted-foreground">{gen.year}</p>}
                    </div>
                  </div>

                  <div className="flex-1">
                    <Select
                      value={assignedId ?? 'none'}
                      onValueChange={val => handleAssign(cls.id, val)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="No trainer assigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-muted-foreground">No trainer</span>
                        </SelectItem>
                        {trainers.map(t => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.full_name ?? t.email ?? t.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {assignedTrainer && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {assignedTrainer.full_name ?? assignedTrainer.email}
                    </Badge>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {trainers.length === 0 && (
          <p className="text-xs text-muted-foreground mt-3">
            No trainer accounts found. Create user accounts with the &quot;Trainer&quot; role first.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
