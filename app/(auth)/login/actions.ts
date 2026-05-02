'use server'

import { queryOne } from '@/lib/db'
import { createSession, destroySession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'

type UserRow = {
  id: string
  email: string
  password_hash: string
  full_name: string
  role: string[] | null
}

export async function signUpWithPassword(
  email: string,
  password: string
): Promise<{ error?: string; redirect?: string; needsConfirmation?: boolean }> {
  const norm = email.toLowerCase().trim()

  const existing = await queryOne<{ id: string }>(
    'SELECT id FROM users WHERE email = $1',
    [norm]
  )
  if (existing) return { error: 'An account with this email already exists.' }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await queryOne<{ id: string }>(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
    [norm, passwordHash]
  )
  if (!user) return { error: 'Failed to create account. Please try again.' }

  await createSession({ userId: user.id, email: norm })
  return { redirect: '/onboarding' }
}

export async function signInWithPassword(
  email: string,
  password: string
): Promise<{ error?: string; redirect?: string }> {
  const norm = email.toLowerCase().trim()

  const user = await queryOne<UserRow>(
    'SELECT id, email, password_hash, full_name, role FROM users WHERE email = $1',
    [norm]
  )
  if (!user) return { error: 'Invalid email or password.' }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return { error: 'Invalid email or password.' }

  await createSession({ userId: user.id, email: user.email })

  if (!user.full_name || !user.role?.length) {
    return { redirect: '/onboarding' }
  }
  return { redirect: '/dashboard' }
}

export async function signOut() {
  await destroySession()
  redirect('/login')
}
