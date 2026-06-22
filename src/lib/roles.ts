import type { UserRole } from '@/types/database.types'

export type AppRole = 'admin' | 'trainer' | 'student' | 'education_team' | 'ero_team' | 'pl_team'
export type NavIconName =
  | 'LayoutDashboard'
  | 'Users'
  | 'UserCheck'
  | 'Building2'
  | 'Briefcase'
  | 'FileText'
  | 'MessageSquare'
  | 'ClipboardList'
  | 'Award'
  | 'BarChart3'
  | 'Settings'
  | 'CalendarOff'
  | 'Wallet'
  | 'UserCog'
  | 'ShieldCheck'
  | 'Handshake'

export interface NavItem {
  href: string
  label: string
  icon: NavIconName
  roles: AppRole[]
}

export function normalizeRole(role: UserRole | null | undefined): AppRole {
  if (role === 'trainer') return 'trainer'
  if (role === 'student') return 'student'
  if (role === 'education_team') return 'education_team'
  if (role === 'ero_team') return 'ero_team'
  if (role === 'pl_team') return 'pl_team'
  return 'admin'
}

export function roleLabel(role: UserRole | null | undefined) {
  const normalized = normalizeRole(role)
  if (normalized === 'admin') return 'Administrator'
  if (normalized === 'trainer') return 'Trainer'
  if (normalized === 'education_team') return 'Education Team'
  if (normalized === 'ero_team') return 'ERO Team'
  if (normalized === 'pl_team') return 'PL Team'
  return 'Student'
}

export const dashboardNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard', roles: ['admin', 'trainer', 'student', 'education_team', 'ero_team', 'pl_team'] },
  { href: '/students', label: 'Students', icon: 'Users', roles: ['admin', 'trainer', 'education_team', 'ero_team', 'pl_team'] },
  { href: '/trainers', label: 'Trainers', icon: 'UserCheck', roles: ['admin'] },
  { href: '/education-team', label: 'Education Team', icon: 'UserCog', roles: ['admin'] },
  { href: '/ero-team', label: 'ERO Team', icon: 'ShieldCheck', roles: ['admin'] },
  { href: '/pl-team', label: 'PL Team', icon: 'Handshake', roles: ['admin'] },
  { href: '/companies', label: 'Companies', icon: 'Building2', roles: ['admin', 'trainer', 'ero_team', 'pl_team'] },
  { href: '/positions', label: 'Positions', icon: 'Briefcase', roles: ['admin', 'trainer', 'ero_team'] },
  { href: '/applications', label: 'Applications', icon: 'FileText', roles: ['admin', 'trainer', 'student', 'ero_team'] },
  { href: '/interviews', label: 'Interviews', icon: 'MessageSquare', roles: ['admin', 'trainer', 'student', 'ero_team', 'pl_team'] },
  { href: '/internships', label: 'Internships', icon: 'ClipboardList', roles: ['admin', 'trainer', 'student', 'ero_team', 'pl_team'] },
  { href: '/employment', label: 'Employment', icon: 'Award', roles: ['admin', 'trainer', 'student', 'ero_team', 'pl_team'] },
  { href: '/leaves', label: 'Leave Requests', icon: 'CalendarOff', roles: ['admin', 'education_team'] },
  { href: '/payments', label: 'Allowance Payments', icon: 'Wallet', roles: ['admin', 'education_team'] },
  { href: '/reports', label: 'Reports', icon: 'BarChart3', roles: ['admin', 'trainer', 'ero_team'] },
  { href: '/settings', label: 'Settings', icon: 'Settings', roles: ['admin', 'trainer'] },
]

export const publicPaths = ['/board']

export function getNavItemsForRole(role: UserRole | null | undefined) {
  const normalized = normalizeRole(role)
  return dashboardNavItems.filter(item => item.roles.includes(normalized))
}

export function canAccessPath(role: UserRole | null | undefined, pathname: string) {
  if (pathname === '/') return true
  if (publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) return true
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) return true

  const normalized = normalizeRole(role)
  const matchedItem = dashboardNavItems.find(item => pathname === item.href || pathname.startsWith(item.href + '/'))
  if (!matchedItem) return normalized === 'admin'

  return matchedItem.roles.includes(normalized)
}
