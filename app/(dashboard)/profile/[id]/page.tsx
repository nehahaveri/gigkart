import { notFound } from 'next/navigation'
import Link from 'next/link'
import { query, queryOne } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { Navbar } from '@/components/layout/navbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BackButton } from '@/components/ui/back-button'
import {
  Star, Shield, MapPin, Calendar, CheckCircle, Settings, Briefcase, Award,
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils/format'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

type UserProfile = {
  id: string
  full_name: string
  city: string | null
  role: string[]
  aadhaar_verified: boolean
  rating_avg: string
  rating_count: number
  completion_rate: string
  created_at: string
}

type ReviewRow = {
  id: string
  overall_rating: string
  quality_rating: string
  punctuality_rating: string
  communication_rating: string
  text: string | null
  created_at: string
  reviewer_id: string
  reviewer_name: string
  reviewer_avatar: string | null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const u = await queryOne<{ full_name: string; city: string | null }>(
    'SELECT full_name, city FROM users WHERE id = $1',
    [id]
  )
  if (!u) return { title: 'Profile not found' }
  return {
    title: `${u.full_name} — GigKart`,
    description: `${u.full_name}'s profile on GigKart${u.city ? ` in ${u.city}` : ''}.`,
  }
}

export default async function ProfilePage({ params }: Props) {
  const { id } = await params

  const [profile, session] = await Promise.all([
    queryOne<UserProfile>('SELECT * FROM users WHERE id = $1', [id]),
    getSession(),
  ])

  if (!profile) notFound()

  const isOwnProfile = session?.userId === id

  const [reviews, completedCount, postedCount] = await Promise.all([
    query<ReviewRow>(
      `SELECT r.*,
              u.id AS reviewer_id, u.full_name AS reviewer_name, u.avatar_url AS reviewer_avatar
       FROM reviews r
       JOIN users u ON u.id = r.reviewer_id
       WHERE r.reviewee_id = $1 AND r.revealed_at IS NOT NULL
       ORDER BY r.created_at DESC LIMIT 20`,
      [id]
    ),
    queryOne<{ cnt: string }>(
      'SELECT COUNT(*)::text AS cnt FROM job_assignments WHERE tasker_id = $1 AND approved_at IS NOT NULL',
      [id]
    ),
    queryOne<{ cnt: string }>(
      'SELECT COUNT(*)::text AS cnt FROM jobs WHERE poster_id = $1',
      [id]
    ),
  ])

  const roles = profile.role ?? []
  const initials = (profile.full_name ?? '?')
    .split(' ')
    .map((s: string) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-sand">

        {/* Cover band */}
        <div className="relative h-36 md:h-44 bg-cyprus-700 overflow-hidden">
          <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-cyprus-500/30 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-clay-400/15 blur-3xl" aria-hidden />
        </div>

        <div className="mx-auto max-w-3xl px-4 pb-16">

          <div className="pt-4 pb-1">
            {!isOwnProfile && <BackButton href="/jobs" label="Back" />}
          </div>

          {/* Avatar row */}
          <div className="flex items-end justify-between -mt-14 mb-5 flex-wrap gap-3">
            <div className="relative z-10 h-28 w-28 md:h-32 md:w-32 rounded-3xl bg-sand-50 border-[3px] border-sand shadow-xl flex items-center justify-center text-cyprus-700 font-bold text-4xl select-none shrink-0">
              {initials}
            </div>
            {isOwnProfile && (
              <Button variant="outline" asChild className="gap-1.5 mb-1">
                <Link href="/settings">
                  <Settings className="h-4 w-4" />
                  Edit profile
                </Link>
              </Button>
            )}
          </div>

          {/* Name + meta */}
          <div className="mb-8">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold text-sand-900 tracking-tight">
                {profile.full_name ?? 'Anonymous'}
              </h1>
              {profile.aadhaar_verified && (
                <Badge variant="success" className="gap-1">
                  <Shield className="h-3 w-3" />Verified
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2 text-sm text-sand-600 flex-wrap">
              {profile.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />{profile.city}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Joined {new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              </span>
            </div>
            <div className="flex gap-1.5 mt-3">
              {roles.map((r) => (
                <Badge key={r} variant="default" className="capitalize">{r}</Badge>
              ))}
            </div>
          </div>

          {/* Stats card */}
          <div className="rounded-3xl bg-white border border-sand-200 p-1 shadow-sm mb-10">
            <div className="rounded-[20px] bg-sand-50 p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Stat
                icon={<Star className="h-4 w-4 text-gold-400 fill-gold-400" />}
                value={Number(profile.rating_avg).toFixed(1)}
                label={`${profile.rating_count} reviews`}
              />
              <Stat
                icon={<Award className="h-4 w-4 text-cyprus-700" />}
                value={completedCount?.cnt ?? '0'}
                label="Jobs completed"
              />
              <Stat
                icon={<Briefcase className="h-4 w-4 text-cyprus-700" />}
                value={postedCount?.cnt ?? '0'}
                label="Jobs posted"
              />
              <Stat
                icon={<CheckCircle className="h-4 w-4 text-success-500" />}
                value={`${Number(profile.completion_rate).toFixed(0)}%`}
                label="Completion rate"
              />
            </div>
          </div>

          {/* Reviews */}
          <section>
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="text-xl font-bold text-sand-900 tracking-tight">Reviews</h2>
              {reviews.length > 0 && (
                <span className="text-sm text-sand-500">{reviews.length} most recent</span>
              )}
            </div>

            {reviews.length === 0 ? (
              <div className="rounded-2xl bg-white border border-sand-200 p-10 text-center">
                <Star className="h-10 w-10 text-sand-300 mx-auto mb-3" />
                <p className="text-sm text-sand-600">No reviews yet.</p>
                <p className="text-xs text-sand-500 mt-1">
                  {isOwnProfile
                    ? 'Complete your first job to start collecting reviews.'
                    : "This user hasn't completed any reviewed jobs yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => {
                  const initial = review.reviewer_name?.[0]?.toUpperCase() ?? '?'
                  return (
                    <div key={review.id} className="rounded-2xl bg-white border border-sand-200 p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <Link href={`/profile/${review.reviewer_id}`}>
                          <div className="h-10 w-10 rounded-full bg-cyprus-50 border border-sand-200 flex items-center justify-center text-cyprus-700 font-bold text-sm">
                            {initial}
                          </div>
                        </Link>
                        <div className="flex-1">
                          <Link href={`/profile/${review.reviewer_id}`} className="font-semibold text-sm text-sand-900 hover:underline">
                            {review.reviewer_name ?? 'Anonymous'}
                          </Link>
                          <div className="text-xs text-sand-500 mt-0.5">{formatRelativeTime(review.created_at)}</div>
                        </div>
                        <div className="flex items-center gap-0.5 px-2.5 py-1 rounded-full bg-sand-50 border border-sand-200">
                          <Star className="h-3.5 w-3.5 text-gold-400 fill-gold-400" />
                          <span className="text-sm font-semibold text-sand-900">{review.overall_rating}</span>
                        </div>
                      </div>
                      {review.text && (
                        <p className="text-sm text-sand-700 leading-relaxed">{review.text}</p>
                      )}
                      <div className="flex gap-4 mt-3 pt-3 border-t border-sand-100 text-xs text-sand-500">
                        <span>Quality <strong className="text-sand-800 ml-0.5">{review.quality_rating}</strong>/5</span>
                        <span>Punctuality <strong className="text-sand-800 ml-0.5">{review.punctuality_rating}</strong>/5</span>
                        <span>Communication <strong className="text-sand-800 ml-0.5">{review.communication_rating}</strong>/5</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  )
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-sand-900 tracking-tight">
        {icon}
        <span>{value}</span>
      </div>
      <div className="text-xs text-sand-600 mt-1 font-medium">{label}</div>
    </div>
  )
}
