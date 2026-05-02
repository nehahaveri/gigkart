'use server'

import { execute, queryOne } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { z } from 'zod'

const disputeSchema = z.object({
  job_id:      z.string().uuid(),
  raised_by:   z.string().uuid(),
  reason:      z.string().min(1, 'Select a reason'),
  description: z.string().min(10, 'Provide at least 10 characters of detail'),
})

export type DisputeState = {
  errors?: Record<string, string>
  success?: boolean
}

export async function submitDispute(
  _prev: DisputeState,
  formData: FormData
): Promise<DisputeState> {
  const session = await getSession()
  if (!session) return { errors: { _: 'Not authenticated' } }

  const raw = {
    job_id:      formData.get('job_id'),
    raised_by:   formData.get('raised_by'),
    reason:      formData.get('reason'),
    description: formData.get('description'),
  }

  const parsed = disputeSchema.safeParse(raw)
  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const [key, msgs] of Object.entries(parsed.error.flatten().fieldErrors)) {
      errors[key] = msgs[0]
    }
    return { errors }
  }

  if (parsed.data.raised_by !== session.userId) {
    return { errors: { _: 'Unauthorized' } }
  }

  // Evidence uploads skipped in local dev (no cloud storage)
  const urls: string[] = []

  try {
    await execute(
      `INSERT INTO disputes (job_id, raised_by, reason, description, evidence_urls, status)
       VALUES ($1, $2, $3, $4, $5, 'open')`,
      [
        parsed.data.job_id,
        parsed.data.raised_by,
        parsed.data.reason,
        parsed.data.description,
        urls,
      ]
    )
  } catch (err: unknown) {
    const e = err as { message?: string }
    return { errors: { _: e?.message ?? 'Failed to submit dispute.' } }
  }

  await execute(`UPDATE jobs SET status = 'disputed' WHERE id = $1`, [parsed.data.job_id])

  return { success: true }
}
