'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/format'
import { ChevronRight, MapPin, Briefcase, Search, CheckCircle2, XCircle, Clock } from 'lucide-react'

type Tab = 'applied' | 'active' | 'completed' | 'cancelled'

const TABS: { key: Tab; label: string }[] = [
  { key: 'applied', label: 'Applied' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

type OfferRow = {
  id: string
  status: string
  price: number
  created_at: string
  job: {
    id: string
    title: string
    category: string
    budget: number
    status: string
    address: string | null
    is_remote: boolean
  }
}

type AssignmentRow = {
  id: string
  started_at: string | null
  submitted_at: string | null
  approved_at: string | null
  job: {
    id: string
    title: string
    category: string
    budget: number
    status: string
    address: string | null
    is_remote: boolean
  }
}

export function MyWorkList({
  offers,
  assignments,
}: {
  offers: OfferRow[]
  assignments: AssignmentRow[]
}) {
  const [tab, setTab] = useState<Tab>('applied')

  const applied = offers.filter((o) => o.status === 'pending')
  const active = assignments.filter((a) => !a.approved_at)
  const completed = assignments.filter((a) => a.approved_at)
  const cancelled = offers.filter((o) => o.status === 'rejected' || o.status === 'withdrawn')

  const items =
    tab === 'applied' ? applied :
    tab === 'active' ? active :
    tab === 'completed' ? completed :
    cancelled

  const counts = {
    applied: applied.length,
    active: active.length,
    completed: completed.length,
    cancelled: cancelled.length,
  }

  const EMPTY: Record<Tab, { icon: React.ReactNode; message: string; sub: string }> = {
    applied: { icon: <Search className="h-10 w-10 text-sand-300" />, message: 'No pending applications', sub: 'Browse gigs and send your first offer.' },
    active: { icon: <Briefcase className="h-10 w-10 text-sand-300" />, message: 'No active gigs', sub: 'Your accepted jobs will appear here.' },
    completed: { icon: <CheckCircle2 className="h-10 w-10 text-sand-300" />, message: 'No completed gigs yet', sub: 'Finish a gig to see it here.' },
    cancelled: { icon: <XCircle className="h-10 w-10 text-sand-300" />, message: 'No cancelled offers', sub: "You're all good!" },
  }

  return (
    <div>
      {/* Underline tabs */}
      <div className="flex overflow-x-auto border-b border-sand-200 mb-5" style={{ scrollbarWidth: 'none' }}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === key
                ? 'border-cyprus-700 text-cyprus-700'
                : 'border-transparent text-sand-500 hover:text-sand-700'
            )}
          >
            {label}
            {counts[key] > 0 && (
              <span className={cn(
                'inline-flex items-center justify-center min-w-[1.1rem] px-1 rounded-full text-[10px] font-bold',
                tab === key ? 'bg-cyprus-100 text-cyprus-700' : 'bg-sand-100 text-sand-500'
              )}>{counts[key]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sand-200 p-10 text-center">
          <div className="flex justify-center mb-3">{EMPTY[tab].icon}</div>
          <p className="text-sm font-medium text-sand-700">{EMPTY[tab].message}</p>
          <p className="text-xs text-sand-400 mt-1">{EMPTY[tab].sub}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const job = 'job' in item ? (item as OfferRow | AssignmentRow).job : null
            if (!job) return null
            const isAssignment = 'started_at' in item
            const href = isAssignment ? `/job/${job.id}/active` : `/jobs/${job.id}`
            const priceAmount = !isAssignment ? (item as OfferRow).price : job.budget * 0.9

            return (
              <Link key={item.id} href={href} className="block">
                <div className="bg-white rounded-2xl border border-sand-200 p-4 flex items-center gap-3 hover:border-sand-300 hover:shadow-sm transition-all cursor-pointer">
                  <div className="h-10 w-10 rounded-xl bg-cyprus-50 flex items-center justify-center shrink-0">
                    <Briefcase className="h-5 w-5 text-cyprus-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="text-[11px] text-cyprus-700 bg-cyprus-50 px-2 py-0.5 rounded-full font-medium">
                        {job.category}
                      </span>
                      {!isAssignment && (
                        <Badge variant="secondary" className="text-[10px]">
                          {(item as OfferRow).status === 'pending' ? 'Awaiting response' : (item as OfferRow).status}
                        </Badge>
                      )}
                      {isAssignment && (item as AssignmentRow).submitted_at && !(item as AssignmentRow).approved_at && (
                        <Badge variant="warning" className="text-[10px]">Awaiting approval</Badge>
                      )}
                      {isAssignment && (item as AssignmentRow).approved_at && (
                        <Badge variant="success" className="text-[10px]">Completed</Badge>
                      )}
                      {isAssignment && !(item as AssignmentRow).submitted_at && (
                        <Badge variant="default" className="text-[10px]">In progress</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-sand-900 truncate text-sm">{job.title}</h3>
                    {job.address && !job.is_remote && (
                      <p className="flex items-center gap-1 text-xs text-sand-400 mt-0.5 truncate">
                        <MapPin className="h-3 w-3 shrink-0" />{job.address}
                      </p>
                    )}
                    {job.is_remote && (
                      <p className="text-xs text-sand-400 mt-0.5">Remote</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-bold text-sand-900 text-sm">{formatCurrency(priceAmount)}</div>
                    {isAssignment && <div className="text-[10px] text-sand-400">your cut</div>}
                  </div>
                  <ChevronRight className="h-4 w-4 text-sand-300 shrink-0" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
