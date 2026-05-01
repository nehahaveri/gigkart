import { Suspense } from 'react'
import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/navbar'
import { JobsFeed } from './jobs-feed'
import { Loader2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Browse Gigs',
  description: 'Browse nearby micro-gig jobs on GigKart. Filter by category, distance, pay, and more.',
}

export default function JobsPage() {
  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold text-sand-900 mb-1">Browse gigs near you</h1>
        <p className="text-sm text-sand-500 mb-6">
          Jobs posted by people in your area. Send offers and start earning.
        </p>
        <Suspense fallback={
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-sand-500" />
          </div>
        }>
          <JobsFeed />
        </Suspense>
      </div>
    </>
  )
}
