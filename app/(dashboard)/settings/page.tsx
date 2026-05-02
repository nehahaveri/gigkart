import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { SettingsForm } from './form'
import { BackButton } from '@/components/ui/back-button'
import type { Metadata } from 'next'
import type { KycRequest } from '@/types'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: kycRequest }] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('kyc_requests').select('*').eq('user_id', user.id).maybeSingle(),
  ])

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-5">
          <BackButton href="/dashboard" label="Home" />
        </div>
        <h1 className="text-2xl font-bold text-sand-900 mb-1">Settings</h1>
        <p className="text-sm text-sand-500 mb-6">Manage your profile, payouts, and account.</p>
        <SettingsForm
          profile={profile}
          email={user.email ?? null}
          phone={user.phone ?? null}
          kycRequest={kycRequest as KycRequest | null}
        />
      </div>
    </>
  )
}
