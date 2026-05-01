'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function startJob(assignmentId: string, jobId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  await supabase
    .from('job_assignments')
    .update({ started_at: new Date().toISOString() })
    .eq('id', assignmentId)
    .eq('tasker_id', user.id)

  revalidatePath(`/job/${jobId}/active`)
  return { success: true }
}

export async function submitProof(
  assignmentId: string,
  jobId: string,
  formData: FormData
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Upload proof photos
  const files = formData.getAll('proof_photos') as File[]
  const urls: string[] = []
  for (const file of files) {
    if (!file.size) continue
    const ext = file.name.split('.').pop()
    const path = `${jobId}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage
      .from('proof-photos')
      .upload(path, file)
    if (!error) {
      const { data } = supabase.storage.from('proof-photos').getPublicUrl(path)
      urls.push(data.publicUrl)
    }
  }

  await supabase
    .from('job_assignments')
    .update({
      submitted_at: new Date().toISOString(),
      proof_photos: urls,
    })
    .eq('id', assignmentId)
    .eq('tasker_id', user.id)

  revalidatePath(`/job/${jobId}/active`)
  return { success: true }
}
