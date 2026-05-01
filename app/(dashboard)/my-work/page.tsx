import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { MyWorkList } from './my-work-list'

export const metadata: Metadata = {
  title: 'My Gigs',
  description: 'Track your active tasks, offers, and earnings on GigKart.',
}

export default async function MyWorkPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Offers sent by this tasker
  const { data: offers } = await supabase
    .from('offers')
    .select('*, job:jobs!offers_job_id_fkey(id, title, category, budget, budget_type, status, address, is_remote, poster_id)')
    .eq('tasker_id', user.id)
    .order('created_at', { ascending: false })

  // Active assignments
  const { data: assignments } = await supabase
    .from('job_assignments')
    .select('*, job:jobs!job_assignments_job_id_fkey(id, title, category, budget, status, address)')
    .eq('tasker_id', user.id)
    .order('started_at', { ascending: false, nullsFirst: false })

  // Earnings
  const { data: completedAssignments } = await supabase
    .from('job_assignments')
    .select('job:jobs!job_assignments_job_id_fkey(budget)')
    .eq('tasker_id', user.id)
    .not('approved_at', 'is', null)

  const totalEarnings = (completedAssignments ?? []).reduce((sum, a) => {
    const budget = (a.job as unknown as { budget: number })?.budget ?? 0
    return sum + budget * 0.9
  }, 0)

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-sand-900">My Gigs</h1>
            <p className="text-sm text-sand-500 mt-1">Your offers, active jobs, and earnings</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-success-600">
              ₹{Math.round(totalEarnings).toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-sand-500">Total earned</div>
          </div>
        </div>
        <MyWorkList offers={offers ?? []} assignments={assignments ?? []} />
      </div>
    </>
  )
}
