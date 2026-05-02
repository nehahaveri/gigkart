import { redirect, notFound } from 'next/navigation'
import { queryOne } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { Navbar } from '@/components/layout/navbar'
import { RatingForm } from './form'
import { BackButton } from '@/components/ui/back-button'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

export const metadata: Metadata = { title: 'Leave a Review' }

export default async function RatePage({ params }: Props) {
  const { id: jobId } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  const [job, assignment] = await Promise.all([
    queryOne<{ id: string; title: string; poster_id: string }>(
      'SELECT id, title, poster_id FROM jobs WHERE id = $1',
      [jobId]
    ),
    queryOne<{ tasker_id: string }>(
      'SELECT tasker_id FROM job_assignments WHERE job_id = $1',
      [jobId]
    ),
  ])

  if (!job) notFound()

  const isPoster = session.userId === job.poster_id
  const isTasker = session.userId === assignment?.tasker_id
  if (!isPoster && !isTasker) redirect('/dashboard')

  const revieweeId = isPoster ? assignment!.tasker_id : job.poster_id

  const [existing, reviewee] = await Promise.all([
    queryOne<{ id: string; revealed_at: string | null }>(
      'SELECT id, revealed_at FROM reviews WHERE job_id = $1 AND reviewer_id = $2',
      [jobId, session.userId]
    ),
    queryOne<{ id: string; full_name: string | null }>(
      'SELECT id, full_name FROM users WHERE id = $1',
      [revieweeId]
    ),
  ])

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
            reviewerId={session.userId}
            revieweeId={revieweeId}
            revieweeName={reviewee?.full_name ?? 'User'}
          />
        )}
      </div>
    </>
  )
}
