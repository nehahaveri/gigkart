'use server'

import { queryOne, execute } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function startJob(assignmentId: string, jobId: string) {
  const session = await getSession()
  if (!session) return { error: 'Not authenticated' }

  await execute(
    `UPDATE job_assignments SET started_at = NOW()
     WHERE id = $1 AND tasker_id = $2`,
    [assignmentId, session.userId]
  )
  revalidatePath(`/job/${jobId}/active`)
  return { success: true }
}

export async function submitProof(
  assignmentId: string,
  jobId: string,
  formData: FormData
) {
  const session = await getSession()
  if (!session) return { error: 'Not authenticated' }

  // Photo uploads skipped in local dev (no cloud storage configured).
  // Add S3/R2 upload logic here when going to production.
  const urls: string[] = []

  await execute(
    `UPDATE job_assignments
       SET submitted_at = NOW(), proof_photos = $1
     WHERE id = $2 AND tasker_id = $3`,
    [urls, assignmentId, session.userId]
  )
  revalidatePath(`/job/${jobId}/active`)
  return { success: true }
}

/** Poster cancels a job (only if proof hasn't been submitted yet) */
export async function cancelJob(jobId: string) {
  const session = await getSession()
  if (!session) return { error: 'Not authenticated' }

  const assignment = await queryOne<{ submitted_at: string | null }>(
    'SELECT submitted_at FROM job_assignments WHERE job_id = $1 LIMIT 1',
    [jobId]
  )
  if (assignment?.submitted_at) {
    return { error: 'Cannot cancel after tasker has submitted proof. Raise a dispute instead.' }
  }

  await execute(
    `UPDATE jobs SET status = 'cancelled' WHERE id = $1 AND poster_id = $2`,
    [jobId, session.userId]
  )
  revalidatePath(`/job/${jobId}/active`)
  revalidatePath('/my-jobs')
  return { success: true }
}

/** Tasker withdraws from an active job (only if proof hasn't been submitted) */
export async function abandonJob(assignmentId: string, jobId: string) {
  const session = await getSession()
  if (!session) return { error: 'Not authenticated' }

  const assignment = await queryOne<{ submitted_at: string | null }>(
    'SELECT submitted_at FROM job_assignments WHERE id = $1 AND tasker_id = $2',
    [assignmentId, session.userId]
  )
  if (!assignment) return { error: 'Assignment not found' }
  if (assignment.submitted_at) return { error: 'Cannot withdraw after submitting proof' }

  await execute(
    'DELETE FROM job_assignments WHERE id = $1 AND tasker_id = $2',
    [assignmentId, session.userId]
  )
  await execute(`UPDATE jobs SET status = 'open' WHERE id = $1`, [jobId])
  await execute(
    `UPDATE offers SET status = 'pending' WHERE job_id = $1 AND tasker_id = $2`,
    [jobId, session.userId]
  )

  revalidatePath('/my-work')
  redirect('/my-work')
}
