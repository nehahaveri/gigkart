import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { ActiveJobView } from './active-job-view'
import { BackButton } from '@/components/ui/back-button'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return { title: `Active Job — ${id.slice(0, 8)}` }
}

export default async function ActiveJobPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single()

  if (!job) notFound()

  const { data: assignment } = await supabase
    .from('job_assignments')
    .select('*')
    .eq('job_id', id)
    .single()

  if (!assignment) notFound()

  const isPoster = user.id === job.poster_id
  const isTasker = user.id === assignment.tasker_id
  if (!isPoster && !isTasker) redirect('/dashboard')

  const { data: otherUser } = await supabase
    .from('users')
    .select('id, full_name, avatar_url, rating_avg, city')
    .eq('id', isPoster ? assignment.tasker_id : job.poster_id)
    .single()

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-5">
          <BackButton href={isPoster ? '/my-jobs' : '/my-work'} label={isPoster ? 'My Jobs' : 'My Work'} />
        </div>
        <ActiveJobView
          job={job}
          assignment={assignment}
          isPoster={isPoster}
          otherUser={otherUser}
          currentUserId={user.id}
        />
      </div>
    </>
  )
}
