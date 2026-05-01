'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/format'
import {
  CheckCircle, Circle, Upload, Camera, Loader2, MessageCircle,
} from 'lucide-react'
import { startJob, submitProof } from './actions'
import { toast } from 'sonner'
import Link from 'next/link'
import type { Job, JobAssignment, User } from '@/types'

const PROGRESS_STEPS = [
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'started', label: 'Started' },
  { key: 'submitted', label: 'Proof Submitted' },
  { key: 'approved', label: 'Approved & Paid' },
]

function getProgress(assignment: JobAssignment): number {
  if (assignment.approved_at) return 3
  if (assignment.submitted_at) return 2
  if (assignment.started_at) return 1
  return 0
}

export function ActiveJobView({
  job,
  assignment: initialAssignment,
  isPoster,
  otherUser,
  currentUserId,
}: {
  job: Job
  assignment: JobAssignment
  isPoster: boolean
  otherUser: Partial<User> | null
  currentUserId: string
}) {
  const [assignment, setAssignment] = useState(initialAssignment)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const progress = getProgress(assignment)

  // Real-time subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`assignment-${assignment.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'job_assignments',
          filter: `id=eq.${assignment.id}`,
        },
        (payload) => {
          setAssignment((prev) => ({ ...prev, ...payload.new }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [assignment.id])

  async function handleStart() {
    setLoading(true)
    const result = await startJob(assignment.id, job.id)
    setLoading(false)
    if (result.error) toast.error(result.error)
    else toast.success('Job started! The poster has been notified.')
  }

  async function handleSubmitProof(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await submitProof(assignment.id, job.id, formData)
    setLoading(false)
    if (result.error) toast.error(result.error)
    else toast.success('Proof submitted! Waiting for poster approval.')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Badge variant={job.status === 'completed' ? 'success' : 'warning'}>
          {job.status}
        </Badge>
        <h1 className="text-2xl font-bold text-sand-900 mt-2">{job.title}</h1>
        <p className="text-sm text-sand-500 mt-1">{formatCurrency(job.budget)} · {job.category}</p>
      </div>

      {/* Other party */}
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-cyprus-100 flex items-center justify-center text-cyprus-700 font-bold">
            {otherUser?.full_name?.[0] ?? '?'}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sand-900">
              {otherUser?.full_name ?? 'User'}
            </div>
            <div className="text-xs text-sand-500">
              {isPoster ? 'Tasker' : 'Poster'}
              {otherUser?.city && ` · ${otherUser.city}`}
            </div>
          </div>
          <a
            href={`/profile/${otherUser?.id}`}
            className="text-xs text-cyprus-700 font-medium hover:underline"
          >
            View profile
          </a>
        </CardContent>
      </Card>

      {/* Progress tracker */}
      <Card>
        <CardContent className="p-5">
          <h2 className="font-semibold text-sand-900 mb-4">Progress</h2>
          <div className="space-y-3">
            {PROGRESS_STEPS.map((step, i) => {
              const done = i <= progress
              const current = i === progress
              return (
                <div key={step.key} className="flex items-center gap-3">
                  {done ? (
                    <CheckCircle className={cn('h-5 w-5 shrink-0', current ? 'text-cyprus-700' : 'text-success-500')} />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-sand-200" />
                  )}
                  <span
                    className={cn(
                      'text-sm font-medium',
                      done ? 'text-sand-900' : 'text-sand-500'
                    )}
                  >
                    {step.label}
                  </span>
                  {current && (
                    <Badge variant="default" className="ml-auto text-xs">Current</Badge>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tasker actions */}
      {!isPoster && (
        <div className="space-y-4">
          {/* Start job */}
          {!assignment.started_at && (
            <Button onClick={handleStart} disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Mark as Started'}
            </Button>
          )}

          {/* Submit proof */}
          {assignment.started_at && !assignment.submitted_at && (
            <Card>
              <CardContent className="p-5">
                <h2 className="font-semibold text-sand-900 mb-3">Submit proof of work</h2>
                <form onSubmit={handleSubmitProof} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-sand-800 mb-1.5">
                      Upload photos/video
                    </label>
                    <label className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-sand-200 cursor-pointer hover:border-sand-300">
                      <Camera className="h-6 w-6 text-sand-500" />
                      <span className="text-sm text-sand-500">Tap to upload proof</span>
                      <input
                        ref={fileRef}
                        type="file"
                        name="proof_photos"
                        accept="image/*,video/mp4"
                        multiple
                        className="hidden"
                      />
                    </label>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Submit & Mark Complete
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {assignment.submitted_at && !assignment.approved_at && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              Proof submitted. Waiting for the poster to review and approve your work.
            </div>
          )}
        </div>
      )}

      {/* Poster actions */}
      {isPoster && assignment.submitted_at && !assignment.approved_at && (
        <div className="space-y-4">
          {/* Proof photos */}
          {assignment.proof_photos?.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h2 className="font-semibold text-sand-900 mb-3">Proof of work</h2>
                <div className="flex gap-3 overflow-x-auto">
                  {assignment.proof_photos.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Proof ${i + 1}`}
                      className="h-40 w-40 rounded-xl object-cover border border-sand-100"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button className="flex-1" asChild>
              <a href={`/job/${job.id}/review`}>Approve & Release Payment</a>
            </Button>
            <Button variant="destructive" asChild>
              <a href={`/job/${job.id}/dispute`}>Raise Issue</a>
            </Button>
          </div>
        </div>
      )}

      {/* Completed */}
      {assignment.approved_at && (
        <div className="rounded-xl bg-success-50 border border-success-200 p-4 text-sm text-success-700 text-center">
          <CheckCircle className="h-5 w-5 mx-auto mb-2" />
          Job completed and payment released!
          <a href={`/rate/${job.id}`} className="block mt-2 font-medium text-success-800 underline">
            Leave a review
          </a>
        </div>
      )}

      {/* Full-page messaging */}
      {otherUser?.id && (
        <Link
          href={`/messages/${job.id}`}
          className="flex items-center gap-3 w-full rounded-2xl border border-cyprus-200 bg-cyprus-50 px-4 py-3.5 hover:bg-cyprus-100 transition-colors"
        >
          <div className="h-9 w-9 rounded-full bg-cyprus-700 flex items-center justify-center shrink-0">
            <MessageCircle className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-cyprus-800">
              Message {otherUser.full_name?.split(' ')[0] ?? (isPoster ? 'Tasker' : 'Poster')}
            </div>
            <div className="text-xs text-cyprus-600">Open full conversation + profile</div>
          </div>
          <CheckCircle className="h-4 w-4 text-cyprus-400 shrink-0" />
        </Link>
      )}
    </div>
  )
}
