'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/format'
import { ChevronRight, MapPin } from 'lucide-react'

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

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-3 mb-4 border-b border-sand-100">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              tab === key
                ? 'bg-cyprus-50 text-cyprus-800'
                : 'text-sand-500 hover:text-sand-800 hover:bg-sand-50'
            )}
          >
            {label}
            {counts[key] > 0 && (
              <span className="ml-1.5 text-xs text-sand-500">({counts[key]})</span>
            )}
          </button>
        ))}
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="text-center py-12 text-sand-500 text-sm">
          Nothing here yet.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const job = 'job' in item ? (item as OfferRow | AssignmentRow).job : null
            if (!job) return null
            const isAssignment = 'started_at' in item
            const href = isAssignment ? `/job/${job.id}/active` : `/jobs/${job.id}`

            return (
              <Link key={item.id} href={href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs text-cyprus-700 bg-cyprus-50 px-2 py-0.5 rounded-full">
                          {job.category}
                        </span>
                        {!isAssignment && (
                          <Badge variant="secondary">
                            {(item as OfferRow).status}
                          </Badge>
                        )}
                        {isAssignment && (item as AssignmentRow).submitted_at && !(item as AssignmentRow).approved_at && (
                          <Badge variant="warning">Awaiting approval</Badge>
                        )}
                        {isAssignment && (item as AssignmentRow).approved_at && (
                          <Badge variant="success">Completed</Badge>
                        )}
                        {isAssignment && !(item as AssignmentRow).submitted_at && (
                          <Badge variant="default">In progress</Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-sand-900 truncate">{job.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-sand-500">
                        <span className="font-medium text-sand-900">
                          {formatCurrency(!isAssignment ? (item as OfferRow).price : job.budget)}
                        </span>
                        {job.address && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {job.address}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-sand-300 shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
