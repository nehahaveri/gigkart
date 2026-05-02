import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import Link from 'next/link'
import { MessageCircle, ChevronRight, Briefcase, Clock } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils/format'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Messages' }

type Convo = {
  jobId: string
  jobTitle: string
  jobStatus: string
  otherName: string
  otherAvatar: string | null
  lastMessage: string | null
  lastMessageAt: string | null
  myRole: 'poster' | 'tasker'
}

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1) All assignments where I'm the tasker
  const { data: myAssignments } = await supabase
    .from('job_assignments')
    .select('job_id, job:jobs!job_assignments_job_id_fkey(id, title, status, poster:users!jobs_poster_id_fkey(id, full_name, avatar_url))')
    .eq('tasker_id', user.id)

  // 2) All assignments on my posted jobs where I'm the poster
  const { data: myJobAssignments } = await supabase
    .from('job_assignments')
    .select('job_id, tasker:users!job_assignments_tasker_id_fkey(id, full_name, avatar_url), job:jobs!job_assignments_job_id_fkey(id, title, status, poster_id)')

  const posterConvos = (myJobAssignments ?? []).filter((a) => {
    const j = a.job as unknown as { poster_id: string }
    return j?.poster_id === user.id
  })

  // 3) Collect all job_ids in this conversation list
  const allJobIds = [
    ...(myAssignments ?? []).map((a) => a.job_id),
    ...posterConvos.map((a) => a.job_id),
  ]

  // 4) Fetch latest message per job
  const latestMessages: Record<string, { body: string; created_at: string }> = {}
  if (allJobIds.length > 0) {
    const { data: msgs } = await supabase
      .from('messages')
      .select('job_id, body, created_at')
      .in('job_id', allJobIds)
      .order('created_at', { ascending: false })

    for (const msg of msgs ?? []) {
      if (!latestMessages[msg.job_id]) {
        latestMessages[msg.job_id] = { body: msg.body, created_at: msg.created_at }
      }
    }
  }

  // Build conversation list
  const convos: Convo[] = []

  for (const a of myAssignments ?? []) {
    const j = a.job as unknown as { id: string; title: string; status: string; poster: { id: string; full_name: string | null; avatar_url: string | null } }
    if (!j) continue
    const lm = latestMessages[a.job_id]
    convos.push({
      jobId: j.id,
      jobTitle: j.title,
      jobStatus: j.status,
      otherName: j.poster?.full_name ?? 'Poster',
      otherAvatar: j.poster?.avatar_url ?? null,
      lastMessage: lm?.body ?? null,
      lastMessageAt: lm?.created_at ?? null,
      myRole: 'tasker',
    })
  }

  for (const a of posterConvos) {
    const tasker = a.tasker as unknown as { id: string; full_name: string | null; avatar_url: string | null }
    const j = a.job as unknown as { id: string; title: string; status: string }
    if (!j) continue
    const lm = latestMessages[a.job_id]
    convos.push({
      jobId: j.id,
      jobTitle: j.title,
      jobStatus: j.status,
      otherName: tasker?.full_name ?? 'Tasker',
      otherAvatar: tasker?.avatar_url ?? null,
      lastMessage: lm?.body ?? null,
      lastMessageAt: lm?.created_at ?? null,
      myRole: 'poster',
    })
  }

  // Sort: conversations with messages first (by latest message), then by no message
  convos.sort((a, b) => {
    if (a.lastMessageAt && b.lastMessageAt) {
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    }
    if (a.lastMessageAt) return -1
    if (b.lastMessageAt) return 1
    return 0
  })

  const STATUS_COLOR: Record<string, string> = {
    open: 'bg-success-50 text-success-600',
    active: 'bg-clay-50 text-clay-500',
    completed: 'bg-sand-100 text-sand-500',
    disputed: 'bg-danger-50 text-danger-500',
    cancelled: 'bg-sand-100 text-sand-400',
  }

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-sand-900">Messages</h1>
          <p className="text-sm text-sand-500 mt-1">Your conversations with job posters and taskers</p>
        </div>

        {convos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-sand-200 p-12 text-center">
            <MessageCircle className="h-10 w-10 text-sand-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-sand-700">No conversations yet</p>
            <p className="text-xs text-sand-400 mt-1">
              Once a job offer is accepted, you can message the other party here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {convos.map((c) => {
              const initials = (c.otherName ?? '?')[0]?.toUpperCase()
              return (
                <Link
                  key={`${c.myRole}-${c.jobId}`}
                  href={`/messages/${c.jobId}`}
                  className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-sand-200 hover:border-sand-300 hover:shadow-sm transition-all"
                >
                  {/* Avatar */}
                  <div className="shrink-0 h-11 w-11 rounded-full bg-cyprus-100 flex items-center justify-center text-cyprus-700 font-bold text-base">
                    {c.otherAvatar
                      ? <img src={c.otherAvatar} alt="" className="h-full w-full object-cover rounded-full" />
                      : initials}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-sand-900 text-sm truncate">{c.otherName}</span>
                      <span className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_COLOR[c.jobStatus] ?? 'bg-sand-100 text-sand-500'}`}>
                        {c.jobStatus}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-sand-500">
                      <Briefcase className="h-3 w-3 shrink-0" />
                      <span className="truncate">{c.jobTitle}</span>
                    </div>
                    {c.lastMessage ? (
                      <p className="text-xs text-sand-400 truncate mt-0.5">{c.lastMessage}</p>
                    ) : (
                      <p className="text-xs text-sand-300 italic mt-0.5">No messages yet — start the conversation</p>
                    )}
                  </div>

                  {/* Time + arrow */}
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    {c.lastMessageAt && (
                      <span className="text-[10px] text-sand-400 flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {formatRelativeTime(c.lastMessageAt)}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-sand-300" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
