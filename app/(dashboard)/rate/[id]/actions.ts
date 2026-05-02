'use server'

import { execute, queryOne } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { z } from 'zod'

const reviewSchema = z.object({
  job_id:               z.string().uuid(),
  reviewer_id:          z.string().uuid(),
  reviewee_id:          z.string().uuid(),
  overall_rating:       z.coerce.number().int().min(1, 'Rate at least 1 star').max(5),
  quality_rating:       z.coerce.number().int().min(1).max(5),
  punctuality_rating:   z.coerce.number().int().min(1).max(5),
  communication_rating: z.coerce.number().int().min(1).max(5),
  rehire_flag:          z.coerce.boolean(),
  text:                 z.string().optional(),
})

export type ReviewState = {
  errors?: Record<string, string>
  success?: boolean
}

export async function submitReview(
  _prev: ReviewState,
  formData: FormData
): Promise<ReviewState> {
  const session = await getSession()
  if (!session) return { errors: { _: 'Not authenticated' } }

  const raw: Record<string, unknown> = {}
  for (const [key, value] of formData.entries()) raw[key] = value

  const parsed = reviewSchema.safeParse(raw)
  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const [key, msgs] of Object.entries(parsed.error.flatten().fieldErrors)) {
      errors[key] = msgs[0]
    }
    return { errors }
  }

  if (parsed.data.reviewer_id !== session.userId) {
    return { errors: { _: 'Unauthorized' } }
  }

  try {
    await execute(
      `INSERT INTO reviews
         (job_id, reviewer_id, reviewee_id,
          overall_rating, quality_rating, punctuality_rating, communication_rating,
          rehire_flag, text)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        parsed.data.job_id,
        parsed.data.reviewer_id,
        parsed.data.reviewee_id,
        parsed.data.overall_rating,
        parsed.data.quality_rating,
        parsed.data.punctuality_rating,
        parsed.data.communication_rating,
        parsed.data.rehire_flag,
        parsed.data.text || null,
      ]
    )
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string }
    if (e?.code === '23505') return { errors: { _: 'You have already reviewed this job.' } }
    return { errors: { _: e?.message ?? 'Failed to submit review.' } }
  }

  // If both reviewer and reviewee have submitted, reveal both reviews
  const cnt = await queryOne<{ cnt: string }>(
    'SELECT COUNT(*)::text AS cnt FROM reviews WHERE job_id = $1',
    [parsed.data.job_id]
  )
  if (parseInt(cnt?.cnt ?? '0', 10) >= 2) {
    await execute(
      `UPDATE reviews SET revealed_at = NOW() WHERE job_id = $1`,
      [parsed.data.job_id]
    )
  }

  return { success: true }
}
