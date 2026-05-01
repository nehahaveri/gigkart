'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import { formatCurrency, formatRelativeTime } from '@/lib/utils/format'
import { Clock, Users, Zap, ChevronRight } from 'lucide-react'
import type { JobStatus } from '@/types'

type JobRow = {
  id: string
  title: string
  category: string
  budget: number
  budget_type: string
  status: JobStatus
  is_urgent: boolean
  created_at: string
  offers: { count: number }[]
}

const TABS: { key: JobStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Active' },
  { key: 'active', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'disputed', label: 'Disputed' },
  { key: 'cancelled', label: 'Cancelled' },
]

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'secondary'> = {
  open: 'default',
  active: 'warning',
  completed: 'success',
  disputed: 'destructive',
  cancelled: 'secondary',
}

export function MyJobsList({ jobs }: { jobs: JobRow[] }) {
  const [tab, setTab] = useState<JobStatus | 'all'>('all')
  const filtered = tab === 'all' ? jobs : jobs.filter((j) => j.status === tab)

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-3 mb-4 border-b border-sand-100">
        {TABS.map(({ key, label }) => {
          const count = key === 'all' ? jobs.length : jobs.filter((j) => j.status === key).length
          return (
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
              {count > 0 && (
                <span className="ml-1.5 text-xs text-sand-500">({count})</span>
              )}
            </button>
          )
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-sand-500 text-sm">
          No jobs in this category.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => {
            const offerCount = job.offers?.[0]?.count ?? 0
            return (
              <Link key={job.id} href={`/my-jobs/${job.id}/offers`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant={STATUS_VARIANT[job.status] ?? 'secondary'}>
                          {job.status}
                        </Badge>
                        <span className="text-xs text-cyprus-700 bg-cyprus-50 px-2 py-0.5 rounded-full">
                          {job.category}
                        </span>
                        {job.is_urgent && (
                          <Badge variant="urgent">
                            <Zap className="h-3 w-3 mr-0.5" />Urgent
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-sand-900 truncate">{job.title}</h3>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-sand-500">
                        <span className="font-medium text-sand-900">
                          {formatCurrency(job.budget)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {offerCount} offer{offerCount !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(job.created_at)}
                        </span>
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
