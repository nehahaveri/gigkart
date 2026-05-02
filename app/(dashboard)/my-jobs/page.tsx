import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { MyJobsList } from './list'

export const metadata: Metadata = {
  title: 'My Postings',
  description: 'Manage your posted jobs on GigKart.',
}

export default async function MyJobsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: jobs } = await supabase
    .from('jobs')
    .select(`
      *,
      offers:offers(count)
    `)
    .eq('poster_id', user.id)
    .order('created_at', { ascending: false })

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
