import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { OffersList } from './list'
import { BackButton } from '@/components/ui/back-button'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return { title: `Offers — Job ${id.slice(0, 8)}` }
}

export default async function OffersPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: job } = await supabase
    .from('jobs')
    .select('id, title, budget, budget_type, status, poster_id')
    .eq('id', id)
    .single()

  if (!job) notFound()
  if (job.poster_id !== user.id) redirect('/my-jobs')

  const { data: offers } = await supabase
    .from('offers')
    .select('*, tasker:users!offers_tasker_id_fkey(*)')
    .eq('job_id', id)
    .order('created_at', { ascending: false })

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <BackButton href="/my-jobs" label="My Postings" />
          <h1 className="text-2xl font-bold text-sand-900 mt-3">{job.title}</h1>
          <p className="text-sm text-sand-500 mt-1">
            {(offers ?? []).length} offer{(offers ?? []).length !== 1 ? 's' : ''} received
          </p>
        </div>
        <OffersList offers={offers ?? []} jobId={id} jobStatus={job.status} />
      </div>
    </>
  )
}
