'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const disputeSchema = z.object({
  job_id: z.string().uuid(),
  raised_by: z.string().uuid(),
  reason: z.string().min(1, 'Select a reason'),
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
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { errors: { _: 'Not authenticated' } }

  const raw = {
    job_id: formData.get('job_id'),
    raised_by: formData.get('raised_by'),
    reason: formData.get('reason'),
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

  // Upload evidence
  const files = formData.getAll('evidence') as File[]
  const urls: string[] = []
  for (const file of files) {
    if (!file.size) continue
    const ext = file.name.split('.').pop()
    const path = `${parsed.data.job_id}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from('proof-photos').upload(path, file)
    if (!error) {
      const { data } = supabase.storage.from('proof-photos').getPublicUrl(path)
      urls.push(data.publicUrl)
    }
  }

  const { error } = await supabase.from('disputes').insert({
    job_id: parsed.data.job_id,
    raised_by: parsed.data.raised_by,
    reason: parsed.data.reason,
    description: parsed.data.description,
    evidence_urls: urls,
    status: 'open',
  })

  if (error) return { errors: { _: error.message } }

  // Freeze job status
  await supabase
    .from('jobs')
    .update({ status: 'disputed' })
    .eq('id', parsed.data.job_id)

  return { success: true }
}
