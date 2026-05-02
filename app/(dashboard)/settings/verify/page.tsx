import { redirect } from 'next/navigation'
import { queryOne } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
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
  const session = await getSession()
  if (!session) redirect('/login')

  const [profile, kycRequest] = await Promise.all([
    queryOne<{ full_name: string | null; aadhaar_verified: boolean }>(
      'SELECT full_name, aadhaar_verified FROM users WHERE id = $1',
      [session.userId]
    ),
    queryOne<KycRequest>(
      'SELECT * FROM kyc_requests WHERE user_id = $1',
      [session.userId]
    ),
  ])

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
