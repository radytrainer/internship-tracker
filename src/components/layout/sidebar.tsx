'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  GraduationCap, LayoutDashboard, Users, Building2,
  Briefcase, FileText, MessageSquare, ClipboardList,
  Award, BarChart3, Settings, ChevronLeft, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getNavItemsForRole } from '@/lib/roles'
import type { Profile } from '@/types/database.types'

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

interface SidebarProps {
  collapsed: boolean
  onCollapse: (v: boolean) => void
  profile: Profile | null
}

export function Sidebar({ collapsed, onCollapse, profile }: SidebarProps) {
  const pathname = usePathname()
  const navItems = getNavItemsForRole(profile?.role)

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed left-0 top-0 h-full z-40 flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 border-r border-sidebar-border hidden md:flex',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className={cn(
          'flex items-center gap-3 px-4 py-5 border-b border-sidebar-border',
          collapsed && 'justify-center px-2'
        )}>
          <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-bold text-sm text-white truncate">InternTrack</p>
              <p className="text-[10px] text-sidebar-foreground/60 truncate">Internship System</p>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <ScrollArea className="flex-1 py-3">
          <nav className="px-2 space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const LucideIcon = iconMap[Icon]
              const active = pathname === href || pathname.startsWith(href + '/')
              const item = (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    active
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  <LucideIcon className="h-4.5 w-4.5 shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
                </Link>
              )

              if (collapsed) {
                return (
                  <Tooltip key={href}>
                    <TooltipTrigger asChild>{item}</TooltipTrigger>
                    <TooltipContent side="right">{label}</TooltipContent>
                  </Tooltip>
                )
              }
              return item
            })}
          </nav>
        </ScrollArea>

        {/* Collapse Button */}
        <div className="p-2 border-t border-sidebar-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCollapse(!collapsed)}
            className={cn(
              'w-full text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              collapsed ? 'justify-center px-2' : 'justify-end'
            )}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : (
              <><span className="text-xs mr-1">Collapse</span><ChevronLeft className="h-4 w-4" /></>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
