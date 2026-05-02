'use server'

import { queryOne, execute } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'

export async function deleteJob(jobId: string) {
  const session = await getSession()
  if (!session) return { error: 'Not authenticated' }

  const job = await queryOne<{ poster_id: string; status: string }>(
    'SELECT poster_id, status FROM jobs WHERE id = $1',
    [jobId]
  )

  if (!job || job.poster_id !== session.userId) return { error: 'Unauthorized' }
  if (job.status !== 'open') {
    return { error: 'Only open jobs can be deleted. Use "Cancel" for jobs already in progress.' }
  }

  await execute(
    'DELETE FROM jobs WHERE id = $1 AND poster_id = $2',
    [jobId, session.userId]
  )

  revalidatePath('/my-jobs')
  revalidatePath('/jobs')
  return { success: true }
}
