import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
// import { AuthService } from '@/lib/auth' // Not needed for demo

// Routes that require authentication
const protectedRoutes = [
  '/',
  '/divisions',
  '/categories',
  '/reports',
  '/reports/expenses',
  '/reports/graphic'
]

// Routes that are public (accessible without authentication)
const publicRoutes = [
  '/login'
]

// Routes that require superadmin role
const superAdminRoutes = [
  '/admin',
  '/admin/users'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for API routes and static files
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Get access token from cookies
  const accessToken = request.cookies.get('accessToken')?.value

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  )

  // Check if route requires superadmin
  const isSuperAdminRoute = superAdminRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  )

  // If accessing protected route without token, redirect to login
  if (isProtectedRoute && !accessToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If accessing protected route with token, verify it (simple demo check)
  if (isProtectedRoute && accessToken) {
    try {
      // For demo purposes, we'll use simple JWT verification
      const jwt = require('jsonwebtoken')
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET || 'demo-secret-key')

      // Check superadmin routes
      if (isSuperAdminRoute && decoded.role !== 'superadmin') {
        // Not superadmin, redirect to dashboard
        return NextResponse.redirect(new URL('/', request.url))
      }
    } catch (error) {
      // Token invalid, redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)

      // Clear invalid cookies
      const response = NextResponse.redirect(loginUrl)
      response.cookies.set('accessToken', '', { maxAge: 0 })
      response.cookies.set('refreshToken', '', { maxAge: 0 })
      return response
    }
  }

  // If accessing login page while authenticated, redirect to dashboard
  if (pathname === '/login' && accessToken) {
    try {
      const jwt = require('jsonwebtoken')
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET || 'demo-secret-key')
      if (decoded) {
        return NextResponse.redirect(new URL('/', request.url))
      }
    } catch (error) {
      // Invalid token, continue to login
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}