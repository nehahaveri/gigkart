'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils/format'
import { CheckCircle, AlertTriangle, Loader2, Shield } from 'lucide-react'
import { toast } from 'sonner'
import type { User } from '@/types'

type JobData = {
  id: string
  title: string
  budget: number
  poster_id: string
  status: string
  escrow_payment_id: string | null
}

type AssignmentData = {
  id: string
  submitted_at: string | null
  approved_at: string | null
  proof_photos: string[]
  tasker: Partial<User>
}

export function ReviewApproval({
  job,
  assignment,
}: {
  job: JobData
  assignment: AssignmentData
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const tasker = assignment.tasker

  async function handleApprove() {
    setLoading(true)
    const res = await fetch('/api/payments/payout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: job.id }),
    })
    const data = await res.json()
    setLoading(false)

    if (data.success) {
      if (data.test_mode) {
        toast.success(`Test mode: payout of ₹${data.payout_amount} simulated. Job marked completed.`)
      } else {
        toast.success(`Payment of ₹${data.payout_amount} released to tasker!`)
      }
      router.push(`/rate/${job.id}`)
    } else {
      toast.error(data.error || 'Failed to release payment')
    }
  }

  if (assignment.approved_at) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-12 w-12 text-success-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-sand-900">Work approved & paid</h2>
        <p className="text-sm text-sand-500 mt-2">Payment has been released to the tasker.</p>
        <Button className="mt-6" asChild>
          <a href={`/rate/${job.id}`}>Leave a review</a>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-sand-900">Review & Approve</h1>
        <p className="text-sm text-sand-500 mt-1">{job.title}</p>
      </div>

      {/* Tasker */}
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-cyprus-100 flex items-center justify-center text-cyprus-700 font-bold">
            {tasker?.full_name?.[0] ?? '?'}
          </div>
          <div>
            <div className="font-semibold text-sand-900">{tasker?.full_name ?? 'Tasker'}</div>
            <div className="text-xs text-sand-500">Submitted proof of work</div>
          </div>
        </CardContent>
      </Card>

      {/* Proof photos */}
      {assignment.proof_photos?.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h2 className="font-semibold text-sand-900 mb-3">Proof of work</h2>
            <div className="grid grid-cols-2 gap-3">
              {assignment.proof_photos.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Proof ${i + 1}`}
                  className="rounded-xl object-cover border border-sand-100 w-full aspect-square"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment breakdown */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <h2 className="font-semibold text-sand-900">Payment breakdown</h2>
          <div className="flex justify-between text-sm">
            <span className="text-sand-500">Job budget</span>
            <span className="font-medium">{formatCurrency(job.budget)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-sand-500">Platform fee (10%)</span>
            <span className="font-medium text-sand-500">
              -{formatCurrency(job.budget * 0.1)}
            </span>
          </div>
          <div className="flex justify-between text-sm border-t border-sand-100 pt-3">
            <span className="font-semibold text-sand-900">Tasker receives</span>
            <span className="font-bold text-success-600">
              {formatCurrency(job.budget * 0.9)}
            </span>
          </div>
          {job.escrow_payment_id && (
            <div className="flex items-center gap-1.5 text-xs text-success-600 mt-2">
              <Shield className="h-3 w-3" />
              Escrow payment secured
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          className="flex-1"
          onClick={handleApprove}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              Approve & Release Payment
            </>
          )}
        </Button>
        <Button variant="destructive" asChild>
          <a href={`/job/${job.id}/dispute`}>
            <AlertTriangle className="h-4 w-4" />
            Dispute
          </a>
        </Button>
      </div>

      <p className="text-xs text-sand-500 text-center">
        If you don&apos;t approve within 48 hours, payment will be auto-released.
      </p>
    </div>
  )
}
