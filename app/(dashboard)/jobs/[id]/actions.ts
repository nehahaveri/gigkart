'use server'

import { execute, queryOne } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { z } from 'zod'

const offerSchema = z.object({
  job_id:            z.string().uuid(),
  price:             z.coerce.number().positive('Price must be greater than 0'),
  availability_note: z.string().optional(),
  message:           z.string().optional(),
})

export type OfferState = {
  errors?: Record<string, string>
  success?: boolean
}

export async function submitOffer(
  _prev: OfferState,
  formData: FormData
): Promise<OfferState> {
  const session = await getSession()
  if (!session) return { errors: { _: 'Not authenticated' } }

  const raw = {
    job_id:            formData.get('job_id'),
    price:             formData.get('price'),
    availability_note: formData.get('availability_note') || undefined,
    message:           formData.get('message') || undefined,
  }

  const parsed = offerSchema.safeParse(raw)
  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const [key, msgs] of Object.entries(parsed.error.flatten().fieldErrors)) {
      errors[key] = msgs[0]
    }
    return { errors }
  }

  try {
    await execute(
      `INSERT INTO offers (job_id, tasker_id, price, availability_note, message, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')`,
      [
        parsed.data.job_id,
        session.userId,
        parsed.data.price,
        parsed.data.availability_note ?? null,
        parsed.data.message ?? null,
      ]
    )
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string }
    if (e?.code === '23505') {
      return { errors: { _: 'You have already sent an offer for this job.' } }
    }
    return { errors: { _: e?.message ?? 'Failed to submit offer.' } }
  }

  return { success: true }
}
