import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { JobCard } from '@/components/jobs/job-card'
import { formatCurrency, formatRelativeTime } from '@/lib/utils/format'
import {
  Search, Plus, TrendingUp, Briefcase, ChevronRight,
  Clock, IndianRupee, FileText, Zap, CheckCircle2, Bell,
} from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { Job, UserRole } from '@/types'

export const metadata: Metadata = { title: 'Home' }

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

  const myOffers = (recentOffers?.data ?? []).filter((o) => {
    const job = o.job as unknown as { poster_id: string } | null
    return job?.poster_id === user.id
  })

  let nearbyJobs: Job[] = []
  let activeWork: Array<{ id: string; submitted_at: string | null; job: { id: string; title: string; budget: number; category: string } }> = []
  let totalEarnings = 0
  let pendingOfferCount = 0

  if (isTasker) {
    const { data } = await supabase.rpc('nearby_jobs', {
      lat: 19.076, lng: 72.8777, radius_km: 20,
      p_category: null, p_limit: 5, p_offset: 0,
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

    const { count } = await supabase
      .from('offers')
      .select('id', { count: 'exact', head: true })
      .eq('tasker_id', user.id)
      .eq('status', 'pending')
    pendingOfferCount = count ?? 0
  }

  const firstName = profile.full_name?.split(' ')[0] ?? 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-8">

        {/* ── Greeting header ─── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-sand-500 font-medium">{greeting}</p>
            <h1 className="text-2xl font-bold text-sand-900 mt-0.5">{firstName} 👋</h1>
            {profile.city && (
              <p className="text-sm text-sand-500 mt-1 flex items-center gap-1">
                <Search className="h-3 w-3" />{profile.city}
              </p>
            )}
          </div>
          <Link
            href="/profile/me"
            className="shrink-0 h-11 w-11 rounded-full bg-cyprus-700 flex items-center justify-center text-white font-bold text-base hover:bg-cyprus-800 transition-colors"
          >
            {firstName[0]?.toUpperCase()}
          </Link>
        </div>

        {/* ── Stat pills ─── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {isTasker && (
            <>
              <div className="bg-white rounded-2xl border border-sand-200 p-4">
                <div className="flex items-center gap-2 text-xs text-sand-500 mb-1">
                  <IndianRupee className="h-3.5 w-3.5" />Earnings
                </div>
                <div className="text-xl font-bold text-success-600">{formatCurrency(totalEarnings)}</div>
              </div>
              <div className="bg-white rounded-2xl border border-sand-200 p-4">
                <div className="flex items-center gap-2 text-xs text-sand-500 mb-1">
                  <Briefcase className="h-3.5 w-3.5" />Active gigs
                </div>
                <div className="text-xl font-bold text-sand-900">{activeWork.length}</div>
              </div>
              <div className="bg-white rounded-2xl border border-sand-200 p-4">
                <div className="flex items-center gap-2 text-xs text-sand-500 mb-1">
                  <Clock className="h-3.5 w-3.5" />Pending offers
                </div>
                <div className="text-xl font-bold text-sand-900">{pendingOfferCount}</div>
              </div>
              <div className="bg-white rounded-2xl border border-sand-200 p-4">
                <div className="flex items-center gap-2 text-xs text-sand-500 mb-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />Completed
                </div>
                <div className="text-xl font-bold text-sand-900">
                  {(activeWork as unknown as { approved_at?: string }[]).filter((a) => 'approved_at' in a).length}
                </div>
              </div>
            </>
          )}
          {isPoster && !isTasker && (
            <>
              <div className="bg-white rounded-2xl border border-sand-200 p-4">
                <div className="flex items-center gap-2 text-xs text-sand-500 mb-1">
                  <FileText className="h-3.5 w-3.5" />Active jobs
                </div>
                <div className="text-xl font-bold text-sand-900">{activeJobs?.data?.length ?? 0}</div>
              </div>
              <div className="bg-white rounded-2xl border border-sand-200 p-4">
                <div className="flex items-center gap-2 text-xs text-sand-500 mb-1">
                  <Bell className="h-3.5 w-3.5" />New offers
                </div>
                <div className="text-xl font-bold text-sand-900">{myOffers.length}</div>
              </div>
            </>
          )}
        </div>

        {/* ── Quick actions ─── */}
        <div className="grid grid-cols-2 gap-3">
          {isPoster && (
            <Link
              href="/post-job"
              className="group flex items-center gap-3 p-4 rounded-2xl bg-cyprus-700 text-white hover:bg-cyprus-800 transition-colors"
            >
              <div className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-colors">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-sm">Post a Job</div>
                <div className="text-xs text-cyprus-100 mt-0.5">Hire a tasker now</div>
              </div>
            </Link>
          )}
          {isTasker && (
            <Link
              href="/jobs"
              className="group flex items-center gap-3 p-4 rounded-2xl bg-sand-900 text-white hover:bg-sand-800 transition-colors"
            >
              <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-sm">Browse Gigs</div>
                <div className="text-xs text-sand-300 mt-0.5">Find nearby work</div>
              </div>
            </Link>
          )}
          {isPoster && (
            <Link
              href="/my-jobs"
              className="group flex items-center gap-3 p-4 rounded-2xl border border-sand-200 bg-white hover:border-sand-300 hover:shadow-sm transition-all"
            >
              <div className="h-9 w-9 rounded-xl bg-sand-100 flex items-center justify-center shrink-0">
                <Briefcase className="h-5 w-5 text-sand-600" />
              </div>
              <div>
                <div className="font-semibold text-sm text-sand-900">My Postings</div>
                <div className="text-xs text-sand-500 mt-0.5">View all your jobs</div>
              </div>
            </Link>
          )}
          {isTasker && !isPoster && (
            <Link
              href="/my-work"
              className="group flex items-center gap-3 p-4 rounded-2xl border border-sand-200 bg-white hover:border-sand-300 hover:shadow-sm transition-all"
            >
              <div className="h-9 w-9 rounded-xl bg-sand-100 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5 text-sand-600" />
              </div>
              <div>
                <div className="font-semibold text-sm text-sand-900">My Gigs</div>
                <div className="text-xs text-sand-500 mt-0.5">Track your work</div>
              </div>
            </Link>
          )}
        </div>

        {/* ── Tasker sections ─── */}
        {isTasker && (
          <div className="space-y-8">
            {/* Active work */}
            {activeWork.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-sand-900">Active gigs</h2>
                  <Link href="/my-work" className="text-xs text-cyprus-700 font-medium flex items-center gap-0.5 hover:underline">
                    View all <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="space-y-2">
                  {activeWork.map((a) => {
                    const j = a.job as unknown as { id: string; title: string; budget: number; category: string }
                    return (
                      <Link key={a.id} href={`/job/${j.id}/active`} className="block">
                        <div className="bg-white rounded-2xl border border-sand-200 p-4 flex items-center gap-3 hover:border-sand-300 hover:shadow-sm transition-all">
                          <div className="h-9 w-9 rounded-xl bg-cyprus-50 flex items-center justify-center shrink-0">
                            <Briefcase className="h-4 w-4 text-cyprus-700" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sand-900 truncate text-sm">{j.title}</div>
                            <div className="text-xs text-sand-500 mt-0.5">{j.category}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-bold text-sand-900 text-sm">{formatCurrency(j.budget * 0.9)}</div>
                            <div className="text-[10px] text-sand-400">your cut</div>
                          </div>
                          {a.submitted_at && (
                            <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">Awaiting approval</span>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Nearby jobs */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-sand-900">Gigs near you</h2>
                <Link href="/jobs" className="text-xs text-cyprus-700 font-medium flex items-center gap-0.5 hover:underline">
                  Browse all <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              {nearbyJobs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-sand-200 p-8 text-center">
                  <Search className="h-8 w-8 text-sand-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-sand-600">No gigs near you right now</p>
                  <p className="text-xs text-sand-400 mt-1">Check back soon — new jobs are posted daily.</p>
                </div>
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

        {/* ── Poster sections ─── */}
        {isPoster && (
          <div className="space-y-8">
            {/* Active jobs */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-sand-900">Your active postings</h2>
                <Link href="/my-jobs" className="text-xs text-cyprus-700 font-medium flex items-center gap-0.5 hover:underline">
                  View all <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              {!activeJobs?.data?.length ? (
                <div className="rounded-2xl border border-dashed border-sand-200 p-8 text-center">
                  <Plus className="h-8 w-8 text-sand-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-sand-600">No active jobs yet</p>
                  <p className="text-xs text-sand-400 mt-1 mb-4">Post your first job to start receiving offers.</p>
                  <Link href="/post-job">
                    <Button size="sm">Post a Job</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeJobs.data.map((j) => (
                    <Link key={j.id} href={`/my-jobs/${j.id}/offers`} className="block">
                      <div className="bg-white rounded-2xl border border-sand-200 p-4 flex items-center gap-3 hover:border-sand-300 hover:shadow-sm transition-all">
                        <div className="h-9 w-9 rounded-xl bg-cypress-50 bg-sand-100 flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4 text-sand-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sand-900 truncate text-sm">{j.title}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant={j.status === 'active' ? 'warning' : 'default'} className="text-[10px]">
                              {j.status === 'open' ? 'Accepting offers' : j.status}
                            </Badge>
                            <span className="text-xs text-sand-400">{formatRelativeTime(j.created_at)}</span>
                          </div>
                        </div>
                        <div className="font-bold text-sand-900 shrink-0 text-sm">{formatCurrency(j.budget)}</div>
                        <ChevronRight className="h-4 w-4 text-sand-300 shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Recent offers */}
            {myOffers.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-sand-900 flex items-center gap-2">
                    New offers
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-cyprus-700 text-white text-[10px] font-bold">
                      {myOffers.length}
                    </span>
                  </h2>
                </div>
                <div className="space-y-2">
                  {myOffers.slice(0, 3).map((o) => {
                    const j = o.job as unknown as { id: string; title: string }
                    return (
                      <Link key={o.id} href={`/my-jobs/${j.id}/offers`} className="block">
                        <div className="bg-white rounded-2xl border border-sand-200 p-4 flex items-center gap-3 hover:border-sand-300 hover:shadow-sm transition-all">
                          <div className="h-9 w-9 rounded-xl bg-clay-50 flex items-center justify-center shrink-0">
                            <Zap className="h-4 w-4 text-clay-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-sand-400 mb-0.5">Offer for</div>
                            <div className="font-medium text-sand-900 truncate text-sm">{j.title}</div>
                          </div>
                          <div className="font-bold text-sand-900 shrink-0 text-sm">{formatCurrency(o.price)}</div>
                          <ChevronRight className="h-4 w-4 text-sand-300 shrink-0" />
                        </div>
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


