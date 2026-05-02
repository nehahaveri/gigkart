'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { JobCard } from '@/components/jobs/job-card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { JOB_CATEGORIES, type Job } from '@/types'
import { Search, MapPin, Loader2, SlidersHorizontal, X, Zap, Clock, Wifi, TrendingUp, CalendarDays } from 'lucide-react'

const FILTER_CHIPS = [
  { key: 'today', label: 'Today', icon: CalendarDays },
  { key: 'near', label: 'Near me', icon: MapPin },
  { key: 'remote', label: 'Remote', icon: Wifi },
  { key: 'high_pay', label: 'High pay', icon: TrendingUp },
  { key: 'urgent', label: 'Urgent', icon: Zap },
] as const

type FilterKey = (typeof FILTER_CHIPS)[number]['key']

const PAGE_SIZE = 20

const CATEGORY_ICONS: Record<string, string> = {
  Cleaning: '🧹', Delivery: '📦', Tutoring: '📚',
  Repairs: '🔧', Cooking: '🍳', 'Personal Care': '💆',
  Moving: '🚚', Other: '✨',
}

export function JobsFeed() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') ?? ''
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState(initialCategory)
  const [activeFilters, setActiveFilters] = useState<Set<FilterKey>>(new Set())
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const pageRef = useRef(0)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      )
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    pageRef.current = 0
    setLoading(true)

    const lat = userCoords?.lat ?? 19.076
    const lng = userCoords?.lng ?? 72.8777
    const radiusKm = activeFilters.has('near') ? 5 : (activeFilters.has('remote') ? 99999 : 50)

    const params = new URLSearchParams({
      lat: String(lat), lng: String(lng),
      radius_km: String(radiusKm),
      limit: String(PAGE_SIZE), offset: '0',
    })
    if (category) params.set('category', category)

    fetch(`/api/jobs?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        let filtered = (data ?? []) as Job[]
        if (activeFilters.has('today')) {
          const todayStr = new Date().toISOString().slice(0, 10)
          filtered = filtered.filter((j) => j.date_needed?.startsWith(todayStr))
        }
        if (activeFilters.has('remote')) filtered = filtered.filter((j) => j.is_remote)
        if (activeFilters.has('high_pay')) filtered = filtered.filter((j) => j.budget >= 1000)
        if (activeFilters.has('urgent')) filtered = filtered.filter((j) => j.is_urgent)
        if (keyword.trim()) {
          const kw = keyword.toLowerCase()
          filtered = filtered.filter(
            (j) => j.title.toLowerCase().includes(kw) || j.description.toLowerCase().includes(kw)
          )
        }
        setJobs(filtered)
        setHasMore(filtered.length === PAGE_SIZE)
        setLoading(false)
      })
      .catch(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [userCoords, category, activeFilters, keyword])

  function toggleFilter(key: FilterKey) {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(key)) { next.delete(key) } else { next.add(key) }
      return next
    })
  }

  async function loadMore() {
    setLoading(true)
    pageRef.current += 1
    const params = new URLSearchParams({
      lat: String(userCoords?.lat ?? 19.076),
      lng: String(userCoords?.lng ?? 72.8777),
      radius_km: String(activeFilters.has('near') ? 5 : 50),
      limit: String(PAGE_SIZE),
      offset: String(pageRef.current * PAGE_SIZE),
    })
    if (category) params.set('category', category)
    const res = await fetch(`/api/jobs?${params}`)
    const more = (res.ok ? await res.json() : []) as Job[]
    setJobs((prev) => [...prev, ...more])
    setHasMore(more.length === PAGE_SIZE)
    setLoading(false)
  }

  const hasActiveFilters = activeFilters.size > 0 || category || keyword

  return (
    <div className="space-y-4">
      {/* ── Search bar ── */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sand-400" />
          <input
            type="search"
            placeholder="Search gigs…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full h-11 pl-9 pr-4 rounded-xl border border-sand-200 bg-white text-sm placeholder:text-sand-400 focus:outline-none focus:ring-2 focus:ring-cyprus-500/30 focus:border-cyprus-500 transition-colors"
          />
          {keyword && (
            <button
              onClick={() => setKeyword('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-400 hover:text-sand-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            'h-11 w-11 rounded-xl border flex items-center justify-center transition-colors shrink-0',
            showFilters || activeFilters.size > 0
              ? 'bg-cyprus-700 border-cyprus-700 text-white'
              : 'bg-white border-sand-200 text-sand-500 hover:border-sand-300'
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {activeFilters.size > 0 && (
            <span className="sr-only">{activeFilters.size} filters active</span>
          )}
        </button>
      </div>

      {/* ── Filter panel ── */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-sand-200 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-sand-900">Filters</span>
            {activeFilters.size > 0 && (
              <button
                onClick={() => setActiveFilters(new Set())}
                className="text-xs text-cyprus-700 hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTER_CHIPS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleFilter(key)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  activeFilters.has(key)
                    ? 'bg-cyprus-700 text-white border-cyprus-700'
                    : 'bg-white text-sand-600 border-sand-200 hover:border-sand-300'
                )}
              >
                <Icon className="h-3 w-3" />{label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Category pills ── */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        <button
          type="button"
          onClick={() => setCategory('')}
          className={cn(
            'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
            !category ? 'bg-cyprus-700 text-white border-cyprus-700' : 'bg-white text-sand-600 border-sand-200 hover:border-sand-300'
          )}
        >
          All categories
        </button>
        {JOB_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={cn(
              'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
              category === cat ? 'bg-cyprus-700 text-white border-cyprus-700' : 'bg-white text-sand-600 border-sand-200 hover:border-sand-300'
            )}
          >
            {CATEGORY_ICONS[cat] ?? '✨'}{cat}
          </button>
        ))}
      </div>

      {/* ── Location + result count ── */}
      <div className="flex items-center justify-between text-xs text-sand-500">
        <span className="flex items-center gap-1">
          {userCoords ? (
            <><MapPin className="h-3 w-3 text-success-500" />Near your location</>
          ) : (
            <><MapPin className="h-3 w-3" />Mumbai area (default)</>
          )}
        </span>
        {!loading && (
          <span>{jobs.length} gig{jobs.length !== 1 ? 's' : ''} found</span>
        )}
      </div>

      {/* ── Active filter summary ── */}
      {hasActiveFilters && !loading && (
        <div className="flex items-center gap-2 flex-wrap">
          {[...activeFilters].map((f) => {
            const chip = FILTER_CHIPS.find((c) => c.key === f)
            return chip ? (
              <span key={f} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyprus-50 text-cyprus-700 text-xs font-medium">
                {chip.label}
                <button onClick={() => toggleFilter(f)}><X className="h-3 w-3" /></button>
              </span>
            ) : null
          })}
          {category && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyprus-50 text-cyprus-700 text-xs font-medium">
              {category}
              <button onClick={() => setCategory('')}><X className="h-3 w-3" /></button>
            </span>
          )}
        </div>
      )}

      {/* ── Job list ── */}
      {loading && jobs.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-sand-200 p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-sand-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-sand-100 rounded w-24" />
                  <div className="h-4 bg-sand-100 rounded w-3/4" />
                  <div className="h-3 bg-sand-100 rounded w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => <JobCard key={job.id} job={job} />)}
        </div>
      )}

      {loading && jobs.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-sand-400" />
        </div>
      )}

      {!loading && jobs.length === 0 && (
        <div className="rounded-2xl border border-dashed border-sand-200 p-10 text-center">
          <Search className="h-10 w-10 text-sand-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-sand-700">No gigs found</p>
          <p className="text-xs text-sand-400 mt-1 mb-4">Try adjusting your filters or search term.</p>
          <Button variant="outline" size="sm" onClick={() => { setCategory(''); setActiveFilters(new Set()); setKeyword('') }}>
            Clear filters
          </Button>
        </div>
      )}

      {!loading && hasMore && jobs.length > 0 && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={loadMore} className="w-full max-w-xs">
            Load more gigs
          </Button>
        </div>
      )}
    </div>
  )
}


