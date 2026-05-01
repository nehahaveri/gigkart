import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { SettingsForm } from './settings-form'
import { BackButton } from '@/components/ui/back-button'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-5">
          <BackButton href="/dashboard" label="Dashboard" />
        </div>
        <h1 className="text-2xl font-bold text-sand-900 mb-1">Settings</h1>
        <p className="text-sm text-sand-500 mb-6">Manage your profile, payouts, and account.</p>
        <SettingsForm profile={profile} email={user.email ?? null} phone={user.phone ?? null} />
      </div>
    </>
  )
}
