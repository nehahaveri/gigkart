import { redirect } from 'next/navigation'
import { query, queryOne } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { Navbar } from '@/components/layout/navbar'
import { SettingsForm } from './form'
import { BackButton } from '@/components/ui/back-button'
import type { Metadata } from 'next'
import type { KycRequest, User } from '@/types'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [profile, kycRequest] = await Promise.all([
    queryOne<User>('SELECT * FROM users WHERE id = $1', [session.userId]),
    queryOne<KycRequest>(
      'SELECT * FROM kyc_requests WHERE user_id = $1',
      [session.userId]
    ),
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
          email={profile?.email ?? null}
          phone={profile?.phone ?? null}
          kycRequest={kycRequest}
        />
      </div>
    </>
  )
}
