import { redirect, notFound } from 'next/navigation'
import { queryOne } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { Navbar } from '@/components/layout/navbar'
import { ReviewApproval } from './approval'
import { BackButton } from '@/components/ui/back-button'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

export const metadata: Metadata = { title: 'Review & Approve Work' }

export default async function ReviewPage({ params }: Props) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  const job = await queryOne<{
    id: string; title: string; budget: string; poster_id: string; status: string; escrow_payment_id: string | null
  }>(
    'SELECT id, title, budget, poster_id, status, escrow_payment_id FROM jobs WHERE id = $1',
    [id]
  )

  if (!job) notFound()
  if (job.poster_id !== session.userId) redirect('/dashboard')

  const rawAssignment = await queryOne<Record<string, unknown>>(
    `SELECT a.*, u.id AS t_id, u.full_name AS t_full_name, u.avatar_url AS t_avatar_url
     FROM job_assignments a
     JOIN users u ON u.id = a.tasker_id
     WHERE a.job_id = $1`,
    [id]
  )

  if (!rawAssignment) notFound()

  const assignment = {
    ...rawAssignment,
    tasker: {
      id: rawAssignment.t_id,
      full_name: rawAssignment.t_full_name,
      avatar_url: rawAssignment.t_avatar_url,
    },
  }

  const taskerProfile = await queryOne<{ upi_id: string | null }>(
    'SELECT upi_id FROM users WHERE id = $1',
    [rawAssignment.tasker_id as string]
  )

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-5">
          <BackButton href={`/jobs/${id}/active`} label="Back to job" />
        </div>
        <ReviewApproval
          job={{ ...job, budget: Number(job.budget) }}
          assignment={assignment as Parameters<typeof ReviewApproval>[0]['assignment']}
          taskerHasUpi={!!taskerProfile?.upi_id}
        />
      </div>
    </>
  )
}
