import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { query } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { Navbar } from '@/components/layout/navbar'
import { MyJobsList } from './list'

export const metadata: Metadata = {
  title: 'My Postings',
  description: 'Manage your posted jobs on GigKart.',
}

export default async function MyJobsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const rawJobs = await query<{
    id: string; title: string; category: string; budget: string; budget_type: string
    status: string; is_urgent: boolean; created_at: string; offer_count: string
  }>(
    `SELECT j.id, j.title, j.category, j.budget, j.budget_type, j.status,
            j.is_urgent, j.created_at, COUNT(o.id)::text AS offer_count
     FROM jobs j
     LEFT JOIN offers o ON o.job_id = j.id
     WHERE j.poster_id = $1
     GROUP BY j.id
     ORDER BY j.created_at DESC`,
    [session.userId]
  )

  // Shape data to match MyJobsList's expected { offers: [{ count }] } format
  const jobs = rawJobs.map((j) => ({
    ...j,
    budget: Number(j.budget),
    status: j.status as import('@/types').JobStatus,
    offers: [{ count: Number(j.offer_count) }],
  }))

  return (
    <>
      <Navbar />
      {/* Page header */}
      <div className="bg-cyprus-700 border-b border-cyprus-800">
        <div className="mx-auto max-w-3xl px-4 py-7 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-cyprus-200 mb-1">Job Poster</p>
            <h1 className="text-2xl font-bold text-sand tracking-tight">My Postings</h1>
            <p className="text-sm text-cyprus-200 mt-1">Manage jobs you&apos;ve posted</p>
          </div>
          <a
            href="/post-job"
            className="inline-flex items-center gap-1.5 rounded-xl bg-sand text-cyprus-700 px-4 py-2.5 text-sm font-bold hover:bg-white transition-colors shadow-sm"
          >
            + Post a Job
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6">
        <MyJobsList jobs={jobs ?? []} />
      </div>
    </>
  )
}
