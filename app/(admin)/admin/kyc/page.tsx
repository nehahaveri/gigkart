import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { BackButton } from '@/components/ui/back-button'
import { Badge } from '@/components/ui/badge'
import { Shield } from 'lucide-react'
import { KycQueue } from './queue'
import type { Metadata } from 'next'
import type { KycRequest } from '@/types'

export const metadata: Metadata = { title: 'KYC Review — Admin' }

export default async function AdminKycPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!Array.isArray(profile?.role) || !profile.role.includes('admin')) {
    redirect('/dashboard')
  }

  // Fetch all KYC requests with user profiles
  const { data: requests } = await supabase
    .from('kyc_requests')
    .select('*, user:users!kyc_requests_user_id_fkey(id, full_name, avatar_url, phone)')
    .order('submitted_at', { ascending: false })

  // Generate short-lived signed URLs for the private document storage
  const withSignedUrls = await Promise.all(
    (requests ?? []).map(async (req: KycRequest & { user?: unknown }) => {
      const [front, back, selfie] = await Promise.all([
        supabase.storage.from('kyc-documents').createSignedUrl(req.front_url, 3600),
        req.back_url
          ? supabase.storage.from('kyc-documents').createSignedUrl(req.back_url, 3600)
          : Promise.resolve({ data: null }),
        supabase.storage.from('kyc-documents').createSignedUrl(req.selfie_url, 3600),
      ])
      return {
        ...req,
        front_signed_url:  front.data?.signedUrl ?? null,
        back_signed_url:   back.data?.signedUrl  ?? null,
        selfie_signed_url: selfie.data?.signedUrl ?? null,
      }
    })
  )

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
