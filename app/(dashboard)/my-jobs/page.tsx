import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { MyJobsList } from './my-jobs-list'

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
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-sand-900">My Postings</h1>
            <p className="text-sm text-sand-500 mt-1">Jobs you&apos;ve posted</p>
          </div>
          <a
            href="/post-job"
            className="inline-flex items-center gap-1.5 rounded-xl bg-cyprus-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyprus-800 transition-colors"
          >
            + Post a Job
          </a>
        </div>
        <MyJobsList jobs={jobs ?? []} />
      </div>
    </>
  )
}
