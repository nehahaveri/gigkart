import Link from 'next/link'
import { MapPin, Clock, Users, Shield, Zap, IndianRupee, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDistance, formatRelativeTime } from '@/lib/utils/format'
import type { Job } from '@/types'

interface JobCardProps {
  job: Job
}

const DURATION_LABELS: Record<string, string> = {
  few_hours: 'Few hrs',
  '1_day': '1 day',
  '2_3_days': '2–3 days',
  '1_week': '1 week',
  single_task: 'One-time',
  recurring: 'Recurring',
}

const CATEGORY_COLORS: Record<string, string> = {
  Cleaning: 'bg-blue-50 text-blue-700',
  Delivery: 'bg-orange-50 text-orange-700',
  Tutoring: 'bg-violet-50 text-violet-700',
  Repairs: 'bg-red-50 text-red-700',
  Cooking: 'bg-amber-50 text-amber-700',
  'Personal Care': 'bg-pink-50 text-pink-700',
  Moving: 'bg-cyan-50 text-cyan-700',
  Other: 'bg-sand-100 text-sand-600',
}

export function JobCard({ job }: JobCardProps) {
  const catColor = CATEGORY_COLORS[job.category] ?? 'bg-sand-100 text-sand-600'

  return (
    <Link href={`/jobs/${job.id}`} className="block group">
      <div className="bg-white rounded-2xl border border-sand-200 p-4 hover:border-sand-300 hover:shadow-md transition-all duration-150">
        <div className="flex items-start gap-3">
          {/* Category icon circle */}
          <div className={`shrink-0 h-10 w-10 rounded-xl flex items-center justify-center text-xs font-bold ${catColor}`}>
            {job.category.slice(0, 2).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            {/* Top row: badges */}
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${catColor}`}>
                {job.category}
              </span>
              {job.is_urgent && (
                <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                  <Zap className="h-2.5 w-2.5" />Urgent
                </span>
              )}
              {job.payment_mode === 'escrow' && (
                <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-success-50 text-success-600">
                  <Shield className="h-2.5 w-2.5" />Escrow
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-sand-900 leading-snug line-clamp-1 group-hover:text-cyprus-700 transition-colors">
              {job.title}
            </h3>
            <p className="text-sm text-sand-500 mt-0.5 line-clamp-2 leading-relaxed">{job.description}</p>
          </div>

          {/* Budget */}
          <div className="shrink-0 text-right">
            <div className="font-bold text-sand-900 text-base">{formatCurrency(job.budget)}</div>
            <div className="text-[11px] text-sand-400 capitalize">{job.budget_type}</div>
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-3 pt-3 border-t border-sand-100 flex items-center gap-3 text-[11px] text-sand-500">
          {job.is_remote ? (
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />Remote</span>
          ) : job.distance_km !== undefined ? (
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{formatDistance(job.distance_km)}</span>
          ) : null}
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{DURATION_LABELS[job.duration_type] ?? job.duration_type}</span>
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{job.num_taskers} needed</span>
          <span className="ml-auto text-sand-400">{formatRelativeTime(job.created_at)}</span>
          <ChevronRight className="h-3.5 w-3.5 text-sand-300 group-hover:text-cyprus-700 transition-colors" />
        </div>
      </div>
    </Link>
  )
}



