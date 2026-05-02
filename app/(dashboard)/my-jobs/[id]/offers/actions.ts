'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function acceptOffer(offerId: string, jobId: string) {
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
  if (job.status !== 'open') return { error: 'Job is not open for offers' }

  const { data: offer } = await supabase
    .from('offers')
    .select('tasker_id')
    .eq('id', offerId)
    .single()

  if (!offer) return { error: 'Offer not found' }

  // Accept this offer
  await supabase
    .from('offers')
    .update({ status: 'accepted' })
    .eq('id', offerId)

  // Reject all other pending offers
  await supabase
    .from('offers')
    .update({ status: 'rejected' })
    .eq('job_id', jobId)
    .neq('id', offerId)
    .eq('status', 'pending')

  // Create job assignment
  await supabase.from('job_assignments').insert({
    job_id: jobId,
    tasker_id: offer.tasker_id,
    offer_id: offerId,
  })

  // Update job status
  await supabase
    .from('jobs')
    .update({ status: 'active' })
    .eq('id', jobId)

  revalidatePath(`/my-jobs/${jobId}/offers`)
  revalidatePath(`/jobs/${jobId}/active`)
  revalidatePath('/my-work')
  revalidatePath('/messages')
  return { success: true }
}

export async function rejectOffer(offerId: string, jobId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: job } = await supabase
    .from('jobs')
    .select('poster_id')
    .eq('id', jobId)
    .single()

  if (!job || job.poster_id !== user.id) return { error: 'Unauthorized' }

  await supabase
    .from('offers')
    .update({ status: 'rejected' })
    .eq('id', offerId)

  revalidatePath(`/my-jobs/${jobId}/offers`)
  return { success: true }
}
