'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Loader2, User, Shield, Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { getInitials } from '@/lib/utils'
import type { Profile } from '@/types/database.types'

const profileSchema = z.object({
  full_name: z.string().min(1, 'Name is required'),
})

const passwordSchema = z.object({
  password: z.string().min(8, 'Minimum 8 characters'),
  confirm: z.string().min(8, 'Required'),
}).refine(d => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] })

interface SettingsClientProps { profile: Profile | null; userEmail: string }

export function SettingsClient({ profile, userEmail }: SettingsClientProps) {
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: profile?.full_name ?? '' },
  })

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', confirm: '' },
  })

  const onSaveProfile = async (values: z.infer<typeof profileSchema>) => {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ full_name: values.full_name }).eq('id', profile?.id ?? '')
    setSaving(false)
    if (error) toast.error(error.message)
    else toast.success('Profile updated')
  }

  const onChangePassword = async (values: z.infer<typeof passwordSchema>) => {
    const { error } = await supabase.auth.updateUser({ password: values.password })
    if (error) toast.error(error.message)
    else { toast.success('Password changed'); passwordForm.reset() }
  }

  const roleLabels: Record<string, string> = {
    admin: 'Administrator',
    career_service_staff: 'Career Service Staff',
    trainer: 'Trainer',
    student: 'Student',
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your account preferences</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2"><User className="h-5 w-5 text-muted-foreground" /><CardTitle>Profile</CardTitle></div>
          <CardDescription>Update your display name</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">{getInitials(profile?.full_name ?? userEmail)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{profile?.full_name ?? '—'}</p>
              <p className="text-sm text-muted-foreground">{userEmail}</p>
              <Badge variant="secondary" className="mt-1">{roleLabels[profile?.role ?? ''] ?? profile?.role}</Badge>
            </div>
          </div>
          <Separator />
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
              <FormField control={profileForm.control} name="full_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div>
                <FormLabel>Email</FormLabel>
                <Input value={userEmail} disabled className="mt-2 bg-muted" />
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed here</p>
              </div>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Profile
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Security Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2"><Shield className="h-5 w-5 text-muted-foreground" /><CardTitle>Security</CardTitle></div>
          <CardDescription>Change your password</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
              <FormField control={passwordForm.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl><Input type="password" placeholder="At least 8 characters" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={passwordForm.control} name="confirm" render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl><Input type="password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                {passwordForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Change Password
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Notifications Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2"><Bell className="h-5 w-5 text-muted-foreground" /><CardTitle>About</CardTitle></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between"><span>Application</span><span className="font-medium text-foreground">Internship Tracker</span></div>
            <div className="flex justify-between"><span>Version</span><span className="font-medium text-foreground">1.0.0</span></div>
            <div className="flex justify-between"><span>Framework</span><span className="font-medium text-foreground">Next.js 15 + Supabase</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
