'use server'

import { execute, queryOne } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { KycStatus } from '@/types'

const kycSchema = z.object({
  legal_name:      z.string().min(2, 'Full legal name is required'),
  id_type:         z.enum(['aadhaar', 'passport', 'driving_license']),
  id_number_last4: z.string().regex(/^[0-9]{4}$/, 'Enter the last 4 digits of your ID number'),
})

export type KycState = {
  errors?: Record<string, string>
  success?: boolean
}

export async function submitKyc(
  _prev: KycState,
  formData: FormData
): Promise<KycState> {
  const session = await getSession()
  if (!session) return { errors: { _: 'Not authenticated' } }

  const raw = {
    legal_name:      formData.get('legal_name'),
    id_type:         formData.get('id_type'),
    id_number_last4: formData.get('id_number_last4'),
  }

  const parsed = kycSchema.safeParse(raw)
  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const [k, msgs] of Object.entries(parsed.error.flatten().fieldErrors)) {
      errors[k] = msgs[0]
    }
    return { errors }
  }

  // File upload — TODO: integrate S3/R2 in production
  // For now we store placeholder paths to satisfy the NOT NULL constraint
  const frontFile  = formData.get('front_photo') as File | null
  const selfieFile = formData.get('selfie_photo') as File | null

  if (!frontFile?.size)  return { errors: { front_photo: 'Front photo of your ID is required' } }
  if (!selfieFile?.size) return { errors: { selfie_photo: 'Selfie with your ID is required' } }

  const userId = session.userId
  const frontPath  = `${userId}/front/pending`
  const selfiePath = `${userId}/selfie/pending`

  // Upsert — allows resubmission after rejection
  await execute(
    `INSERT INTO kyc_requests
       (user_id, legal_name, id_type, id_number_last4, front_url, back_url, selfie_url,
        status, rejection_reason, reviewed_by, reviewed_at, submitted_at)
     VALUES ($1,$2,$3,$4,$5,NULL,$6,'pending',NULL,NULL,NULL,NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       legal_name       = EXCLUDED.legal_name,
       id_type          = EXCLUDED.id_type,
       id_number_last4  = EXCLUDED.id_number_last4,
       front_url        = EXCLUDED.front_url,
       selfie_url       = EXCLUDED.selfie_url,
       status           = 'pending',
       rejection_reason = NULL,
       reviewed_by      = NULL,
       reviewed_at      = NULL,
       submitted_at     = NOW()`,
    [userId, parsed.data.legal_name, parsed.data.id_type, parsed.data.id_number_last4, frontPath, selfiePath]
  )

  revalidatePath('/settings')
  revalidatePath('/settings/verify')
  return { success: true }
}

export async function reviewKyc(
  requestId: string,
  decision: Extract<KycStatus, 'approved' | 'rejected'>,
  rejectionReason?: string
): Promise<{ error?: string }> {
  const session = await getSession()
  if (!session) return { error: 'Not authenticated' }

  // Verify caller is admin
  const admin = await queryOne<{ role: string[] }>(
    'SELECT role FROM users WHERE id = $1',
    [session.userId]
  )
  if (!Array.isArray(admin?.role) || !admin.role.includes('admin')) {
    return { error: 'Forbidden' }
  }

  // Fetch request
  const req = await queryOne<{ user_id: string; id_number_last4: string }>(
    'SELECT user_id, id_number_last4 FROM kyc_requests WHERE id = $1',
    [requestId]
  )
  if (!req) return { error: 'KYC request not found' }

  await execute(
    `UPDATE kyc_requests SET
       status           = $1,
       rejection_reason = $2,
       reviewed_by      = $3,
       reviewed_at      = NOW()
     WHERE id = $4`,
    [decision, decision === 'rejected' ? (rejectionReason ?? 'Does not meet requirements') : null, session.userId, requestId]
  )

  if (decision === 'approved') {
    await execute(
      'UPDATE users SET aadhaar_verified = TRUE, aadhaar_last4 = $1 WHERE id = $2',
      [req.id_number_last4, req.user_id]
    )
    await execute(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, 'kyc_approved', 'Identity verified ✓',
               'Your government ID has been verified. Your profile now shows a Verified badge.', '{}')`,
      [req.user_id]
    )
  } else {
    await execute(
      'UPDATE users SET aadhaar_verified = FALSE, aadhaar_last4 = NULL WHERE id = $1',
      [req.user_id]
    )
    await execute(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, 'kyc_rejected', 'Identity verification needs attention', $2, '{}')`,
      [req.user_id, rejectionReason ?? 'Your submission could not be verified. Please resubmit with a clearer photo.']
    )
  }

  revalidatePath('/admin/kyc')
  return {}
}
