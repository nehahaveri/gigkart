import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { queryOne } from '@/lib/db'
import { OnboardingWizard } from './wizard'

export const metadata: Metadata = {
  title: 'Get started',
  description: 'Set up your GigKart profile.',
}

export default async function OnboardingPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const profile = await queryOne<{ role: string[]; full_name: string | null }>(
    'SELECT role, full_name FROM users WHERE id = $1',
    [session.userId]
  )

  // Already onboarded — send to dashboard
  if (profile?.full_name && profile.role?.length) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-sand-50 flex flex-col items-center justify-center px-4 py-12">
      <OnboardingWizard userId={session.userId} />
    </div>
  )
}
