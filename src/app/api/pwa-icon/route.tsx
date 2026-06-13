import { ImageResponse } from 'next/og'
import { type NextRequest } from 'next/server'

export const runtime = 'edge'

export function GET(request: NextRequest) {
  const size = parseInt(request.nextUrl.searchParams.get('size') ?? '192')
  const r = Math.round(size * 0.19)
  const pad = Math.round(size * 0.14)
  const inner = size - pad * 2

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
          borderRadius: r,
        }}
      >
        <div
          style={{
            width: inner,
            height: inner,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: Math.round(inner * 0.08),
          }}
        >
          {/* Cap brim */}
          <div style={{
            width: '100%',
            height: Math.round(inner * 0.22),
            background: 'white',
            borderRadius: Math.round(inner * 0.06),
            transform: 'skewX(-6deg)',
          }} />
          {/* Cap body */}
          <div style={{
            width: Math.round(inner * 0.65),
            height: Math.round(inner * 0.36),
            background: 'white',
            borderRadius: `0 0 ${Math.round(inner * 0.1)}px ${Math.round(inner * 0.1)}px`,
            opacity: 0.88,
          }} />
        </div>
      </div>
    ),
    { width: size, height: size }
  )
}
