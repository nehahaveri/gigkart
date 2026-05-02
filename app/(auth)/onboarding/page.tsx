import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingWizard } from './wizard'

export const metadata: Metadata = {
  title: 'Get started',
  description: 'Set up your GigKart profile.',
}

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  // Already onboarded — send to dashboard
  if (profile?.full_name && profile.role?.length) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-sand-50 flex flex-col items-center justify-center px-4 py-12">
      <OnboardingWizard userId={user.id} />
    </div>
  )
}
