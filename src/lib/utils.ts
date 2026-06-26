import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, isValid } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | null | undefined, fmt = 'MMM d, yyyy') {
  if (!date) return '—'
  const parsed = parseISO(date)
  if (!isValid(parsed)) return '—'
  return format(parsed, fmt)
}

export function formatCurrency(amount: number | null | undefined, currency = 'USD') {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

export function formatNumber(n: number | null | undefined) {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US').format(n)
}

export function getInitials(name: string | null | undefined) {
  if (!name) return '?'
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

export const STUDENT_STATUS_COLORS: Record<string, string> = {
  'Studying': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  'Looking For Internship': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  'Internship Applied': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  'Interview Scheduled': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  'Internship Accepted': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
  'Internship Active': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  'Internship Completed': 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  'Looking For Job': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  'Employed': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
}

export const APPLICATION_STATUS_COLORS: Record<string, string> = {
  'Applied': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  'Under Review': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  'Interview Scheduled': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  'Interview Passed': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  'Interview Failed': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  'Accepted': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  'Rejected': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

export const INTERVIEW_RESULT_COLORS: Record<string, string> = {
  'Pending': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  'Passed': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  'Failed': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

export const INTERNSHIP_STATUS_COLORS: Record<string, string> = {
  'Active': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  'Completed': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  'Terminated': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

export const EMPLOYMENT_STATUS_COLORS: Record<string, string> = {
  'Active': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  'Resigned': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  'Terminated': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

export const LEAVE_STATUS_COLORS: Record<string, string> = {
  'Pending': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  'Approved': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  'Rejected': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

// students keep this much of their monthly internship allowance; the rest goes to the school
export const STUDENT_ALLOWANCE_KEEP = 110
// students pay the school for at most this many months, even on a longer internship
export const MAX_ALLOWANCE_MONTHS = 4

export function internshipAllowanceMonthCap(start: string | null | undefined, end: string | null | undefined) {
  if (!start || !end) return MAX_ALLOWANCE_MONTHS
  const s = parseISO(start)
  const e = parseISO(end)
  if (!isValid(s) || !isValid(e) || e <= s) return MAX_ALLOWANCE_MONTHS
  let months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth())
  if (e.getDate() > s.getDate()) months += 1
  return Math.min(MAX_ALLOWANCE_MONTHS, Math.max(1, months))
}

export function schoolAllowanceShare(monthlyAllowance: number | null | undefined) {
  return Math.max(0, (monthlyAllowance ?? 0) - STUDENT_ALLOWANCE_KEEP)
}
