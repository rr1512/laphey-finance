import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log(`[MIDDLEWARE] Processing: ${pathname}`)

  // Skip static files
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Skip public API routes
  const publicApiRoutes = [
    '/api/auth/login',
    '/api/auth/logout',
    '/api/auth/me'
  ]

  const isPublicApi = publicApiRoutes.some(route => pathname.startsWith(route))

  if (isPublicApi) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/')) {
    // API routes will be protected below
  }

  // Skip login page
  if (pathname === '/login') {
    return NextResponse.next()
  }

  // Check access token for protected routes
  const token = request.cookies.get('accessToken')?.value

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    } else {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (public auth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.).*)',
    '/api/:path*',
  ],
}