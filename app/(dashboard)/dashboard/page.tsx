import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { JobCard } from '@/components/jobs/job-card'
import { formatCurrency, formatRelativeTime } from '@/lib/utils/format'
import { Search, Plus, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { Job, UserRole } from '@/types'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role, city, location')
    .eq('id', user.id)
    .single()

  if (!profile?.full_name || !profile?.role?.length) redirect('/onboarding')

  const roles = profile.role as UserRole[]
  const isPoster = roles.includes('poster')
  const isTasker = roles.includes('tasker')

  // Poster stats
  const [activeJobs, recentOffers] = isPoster
    ? await Promise.all([
        supabase
          .from('jobs')
          .select('id, title, category, budget, status, created_at')
          .eq('poster_id', user.id)
          .in('status', ['open', 'active'])
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('offers')
          .select('id, price, created_at, job:jobs!offers_job_id_fkey(id, title, poster_id)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5),
      ])
    : [{ data: [] }, { data: [] }]

  // Filter offers to those for this user's jobs
  const myOffers = (recentOffers?.data ?? []).filter((o) => {
    const job = o.job as unknown as { poster_id: string } | null
    return job?.poster_id === user.id
  })

  // Tasker data
  let nearbyJobs: Job[] = []
  let activeWork: Array<{ id: string; job: { id: string; title: string; budget: number; category: string } }> = []
  let totalEarnings = 0

  if (isTasker) {
    const { data } = await supabase.rpc('nearby_jobs', {
      lat: 19.076,
      lng: 72.8777,
      radius_km: 20,
      p_category: null,
      p_limit: 5,
      p_offset: 0,
    })
    nearbyJobs = (data ?? []) as Job[]

    const { data: work } = await supabase
      .from('job_assignments')
      .select('id, submitted_at, approved_at, job:jobs!job_assignments_job_id_fkey(id, title, budget, category)')
      .eq('tasker_id', user.id)
      .is('approved_at', null)
      .limit(3)
    activeWork = (work ?? []) as unknown as typeof activeWork

    const { data: completed } = await supabase
      .from('job_assignments')
      .select('job:jobs!job_assignments_job_id_fkey(budget)')
      .eq('tasker_id', user.id)
      .not('approved_at', 'is', null)
    totalEarnings = (completed ?? []).reduce((sum, a) => {
      const budget = (a.job as unknown as { budget: number })?.budget ?? 0
      return sum + budget * 0.9
    }, 0)
  }

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-sand-900">
            Hi, {profile.full_name?.split(' ')[0] ?? 'there'} 👋
          </h1>
          <p className="text-sm text-sand-500 mt-1">
            {isPoster && isTasker
              ? "What would you like to do today?"
              : isPoster
              ? "Manage your posted jobs and offers"
              : "Find work near you and track your earnings"}
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {isPoster && (
            <Link
              href="/post-job"
              className="flex items-center gap-3 p-4 rounded-2xl bg-cyprus-700 text-white hover:bg-cyprus-800 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <div>
                <div className="font-semibold">Post a Job</div>
                <div className="text-xs text-cyprus-100">Hire a tasker now</div>
              </div>
            </Link>
          )}
          {isTasker && (
            <Link
              href="/jobs"
              className="flex items-center gap-3 p-4 rounded-2xl bg-cyprus-600 text-white hover:bg-cyprus-700 transition-colors"
            >
              <Search className="h-5 w-5" />
              <div>
                <div className="font-semibold">Find Work</div>
                <div className="text-xs text-cyprus-100">Browse nearby jobs</div>
              </div>
            </Link>
          )}
        </div>

        {/* Tasker view */}
        {isTasker && (
          <div className="space-y-8">
            {/* Earnings widget */}
            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <div className="text-xs text-sand-500 mb-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Total earnings
                  </div>
                  <div className="text-2xl font-bold text-success-600">
                    {formatCurrency(totalEarnings)}
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/my-work">View work</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Active work */}
            {activeWork.length > 0 && (
              <section>
                <h2 className="font-semibold text-sand-900 mb-3">Active jobs</h2>
                <div className="space-y-2">
                  {activeWork.map((a) => {
                    const j = a.job as unknown as { id: string; title: string; budget: number; category: string }
                    return (
                      <Link key={a.id} href={`/job/${j.id}/active`}>
                        <Card className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sand-900">{j.title}</div>
                              <div className="text-xs text-sand-500 mt-0.5">{j.category}</div>
                            </div>
                            <div className="font-bold text-sand-900">{formatCurrency(j.budget)}</div>
                          </CardContent>
                        </Card>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Nearby jobs */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-sand-900">Jobs near you</h2>
                <Link href="/jobs" className="text-xs text-cyprus-700 hover:underline">View all →</Link>
              </div>
              {nearbyJobs.length === 0 ? (
                <p className="text-sm text-sand-500">No jobs available right now. Check back soon.</p>
              ) : (
                <div className="space-y-3">
                  {nearbyJobs.slice(0, 3).map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Poster view */}
        {isPoster && (
          <div className="space-y-8 mt-6">
            {/* Active jobs */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-sand-900">Your active jobs</h2>
                <Link href="/my-jobs" className="text-xs text-cyprus-700 hover:underline">View all →</Link>
              </div>
              {!activeJobs?.data?.length ? (
                <p className="text-sm text-sand-500">No active jobs. Post your first job to get started!</p>
              ) : (
                <div className="space-y-2">
                  {activeJobs.data.map((j) => (
                    <Link key={j.id} href={`/my-jobs/${j.id}/offers`}>
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sand-900 truncate">{j.title}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={j.status === 'active' ? 'warning' : 'default'} className="text-xs">
                                {j.status}
                              </Badge>
                              <span className="text-xs text-sand-500">{formatRelativeTime(j.created_at)}</span>
                            </div>
                          </div>
                          <div className="font-bold text-sand-900 shrink-0">{formatCurrency(j.budget)}</div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Recent offers */}
            {myOffers.length > 0 && (
              <section>
                <h2 className="font-semibold text-sand-900 mb-3">Recent offers</h2>
                <div className="space-y-2">
                  {myOffers.slice(0, 3).map((o) => {
                    const j = o.job as unknown as { id: string; title: string }
                    return (
                      <Link key={o.id} href={`/my-jobs/${j.id}/offers`}>
                        <Card className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-sand-500">New offer for</div>
                              <div className="font-medium text-sand-900 truncate">{j.title}</div>
                            </div>
                            <div className="font-bold text-sand-900 shrink-0">{formatCurrency(o.price)}</div>
                          </CardContent>
                        </Card>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </>
  )
}
