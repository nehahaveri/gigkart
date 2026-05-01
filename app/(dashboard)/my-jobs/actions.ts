'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteJob(jobId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify ownership
  const { data: job } = await supabase
    .from('jobs')
    .select('poster_id, status')
    .eq('id', jobId)
    .single()

  if (!job || job.poster_id !== user.id) return { error: 'Unauthorized' }

  // Can only delete open jobs (no tasker assigned yet)
  if (job.status !== 'open') {
    return { error: 'Only open jobs can be deleted. Use "Cancel" for jobs already in progress.' }
  }

  // Delete the job — cascades to offers, messages
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', jobId)
    .eq('poster_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/my-jobs')
  revalidatePath('/jobs')
  return { success: true }
}
