import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { PostJobForm } from './post-job-form'
import { BackButton } from '@/components/ui/back-button'

export const metadata: Metadata = {
  title: 'Post a Job',
  description: 'Post a micro-gig task on GigKart and hire local taskers.',
}

export default async function PostJobPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-5">
          <BackButton href="/dashboard" label="Dashboard" />
        </div>
        <h1 className="text-2xl font-bold text-sand-900 mb-1">Post a new job</h1>
        <p className="text-sm text-sand-500 mb-8">
          Describe what you need and set your budget. Local taskers will send offers within minutes.
        </p>
        <PostJobForm />
      </div>
    </>
  )
}
