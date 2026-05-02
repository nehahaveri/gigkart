import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { BackButton } from '@/components/ui/back-button'
import { KycWizard } from './wizard'
import type { Metadata } from 'next'
import type { KycRequest } from '@/types'

export const metadata: Metadata = {
  title: 'Verify Identity — GigKart',
  description: 'Verify your identity to unlock the Verified badge and build trust with posters and taskers.',
}

export default async function VerifyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, aadhaar_verified')
    .eq('id', user.id)
    .single()

  const { data: kycRequest } = await supabase
    .from('kyc_requests')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-sand">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="mb-6">
            <BackButton href="/settings" label="Settings" />
          </div>
          <KycWizard
            fullName={profile?.full_name ?? null}
            existingRequest={kycRequest as KycRequest | null}
          />
        </div>
      </div>
    </>
  )
}
