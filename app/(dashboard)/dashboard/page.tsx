import { redirect } from 'next/navigation'
import { query, queryOne } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { Navbar } from '@/components/layout/navbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { JobCard } from '@/components/jobs/job-card'
import { formatCurrency, formatRelativeTime } from '@/lib/utils/format'
import {
  Search, Plus, TrendingUp, Briefcase, ChevronRight,
  Clock, IndianRupee, FileText, Zap, CheckCircle2, Bell, MapPin,
} from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { Job, UserRole } from '@/types'

export const metadata: Metadata = { title: 'Home' }

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const profile = await queryOne<{ full_name: string; role: string[]; city: string | null }>(
    'SELECT full_name, role, city FROM users WHERE id = $1',
    [session.userId]
  )

  if (!profile?.full_name || !profile?.role?.length) redirect('/onboarding')

  const roles = profile.role as UserRole[]
  const isPoster = roles.includes('poster')
  const isTasker = roles.includes('tasker')

  // ── Poster data ──────────────────────────────────────────────────────────
  const [activeJobs, pendingOfferRows] = isPoster
    ? await Promise.all([
        query<{ id: string; title: string; category: string; budget: number; status: string; created_at: string }>(
          `SELECT id, title, category, budget, status, created_at
           FROM jobs
           WHERE poster_id = $1 AND status IN ('open','active')
           ORDER BY created_at DESC LIMIT 3`,
          [session.userId]
        ),
        query<{ id: string; price: number; created_at: string; job_id: string; job_title: string }>(
          `SELECT o.id, o.price, o.created_at, j.id AS job_id, j.title AS job_title
           FROM offers o
           JOIN jobs j ON j.id = o.job_id
           WHERE o.status = 'pending' AND j.poster_id = $1
           ORDER BY o.created_at DESC LIMIT 5`,
          [session.userId]
        ),
      ])
    : [[], []]

  // ── Tasker data ──────────────────────────────────────────────────────────
  let nearbyJobs: Job[] = []
  let activeWork: Array<{
    id: string; submitted_at: string | null;
    job_id: string; job_title: string; job_budget: number; job_category: string;
  }> = []
  let totalEarnings = 0
  let pendingOfferCount = 0

  if (isTasker) {
    const [nearby, work, completed, offerCnt] = await Promise.all([
      query<Job>(
        `SELECT * FROM nearby_jobs($1, $2, $3, NULL, 5, 0)`,
        [19.076, 72.8777, 20]
      ),
      query(
        `SELECT a.id, a.submitted_at, a.approved_at,
                j.id AS job_id, j.title AS job_title, j.budget AS job_budget, j.category AS job_category
         FROM job_assignments a
         JOIN jobs j ON j.id = a.job_id
         WHERE a.tasker_id = $1 AND a.approved_at IS NULL
         LIMIT 3`,
        [session.userId]
      ),
      query<{ job_budget: string }>(
        `SELECT j.budget AS job_budget
         FROM job_assignments a
         JOIN jobs j ON j.id = a.job_id
         WHERE a.tasker_id = $1 AND a.approved_at IS NOT NULL`,
        [session.userId]
      ),
      queryOne<{ cnt: string }>(
        `SELECT COUNT(*)::text AS cnt FROM offers WHERE tasker_id = $1 AND status = 'pending'`,
        [session.userId]
      ),
    ])

    nearbyJobs = nearby
    activeWork = work as typeof activeWork
    totalEarnings = completed.reduce((s, r) => s + parseFloat(r.job_budget) * 0.9, 0)
    pendingOfferCount = parseInt(offerCnt?.cnt ?? '0', 10)
  }

  const firstName = profile.full_name?.split(' ')[0] ?? 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-8">

        {/* ── Greeting hero ─── */}
        <div className="relative rounded-3xl overflow-hidden bg-cyprus-700 px-6 py-7">
          <div className="pointer-events-none absolute -top-10 -right-10 h-44 w-44 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute bottom-0 right-24 h-24 w-24 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute top-1/2 -translate-y-1/2 right-4 h-16 w-16 rounded-full bg-white/5" />
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold text-cyprus-200 uppercase tracking-widest">{greeting}</p>
              <h1 className="text-2xl font-bold text-white mt-1">{firstName} 👋</h1>
              {profile.city && (
                <p className="text-sm text-cyprus-200 mt-2 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />{profile.city}
                </p>
              )}
            </div>
            <Link
              href="/profile/me"
              className="shrink-0 h-12 w-12 rounded-2xl bg-white/15 border border-white/15 flex items-center justify-center text-white font-bold text-lg hover:bg-white/25 transition-colors"
            >
              {firstName[0]?.toUpperCase()}
            </Link>
          </div>
        </div>

        {/* ── Stat cards ─── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {isTasker && (
            <>
              <div className="bg-white rounded-2xl border border-sand-200 p-4">
                <div className="h-8 w-8 rounded-xl bg-success-50 flex items-center justify-center mb-3">
                  <IndianRupee className="h-4 w-4 text-success-600" />
                </div>
                <div className="text-xl font-bold text-success-600">{formatCurrency(totalEarnings)}</div>
                <div className="text-xs text-sand-500 mt-0.5">Total earnings</div>
              </div>
              <div className="bg-white rounded-2xl border border-sand-200 p-4">
                <div className="h-8 w-8 rounded-xl bg-cyprus-50 flex items-center justify-center mb-3">
                  <Briefcase className="h-4 w-4 text-cyprus-700" />
                </div>
                <div className="text-xl font-bold text-sand-900">{activeWork.length}</div>
                <div className="text-xs text-sand-500 mt-0.5">Active gigs</div>
              </div>
              <div className="bg-white rounded-2xl border border-sand-200 p-4">
                <div className="h-8 w-8 rounded-xl bg-clay-50 flex items-center justify-center mb-3">
                  <Clock className="h-4 w-4 text-clay-500" />
                </div>
                <div className="text-xl font-bold text-sand-900">{pendingOfferCount}</div>
                <div className="text-xs text-sand-500 mt-0.5">Pending offers</div>
              </div>
              <div className="bg-white rounded-2xl border border-sand-200 p-4">
                <div className="h-8 w-8 rounded-xl bg-sand-100 flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-4 w-4 text-sand-600" />
                </div>
                <div className="text-xl font-bold text-sand-900">0</div>
                <div className="text-xs text-sand-500 mt-0.5">Completed</div>
              </div>
            </>
          )}
          {isPoster && !isTasker && (
            <>
              <div className="bg-white rounded-2xl border border-sand-200 p-4">
                <div className="h-8 w-8 rounded-xl bg-cyprus-50 flex items-center justify-center mb-3">
                  <FileText className="h-4 w-4 text-cyprus-700" />
                </div>
                <div className="text-xl font-bold text-sand-900">{activeJobs.length}</div>
                <div className="text-xs text-sand-500 mt-0.5">Active jobs</div>
              </div>
              <div className="bg-white rounded-2xl border border-sand-200 p-4">
                <div className="h-8 w-8 rounded-xl bg-clay-50 flex items-center justify-center mb-3">
                  <Bell className="h-4 w-4 text-clay-500" />
                </div>
                <div className="text-xl font-bold text-sand-900">{pendingOfferRows.length}</div>
                <div className="text-xs text-sand-500 mt-0.5">New offers</div>
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
              className="group flex items-center gap-3 p-4 rounded-2xl bg-clay-500 text-white hover:bg-clay-600 transition-colors"
            >
              <div className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-colors">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-sm">Browse Gigs</div>
                <div className="text-xs text-clay-100 mt-0.5">Find nearby work</div>
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
            {activeWork.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-sand-900">Active gigs</h2>
                  <Link href="/my-work" className="text-xs text-cyprus-700 font-medium flex items-center gap-0.5 hover:underline">
                    View all <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="space-y-2">
                  {activeWork.map((a) => (
                    <Link key={a.id} href={`/job/${a.job_id}/active`} className="block">
                      <div className="bg-white rounded-2xl border border-sand-200 p-4 flex items-center gap-3 hover:border-sand-300 hover:shadow-sm transition-all">
                        <div className="h-9 w-9 rounded-xl bg-cyprus-50 flex items-center justify-center shrink-0">
                          <Briefcase className="h-4 w-4 text-cyprus-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sand-900 truncate text-sm">{a.job_title}</div>
                          <div className="text-xs text-sand-500 mt-0.5">{a.job_category}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-sand-900 text-sm">{formatCurrency(a.job_budget * 0.9)}</div>
                          <div className="text-[10px] text-sand-400">your cut</div>
                        </div>
                        {a.submitted_at && (
                          <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-clay-50 text-clay-500">Awaiting approval</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

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
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-sand-900">Your active postings</h2>
                <Link href="/my-jobs" className="text-xs text-cyprus-700 font-medium flex items-center gap-0.5 hover:underline">
                  View all <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              {activeJobs.length === 0 ? (
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
                  {activeJobs.map((j) => (
                    <Link key={j.id} href={`/my-jobs/${j.id}/offers`} className="block">
                      <div className="bg-white rounded-2xl border border-sand-200 p-4 flex items-center gap-3 hover:border-sand-300 hover:shadow-sm transition-all">
                        <div className="h-9 w-9 rounded-xl bg-sand-100 flex items-center justify-center shrink-0">
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

            {pendingOfferRows.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-sand-900 flex items-center gap-2">
                    New offers
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-cyprus-700 text-white text-[10px] font-bold">
                      {pendingOfferRows.length}
                    </span>
                  </h2>
                </div>
                <div className="space-y-2">
                  {pendingOfferRows.slice(0, 3).map((o) => (
                    <Link key={o.id} href={`/my-jobs/${o.job_id}/offers`} className="block">
                      <div className="bg-white rounded-2xl border border-sand-200 p-4 flex items-center gap-3 hover:border-sand-300 hover:shadow-sm transition-all">
                        <div className="h-9 w-9 rounded-xl bg-clay-50 flex items-center justify-center shrink-0">
                          <Zap className="h-4 w-4 text-clay-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-sand-400 mb-0.5">Offer for</div>
                          <div className="font-medium text-sand-900 truncate text-sm">{o.job_title}</div>
                        </div>
                        <div className="font-bold text-sand-900 shrink-0 text-sm">{formatCurrency(o.price)}</div>
                        <ChevronRight className="h-4 w-4 text-sand-300 shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </>
  )
}
