'use client'

import { useState } from 'react'
import { ConversationView } from '@/components/messages/conversation-view'
import { VerificationCard } from '@/components/messages/verification-card'
import { ArrowLeft, User } from 'lucide-react'
import Link from 'next/link'
import type { User as UserType } from '@/types'

interface MessagesLayoutProps {
  jobId: string
  jobTitle: string
  currentUserId: string
  otherUser: Partial<UserType>
  otherRole: 'poster' | 'tasker'
  backHref: string
}

export function MessagesLayout({
  jobId,
  jobTitle,
  currentUserId,
  otherUser,
  otherRole,
  backHref,
}: MessagesLayoutProps) {
  const [showProfile, setShowProfile] = useState(false)

  return (
    <div className="flex flex-col h-[100dvh] md:h-[calc(100vh-4rem)]">
      {/* Mobile: back + profile toggle */}
      <div className="md:hidden flex items-center gap-2 px-3 py-2 border-b border-sand-200 bg-white shrink-0">
        <Link href={backHref} className="h-8 w-8 rounded-xl flex items-center justify-center hover:bg-sand-100 transition-colors">
          <ArrowLeft className="h-4 w-4 text-sand-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-sand-900 truncate">{otherUser.full_name}</div>
          <div className="text-[11px] text-sand-400 truncate">{jobTitle}</div>
        </div>
        <button
          onClick={() => setShowProfile((v) => !v)}
          className="h-8 w-8 rounded-xl flex items-center justify-center hover:bg-sand-100 transition-colors"
        >
          <User className="h-4 w-4 text-sand-600" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Verification panel ── desktop always visible, mobile slide-in */}
        <aside
          className={`
            shrink-0 overflow-y-auto border-r border-sand-200 bg-sand-50
            md:w-72 md:block
            ${showProfile ? 'block absolute inset-0 z-10 w-full' : 'hidden'}
          `}
        >
          {/* Mobile close button */}
          <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-sand-200 bg-white">
            <span className="font-semibold text-sand-900 text-sm">About {otherUser.full_name?.split(' ')[0]}</span>
            <button
              onClick={() => setShowProfile(false)}
              className="text-xs text-cyprus-700 font-medium"
            >
              Close
            </button>
          </div>

          <div className="p-4">
            {/* Back to job (desktop) */}
            <Link
              href={backHref}
              className="hidden md:flex items-center gap-1.5 text-xs text-sand-500 hover:text-sand-700 mb-4 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to job
            </Link>

            <VerificationCard user={otherUser} role={otherRole} />

            {/* Safety tip */}
            <div className="mt-4 rounded-xl border border-sand-200 bg-white p-3 text-xs text-sand-500 leading-relaxed">
              <span className="font-semibold text-sand-600 block mb-1">Safety tip</span>
              Never share bank OTPs or passwords. All payments are handled securely through GigKart — no need to exchange payment details here.
            </div>
          </div>
        </aside>

        {/* ── Right: Chat ── */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <ConversationView
            jobId={jobId}
            jobTitle={jobTitle}
            currentUserId={currentUserId}
            otherUser={{ id: otherUser.id ?? '', full_name: otherUser.full_name ?? null, avatar_url: otherUser.avatar_url ?? null }}
            onShowProfile={() => setShowProfile(true)}
            showProfileButton
          />
        </div>
      </div>
    </div>
  )
}
