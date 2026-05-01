'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signUpWithPassword(
  email: string,
  password: string
): Promise<{ error?: string; redirect?: string; needsConfirmation?: boolean }> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return { error: error.message }

  // If email confirmation is enabled, no session yet
  if (!data.session) {
    return { needsConfirmation: true }
  }

  return { redirect: '/onboarding' }
}

export async function signInWithPassword(
  email: string,
  password: string
): Promise<{ error?: string; redirect?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }

  const userId = data.user?.id
  if (!userId) return { error: 'Authentication failed. Please try again.' }

  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', userId)
    .single()

  if (!profile?.full_name || !profile.role?.length) {
    return { redirect: '/onboarding' }
  }

  return { redirect: '/dashboard' }
}

export async function sendOtp(
  phone: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: { channel: 'sms' },
  })
  if (error) return { error: error.message }
  return {}
}

export async function verifyOtp(
  phone: string,
  token: string
): Promise<{ error?: string; redirect?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  })
  if (error) return { error: error.message }

  const userId = data.user?.id
  if (!userId) return { error: 'Authentication failed. Please try again.' }

  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', userId)
    .single()

  if (!profile?.full_name || !profile.role?.length) {
    return { redirect: '/onboarding' }
  }

  return { redirect: '/dashboard' }
}

export async function signInWithGoogle(): Promise<{ error?: string; url?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    },
  })
  if (error) return { error: error.message }
  return { url: data.url }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
