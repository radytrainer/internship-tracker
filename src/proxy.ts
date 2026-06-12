import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { canAccessPath, publicPaths } from '@/lib/roles'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl
  const isPublicPath = publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'))

  // Unauthenticated
  if (!user) {
    if (pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/board'
      return NextResponse.redirect(url)
    }
    if (!pathname.startsWith('/login') && !pathname.startsWith('/api/auth') && !isPublicPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Authenticated — fetch profile once, use for all checks
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role
  const defaultPath = role === 'student' ? '/applications' : '/dashboard'

  if (pathname === '/' || pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = defaultPath
    return NextResponse.redirect(url)
  }

  if (!pathname.startsWith('/api/auth') && !isPublicPath && !canAccessPath(role, pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = defaultPath
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
