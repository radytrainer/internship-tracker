'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Camera, Loader2, X } from 'lucide-react'

interface AvatarUploadProps {
  value?: string | null
  onChange: (url: string | null) => void
  name?: string
  folder?: string
  shape?: 'circle' | 'square'
  size?: number
}

function colorFromName(name: string) {
  const colors = ['#3b82f6','#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#ef4444','#22c55e']
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % colors.length
  return colors[h]
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}

export function AvatarUpload({ value, onChange, name = '', folder = 'general', shape = 'circle', size = 88 }: AvatarUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const borderRadius = shape === 'circle' ? '50%' : '12px'

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert('File must be under 2 MB'); return }
    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${folder}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      onChange(data.publicUrl)
    }
    setUploading(false)
    e.target.value = ''
  }

  return (
    <div className="flex items-center gap-4">
      {/* Avatar preview */}
      <div className="relative shrink-0 group" style={{ width: size, height: size }}>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={name} style={{ width: size, height: size, borderRadius, objectFit: 'cover' }} />
        ) : (
          <div style={{ width: size, height: size, borderRadius, background: colorFromName(name), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: size * 0.32 }}>{initials(name) || '?'}</span>
          </div>
        )}
        {/* Overlay */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{ borderRadius }}
          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
        >
          {uploading ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Camera className="h-5 w-5 text-white" />}
        </button>
      </div>

      {/* Controls */}
      <div className="space-y-1">
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="text-sm text-primary hover:underline">
          {uploading ? 'Uploading…' : value ? 'Change photo' : 'Upload photo'}
        </button>
        {value && (
          <div>
            <button type="button" onClick={() => onChange(null)} className="text-xs text-destructive hover:underline block">
              <X className="inline h-3 w-3 mr-0.5" />Remove
            </button>
          </div>
        )}
        <p className="text-xs text-muted-foreground">JPG, PNG or WEBP · max 2 MB</p>
      </div>

      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
    </div>
  )
}
