import { redirect, notFound } from 'next/navigation'
import { queryOne, query } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
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
  const session = await getSession()
  if (!session) redirect('/login')

  const job = await queryOne<{
    id: string; title: string; budget: string; budget_type: string; status: string; poster_id: string
  }>(
    'SELECT id, title, budget, budget_type, status, poster_id FROM jobs WHERE id = $1',
    [id]
  )

  if (!job) notFound()
  if (job.poster_id !== session.userId) redirect('/my-jobs')

  const rawOffers = await query<Record<string, unknown>>(
    `SELECT o.*,
            u.id AS t_id, u.full_name AS t_full_name, u.avatar_url AS t_avatar_url,
            u.rating_avg AS t_rating_avg, u.rating_count AS t_rating_count,
            u.completion_rate AS t_completion_rate, u.aadhaar_verified AS t_aadhaar_verified,
            u.city AS t_city
     FROM offers o
     JOIN users u ON u.id = o.tasker_id
     WHERE o.job_id = $1
     ORDER BY o.created_at DESC`,
    [id]
  )

  const offers = rawOffers.map((o) => ({
    ...o,
    price: Number(o.price),
    tasker: {
      id: o.t_id,
      full_name: o.t_full_name,
      avatar_url: o.t_avatar_url,
      rating_avg: Number(o.t_rating_avg),
      rating_count: Number(o.t_rating_count),
      completion_rate: Number(o.t_completion_rate),
      aadhaar_verified: o.t_aadhaar_verified,
      city: o.t_city,
    },
  }))

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <BackButton href="/my-jobs" label="My Postings" />
          <h1 className="text-2xl font-bold text-sand-900 mt-3">{job.title}</h1>
          <p className="text-sm text-sand-500 mt-1">
            {offers.length} offer{offers.length !== 1 ? 's' : ''} received
          </p>
        </div>
        <OffersList offers={offers as Parameters<typeof OffersList>[0]['offers']} jobId={id} jobStatus={job.status} />
      </div>
    </>
  )
}
