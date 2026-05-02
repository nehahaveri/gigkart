import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { DisputeForm } from './form'
import { BackButton } from '@/components/ui/back-button'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

export const metadata: Metadata = { title: 'Raise a Dispute' }

export default async function DisputePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: job } = await supabase
    .from('jobs')
    .select('id, title, poster_id')
    .eq('id', id)
    .single()

  if (!job) notFound()

  // Check if user is a party to this job
  const { data: assignment } = await supabase
    .from('job_assignments')
    .select('tasker_id')
    .eq('job_id', id)
    .single()

  const isParty = job.poster_id === user.id || assignment?.tasker_id === user.id
  if (!isParty) redirect('/dashboard')

  // Check for existing dispute
  const { data: existing } = await supabase
    .from('disputes')
    .select('id, status')
    .eq('job_id', id)
    .single()

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-xl px-4 py-8">
        <div className="mb-5">
          <BackButton href={`/jobs/${id}/active`} label="Back to job" />
        </div>
        <h1 className="text-2xl font-bold text-sand-900 mb-1">Raise a dispute</h1>
        <p className="text-sm text-sand-500 mb-6">{job.title}</p>

        {existing ? (
          <div className="rounded-xl bg-clay-50 border border-clay-100 p-4 text-sm text-clay-700">
            A dispute has already been raised for this job (status: {existing.status}).
            Our team is reviewing it.
          </div>
        ) : (
          <DisputeForm jobId={id} userId={user.id} />
        )}
      </div>
    </>
  )
}
