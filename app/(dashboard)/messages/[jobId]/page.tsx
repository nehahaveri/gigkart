import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { MessagesLayout } from './messages-layout'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { User } from '@/types'

// Fields that actually exist in the users table schema
const USER_FIELDS = 'id, full_name, avatar_url, phone, email, aadhaar_verified, rating_avg, rating_count, completion_rate, city, created_at, upi_id'

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

  // Step 1: Fetch job (plain fields only, no user join) for access check
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('id, title, status, poster_id')
    .eq('id', jobId)
    .single()

  if (jobError || !job) notFound()

  const isPoster = job.poster_id === user.id

  // Step 2: Fetch assignment (plain fields only) for access check
  const { data: assignment } = await supabase
    .from('job_assignments')
    .select('id, tasker_id')
    .eq('job_id', jobId)
    .maybeSingle()

  const isTasker = assignment?.tasker_id === user.id

  // Access control: must be poster OR assigned tasker
  if (!isPoster && !isTasker) redirect('/messages')

  // Poster with no accepted offer yet — show a waiting state
  if (isPoster && !assignment) {
    return (
      <>
        <Navbar />
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <div className="h-14 w-14 rounded-full bg-sand-100 flex items-center justify-center mx-auto mb-4">
            <svg className="h-7 w-7 text-sand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-sand-900 mb-2">No conversation yet</h1>
          <p className="text-sm text-sand-500 mb-6">
            Messaging unlocks once you accept an offer for <span className="font-medium text-sand-700">{job.title}</span>.
          </p>
          <Link
            href={`/my-jobs/${jobId}/offers`}
            className="inline-flex items-center gap-2 rounded-xl bg-cyprus-700 text-white text-sm font-semibold px-5 py-2.5 hover:bg-cyprus-800 transition-colors"
          >
            View Offers →
          </Link>
        </div>
      </>
    )
  }

  if (!assignment) redirect('/messages')

  // Step 3: Fetch the OTHER party's profile (separate query, clean)
  const otherUserId = isPoster ? assignment.tasker_id : job.poster_id
  const { data: otherUserData } = await supabase
    .from('users')
    .select(USER_FIELDS)
    .eq('id', otherUserId)
    .single()

  const otherUser = (otherUserData ?? { id: otherUserId }) as Partial<User>
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
