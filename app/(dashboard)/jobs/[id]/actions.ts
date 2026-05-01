'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const offerSchema = z.object({
  job_id: z.string().uuid(),
  price: z.coerce.number().positive('Price must be greater than 0'),
  availability_note: z.string().optional(),
  message: z.string().optional(),
})

export type OfferState = {
  errors?: Record<string, string>
  success?: boolean
}

export async function submitOffer(
  _prev: OfferState,
  formData: FormData
): Promise<OfferState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { errors: { _: 'Not authenticated' } }

  const raw = {
    job_id: formData.get('job_id'),
    price: formData.get('price'),
    availability_note: formData.get('availability_note') || undefined,
    message: formData.get('message') || undefined,
  }

  const parsed = offerSchema.safeParse(raw)
  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const [key, msgs] of Object.entries(parsed.error.flatten().fieldErrors)) {
      errors[key] = msgs[0]
    }
    return { errors }
  }

  const { error } = await supabase.from('offers').insert({
    job_id: parsed.data.job_id,
    tasker_id: user.id,
    price: parsed.data.price,
    availability_note: parsed.data.availability_note ?? null,
    message: parsed.data.message ?? null,
    status: 'pending',
  })

  if (error) {
    if (error.code === '23505') {
      return { errors: { _: 'You have already sent an offer for this job.' } }
    }
    return { errors: { _: error.message } }
  }

  return { success: true }
}
