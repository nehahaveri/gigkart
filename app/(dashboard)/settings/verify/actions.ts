'use server'

import { createClient } from '@/lib/supabase/server'
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

async function uploadKycFile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  file: File,
  folder: string
): Promise<string | null> {
  if (!file.size) return null
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${folder}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('kyc-documents').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) return null
  // KYC docs are private — return path only; URLs generated server-side for admin
  return path
}

export async function submitKyc(
  _prev: KycState,
  formData: FormData
): Promise<KycState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { errors: { _: 'Not authenticated' } }

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

  // Upload photos
  const frontFile  = formData.get('front_photo') as File | null
  const backFile   = formData.get('back_photo') as File | null
  const selfieFile = formData.get('selfie_photo') as File | null

  if (!frontFile?.size)  return { errors: { front_photo: 'Front photo of your ID is required' } }
  if (!selfieFile?.size) return { errors: { selfie_photo: 'Selfie with your ID is required' } }

  const userId = user.id
  const [frontPath, backPath, selfiePath] = await Promise.all([
    uploadKycFile(supabase, frontFile,  `${userId}/front`),
    backFile?.size ? uploadKycFile(supabase, backFile, `${userId}/back`) : Promise.resolve(null),
    uploadKycFile(supabase, selfieFile, `${userId}/selfie`),
  ])

  if (!frontPath)  return { errors: { front_photo: 'Upload failed. Please try again.' } }
  if (!selfiePath) return { errors: { selfie_photo: 'Upload failed. Please try again.' } }

  // Upsert — allows resubmission after rejection
  const { error } = await supabase.from('kyc_requests').upsert(
    {
      user_id:         userId,
      legal_name:      parsed.data.legal_name,
      id_type:         parsed.data.id_type,
      id_number_last4: parsed.data.id_number_last4,
      front_url:       frontPath,
      back_url:        backPath ?? null,
      selfie_url:      selfiePath,
      status:          'pending',
      rejection_reason: null,
      reviewed_by:     null,
      reviewed_at:     null,
      submitted_at:    new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  if (error) return { errors: { _: error.message } }

  revalidatePath('/settings')
  revalidatePath('/settings/verify')
  return { success: true }
}

export async function reviewKyc(
  requestId: string,
  decision: Extract<KycStatus, 'approved' | 'rejected'>,
  rejectionReason?: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify caller is admin
  const { data: admin } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!Array.isArray(admin?.role) || !admin.role.includes('admin')) {
    return { error: 'Forbidden' }
  }

  // Fetch request
  const { data: req } = await supabase
    .from('kyc_requests')
    .select('user_id, id_number_last4')
    .eq('id', requestId)
    .single()

  if (!req) return { error: 'KYC request not found' }

  const { error } = await supabase
    .from('kyc_requests')
    .update({
      status:           decision,
      rejection_reason: decision === 'rejected' ? (rejectionReason ?? 'Does not meet requirements') : null,
      reviewed_by:      user.id,
      reviewed_at:      new Date().toISOString(),
    })
    .eq('id', requestId)

  if (error) return { error: error.message }

  // If approved: mark user as verified and store last-4
  if (decision === 'approved') {
    await supabase
      .from('users')
      .update({
        aadhaar_verified: true,
        aadhaar_last4: req.id_number_last4,
      })
      .eq('id', req.user_id)

    // Notify user
    await supabase.from('notifications').insert({
      user_id: req.user_id,
      type:    'kyc_approved',
      title:   'Identity verified ✓',
      body:    'Your government ID has been verified. Your profile now shows a Verified badge.',
      data:    {},
    })
  } else {
    // Reset verification flag in case it was previously set
    await supabase
      .from('users')
      .update({ aadhaar_verified: false, aadhaar_last4: null })
      .eq('id', req.user_id)

    await supabase.from('notifications').insert({
      user_id: req.user_id,
      type:    'kyc_rejected',
      title:   'Identity verification needs attention',
      body:    rejectionReason ?? 'Your submission could not be verified. Please resubmit with a clearer photo.',
      data:    {},
    })
  }

  revalidatePath('/admin/kyc')
  return {}
}
