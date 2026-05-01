import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { ReviewApproval } from './review-approval'
import { BackButton } from '@/components/ui/back-button'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

export const metadata: Metadata = { title: 'Review & Approve Work' }

export default async function ReviewPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: job } = await supabase
    .from('jobs')
    .select('id, title, budget, poster_id, status, escrow_payment_id')
    .eq('id', id)
    .single()

  if (!job) notFound()
  if (job.poster_id !== user.id) redirect('/dashboard')

  const { data: assignment } = await supabase
    .from('job_assignments')
    .select('*, tasker:users!job_assignments_tasker_id_fkey(id, full_name, avatar_url)')
    .eq('job_id', id)
    .single()

  if (!assignment) notFound()

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-5">
          <BackButton href={`/job/${id}/active`} label="Back to job" />
        </div>
        <ReviewApproval job={job} assignment={assignment} />
      </div>
    </>
  )
}
