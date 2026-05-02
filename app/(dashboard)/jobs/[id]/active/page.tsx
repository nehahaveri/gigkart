import { redirect, notFound } from 'next/navigation'
import { queryOne } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { Navbar } from '@/components/layout/navbar'
import { ActiveJobView } from './view'
import { BackButton } from '@/components/ui/back-button'
import type { Metadata } from 'next'
import type { Job, JobAssignment, User } from '@/types'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return { title: `Active Job — ${id.slice(0, 8)}` }
}

export default async function ActiveJobPage({ params }: Props) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  const [job, assignment] = await Promise.all([
    queryOne<Job>('SELECT * FROM jobs WHERE id = $1', [id]),
    queryOne<JobAssignment>('SELECT * FROM job_assignments WHERE job_id = $1', [id]),
  ])

  if (!job) notFound()
  if (!assignment) notFound()

  const isPoster = session.userId === job.poster_id
  const isTasker = session.userId === assignment.tasker_id
  if (!isPoster && !isTasker) redirect('/dashboard')

  const otherUserId = isPoster ? assignment.tasker_id : job.poster_id
  const otherUser = await queryOne<Partial<User>>(
    'SELECT id, full_name, avatar_url, city FROM users WHERE id = $1',
    [otherUserId as string]
  )

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-5">
          <BackButton href={isPoster ? '/my-jobs' : '/my-work'} label={isPoster ? 'My Postings' : 'My Gigs'} />
        </div>
        <ActiveJobView
          job={job as unknown as Job}
          assignment={assignment as unknown as JobAssignment}
          isPoster={isPoster}
          otherUser={otherUser}
          currentUserId={session.userId}
        />
      </div>
    </>
  )
}
