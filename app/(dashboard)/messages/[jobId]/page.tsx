import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { MessagesLayout } from './messages-layout'
import type { Metadata } from 'next'
import type { User } from '@/types'

interface Props {
  params: Promise<{ jobId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { jobId } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('jobs').select('title').eq('id', jobId).single()
  return { title: data?.title ? `Chat · ${data.title}` : 'Messages' }
}

export default async function MessagePage({ params }: Props) {
  const { jobId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch job + poster
  const { data: job } = await supabase
    .from('jobs')
    .select('id, title, status, poster_id, poster:users!jobs_poster_id_fkey(id, full_name, avatar_url, phone, email, aadhaar_verified, rating_avg, rating_count, completion_rate, city, created_at, upi_id, bank_account, role)')
    .eq('id', jobId)
    .single()

  if (!job) notFound()

  // Fetch assignment (tasker)
  const { data: assignment } = await supabase
    .from('job_assignments')
    .select('tasker_id, tasker:users!job_assignments_tasker_id_fkey(id, full_name, avatar_url, phone, email, aadhaar_verified, rating_avg, rating_count, completion_rate, city, created_at, upi_id, bank_account, role)')
    .eq('job_id', jobId)
    .maybeSingle()

  // Determine who the current user is in this conversation
  const isPoster = job.poster_id === user.id
  const isTasker = assignment?.tasker_id === user.id

  // Access control: must be poster OR assigned tasker
  if (!isPoster && !isTasker) redirect('/messages')

  // If tasker side but no assignment yet, not ready
  if (!assignment && isTasker) redirect('/messages')

  const poster = job.poster as unknown as Partial<User>
  const tasker = assignment?.tasker as unknown as Partial<User> | undefined

  // The "other" user depends on who we are
  const otherUser = isPoster ? tasker : poster
  if (!otherUser) notFound()

  const otherRole: 'poster' | 'tasker' = isPoster ? 'tasker' : 'poster'
  const backHref = isPoster ? `/my-jobs/${jobId}/offers` : `/job/${jobId}/active`

  return (
    <>
      <Navbar />
      <MessagesLayout
        jobId={jobId}
        jobTitle={job.title}
        currentUserId={user.id}
        otherUser={otherUser}
        otherRole={otherRole}
        backHref={backHref}
      />
    </>
  )
}
