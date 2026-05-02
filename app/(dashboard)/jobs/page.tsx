import { Suspense } from 'react'
import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/navbar'
import { JobsFeed } from './feed'
import { Loader2, MapPin } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Browse Gigs',
  description: 'Browse nearby micro-gig jobs on GigKart. Filter by category, distance, pay, and more.',
}

export default function JobsPage() {
  return (
    <>
      <Navbar />
      {/* Page header */}
      <div className="bg-cyprus-700 border-b border-cyprus-800">
        <div className="mx-auto max-w-3xl px-4 py-7">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-4 w-4 text-cyprus-200" />
            <span className="text-xs font-semibold tracking-[0.15em] uppercase text-cyprus-200">Find Work</span>
          </div>
          <h1 className="text-2xl font-bold text-sand tracking-tight">Browse gigs near you</h1>
          <p className="text-sm text-cyprus-200 mt-1">
            Jobs posted by people in your area. Send offers and start earning.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6">
        <Suspense fallback={
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-sand-400" />
          </div>
        }>
          <JobsFeed />
        </Suspense>
      </div>
    </>
  )
}
