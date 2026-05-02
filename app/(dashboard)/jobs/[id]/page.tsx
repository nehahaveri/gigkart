import { notFound } from 'next/navigation'
import Link from 'next/link'
import { queryOne, count } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { Navbar } from '@/components/layout/navbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BackButton } from '@/components/ui/back-button'
import { formatCurrency, formatRelativeTime } from '@/lib/utils/format'
import { MapPin, Clock, Users, Shield, Zap, Star, Calendar, IndianRupee, ExternalLink } from 'lucide-react'
import { SendOfferForm } from './offer-form'
import type { Metadata } from 'next'

const DURATION_LABELS: Record<string, string> = {
  few_hours: 'Few hours',
  '1_day': '1 day',
  '2_3_days': '2-3 days',
  '1_week': '1 week',
  single_task: 'Single task',
  recurring: 'Recurring',
}

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const job = await queryOne<{ title: string; category: string; address: string | null }>(
    'SELECT title, category, address FROM jobs WHERE id = $1',
    [id]
  )
  if (!job) return { title: 'Job not found' }
  return {
    title: `${job.title} — ${job.category}`,
    description: `${job.title} in ${job.address ?? 'your area'} on GigKart.`,
  }
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params

  type JobDetailRow = {
    id: string; poster_id: string; title: string; description: string
    category: string; sub_category: string | null; photos: string[]
    duration_type: string; date_needed: string | null; address: string | null
    is_remote: boolean; num_taskers: number; budget: string
    budget_type: string; payment_mode: string; is_urgent: boolean
    status: string; escrow_payment_id: string | null; created_at: string
    p_id: string | null; p_full_name: string | null; p_avatar_url: string | null
    p_rating_avg: string | null; p_rating_count: string | null; p_city: string | null
  }

  const [jobRow, session] = await Promise.all([
    queryOne<JobDetailRow>(
      `SELECT j.*,
              u.id AS p_id, u.full_name AS p_full_name, u.avatar_url AS p_avatar_url,
              u.rating_avg AS p_rating_avg, u.rating_count AS p_rating_count, u.city AS p_city
       FROM jobs j
       LEFT JOIN users u ON u.id = j.poster_id
       WHERE j.id = $1`,
      [id]
    ),
    getSession(),
  ])

  if (!jobRow) notFound()

  const job = { ...jobRow, budget: Number(jobRow.budget) }
  const poster = {
    id: jobRow.p_id,
    full_name: jobRow.p_full_name,
    avatar_url: jobRow.p_avatar_url,
    rating_avg: Number(jobRow.p_rating_avg),
    rating_count: Number(jobRow.p_rating_count),
    city: jobRow.p_city,
  }
  const isOwner = session?.userId === job.poster_id

  const [offerCount, alreadyAppliedCount] = await Promise.all([
    count('SELECT COUNT(*) FROM offers WHERE job_id = $1', [id]),
    session && !isOwner
      ? count('SELECT COUNT(*) FROM offers WHERE job_id = $1 AND tasker_id = $2', [id, session.userId])
      : Promise.resolve(0),
  ])
  const alreadyApplied = alreadyAppliedCount > 0

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-5">
          <BackButton href="/jobs" label="Browse jobs" />
        </div>
        {/* Header */}
        <div className="flex flex-wrap gap-2 mb-2">
          <Badge>{job.category}</Badge>
          {job.is_urgent && (
            <Badge variant="urgent">
              <Zap className="h-3 w-3 mr-0.5" />Urgent
            </Badge>
          )}
          {job.payment_mode === 'escrow' && (
            <Badge variant="escrow">
              <Shield className="h-3 w-3 mr-0.5" />Escrow
            </Badge>
          )}
          <Badge variant="secondary">{job.status}</Badge>
        </div>

        <h1 className="text-2xl font-bold text-sand-900">{job.title}</h1>

        <div className="flex items-center gap-4 mt-2 text-sm text-sand-500 flex-wrap">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {DURATION_LABELS[job.duration_type]}
          </span>
          {job.address && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {job.address}
            </span>
          )}
          {job.is_remote && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Remote
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {job.num_taskers} tasker{job.num_taskers > 1 ? 's' : ''} needed
          </span>
          {job.date_needed && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(job.date_needed).toLocaleDateString('en-IN')}
            </span>
          )}
        </div>

        {/* Budget */}
        <div className="mt-6 rounded-2xl bg-cyprus-700 text-sand p-5 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold tracking-[0.15em] uppercase text-cyprus-200 mb-1">Budget</div>
            <div className="flex items-baseline gap-1">
              <IndianRupee className="h-5 w-5 text-sand/80 mb-0.5" />
              <span className="text-3xl font-bold tracking-tight">{job.budget.toLocaleString('en-IN')}</span>
            </div>
            <div className="text-xs text-cyprus-200 capitalize mt-1">{job.budget_type} · {job.payment_mode}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-sand">{offerCount ?? 0}</div>
            <div className="text-xs text-cyprus-200">offer{offerCount !== 1 ? 's' : ''} received</div>
            <div className="text-xs text-cyprus-300 mt-2">{formatRelativeTime(job.created_at)}</div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-6">
          <h2 className="font-semibold text-sand-900 mb-2">Description</h2>
          <p className="text-sm text-sand-800 whitespace-pre-wrap leading-relaxed">
            {job.description}
          </p>
        </div>

        {/* Photos */}
        {job.photos?.length > 0 && (
          <div className="mt-6">
            <h2 className="font-semibold text-sand-900 mb-2">Photos</h2>
            <div className="flex gap-3 overflow-x-auto">
              {job.photos.map((url: string, i: number) => (
                <img
                  key={i}
                  src={url}
                  alt={`Job photo ${i + 1}`}
                  className="h-40 w-40 rounded-xl object-cover border border-sand-100"
                />
              ))}
            </div>
          </div>
        )}

        {/* Poster */}
        <div className="mt-6 rounded-2xl border border-sand-200 bg-white overflow-hidden">
          <div className="px-4 py-2.5 bg-sand-50 border-b border-sand-100">
            <span className="text-xs font-semibold tracking-[0.12em] uppercase text-sand-500">Posted by</span>
          </div>
          <div className="p-4 flex items-center gap-4">
            <Link href={`/profile/${job.poster_id}`}>
              <div className="h-12 w-12 rounded-2xl bg-cyprus-700 flex items-center justify-center text-sand font-bold text-lg hover:bg-cyprus-800 transition-colors">
                {poster?.full_name?.[0]?.toUpperCase() ?? '?'}
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/profile/${job.poster_id}`} className="font-semibold text-sand-900 hover:text-cyprus-700 transition-colors">
                {poster?.full_name ?? 'Anonymous'}
              </Link>
              <div className="flex items-center gap-2 text-sm text-sand-500 mt-0.5 flex-wrap">
                {poster?.rating_avg > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 text-gold-400 fill-gold-400" />
                    {Number(poster.rating_avg).toFixed(1)}
                    <span className="text-sand-400">({poster.rating_count})</span>
                  </span>
                )}
                {poster?.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{poster.city}</span>}
              </div>
            </div>
            <Link
              href={`/profile/${job.poster_id}`}
              className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-cyprus-700 hover:underline"
            >
              View profile
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Send offer form */}
        {session && !isOwner && job.status === 'open' && !alreadyApplied && (
          <div className="mt-8">
            <h2 className="font-semibold text-sand-900 mb-3">Send your offer</h2>
            <SendOfferForm jobId={id} suggestedBudget={job.budget as number} />
          </div>
        )}

        {alreadyApplied && (
          <div className="mt-8 rounded-xl bg-cyprus-50 border border-cyprus-100 p-4 flex items-center gap-3 text-sm text-cyprus-700">
            <Shield className="h-4 w-4 shrink-0" />
            <span>Your offer has been sent. The poster will review it shortly.</span>
          </div>
        )}

        {!session && job.status === 'open' && (
          <div className="mt-8">
            <Button asChild className="w-full">
              <a href="/login">Log in to send an offer</a>
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
