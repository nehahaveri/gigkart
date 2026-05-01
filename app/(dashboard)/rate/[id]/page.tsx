import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { RatingForm } from './rating-form'
import { BackButton } from '@/components/ui/back-button'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

export const metadata: Metadata = { title: 'Leave a Review' }

export default async function RatePage({ params }: Props) {
  const { id: jobId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: job } = await supabase
    .from('jobs')
    .select('id, title, poster_id')
    .eq('id', jobId)
    .single()

  if (!job) notFound()

  const { data: assignment } = await supabase
    .from('job_assignments')
    .select('tasker_id')
    .eq('job_id', jobId)
    .single()

  const isPoster = user.id === job.poster_id
  const isTasker = user.id === assignment?.tasker_id
  if (!isPoster && !isTasker) redirect('/dashboard')

  const revieweeId = isPoster ? assignment!.tasker_id : job.poster_id

  // Check if already reviewed
  const { data: existing } = await supabase
    .from('reviews')
    .select('id, revealed_at')
    .eq('job_id', jobId)
    .eq('reviewer_id', user.id)
    .single()

  // Get reviewee info
  const { data: reviewee } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('id', revieweeId)
    .single()

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-xl px-4 py-8">
        <div className="mb-5">
          <BackButton href="/my-work" label="My Work" />
        </div>
        <h1 className="text-2xl font-bold text-sand-900 mb-1">Leave a review</h1>
        <p className="text-sm text-sand-500 mb-6">{job.title}</p>

        {existing?.revealed_at ? (
          <div className="text-center py-8 text-sand-500 text-sm">
            You&apos;ve already reviewed this job. Reviews have been revealed.
          </div>
        ) : existing ? (
          <div className="rounded-xl bg-cyprus-50 border border-cyprus-100 p-4 text-sm text-cyprus-800 text-center">
            Review submitted! Waiting for the other party to submit theirs.
            Reviews are revealed simultaneously.
          </div>
        ) : (
          <RatingForm
            jobId={jobId}
            reviewerId={user.id}
            revieweeId={revieweeId}
            revieweeName={reviewee?.full_name ?? 'User'}
          />
        )}
      </div>
    </>
  )
}
