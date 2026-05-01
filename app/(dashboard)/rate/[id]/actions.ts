'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const reviewSchema = z.object({
  job_id: z.string().uuid(),
  reviewer_id: z.string().uuid(),
  reviewee_id: z.string().uuid(),
  overall_rating: z.coerce.number().int().min(1, 'Rate at least 1 star').max(5),
  quality_rating: z.coerce.number().int().min(1).max(5),
  punctuality_rating: z.coerce.number().int().min(1).max(5),
  communication_rating: z.coerce.number().int().min(1).max(5),
  rehire_flag: z.coerce.boolean(),
  text: z.string().optional(),
})

export type ReviewState = {
  errors?: Record<string, string>
  success?: boolean
}

export async function submitReview(
  _prev: ReviewState,
  formData: FormData
): Promise<ReviewState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { errors: { _: 'Not authenticated' } }

  const raw: Record<string, unknown> = {}
  for (const [key, value] of formData.entries()) {
    raw[key] = value
  }

  const parsed = reviewSchema.safeParse(raw)
  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const [key, msgs] of Object.entries(parsed.error.flatten().fieldErrors)) {
      errors[key] = msgs[0]
    }
    return { errors }
  }

  if (parsed.data.reviewer_id !== user.id) {
    return { errors: { _: 'Unauthorized' } }
  }

  const { error } = await supabase.from('reviews').insert({
    job_id: parsed.data.job_id,
    reviewer_id: parsed.data.reviewer_id,
    reviewee_id: parsed.data.reviewee_id,
    overall_rating: parsed.data.overall_rating,
    quality_rating: parsed.data.quality_rating,
    punctuality_rating: parsed.data.punctuality_rating,
    communication_rating: parsed.data.communication_rating,
    rehire_flag: parsed.data.rehire_flag,
    text: parsed.data.text || null,
  })

  if (error) {
    if (error.code === '23505') {
      return { errors: { _: 'You have already reviewed this job.' } }
    }
    return { errors: { _: error.message } }
  }

  // Check if both reviews are in — if so, reveal both
  const { count } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('job_id', parsed.data.job_id)

  if ((count ?? 0) >= 2) {
    const now = new Date().toISOString()
    await supabase
      .from('reviews')
      .update({ revealed_at: now })
      .eq('job_id', parsed.data.job_id)
  }

  return { success: true }
}
