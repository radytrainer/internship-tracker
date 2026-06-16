import type { UserRole } from '@/types/database.types'

export type AppRole = 'admin' | 'trainer' | 'student'
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

export interface NavItem {
  href: string
  label: string
  icon: NavIconName
  roles: AppRole[]
}

export function normalizeRole(role: UserRole | null | undefined): AppRole {
  if (role === 'trainer') return 'trainer'
  if (role === 'student') return 'student'
  return 'admin'
}

export function roleLabel(role: UserRole | null | undefined) {
  const normalized = normalizeRole(role)
  if (normalized === 'admin') return 'Administrator'
  if (normalized === 'trainer') return 'Trainer'
  return 'Student'
}

export const dashboardNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard', roles: ['admin', 'trainer', 'student'] },
  { href: '/students', label: 'Students', icon: 'Users', roles: ['admin', 'trainer'] },
  { href: '/trainers', label: 'Trainers', icon: 'UserCheck', roles: ['admin'] },
  { href: '/companies', label: 'Companies', icon: 'Building2', roles: ['admin', 'trainer'] },
  { href: '/positions', label: 'Positions', icon: 'Briefcase', roles: ['admin', 'trainer'] },
  { href: '/applications', label: 'Applications', icon: 'FileText', roles: ['admin', 'trainer', 'student'] },
  { href: '/interviews', label: 'Interviews', icon: 'MessageSquare', roles: ['admin', 'trainer', 'student'] },
  { href: '/internships', label: 'Internships', icon: 'ClipboardList', roles: ['admin', 'trainer'] },
  { href: '/employment', label: 'Employment', icon: 'Award', roles: ['admin', 'trainer'] },
  { href: '/reports', label: 'Reports', icon: 'BarChart3', roles: ['admin', 'trainer'] },
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
