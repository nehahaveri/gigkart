'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { formatCurrency, formatRelativeTime } from '@/lib/utils/format'
import { Clock, Users, Zap, ChevronRight, Plus, FileText, Briefcase } from 'lucide-react'
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
      {/* Underline tabs */}
      <div className="flex overflow-x-auto border-b border-sand-200 mb-5" style={{ scrollbarWidth: 'none' }}>
        {TABS.map(({ key, label }) => {
          const count = key === 'all' ? jobs.length : jobs.filter((j) => j.status === key).length
          return (
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
              {count > 0 && (
                <span className={cn(
                  'inline-flex items-center justify-center h-4.5 min-w-[1.1rem] px-1 rounded-full text-[10px] font-bold',
                  tab === key ? 'bg-cyprus-100 text-cyprus-700' : 'bg-sand-100 text-sand-500'
                )}>{count}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sand-200 p-10 text-center">
          {tab === 'all' ? (
            <>
              <Plus className="h-10 w-10 text-sand-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-sand-700">No postings yet</p>
              <p className="text-xs text-sand-400 mt-1 mb-4">Post your first job to start receiving offers.</p>
              <Link href="/post-job"><Button size="sm">Post a Job</Button></Link>
            </>
          ) : (
            <>
              <FileText className="h-10 w-10 text-sand-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-sand-700">No {tab} jobs</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => {
            const offerCount = job.offers?.[0]?.count ?? 0
            return (
              <Link key={job.id} href={`/my-jobs/${job.id}/offers`} className="block">
                <div className="bg-white rounded-2xl border border-sand-200 p-4 flex items-center gap-3 hover:border-sand-300 hover:shadow-sm transition-all cursor-pointer">
                  <div className="h-10 w-10 rounded-xl bg-sand-100 flex items-center justify-center shrink-0">
                    <Briefcase className="h-5 w-5 text-sand-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <Badge variant={STATUS_VARIANT[job.status] ?? 'secondary'} className="text-[10px]">
                        {job.status === 'open' ? 'Accepting offers' : job.status}
                      </Badge>
                      <span className="text-[11px] text-cyprus-700 bg-cyprus-50 px-2 py-0.5 rounded-full font-medium">
                        {job.category}
                      </span>
                      {job.is_urgent && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                          <Zap className="h-2.5 w-2.5" />Urgent
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-sand-900 truncate text-sm">{job.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-sand-400">
                      <span className="flex items-center gap-0.5">
                        <Users className="h-3 w-3" />
                        {offerCount} offer{offerCount !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(job.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-bold text-sand-900 text-sm">{formatCurrency(job.budget)}</div>
                    <div className="text-[10px] text-sand-400 capitalize">{job.budget_type}</div>
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
