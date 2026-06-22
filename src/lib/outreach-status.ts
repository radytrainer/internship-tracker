import type { OutreachStatus } from '@/types/database.types'

export const OUTREACH_STATUS_OPTIONS: { value: OutreachStatus; label: string }[] = [
  { value: 'not_contacted', label: 'Not Contacted' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'follow_up', label: 'Follow-up Needed' },
  { value: 'confirmed', label: 'Confirmed — Needs Interns' },
  { value: 'declined', label: 'Declined — No Interns' },
]

export const OUTREACH_STATUS_STYLES: Record<OutreachStatus, string> = {
  not_contacted: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  contacted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  follow_up: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  declined: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
}

export function outreachStatusLabel(status: OutreachStatus) {
  return OUTREACH_STATUS_OPTIONS.find(o => o.value === status)?.label ?? status
}
