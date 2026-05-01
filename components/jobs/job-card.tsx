import Link from 'next/link'
import { MapPin, Clock, Users, Shield, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDistance, formatRelativeTime } from '@/lib/utils/format'
import type { Job } from '@/types'

interface JobCardProps {
  job: Job
}

const DURATION_LABELS: Record<string, string> = {
  few_hours: 'Few hours',
  '1_day': '1 day',
  '2_3_days': '2-3 days',
  '1_week': '1 week',
  single_task: 'Single task',
  recurring: 'Recurring',
}

export function JobCard({ job }: JobCardProps) {
  return (
    <Link href={`/jobs/${job.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-medium text-cyprus-700 bg-cyprus-50 px-2 py-0.5 rounded-full">
                  {job.category}
                </span>
                {job.is_urgent && <Badge variant="urgent"><Zap className="h-3 w-3 mr-0.5" />Urgent</Badge>}
                {job.payment_mode === 'escrow' && (
                  <Badge variant="escrow"><Shield className="h-3 w-3 mr-0.5" />Escrow</Badge>
                )}
              </div>
              <h3 className="font-semibold text-sand-900 truncate">{job.title}</h3>
              <p className="text-sm text-sand-500 mt-1 line-clamp-2">{job.description}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="font-bold text-sand-900">{formatCurrency(job.budget)}</div>
              <div className="text-xs text-sand-500">{job.budget_type}</div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3 text-xs text-sand-500 flex-wrap">
            {job.distance_km !== undefined && !job.is_remote && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {formatDistance(job.distance_km)}
              </span>
            )}
            {job.is_remote && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Remote
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {DURATION_LABELS[job.duration_type]}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {job.num_taskers} needed
            </span>
            <span className="ml-auto">{formatRelativeTime(job.created_at)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
