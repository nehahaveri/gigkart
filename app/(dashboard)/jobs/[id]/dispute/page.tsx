import { redirect, notFound } from 'next/navigation'
import { queryOne } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { Navbar } from '@/components/layout/navbar'
import { DisputeForm } from './form'
import { BackButton } from '@/components/ui/back-button'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

export const metadata: Metadata = { title: 'Raise a Dispute' }

export default async function DisputePage({ params }: Props) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  const [job, assignment, existing] = await Promise.all([
    queryOne<{ id: string; title: string; poster_id: string }>(
      'SELECT id, title, poster_id FROM jobs WHERE id = $1',
      [id]
    ),
    queryOne<{ tasker_id: string }>(
      'SELECT tasker_id FROM job_assignments WHERE job_id = $1',
      [id]
    ),
    queryOne<{ id: string; status: string }>(
      'SELECT id, status FROM disputes WHERE job_id = $1',
      [id]
    ),
  ])

  if (!job) notFound()

  const isParty = job.poster_id === session.userId || assignment?.tasker_id === session.userId
  if (!isParty) redirect('/dashboard')

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-xl px-4 py-8">
        <div className="mb-5">
          <BackButton href={`/jobs/${id}/active`} label="Back to job" />
        </div>
        <h1 className="text-2xl font-bold text-sand-900 mb-1">Raise a dispute</h1>
        <p className="text-sm text-sand-500 mb-6">{job.title}</p>

        {existing ? (
          <div className="rounded-xl bg-clay-50 border border-clay-100 p-4 text-sm text-clay-700">
            A dispute has already been raised for this job (status: {existing.status}).
            Our team is reviewing it.
          </div>
        ) : (
          <DisputeForm jobId={id} userId={session.userId} />
        )}
      </div>
    </>
  )
}
