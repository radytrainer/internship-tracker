'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database.types'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const update = () => setIsDesktop(window.innerWidth >= 768)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(data)
      }
    }
    fetchProfile()
  }, [])

  const sidebarWidth = !isDesktop ? 0 : collapsed ? 64 : 256

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} onCollapse={setCollapsed} profile={profile} />
      <div
        style={{ marginLeft: sidebarWidth }}
        className="flex flex-col min-h-screen transition-all duration-300"
      >
        <Header profile={profile} />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
