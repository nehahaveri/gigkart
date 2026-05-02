// ─────────────────────────────────────────────────────────────────────────────
// MIDDLEWARE LAYER — JWT Route Guard
// Verifies the gk_session JWT cookie on every non-asset request.
//   • Protected routes → redirect to /login when unauthenticated
//   • Auth pages (/login) → redirect to /dashboard when already logged in
// ─────────────────────────────────────────────────────────────────────────────
import { type NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const COOKIE = 'gk_session'

function getSecret() {
  const raw = process.env.AUTH_SECRET ?? 'gigkart-dev-secret-please-change-in-production'
  return new TextEncoder().encode(raw)
}

// Routes that require an authenticated session
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/my-jobs',
  '/my-work',
  '/post-job',
  '/jobs',
  '/messages',
  '/profile',
  '/settings',
  '/rate',
  '/job',
  '/onboarding',
]

// Pages that logged-in users should be bounced away from
const AUTH_PREFIXES = ['/login']

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE)?.value
  if (!token) return false
  try {
    await jwtVerify(token, getSecret())
    return true
  } catch {
    return false
  }
}

export async function authGuard(request: NextRequest) {
  const { pathname } = request.nextUrl

  const needsAuth  = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  const isAuthPage = AUTH_PREFIXES.some((p) => pathname.startsWith(p))

  if (!needsAuth && !isAuthPage) return NextResponse.next()

  const authed = await isAuthenticated(request)

  if (needsAuth && !authed) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (isAuthPage && authed) {
    const next = request.nextUrl.searchParams.get('next') ?? '/dashboard'
    return NextResponse.redirect(new URL(next, request.url))
  }

  return NextResponse.next()
}
