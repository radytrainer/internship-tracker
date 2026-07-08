import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { canAccessPath, publicPaths } from '@/lib/roles'

export async function middleware(request: NextRequest) {
  // Strip any client-supplied value so it can't be spoofed — only middleware may set it below.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.delete('x-profile')

  let cookiesToForward: { name: string; value: string; options?: CookieOptions }[] = []

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
          cookiesToForward = cookiesToSet
        },
      },
    }
  )

  const applyCookies = (res: NextResponse) => {
    cookiesToForward.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
    return res
  }

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl
  const isPublicPath = publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'))

  // Unauthenticated
  if (!user) {
    if (pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/board'
      return applyCookies(NextResponse.redirect(url))
    }
    if (!pathname.startsWith('/login') && !pathname.startsWith('/api/auth') && !isPublicPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return applyCookies(NextResponse.redirect(url))
    }
    return applyCookies(NextResponse.next({ request: { headers: requestHeaders } }))
  }

  // Authenticated — fetch profile once here, forward it to Server Components/Actions
  // via a header so getCurrentProfile() doesn't have to re-fetch it on every navigation.
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const role = profile?.role
  const defaultPath = '/dashboard'

  if (pathname === '/' || pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = defaultPath
    return applyCookies(NextResponse.redirect(url))
  }

  if (!pathname.startsWith('/api/auth') && !isPublicPath && !canAccessPath(role, pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = defaultPath
    return applyCookies(NextResponse.redirect(url))
  }

  if (profile) {
    requestHeaders.set('x-profile', JSON.stringify(profile))
  }
  return applyCookies(NextResponse.next({ request: { headers: requestHeaders } }))
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
