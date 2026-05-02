'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Send, Loader2, ChevronDown, Info } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatRelativeTime } from '@/lib/utils/format'
import type { User } from '@/types'

type Message = {
  id: string
  sender_id: string
  body: string
  created_at: string
  sender_name?: string | null
}

interface ConversationViewProps {
  jobId: string
  jobTitle: string
  currentUserId: string
  otherUser: Pick<User, 'id' | 'full_name' | 'avatar_url'>
  onShowProfile?: () => void
  showProfileButton?: boolean
}

export function ConversationView({
  jobId,
  jobTitle,
  currentUserId,
  otherUser,
  onShowProfile,
  showProfileButton = false,
}: ConversationViewProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [atBottom, setAtBottom] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lastMsgAt = useRef<string | null>(null)

  // Initial load
  useEffect(() => {
    fetch(`/api/messages/${jobId}`)
      .then((r) => r.json())
      .then((data: Message[]) => {
        setMessages(data ?? [])
        if (data?.length) lastMsgAt.current = data[data.length - 1].created_at
        setLoading(false)
        setTimeout(() => bottomRef.current?.scrollIntoView(), 50)
      })
      .catch(() => setLoading(false))
  }, [jobId])

  // Polling — fetch new messages every 4s
  const poll = useCallback(() => {
    const url = lastMsgAt.current
      ? `/api/messages/${jobId}?after=${encodeURIComponent(lastMsgAt.current)}`
      : `/api/messages/${jobId}`

    fetch(url)
      .then((r) => r.json())
      .then((data: Message[]) => {
        if (!data?.length) return
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id))
          const fresh = data.filter((m) => !ids.has(m.id))
          if (!fresh.length) return prev
          lastMsgAt.current = fresh[fresh.length - 1].created_at
          return [...prev, ...fresh]
        })
      })
      .catch(() => {})
  }, [jobId])

  useEffect(() => {
    if (loading) return
    const interval = setInterval(poll, 4_000)
    return () => clearInterval(interval)
  }, [loading, poll])

  // Auto-scroll when new messages arrive and user is at bottom
  useEffect(() => {
    if (atBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, atBottom])

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60
    setAtBottom(isAtBottom)
  }

  async function sendMessage() {
    const text = body.trim()
    if (!text || sending) return

    const optimisticId = `opt-${Date.now()}`
    const optimistic: Message = {
      id: optimisticId,
      sender_id: currentUserId,
      body: text,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])
    setBody('')
    setSending(true)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    const res = await fetch(`/api/messages/${jobId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: text }),
    })

    setSending(false)
    if (!res.ok) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
      return
    }
    // Replace optimistic with a confirmed version (same content, poll will confirm later)
    setMessages((prev) =>
      prev.map((m) =>
        m.id === optimisticId ? { ...m, id: `sent-${Date.now()}` } : m
      )
    )
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Group messages by date for dividers
  function getDateLabel(iso: string) {
    const d = new Date(iso)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  // Build message groups with date separators
  const grouped: Array<Message | { __date: string }> = []
  let lastDate = ''
  for (const msg of messages) {
    const label = getDateLabel(msg.created_at)
    if (label !== lastDate) {
      grouped.push({ __date: label })
      lastDate = label
    }
    grouped.push(msg)
  }

  const initials = (otherUser.full_name ?? '?')[0]?.toUpperCase()

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-sand-200 bg-white">
        <div className="h-9 w-9 rounded-full bg-cyprus-100 flex items-center justify-center text-cyprus-700 font-bold text-sm shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sand-900 text-sm truncate">{otherUser.full_name}</div>
          <div className="text-xs text-sand-400 truncate">Re: {jobTitle}</div>
        </div>
        {showProfileButton && onShowProfile && (
          <button
            onClick={onShowProfile}
            className="shrink-0 h-8 w-8 rounded-xl border border-sand-200 flex items-center justify-center text-sand-500 hover:bg-sand-50 hover:text-sand-700 transition-colors"
            title="View profile"
          >
            <Info className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Message list ── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-sand-50"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-5 w-5 animate-spin text-sand-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-10">
            <div className="h-12 w-12 rounded-full bg-sand-200 flex items-center justify-center">
              <Send className="h-5 w-5 text-sand-400 -rotate-45 translate-x-0.5" />
            </div>
            <p className="text-sm font-medium text-sand-600">Start the conversation</p>
            <p className="text-xs text-sand-400">
              Discuss job details, timings, and expectations with {otherUser.full_name?.split(' ')[0] ?? 'them'}.
            </p>
          </div>
        ) : (
          grouped.map((item, i) => {
            if ('__date' in item) {
              return (
                <div key={`date-${i}`} className="flex items-center gap-3 py-2">
                  <div className="flex-1 h-px bg-sand-200" />
                  <span className="text-[10px] font-medium text-sand-400">{item.__date}</span>
                  <div className="flex-1 h-px bg-sand-200" />
                </div>
              )
            }
            const isOwn = item.sender_id === currentUserId
            return (
              <div key={item.id} className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
                <div className="max-w-[75%]">
                  <div
                    className={cn(
                      'px-3.5 py-2 rounded-2xl text-sm leading-relaxed',
                      isOwn
                        ? 'bg-cyprus-700 text-white rounded-br-sm'
                        : 'bg-white border border-sand-200 text-sand-800 rounded-bl-sm shadow-xs'
                    )}
                  >
                    {item.body}
                  </div>
                  <div
                    className={cn(
                      'text-[10px] mt-0.5 text-sand-400',
                      isOwn ? 'text-right' : 'text-left'
                    )}
                  >
                    {formatRelativeTime(item.created_at)}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Scroll to bottom button ── */}
      {!atBottom && (
        <button
          onClick={() => { setAtBottom(true); bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }}
          className="absolute bottom-20 right-4 h-8 w-8 rounded-full bg-white border border-sand-200 shadow-md flex items-center justify-center hover:bg-sand-50 transition-colors"
        >
          <ChevronDown className="h-4 w-4 text-sand-600" />
        </button>
      )}

      {/* ── Composer ── */}
      <div className="border-t border-sand-200 bg-white px-3 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${otherUser.full_name?.split(' ')[0] ?? 'them'}…`}
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-sand-200 bg-sand-50 px-3.5 py-2.5 text-sm placeholder:text-sand-400 focus:outline-none focus:ring-2 focus:ring-cyprus-500/30 focus:border-cyprus-500 transition-colors max-h-32 overflow-y-auto"
            style={{ minHeight: '2.5rem' }}
          />
          <button
            onClick={sendMessage}
            disabled={!body.trim() || sending}
            className="shrink-0 h-10 w-10 rounded-2xl bg-cyprus-700 text-white flex items-center justify-center hover:bg-cyprus-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-[10px] text-sand-400 mt-1.5 px-1">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
