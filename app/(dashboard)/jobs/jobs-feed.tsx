'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { JobCard } from '@/components/jobs/job-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { JOB_CATEGORIES, type Job } from '@/types'
import { Search, MapPin, Loader2 } from 'lucide-react'

const FILTER_CHIPS = [
  { key: 'today', label: 'Today only' },
  { key: 'near', label: 'Near me (5 km)' },
  { key: 'remote', label: 'Remote' },
  { key: 'high_pay', label: 'High pay' },
  { key: 'urgent', label: 'Urgent' },
] as const

type FilterKey = (typeof FILTER_CHIPS)[number]['key']

const PAGE_SIZE = 20

export function JobsFeed() {
  const searchParams = useSearchParams()

  const initialCategory = searchParams.get('category') ?? ''
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState(initialCategory)
  const [activeFilters, setActiveFilters] = useState<Set<FilterKey>>(new Set())
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
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

  // Re-fetch when filters / keyword / coords change. Each change resets paging via the ref.
  useEffect(() => {
    let cancelled = false
    pageRef.current = 0
    const supabase = createClient()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)

    const lat = userCoords?.lat ?? 19.076
    const lng = userCoords?.lng ?? 72.8777
    const radiusKm = activeFilters.has('near') ? 5 : 50

    supabase.rpc('nearby_jobs', {
      lat,
      lng,
      radius_km: activeFilters.has('remote') ? 99999 : radiusKm,
      p_category: category || null,
      p_limit: PAGE_SIZE,
      p_offset: 0,
    }).then(({ data, error }) => {
      if (cancelled) return
      if (error) {
        setLoading(false)
        return
      }

      let filtered = (data ?? []) as Job[]
      if (activeFilters.has('today')) {
        const todayStr = new Date().toISOString().slice(0, 10)
        filtered = filtered.filter((j) => j.date_needed && j.date_needed.startsWith(todayStr))
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

    return () => { cancelled = true }
  }, [userCoords, category, activeFilters, keyword])

  function toggleFilter(key: FilterKey) {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function loadMore() {
    setLoading(true)
    pageRef.current += 1
    const supabase = createClient()
    const lat = userCoords?.lat ?? 19.076
    const lng = userCoords?.lng ?? 72.8777
    const radiusKm = activeFilters.has('near') ? 5 : 50

    const { data } = await supabase.rpc('nearby_jobs', {
      lat,
      lng,
      radius_km: activeFilters.has('remote') ? 99999 : radiusKm,
      p_category: category || null,
      p_limit: PAGE_SIZE,
      p_offset: pageRef.current * PAGE_SIZE,
    })

    const more = (data ?? []) as Job[]
    setJobs((prev) => [...prev, ...more])
    setHasMore(more.length === PAGE_SIZE)
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-sand-500" />
        <Input
          placeholder="Search jobs…"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          type="button"
          onClick={() => setCategory('')}
          className={cn(
            'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
            !category
              ? 'bg-cyprus-700 text-white border-cyprus-700'
              : 'bg-white text-sand-700 border-sand-200'
          )}
        >
          All
        </button>
        {JOB_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
              category === cat
                ? 'bg-cyprus-700 text-white border-cyprus-700'
                : 'bg-white text-sand-700 border-sand-200'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_CHIPS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => toggleFilter(key)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
              activeFilters.has(key)
                ? 'bg-sand-900 text-white border-sand-900'
                : 'bg-white text-sand-500 border-sand-200 hover:border-sand-300'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Location hint */}
      {userCoords && (
        <div className="flex items-center gap-1.5 text-xs text-sand-500">
          <MapPin className="h-3 w-3" />
          Showing jobs near your location
        </div>
      )}

      {/* Job list */}
      <div className="space-y-3">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>

      {/* Loading / empty / load more */}
      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-sand-500" />
        </div>
      )}

      {!loading && jobs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sand-500">No jobs found matching your filters.</p>
          <Button
            variant="link"
            className="mt-2"
            onClick={() => {
              setCategory('')
              setActiveFilters(new Set())
              setKeyword('')
            }}
          >
            Clear all filters
          </Button>
        </div>
      )}

      {!loading && hasMore && jobs.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={loadMore}>
            Load more
          </Button>
        </div>
      )}
    </div>
  )
}
