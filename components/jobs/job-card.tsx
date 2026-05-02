import Link from 'next/link'
import { MapPin, Clock, Users, Shield, Zap, ArrowRight } from 'lucide-react'
import { formatCurrency, formatDistance, formatRelativeTime } from '@/lib/utils/format'
import type { Job } from '@/types'

const DURATION_LABELS: Record<string, string> = {
  few_hours: 'Few hrs',
  '1_day': '1 day',
  '2_3_days': '2–3 days',
  '1_week': '1 week',
  single_task: 'One-time',
  recurring: 'Recurring',
}

const CATEGORY_ICONS: Record<string, string> = {
  Cleaning:         '🧹',
  Delivery:         '📦',
  Tutoring:         '📚',
  Repairs:          '🔧',
  Cooking:          '🍳',
  'Personal Care':  '💆',
  'Moving & Packing': '🚚',
  Moving:           '🚚',
  'Tech Help':      '💻',
  Gardening:        '🌿',
  'Pet Care':       '🐾',
  Errands:          '📍',
  'Event Help':     '🎪',
  Other:            '✨',
}

export function JobCard({ job }: { job: Job }) {
  const icon = CATEGORY_ICONS[job.category] ?? '✨'

  return (
    <Link href={`/jobs/${job.id}`} className="block group">
      <article className="relative bg-white rounded-2xl border border-sand-200 p-4 hover:border-cyprus-200 hover:shadow-md transition-all duration-200 overflow-hidden">
        {/* Accent bar — appears on hover */}
        <div className="absolute left-0 top-3 bottom-3 w-0.75 rounded-r-full bg-cyprus-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        <div className="flex items-start gap-3">
          {/* Category emoji icon */}
          <div className="shrink-0 h-11 w-11 rounded-xl bg-sand-100 flex items-center justify-center text-xl select-none">
            {icon}
          </div>

          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-sand-100 text-sand-600">
                {job.category}
              </span>
              {job.is_urgent && (
                <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-clay-50 text-clay-500">
                  <Zap className="h-2.5 w-2.5 fill-current" />Urgent
                </span>
              )}
              {job.payment_mode === 'escrow' && (
                <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyprus-50 text-cyprus-700">
                  <Shield className="h-2.5 w-2.5" />Escrow
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-sand-900 leading-snug line-clamp-1 group-hover:text-cyprus-700 transition-colors">
              {job.title}
            </h3>
            <p className="text-xs text-sand-500 mt-0.5 line-clamp-2 leading-relaxed">{job.description}</p>
          </div>

          {/* Budget */}
          <div className="shrink-0 text-right ml-1">
            <div className="font-bold text-sand-900">{formatCurrency(job.budget)}</div>
            <div className="text-[10px] text-sand-400 capitalize mt-0.5">{job.budget_type}</div>
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-3 pt-3 border-t border-sand-100 flex items-center gap-3 text-[11px] text-sand-500">
          {job.is_remote ? (
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />Remote</span>
          ) : job.distance_km !== undefined ? (
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{formatDistance(job.distance_km)}</span>
          ) : null}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />{DURATION_LABELS[job.duration_type] ?? job.duration_type}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />{job.num_taskers} needed
          </span>
          <span className="ml-auto">{formatRelativeTime(job.created_at)}</span>
          <ArrowRight className="h-3.5 w-3.5 text-sand-300 group-hover:text-cyprus-700 group-hover:translate-x-0.5 transition-all duration-200" />
        </div>
      </article>
    </Link>
  )
}



