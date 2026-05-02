import { redirect } from 'next/navigation'
import { queryOne, query } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { Navbar } from '@/components/layout/navbar'
import { BackButton } from '@/components/ui/back-button'
import { Badge } from '@/components/ui/badge'
import { Shield } from 'lucide-react'
import { KycQueue } from './queue'
import type { Metadata } from 'next'
import type { KycRequest } from '@/types'

export const metadata: Metadata = { title: 'KYC Review — Admin' }

export default async function AdminKycPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const profile = await queryOne<{ role: string[] }>(
    'SELECT role FROM users WHERE id = $1',
    [session.userId]
  )

  if (!Array.isArray(profile?.role) || !profile.role.includes('admin')) {
    redirect('/dashboard')
  }

  type KycRow = KycRequest & {
    u_id: string
    u_full_name: string | null
    u_avatar_url: string | null
    u_phone: string | null
  }

  // Fetch all KYC requests with user profiles
  const rawRequests = await query<KycRow>(
    `SELECT k.*, u.id AS u_id, u.full_name AS u_full_name, u.avatar_url AS u_avatar_url, u.phone AS u_phone
     FROM kyc_requests k
     JOIN users u ON u.id = k.user_id
     ORDER BY k.submitted_at DESC`
  )

  // Shape with user sub-object; document URLs are stored as paths — in local dev served directly
  const withSignedUrls = rawRequests.map((req) => ({
    ...req,
    user: { id: req.u_id, full_name: req.u_full_name, avatar_url: req.u_avatar_url, phone: req.u_phone } as unknown as import('@/types').User,
    // In production these would be signed URLs from S3/R2; for now use the stored paths as-is
    front_signed_url:  req.front_url ?? null,
    back_signed_url:   req.back_url  ?? null,
    selfie_signed_url: req.selfie_url ?? null,
  }))

  const pendingCount = withSignedUrls.filter((r) => r.status === 'pending').length

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-sand">
        <div className="bg-cyprus-700 px-4 py-10">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center gap-3 mb-1">
              <Shield className="h-5 w-5 text-cyprus-200" />
              <span className="text-xs font-semibold tracking-[0.15em] text-cyprus-200 uppercase">Admin</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-sand tracking-tight">KYC Review</h1>
              {pendingCount > 0 && (
                <Badge variant="urgent">{pendingCount} pending</Badge>
              )}
            </div>
            <p className="text-cyprus-200 text-sm mt-1">
              Review identity verification submissions and approve or reject them.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="mb-5">
            <BackButton href="/admin" label="Control Centre" />
          </div>
          <KycQueue requests={withSignedUrls as Parameters<typeof KycQueue>[0]['requests']} />
        </div>
      </main>
    </>
  )
}
