import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { query, queryOne } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { Navbar } from '@/components/layout/navbar'
import { MyWorkList } from './list'

export const metadata: Metadata = {
  title: 'My Gigs',
  description: 'Track your active tasks, offers, and earnings on GigKart.',
}

export default async function MyWorkPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  type OfferWithJob = {
    id: string; status: string; price: string; created_at: string
    job_id_ref: string; job_title: string; job_category: string
    job_budget: string; job_budget_type: string; job_status: string
    job_address: string | null; job_is_remote: boolean; job_poster_id: string
  }
  type AssignmentWithJob = {
    id: string; started_at: string | null; submitted_at: string | null
    approved_at: string | null; offer_id: string
    job_id_ref: string; job_title: string; job_category: string
    job_budget: string; job_status: string; job_address: string | null
  }

  const [offers, assignments, completedRows] = await Promise.all([
    query<OfferWithJob>(
      `SELECT o.*,
              j.id AS job_id_ref, j.title AS job_title, j.category AS job_category,
              j.budget AS job_budget, j.budget_type AS job_budget_type,
              j.status AS job_status, j.address AS job_address,
              j.is_remote AS job_is_remote, j.poster_id AS job_poster_id
       FROM offers o
       JOIN jobs j ON j.id = o.job_id
       WHERE o.tasker_id = $1
       ORDER BY o.created_at DESC`,
      [session.userId]
    ),
    query<AssignmentWithJob>(
      `SELECT a.*,
              j.id AS job_id_ref, j.title AS job_title, j.category AS job_category,
              j.budget AS job_budget, j.status AS job_status, j.address AS job_address
       FROM job_assignments a
       JOIN jobs j ON j.id = a.job_id
       WHERE a.tasker_id = $1
       ORDER BY a.started_at DESC NULLS LAST`,
      [session.userId]
    ),
    query<{ job_budget: string }>(
      `SELECT j.budget AS job_budget
       FROM job_assignments a
       JOIN jobs j ON j.id = a.job_id
       WHERE a.tasker_id = $1 AND a.approved_at IS NOT NULL`,
      [session.userId]
    ),
  ])

  const totalEarnings = completedRows.reduce(
    (sum, r) => sum + parseFloat(r.job_budget) * 0.9,
    0
  )

  // Reshape for MyWorkList which expects nested `job` objects
  const shapedOffers = offers.map((o) => ({
    ...o,
    price: Number(o.price),
    job: {
      id: o.job_id_ref,
      title: o.job_title,
      category: o.job_category,
      budget: Number(o.job_budget),
      budget_type: o.job_budget_type,
      status: o.job_status,
      address: o.job_address,
      is_remote: o.job_is_remote,
      poster_id: o.job_poster_id,
    },
  }))

  const shapedAssignments = assignments.map((a) => ({
    ...a,
    job: {
      id: a.job_id_ref,
      title: a.job_title,
      category: a.job_category,
      budget: Number(a.job_budget),
      status: a.job_status,
      address: a.job_address,
      is_remote: false,
    },
  }))

  return (
    <>
      <Navbar />
      {/* Page header */}
      <div className="bg-cyprus-700 border-b border-cyprus-800">
        <div className="mx-auto max-w-3xl px-4 py-7 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-cyprus-200 mb-1">Tasker</p>
            <h1 className="text-2xl font-bold text-sand tracking-tight">My Gigs</h1>
            <p className="text-sm text-cyprus-200 mt-1">Your offers, active jobs, and earnings</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-sand">
              ₹{Math.round(totalEarnings).toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-cyprus-200">Total earned</div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6">
        <MyWorkList offers={shapedOffers} assignments={shapedAssignments} />
      </div>
    </>
  )
}
