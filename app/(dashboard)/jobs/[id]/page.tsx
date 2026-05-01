import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatRelativeTime } from '@/lib/utils/format'
import { MapPin, Clock, Users, Shield, Zap, Star, Calendar } from 'lucide-react'
import { SendOfferForm } from './send-offer-form'
import type { Metadata } from 'next'
import type { User } from '@/types'

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
  const supabase = await createClient()
  const { data: job } = await supabase
    .from('jobs')
    .select('title, category, address')
    .eq('id', id)
    .single()

  if (!job) return { title: 'Job not found' }

  return {
    title: `${job.title} — ${job.category}`,
    description: `${job.title} in ${job.address ?? 'your area'} on GigKart.`,
  }
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: job } = await supabase
    .from('jobs')
    .select('*, poster:users!jobs_poster_id_fkey(*)')
    .eq('id', id)
    .single()

  if (!job) notFound()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  const poster = job.poster as User
  const isOwner = authUser?.id === job.poster_id

  const { count: offerCount } = await supabase
    .from('offers')
    .select('*', { count: 'exact', head: true })
    .eq('job_id', id)

  let alreadyApplied = false
  if (authUser && !isOwner) {
    const { count } = await supabase
      .from('offers')
      .select('*', { count: 'exact', head: true })
      .eq('job_id', id)
      .eq('tasker_id', authUser.id)
    alreadyApplied = (count ?? 0) > 0
  }

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-8">
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
        <div className="mt-6 p-4 rounded-2xl bg-cyprus-50 border border-cyprus-100 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-sand-900">
              {formatCurrency(job.budget)}
            </div>
            <div className="text-sm text-sand-500 capitalize">{job.budget_type} · {job.payment_mode}</div>
          </div>
          <div className="text-right text-sm text-sand-500">
            {offerCount ?? 0} offer{offerCount !== 1 ? 's' : ''} received
            <br />
            Posted {formatRelativeTime(job.created_at)}
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
        <div className="mt-6 p-4 rounded-2xl border border-sand-100 bg-white flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-cyprus-100 flex items-center justify-center text-cyprus-700 font-bold text-lg">
            {poster?.full_name?.[0] ?? '?'}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sand-900">{poster?.full_name ?? 'Anonymous'}</div>
            <div className="flex items-center gap-2 text-sm text-sand-500">
              {poster?.rating_avg > 0 && (
                <span className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 text-clay-400 fill-clay-400" />
                  {Number(poster.rating_avg).toFixed(1)} ({poster.rating_count})
                </span>
              )}
              {poster?.city && <span>· {poster.city}</span>}
            </div>
          </div>
        </div>

        {/* Send offer form */}
        {authUser && !isOwner && job.status === 'open' && !alreadyApplied && (
          <div className="mt-8">
            <h2 className="font-semibold text-sand-900 mb-3">Send your offer</h2>
            <SendOfferForm jobId={id} suggestedBudget={job.budget} />
          </div>
        )}

        {alreadyApplied && (
          <div className="mt-8 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700">
            You have already sent an offer for this job.
          </div>
        )}

        {!authUser && job.status === 'open' && (
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
