// ─────────────────────────────────────────────────────────────────────────────
// BACKEND LAYER — JWT Session Management
// Server-only. Used by Server Actions and Route Handlers.
// Signs/verifies HS256 JWT cookies (gk_session). No Supabase dependency.
// ─────────────────────────────────────────────────────────────────────────────
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { cache } from 'react'

const COOKIE = 'gk_session'
const ALG    = 'HS256'
const TTL    = '30d'

function getSecret() {
  const raw = process.env.AUTH_SECRET ?? 'gigkart-dev-secret-please-change-in-production'
  return new TextEncoder().encode(raw)
}

export type SessionPayload = {
  userId: string
  email: string
}

/** Write a JWT session cookie (call from Server Actions / Route Handlers). */
export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({ userId: payload.userId, email: payload.email })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(TTL)
    .sign(getSecret())

  const jar = await cookies()
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days in seconds
    path: '/',
  })
}

/** Read + verify the session cookie. Returns null when absent or invalid. */
export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const jar    = await cookies()
  const token  = jar.get(COOKIE)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, getSecret())
    return {
      userId: payload.userId as string,
      email:  payload.email  as string,
    }
  } catch {
    return null
  }
})

/** Delete the session cookie (sign-out). */
export async function destroySession(): Promise<void> {
  const jar = await cookies()
  jar.delete(COOKIE)
}
