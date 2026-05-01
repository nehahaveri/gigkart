'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function startJob(assignmentId: string, jobId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('job_assignments')
    .update({ started_at: new Date().toISOString() })
    .eq('id', assignmentId)
    .eq('tasker_id', user.id)

  if (error) return { error: error.message }
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

  const { error } = await supabase
    .from('job_assignments')
    .update({
      submitted_at: new Date().toISOString(),
      proof_photos: urls,
    })
    .eq('id', assignmentId)
    .eq('tasker_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(`/job/${jobId}/active`)
  return { success: true }
}

/** Poster cancels a job (only if proof hasn't been submitted yet) */
export async function cancelJob(jobId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: assignment } = await supabase
    .from('job_assignments')
    .select('submitted_at')
    .eq('job_id', jobId)
    .maybeSingle()

  if (assignment?.submitted_at) {
    return { error: 'Cannot cancel after tasker has submitted proof. Raise a dispute instead.' }
  }

  const { error } = await supabase
    .from('jobs')
    .update({ status: 'cancelled' })
    .eq('id', jobId)
    .eq('poster_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(`/job/${jobId}/active`)
  revalidatePath('/my-jobs')
  return { success: true }
}

/** Tasker withdraws from an active job (only if proof hasn't been submitted) */
export async function abandonJob(assignmentId: string, jobId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: assignment } = await supabase
    .from('job_assignments')
    .select('submitted_at')
    .eq('id', assignmentId)
    .eq('tasker_id', user.id)
    .single()

  if (!assignment) return { error: 'Assignment not found' }
  if (assignment.submitted_at) {
    return { error: 'Cannot withdraw after submitting proof' }
  }

  await supabase
    .from('job_assignments')
    .delete()
    .eq('id', assignmentId)
    .eq('tasker_id', user.id)

  await supabase
    .from('jobs')
    .update({ status: 'open' })
    .eq('id', jobId)

  await supabase
    .from('offers')
    .update({ status: 'pending' })
    .eq('job_id', jobId)
    .eq('tasker_id', user.id)

  revalidatePath('/my-work')
  redirect('/my-work')
}
