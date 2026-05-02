'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { reviewKyc } from '@/app/(dashboard)/settings/verify/actions'
import { formatRelativeTime } from '@/lib/utils/format'
import {
  CheckCircle2, XCircle, ChevronDown, ChevronUp, Shield,
  CreditCard, BookOpen, Car, Loader2, AlertTriangle, User,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'
import type { KycRequest } from '@/types'

const ID_LABELS: Record<string, string> = {
  aadhaar:          'Aadhaar Card',
  passport:         'Passport',
  driving_license:  'Driving Licence',
}

const ID_ICONS: Record<string, React.ReactNode> = {
  aadhaar:         <CreditCard className="h-4 w-4" />,
  passport:        <BookOpen className="h-4 w-4" />,
  driving_license: <Car className="h-4 w-4" />,
}

interface KycReviewCardProps {
  request: KycRequest & {
    front_signed_url: string | null
    back_signed_url: string | null
    selfie_signed_url: string | null
  }
}

function KycReviewCard({ request }: KycReviewCardProps) {
  const [expanded, setExpanded]           = useState(false)
  const [rejectionReason, setRejection]   = useState('')
  const [showRejectInput, setShowReject]  = useState(false)
  const [isPending, startTransition]      = useTransition()

  function approve() {
    startTransition(async () => {
      const result = await reviewKyc(request.id, 'approved')
      if (result.error) toast.error(result.error)
      else toast.success('KYC approved — user notified')
    })
  }

  function reject() {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    startTransition(async () => {
      const result = await reviewKyc(request.id, 'rejected', rejectionReason)
      if (result.error) toast.error(result.error)
      else toast.success('KYC rejected — user notified')
    })
  }

  const user = request.user

  return (
    <div className="bg-white rounded-2xl border border-sand-200 overflow-hidden">
      {/* Summary row */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full text-left flex items-center gap-4 px-5 py-4 hover:bg-sand-50 transition-colors"
      >
        <div className="h-10 w-10 rounded-full bg-cyprus-50 border border-cyprus-100 flex items-center justify-center text-cyprus-700 font-bold text-sm shrink-0">
          {user?.full_name?.[0]?.toUpperCase() ?? <User className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sand-900 truncate">
            {request.legal_name}
            {user?.full_name && user.full_name !== request.legal_name && (
              <span className="text-sand-400 font-normal text-xs ml-1.5">(profile: {user.full_name})</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="flex items-center gap-1 text-xs text-sand-500">
              {ID_ICONS[request.id_type]} {ID_LABELS[request.id_type]} ····{request.id_number_last4}
            </span>
            <span className="text-sand-300 text-xs">·</span>
            <span className="text-xs text-sand-400">{formatRelativeTime(request.submitted_at)}</span>
          </div>
        </div>
        <Badge variant={request.status === 'pending' ? 'warning' : request.status === 'approved' ? 'success' : 'destructive'}>
          {request.status}
        </Badge>
        {expanded ? <ChevronUp className="h-4 w-4 text-sand-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-sand-400 shrink-0" />}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-sand-100 p-5 space-y-5">
          {/* Document photos */}
          <div>
            <h3 className="text-xs font-semibold text-sand-500 uppercase tracking-wide mb-3">Documents</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {request.front_signed_url && (
                <div>
                  <p className="text-xs text-sand-500 mb-1.5 font-medium">Front</p>
                  <a href={request.front_signed_url} target="_blank" rel="noreferrer" className="block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={request.front_signed_url}
                      alt="ID front"
                      className="w-full h-32 object-cover rounded-xl border border-sand-200 hover:opacity-90 transition-opacity"
                    />
                  </a>
                </div>
              )}
              {request.back_signed_url && (
                <div>
                  <p className="text-xs text-sand-500 mb-1.5 font-medium">Back</p>
                  <a href={request.back_signed_url} target="_blank" rel="noreferrer" className="block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={request.back_signed_url}
                      alt="ID back"
                      className="w-full h-32 object-cover rounded-xl border border-sand-200 hover:opacity-90 transition-opacity"
                    />
                  </a>
                </div>
              )}
              {request.selfie_signed_url && (
                <div>
                  <p className="text-xs text-sand-500 mb-1.5 font-medium">Selfie with ID</p>
                  <a href={request.selfie_signed_url} target="_blank" rel="noreferrer" className="block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={request.selfie_signed_url}
                      alt="Selfie"
                      className="w-full h-32 object-cover rounded-xl border border-sand-200 hover:opacity-90 transition-opacity"
                    />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Actions for pending requests */}
          {request.status === 'pending' && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-sand-500 uppercase tracking-wide">Decision</h3>
              <div className="flex gap-3 flex-wrap">
                <Button
                  onClick={approve}
                  disabled={isPending}
                  className="bg-success-600 hover:bg-success-700 text-white flex items-center gap-2"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Approve
                </Button>
                <Button
                  variant="outline"
                  className="border-danger-200 text-danger-600 hover:bg-danger-50"
                  onClick={() => setShowReject((v) => !v)}
                  disabled={isPending}
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
              </div>
              {showRejectInput && (
                <div className="space-y-2">
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejection(e.target.value)}
                    placeholder="Reason for rejection (will be shown to user)"
                    rows={3}
                    className="text-sm"
                  />
                  <Button
                    variant="destructive"
                    onClick={reject}
                    disabled={isPending || !rejectionReason.trim()}
                    size="sm"
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm rejection'}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Show rejection reason if rejected */}
          {request.status === 'rejected' && request.rejection_reason && (
            <div className="rounded-xl bg-clay-50 border border-clay-100 p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-clay-500 shrink-0 mt-0.5" />
              <p className="text-sm text-clay-700">{request.rejection_reason}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function KycQueue({
  requests,
}: {
  requests: Array<KycRequest & {
    front_signed_url: string | null
    back_signed_url: string | null
    selfie_signed_url: string | null
  }>
}) {
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter)

  const counts = {
    pending:  requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
    all:      requests.length,
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 flex-wrap">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-semibold transition-colors capitalize',
              filter === f
                ? 'bg-cyprus-700 text-white'
                : 'bg-white border border-sand-200 text-sand-600 hover:bg-sand-50'
            )}
          >
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-white border border-sand-200">
          <Shield className="h-10 w-10 text-success-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-sand-600">
            {filter === 'pending' ? 'No pending verifications' : `No ${filter} verifications`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <KycReviewCard key={r.id} request={r} />
          ))}
        </div>
      )}
    </div>
  )
}
