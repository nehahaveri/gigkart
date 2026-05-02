'use server'

import { queryOne, execute } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'

export async function acceptOffer(offerId: string, jobId: string) {
  const session = await getSession()
  if (!session) return { error: 'Not authenticated' }

  const job = await queryOne<{ poster_id: string; status: string }>(
    'SELECT poster_id, status FROM jobs WHERE id = $1',
    [jobId]
  )
  if (!job || job.poster_id !== session.userId) return { error: 'Unauthorized' }
  if (job.status !== 'open') return { error: 'Job is not open for offers' }

  const offer = await queryOne<{ tasker_id: string }>(
    'SELECT tasker_id FROM offers WHERE id = $1',
    [offerId]
  )
  if (!offer) return { error: 'Offer not found' }

  // Accept this offer
  await execute(`UPDATE offers SET status = 'accepted' WHERE id = $1`, [offerId])

  // Reject all other pending offers for this job
  await execute(
    `UPDATE offers SET status = 'rejected'
     WHERE job_id = $1 AND id != $2 AND status = 'pending'`,
    [jobId, offerId]
  )

  // Create job assignment
  await execute(
    `INSERT INTO job_assignments (job_id, tasker_id, offer_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (job_id, tasker_id) DO NOTHING`,
    [jobId, offer.tasker_id, offerId]
  )

  // Update job status
  await execute(`UPDATE jobs SET status = 'active' WHERE id = $1`, [jobId])

  revalidatePath(`/my-jobs/${jobId}/offers`)
  revalidatePath(`/job/${jobId}/active`)
  revalidatePath('/my-work')
  revalidatePath('/messages')
  return { success: true }
}

export async function rejectOffer(offerId: string, jobId: string) {
  const session = await getSession()
  if (!session) return { error: 'Not authenticated' }

  const job = await queryOne<{ poster_id: string }>(
    'SELECT poster_id FROM jobs WHERE id = $1',
    [jobId]
  )
  if (!job || job.poster_id !== session.userId) return { error: 'Unauthorized' }

  await execute(`UPDATE offers SET status = 'rejected' WHERE id = $1`, [offerId])

  revalidatePath(`/my-jobs/${jobId}/offers`)
  return { success: true }
}
