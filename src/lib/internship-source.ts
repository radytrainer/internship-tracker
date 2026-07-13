import type { InternshipSource } from '@/types/database.types'

export const INTERNSHIP_SOURCE_OPTIONS: { value: InternshipSource; label: string }[] = [
  { value: 'Student Found', label: 'Student Found' },
  { value: 'Staff Outreach', label: 'Staff Outreach' },
]

export const INTERNSHIP_SOURCE_STYLES: Record<InternshipSource, string> = {
  'Student Found': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400',
  'Staff Outreach': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400',
}
