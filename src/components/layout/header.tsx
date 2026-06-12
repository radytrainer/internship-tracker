'use client'

import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Moon, Sun, LogOut, User, Menu } from 'lucide-react'
import { useTheme } from 'next-themes'
import { getInitials } from '@/lib/utils'
import type { Profile } from '@/types/database.types'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import Link from 'next/link'
import {
  GraduationCap, LayoutDashboard, Users, Building2, Briefcase,
  FileText, MessageSquare, ClipboardList, Award, BarChart3, Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getNavItemsForRole, roleLabel } from '@/lib/roles'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/students': 'Students',
  '/companies': 'Companies',
  '/positions': 'Positions',
  '/applications': 'Applications',
  '/interviews': 'Interviews',
  '/internships': 'Internships',
  '/employment': 'Employment Records',
  '/reports': 'Reports & Analytics',
  '/settings': 'Settings',
}

const iconMap = {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  FileText,
  MessageSquare,
  ClipboardList,
  Award,
  BarChart3,
  Settings,
}

interface HeaderProps {
  profile: Profile | null
}

export function Header({ profile }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const navItems = getNavItemsForRole(profile?.role)

  const title = Object.entries(PAGE_TITLES).find(([path]) => pathname.startsWith(path))?.[1] ?? 'InternTrack'

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
      {/* Mobile nav */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64 bg-sidebar text-sidebar-foreground">
          <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-white">InternTrack</p>
              <p className="text-[10px] text-sidebar-foreground/60">Internship System</p>
            </div>
          </div>
          <nav className="p-2 space-y-1">
            {navItems.map(({ href, label, icon }) => {
              const LucideIcon = iconMap[icon]

              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    pathname.startsWith(href)
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent'
                  )}
                >
                  <LucideIcon className="h-4 w-4" />
                  {label}
                </Link>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>

      <h1 className="text-lg font-semibold flex-1">{title}</h1>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-blue-600 text-white text-xs font-semibold">
                  {getInitials(profile?.full_name)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <p className="font-semibold text-sm">{profile?.full_name ?? 'User'}</p>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
                <p className="text-xs text-blue-600 font-medium capitalize">
                  {roleLabel(profile?.role)}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings"><User className="mr-2 h-4 w-4" />Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
