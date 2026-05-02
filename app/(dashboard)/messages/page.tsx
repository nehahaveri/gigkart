import { redirect } from 'next/navigation'
import { query } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
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
  const session = await getSession()
  if (!session) redirect('/login')

  // Fetch all conversations: jobs where I'm tasker OR poster with an accepted assignment
  const rows = await query<{
    job_id: string; job_title: string; job_status: string
    other_id: string; other_name: string | null; other_avatar: string | null
    my_role: 'poster' | 'tasker'
    last_msg: string | null; last_msg_at: string | null
  }>(
    `WITH my_convos AS (
       -- As tasker
       SELECT a.job_id, j.title AS job_title, j.status AS job_status,
              j.poster_id AS other_id, p.full_name AS other_name, p.avatar_url AS other_avatar,
              'tasker'::text AS my_role
       FROM job_assignments a
       JOIN jobs j ON j.id = a.job_id
       JOIN users p ON p.id = j.poster_id
       WHERE a.tasker_id = $1
       UNION ALL
       -- As poster
       SELECT a.job_id, j.title AS job_title, j.status AS job_status,
              a.tasker_id AS other_id, t.full_name AS other_name, t.avatar_url AS other_avatar,
              'poster'::text AS my_role
       FROM job_assignments a
       JOIN jobs j ON j.id = a.job_id
       JOIN users t ON t.id = a.tasker_id
       WHERE j.poster_id = $1
     ),
     latest_msgs AS (
       SELECT DISTINCT ON (job_id) job_id, body, created_at
       FROM messages
       ORDER BY job_id, created_at DESC
     )
     SELECT c.*, lm.body AS last_msg, lm.created_at AS last_msg_at
     FROM my_convos c
     LEFT JOIN latest_msgs lm ON lm.job_id = c.job_id
     ORDER BY lm.created_at DESC NULLS LAST`,
    [session.userId]
  )

  const convos: Convo[] = rows.map((r) => ({
    jobId: r.job_id,
    jobTitle: r.job_title,
    jobStatus: r.job_status,
    otherName: r.other_name ?? (r.my_role === 'tasker' ? 'Poster' : 'Tasker'),
    otherAvatar: r.other_avatar,
    lastMessage: r.last_msg,
    lastMessageAt: r.last_msg_at,
    myRole: r.my_role,
  }))

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
