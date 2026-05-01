'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const postJobSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  category: z.string().min(1, 'Select a category'),
  sub_category: z.string().optional(),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  duration_type: z.enum(['few_hours', '1_day', '2_3_days', '1_week', 'single_task', 'recurring']),
  date_needed: z.string().optional(),
  deadline: z.string().optional(),
  is_remote: z.coerce.boolean(),
  address: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  num_taskers: z.coerce.number().int().min(1).max(20).default(1),
  budget: z.coerce.number().positive('Budget must be greater than 0'),
  budget_type: z.enum(['fixed', 'hourly', 'negotiable']),
  payment_mode: z.enum(['escrow', 'upfront', '50_50_split']),
  search_radius_km: z.coerce.number().int().min(1).max(100).default(10),
  gender_pref: z.enum(['any', 'male', 'female']).default('any'),
  min_rating: z.coerce.number().min(0).max(5).default(0),
  is_urgent: z.coerce.boolean(),
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
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { errors: { _: 'Not authenticated' } }

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

  // Upload photos
  const photoFiles = formData.getAll('photos') as File[]
  const photoUrls: string[] = []
  for (const file of photoFiles) {
    if (!file.size) continue
    const ext = file.name.split('.').pop()
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('job-photos')
      .upload(path, file)
    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from('job-photos')
        .getPublicUrl(path)
      photoUrls.push(urlData.publicUrl)
    }
  }

  const insertData: Record<string, unknown> = {
    poster_id: user.id,
    title: fields.title,
    category: fields.category,
    sub_category: fields.sub_category || null,
    description: fields.description,
    duration_type: fields.duration_type,
    date_needed: fields.date_needed || null,
    deadline: fields.deadline || null,
    is_remote: fields.is_remote,
    address: fields.address || null,
    num_taskers: fields.num_taskers,
    budget: fields.budget,
    budget_type: fields.budget_type,
    payment_mode: fields.payment_mode,
    search_radius_km: fields.search_radius_km,
    gender_pref: fields.gender_pref,
    min_rating: fields.min_rating,
    is_urgent: fields.is_urgent,
    photos: photoUrls,
    status: 'open',
  }

  if (lat && lng) {
    insertData.location = `POINT(${lng} ${lat})`
  }

  const { data: job, error } = await supabase
    .from('jobs')
    .insert(insertData)
    .select('id')
    .single()

  if (error) return { errors: { _: error.message } }

  redirect(`/jobs/${job.id}`)
}
