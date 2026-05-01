import Link from 'next/link'
import {
  CheckCircle2, XCircle, Star, Shield, Award, TrendingUp,
  AlertTriangle, MapPin, Calendar, BarChart2, ExternalLink,
} from 'lucide-react'
import type { User } from '@/types'

type TrustTier = 'pro' | 'trusted' | 'new' | 'caution'

function getTrustTier(u: Partial<User>): TrustTier {
  const jobs = u.rating_count ?? 0
  const rate = u.completion_rate ?? 0
  const verified = u.aadhaar_verified ?? false
  if (verified && jobs >= 5 && rate >= 80) return 'pro'
  if (verified && jobs >= 1) return 'trusted'
  if (!verified && jobs === 0) return 'caution'
  return 'new'
}

const TRUST_META: Record<TrustTier, { label: string; icon: React.ReactNode; className: string; desc: string }> = {
  pro:     { label: 'Pro Tasker',  icon: <Award className="h-3.5 w-3.5" />, className: 'bg-cyprus-700 text-white',        desc: 'ID verified · 5+ jobs · ≥80% completion' },
  trusted: { label: 'Trusted',     icon: <Shield className="h-3.5 w-3.5" />, className: 'bg-success-100 text-success-700', desc: 'ID verified · has reviews' },
  new:     { label: 'New Member',  icon: <TrendingUp className="h-3.5 w-3.5" />, className: 'bg-sand-100 text-sand-600', desc: 'Getting started' },
  caution: { label: 'Unverified',  icon: <AlertTriangle className="h-3.5 w-3.5" />, className: 'bg-amber-100 text-amber-700', desc: 'No ID or reviews yet' },
}

function VerifyRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      {ok
        ? <CheckCircle2 className="h-4 w-4 text-success-500 shrink-0" />
        : <XCircle className="h-4 w-4 text-sand-300 shrink-0" />
      }
      <span className={ok ? 'text-sand-700 text-sm' : 'text-sand-400 text-sm'}>{label}</span>
    </div>
  )
}

function StarRating({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${n <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-sand-200'}`}
        />
      ))}
    </span>
  )
}

interface VerificationCardProps {
  user: Partial<User>
  role: 'poster' | 'tasker'
}

export function VerificationCard({ user, role }: VerificationCardProps) {
  const tier = getTrustTier(user)
  const meta = TRUST_META[tier]
  const initials = (user.full_name ?? '?')[0]?.toUpperCase()

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : null

  return (
    <div className="bg-white rounded-2xl border border-sand-200 overflow-hidden">
      {/* Header band */}
      <div className="bg-cyprus-700 px-5 py-5 flex flex-col items-center gap-3">
        {/* Avatar */}
        <div className="h-16 w-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-white font-bold text-2xl">
          {user.avatar_url
            ? <img src={user.avatar_url} alt="" className="h-full w-full object-cover rounded-full" />
            : initials}
        </div>
        <div className="text-center">
          <div className="font-bold text-white text-base">{user.full_name ?? 'Unknown'}</div>
          <div className="text-cyprus-100 text-xs mt-0.5 capitalize">{role}</div>
        </div>
        {/* Trust tier */}
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.className}`}>
          {meta.icon}{meta.label}
        </span>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-5">

        {/* Verifications */}
        <div>
          <h3 className="text-xs font-semibold text-sand-500 uppercase tracking-wide mb-2.5">Verifications</h3>
          <div className="space-y-2">
            <VerifyRow ok={!!user.phone} label="Phone number confirmed" />
            <VerifyRow ok={!!user.aadhaar_verified} label="Government ID (Aadhaar)" />
            <VerifyRow ok={!!user.email} label="Email address" />
          </div>
        </div>

        {/* Stats (tasker-relevant) */}
        {(user.rating_count ?? 0) > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-sand-500 uppercase tracking-wide mb-2.5">Reviews</h3>
            <div className="flex items-center gap-2">
              <StarRating value={user.rating_avg ?? 0} />
              <span className="text-sm font-semibold text-sand-900">{(user.rating_avg ?? 0).toFixed(1)}</span>
              <span className="text-xs text-sand-400">({user.rating_count} review{user.rating_count !== 1 ? 's' : ''})</span>
            </div>
          </div>
        )}

        {(user.completion_rate ?? 0) > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-sand-500 uppercase tracking-wide mb-2.5">Completion rate</h3>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-sand-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-success-500 transition-all"
                  style={{ width: `${Math.min(user.completion_rate ?? 0, 100)}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-sand-900 shrink-0">{user.completion_rate ?? 0}%</span>
            </div>
          </div>
        )}

        {/* About */}
        <div className="space-y-2">
          {user.city && (
            <div className="flex items-center gap-2 text-sm text-sand-600">
              <MapPin className="h-3.5 w-3.5 text-sand-400 shrink-0" />
              {user.city}
            </div>
          )}
          {memberSince && (
            <div className="flex items-center gap-2 text-sm text-sand-600">
              <Calendar className="h-3.5 w-3.5 text-sand-400 shrink-0" />
              Member since {memberSince}
            </div>
          )}
          {(user.rating_count ?? 0) > 0 && (
            <div className="flex items-center gap-2 text-sm text-sand-600">
              <BarChart2 className="h-3.5 w-3.5 text-sand-400 shrink-0" />
              {user.rating_count} job{user.rating_count !== 1 ? 's' : ''} completed
            </div>
          )}
        </div>

        {/* Trust note */}
        <div className="rounded-xl bg-sand-50 border border-sand-100 px-3 py-2.5 text-xs text-sand-500 leading-relaxed">
          {meta.desc}
        </div>

        {/* View full profile */}
        {user.id && (
          <Link
            href={`/profile/${user.id}`}
            className="flex items-center justify-center gap-1.5 w-full rounded-xl border border-sand-200 py-2 text-sm font-medium text-sand-700 hover:bg-sand-50 hover:border-sand-300 transition-colors"
          >
            View full profile <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  )
}
