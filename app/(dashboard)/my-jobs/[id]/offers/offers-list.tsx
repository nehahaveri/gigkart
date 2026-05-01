'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { formatCurrency, formatRelativeTime } from '@/lib/utils/format'
import { Star, CheckCircle, Shield, Loader2, AlertTriangle, Award, TrendingUp, MessageCircle } from 'lucide-react'
import { acceptOffer, rejectOffer } from './actions'
import { toast } from 'sonner'
import Link from 'next/link'
import type { User, OfferStatus } from '@/types'

type OfferRow = {
  id: string
  job_id: string
  tasker_id: string
  price: number
  availability_note: string | null
  message: string | null
  status: OfferStatus
  created_at: string
  tasker: User
}

type SortKey = 'best' | 'lowest' | 'highest_rated' | 'newest'

type TrustTier = 'pro' | 'trusted' | 'new' | 'caution'

function getTrustTier(tasker: User): TrustTier {
  const jobs = tasker?.rating_count ?? 0
  const rate = tasker?.completion_rate ?? 0
  const verified = tasker?.aadhaar_verified ?? false
  if (verified && jobs >= 5 && rate >= 80) return 'pro'
  if (verified && jobs >= 1) return 'trusted'
  if (!verified && jobs === 0) return 'caution'
  return 'new'
}

const TRUST_META: Record<TrustTier, { label: string; icon: React.ReactNode; className: string }> = {
  pro: {
    label: 'Pro',
    icon: <Award className="h-3 w-3" />,
    className: 'bg-cyprus-700 text-white',
  },
  trusted: {
    label: 'Trusted',
    icon: <Shield className="h-3 w-3" />,
    className: 'bg-success-100 text-success-700',
  },
  new: {
    label: 'New',
    icon: <TrendingUp className="h-3 w-3" />,
    className: 'bg-sand-100 text-sand-600',
  },
  caution: {
    label: 'Unverified',
    icon: <AlertTriangle className="h-3 w-3" />,
    className: 'bg-amber-100 text-amber-700',
  },
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'best', label: 'Best match' },
  { key: 'lowest', label: 'Lowest price' },
  { key: 'highest_rated', label: 'Highest rated' },
  { key: 'newest', label: 'Newest' },
]

function sortOffers(offers: OfferRow[], sortKey: SortKey): OfferRow[] {
  const copy = [...offers]
  switch (sortKey) {
    case 'lowest':
      return copy.sort((a, b) => a.price - b.price)
    case 'highest_rated':
      return copy.sort((a, b) => (b.tasker?.rating_avg ?? 0) - (a.tasker?.rating_avg ?? 0))
    case 'newest':
      return copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    case 'best':
    default:
      return copy.sort((a, b) => {
        const scoreA = (a.tasker?.rating_avg ?? 0) * 0.6 + (1 / (a.price || 1)) * 1000 * 0.4
        const scoreB = (b.tasker?.rating_avg ?? 0) * 0.6 + (1 / (b.price || 1)) * 1000 * 0.4
        return scoreB - scoreA
      })
  }
}

export function OffersList({
  offers,
  jobId,
  jobStatus,
}: {
  offers: OfferRow[]
  jobId: string
  jobStatus: string
}) {
  const [sort, setSort] = useState<SortKey>('best')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const sorted = sortOffers(offers, sort)
  const canAct = jobStatus === 'open'

  async function handleAccept(offerId: string) {
    setLoadingId(offerId)
    const result = await acceptOffer(offerId, jobId)
    setLoadingId(null)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Offer accepted! The tasker has been notified.')
    }
  }

  async function handleReject(offerId: string) {
    setLoadingId(offerId)
    const result = await rejectOffer(offerId, jobId)
    setLoadingId(null)
    if (result.error) {
      toast.error(result.error)
    }
  }

  if (offers.length === 0) {
    return (
      <div className="text-center py-12 text-sand-500 text-sm">
        No offers yet. Taskers will send offers as they see your job.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Sort */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {SORT_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setSort(key)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
              sort === key
                ? 'bg-sand-900 text-white border-sand-900'
                : 'bg-white text-sand-500 border-sand-200'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Trust legend */}
      <div className="rounded-xl border border-sand-200 bg-sand-50 p-3 text-xs text-sand-600 flex flex-wrap gap-3">
        <span className="font-semibold text-sand-700 shrink-0">Trust signals:</span>
        <span className="flex items-center gap-1"><span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-cyprus-700 text-white text-[10px] font-medium"><Award className="h-3 w-3" />Pro</span> ID-verified, 5+ jobs, ≥80% completion</span>
        <span className="flex items-center gap-1"><span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-success-100 text-success-700 text-[10px] font-medium"><Shield className="h-3 w-3" />Trusted</span> ID-verified, has reviews</span>
        <span className="flex items-center gap-1"><span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium"><AlertTriangle className="h-3 w-3" />Unverified</span> No ID, no reviews yet</span>
      </div>

      {/* Offer cards */}
      {sorted.map((offer) => {
        const tasker = offer.tasker
        const isLoading = loadingId === offer.id
        return (
          <Card key={offer.id}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <a href={`/profile/${tasker?.id}`} className="shrink-0">
                  <div className="h-12 w-12 rounded-full bg-cyprus-100 flex items-center justify-center text-cyprus-700 font-bold text-lg">
                    {tasker?.full_name?.[0] ?? '?'}
                  </div>
                </a>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={`/profile/${tasker?.id}`}
                      className="font-semibold text-sand-900 hover:underline"
                    >
                      {tasker?.full_name ?? 'Anonymous'}
                    </a>
                    {/* Trust tier badge */}
                    {(() => {
                      const tier = getTrustTier(tasker)
                      const meta = TRUST_META[tier]
                      return (
                        <span className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                          meta.className
                        )}>
                          {meta.icon}{meta.label}
                        </span>
                      )
                    })()}
                    {tasker?.aadhaar_verified && (
                      <Badge variant="success">
                        <Shield className="h-3 w-3 mr-0.5" />ID Verified
                      </Badge>
                    )}
                    <Badge variant={offer.status === 'accepted' ? 'success' : offer.status === 'rejected' ? 'destructive' : 'secondary'}>
                      {offer.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-sm text-sand-500 flex-wrap">
                    {tasker?.rating_avg > 0 ? (
                      <span className="flex items-center gap-0.5">
                        <Star className="h-3 w-3 text-clay-400 fill-clay-400" />
                        <span className="font-medium text-sand-700">{Number(tasker.rating_avg).toFixed(1)}</span>
                        <span>· {tasker.rating_count} review{tasker.rating_count !== 1 ? 's' : ''}</span>
                      </span>
                    ) : (
                      <span className="text-sand-400 text-xs">No reviews yet</span>
                    )}
                    {tasker?.completion_rate > 0 && (
                      <span className="flex items-center gap-0.5">
                        <CheckCircle className="h-3 w-3 text-success-500" />
                        <span>{Number(tasker.completion_rate).toFixed(0)}% done</span>
                      </span>
                    )}
                    {tasker?.city && <span>· {tasker.city}</span>}
                  </div>

                  {/* Caution warning for brand-new unverified */}
                  {getTrustTier(tasker) === 'caution' && (
                    <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 border border-amber-200 p-2 text-xs text-amber-700">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>This tasker has no ID verification and no completed jobs. Review their offer carefully before accepting.</span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="mt-3 text-lg font-bold text-sand-900">
                    {formatCurrency(offer.price)}
                  </div>

                  {offer.availability_note && (
                    <p className="text-sm text-sand-500 mt-1">{offer.availability_note}</p>
                  )}
                  {offer.message && (
                    <p className="text-sm text-sand-700 mt-2 bg-sand-50 rounded-xl p-3">
                      {offer.message}
                    </p>
                  )}

                  <div className="text-xs text-sand-500 mt-2">
                    {formatRelativeTime(offer.created_at)}
                  </div>

                  {/* Actions */}
                  {canAct && offer.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => handleAccept(offer.id)}
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Accept'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(offer.id)}
                        disabled={isLoading}
                      >
                        Reject
                      </Button>
                      <Button size="sm" variant="ghost" asChild>
                        <a href={`/profile/${tasker?.id}`}>View profile</a>
                      </Button>
                    </div>
                  )}

                  {/* Message tasker after acceptance */}
                  {offer.status === 'accepted' && (
                    <div className="mt-3 flex items-center gap-2">
                      <Link
                        href={`/messages/${offer.job_id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-cyprus-700 text-white text-xs font-semibold px-3 py-2 hover:bg-cyprus-800 transition-colors"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Message Tasker
                      </Link>
                      <Link
                        href={`/job/${offer.job_id}/active`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-sand-200 text-sand-700 text-xs font-semibold px-3 py-2 hover:bg-sand-50 transition-colors"
                      >
                        View Active Job →
                      </Link>
                    </div>
                  )}
                </div>

                {/* Price badge (right side) */}
                <div className="shrink-0 text-right">
                  <div className="text-lg font-bold text-sand-900">
                    {formatCurrency(offer.price)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
