// ─────────────────────────────────────────────────────────────────────────────
// MIDDLEWARE LAYER — Next.js 16 Edge Route Guard
// File must be named proxy.ts (middleware.ts is deprecated in Next.js 16).
//
// config MUST be defined inline here — Next.js cannot read a re-exported
// config from another module.
// ─────────────────────────────────────────────────────────────────────────────
import type { NextRequest } from 'next/server'
import { authGuard } from '@/lib/middleware/auth-guard'

export async function proxy(request: NextRequest) {
  return authGuard(request)
}

// Inline config — do NOT re-export this from another file.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
