import { redirect } from 'next/navigation'
import { queryOne, count, query } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { Navbar } from '@/components/layout/navbar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, AlertTriangle, Users, Briefcase, BarChart2 } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin — GigKart' }

export default async function AdminPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const profile = await queryOne<{ role: string[] }>(
    'SELECT role FROM users WHERE id = $1',
    [session.userId]
  )

  if (!profile?.role?.includes('admin')) redirect('/dashboard')

  const [totalUsers, totalJobs, openDisputes, pendingKyc, disputes] = await Promise.all([
    count('SELECT COUNT(*) FROM users'),
    count('SELECT COUNT(*) FROM jobs'),
    count("SELECT COUNT(*) FROM disputes WHERE status = 'open'"),
    count("SELECT COUNT(*) FROM kyc_requests WHERE status = 'pending'"),
    query<{ id: string; reason: string; created_at: string; job_id: string; job_title: string }>(
      `SELECT d.id, d.reason, d.created_at, j.id AS job_id, j.title AS job_title
       FROM disputes d
       JOIN jobs j ON j.id = d.job_id
       WHERE d.status = 'open'
       ORDER BY d.created_at DESC
       LIMIT 10`
    ),
  ])

  const stats = [
    { label: 'Total users',   value: totalUsers,   icon: Users,         color: 'text-cyprus-700' },
    { label: 'Total jobs',    value: totalJobs,    icon: Briefcase,     color: 'text-cyprus-700' },
    { label: 'Open disputes', value: openDisputes, icon: AlertTriangle, color: 'text-clay-500' },
    { label: 'Pending KYC',  value: pendingKyc,   icon: Shield,        color: 'text-sand-500' },
  ]

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-sand">
        {/* Header band */}
        <div className="bg-cyprus-700 px-4 py-10">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center gap-3 mb-1">
              <BarChart2 className="h-5 w-5 text-cyprus-200" />
              <span className="text-xs font-semibold tracking-[0.15em] text-cyprus-200 uppercase">
                Admin
              </span>
            </div>
            <h1 className="text-3xl font-bold text-sand tracking-tight">Control Centre</h1>
            <p className="text-cyprus-200 text-sm mt-1">Manage disputes, users, and platform health.</p>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-10 space-y-10">
          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map(({ label, value, icon: Icon, color }) => (
              <Card key={label}>
                <CardContent className="p-5 text-center">
                  <Icon className={`h-5 w-5 mx-auto mb-2 ${color}`} />
                  <div className="text-2xl font-bold text-sand-900">{value}</div>
                  <div className="text-xs text-sand-500 mt-0.5">{label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Open disputes */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-sand-900 tracking-tight">Open Disputes</h2>
              {openDisputes > 0 && (
                <Badge variant="urgent">{openDisputes} open</Badge>
              )}
            </div>

            {(disputes.length === 0) ? (
              <div className="rounded-2xl bg-white border border-sand-200 p-10 text-center">
                <Shield className="h-10 w-10 text-success-500 mx-auto mb-3" />
                <p className="text-sm text-sand-600 font-medium">No open disputes — all clear!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {disputes.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center gap-4 rounded-2xl bg-white border border-sand-200 px-5 py-4"
                    >
                      <AlertTriangle className="h-5 w-5 text-clay-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sand-900 truncate">
                          {d.job_title ?? 'Unknown job'}
                        </div>
                        <div className="text-xs text-sand-500 mt-0.5">{d.reason}</div>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/jobs/${d.job_id}/dispute`}>
                          Review
                        </Link>
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </section>

          {/* Quick links */}
          <section>
            <h2 className="text-lg font-bold text-sand-900 mb-4 tracking-tight">Quick Links</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: 'All Jobs',        href: '/jobs' },
                { label: 'KYC Review',      href: '/admin/kyc' },
                { label: 'Settings',        href: '/settings' },
              ].map(({ label, href }) => (
                <Button key={href} variant="outline" asChild className="h-12 font-semibold">
                  <Link href={href}>{label}</Link>
                </Button>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  )
}

