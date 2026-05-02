'use server'

import { queryOne } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const postJobSchema = z.object({
  title:            z.string().min(5, 'Title must be at least 5 characters').max(100),
  category:         z.string().min(1, 'Select a category'),
  sub_category:     z.string().optional(),
  description:      z.string().min(20, 'Description must be at least 20 characters').max(2000),
  duration_type:    z.enum(['few_hours', '1_day', '2_3_days', '1_week', 'single_task', 'recurring']),
  date_needed:      z.string().optional(),
  deadline:         z.string().optional(),
  is_remote:        z.coerce.boolean(),
  address:          z.string().optional(),
  lat:              z.coerce.number().optional(),
  lng:              z.coerce.number().optional(),
  num_taskers:      z.coerce.number().int().min(1).max(20).default(1),
  budget:           z.coerce.number().positive('Budget must be greater than 0'),
  budget_type:      z.enum(['fixed', 'hourly', 'negotiable']),
  payment_mode:     z.enum(['escrow', 'upfront', '50_50_split']),
  search_radius_km: z.coerce.number().int().min(1).max(100).default(10),
  gender_pref:      z.enum(['any', 'male', 'female']).default('any'),
  min_rating:       z.coerce.number().min(0).max(5).default(0),
  is_urgent:        z.coerce.boolean(),
})

export type PostJobState = {
  errors?: Record<string, string>
  success?: boolean
  jobId?: string
}

export async function createJob(
  _prev: PostJobState,
  formData: FormData
): Promise<PostJobState> {
  const session = await getSession()
  if (!session) return { errors: { _: 'Not authenticated' } }

  const raw: Record<string, unknown> = {}
  for (const [key, value] of formData.entries()) {
    if (key === 'photos') continue
    raw[key] = value
  }

  const parsed = postJobSchema.safeParse(raw)
  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const [key, msgs] of Object.entries(parsed.error.flatten().fieldErrors)) {
      errors[key] = msgs[0]
    }
    return { errors }
  }

  const { lat, lng, ...fields } = parsed.data

  // Photo uploads are skipped in local dev (no cloud storage).
  // To support uploads, wire up local disk or an S3-compatible service here.
  const photoUrls: string[] = []

  const locationSql = lat && lng
    ? `ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`
    : 'NULL'

  const job = await queryOne<{ id: string }>(
    `INSERT INTO jobs (
       poster_id, title, category, sub_category, description,
       duration_type, date_needed, deadline, is_remote, address,
       num_taskers, budget, budget_type, payment_mode,
       search_radius_km, gender_pref, min_rating, is_urgent,
       photos, status, location
     ) VALUES (
       $1, $2, $3, $4, $5,
       $6, $7, $8, $9, $10,
       $11, $12, $13, $14,
       $15, $16, $17, $18,
       $19, 'open', ${locationSql}
     ) RETURNING id`,
    [
      session.userId,
      fields.title,
      fields.category,
      fields.sub_category || null,
      fields.description,
      fields.duration_type,
      fields.date_needed || null,
      fields.deadline || null,
      fields.is_remote,
      fields.address || null,
      fields.num_taskers,
      fields.budget,
      fields.budget_type,
      fields.payment_mode,
      fields.search_radius_km,
      fields.gender_pref,
      fields.min_rating,
      fields.is_urgent,
      photoUrls,
    ]
  )

  if (!job) return { errors: { _: 'Failed to create job. Please try again.' } }

  redirect(`/jobs/${job.id}`)
}
