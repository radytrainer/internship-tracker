import { ImageResponse } from 'next/og'
import { type NextRequest } from 'next/server'

export const runtime = 'edge'

export function GET(request: NextRequest) {
  const size = parseInt(request.nextUrl.searchParams.get('size') ?? '192')
  const radius = Math.round(size * 0.19)
  const icon = Math.round(size * 0.52)

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#2563EB',
          borderRadius: radius,
        }}
      >
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Graduation cap top */}
          <path d="M32 8L4 24L32 40L60 24L32 8Z" fill="white" />
          {/* Cap body / diploma */}
          <path d="M16 31.5V47C16 47 23 55 32 55C41 55 48 47 48 47V31.5L32 40L16 31.5Z" fill="white" fillOpacity="0.85" />
          {/* Tassel string */}
          <rect x="57" y="24" width="4.5" height="18" rx="2.25" fill="white" fillOpacity="0.7" />
          <circle cx="59.25" cy="45.5" r="4.5" fill="white" fillOpacity="0.7" />
        </svg>
      </div>
    ),
    { width: size, height: size }
  )
}
