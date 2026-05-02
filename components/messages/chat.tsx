'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Send, Loader2, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatRelativeTime } from '@/lib/utils/format'

type Message = {
  id: string
  sender_id: string
  body: string
  created_at: string
  sender_name?: string | null
}

interface JobChatProps {
  jobId: string
  currentUserId: string
  /** Display name of the other party shown at the top of the panel. */
  otherName: string
}

export function JobChat({ jobId, currentUserId, otherName }: JobChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const lastMsgAt = useRef<string | null>(null)
  const prevCount = useRef(0)

  // Load history on first open
  useEffect(() => {
    if (!open) return
    setUnread(0)
    setLoading(true)

    fetch(`/api/messages/${jobId}`)
      .then((r) => r.json())
      .then((data: Message[]) => {
        setMessages(data ?? [])
        if (data?.length) lastMsgAt.current = data[data.length - 1].created_at
        prevCount.current = data?.length ?? 0
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [open, jobId])

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  // Poll for new messages (whether open or closed, for badge count)
  const poll = useCallback(() => {
    const url = lastMsgAt.current
      ? `/api/messages/${jobId}?after=${encodeURIComponent(lastMsgAt.current)}`
      : null
    if (!url) return

    fetch(url)
      .then((r) => r.json())
      .then((data: Message[]) => {
        if (!data?.length) return
        const fresh = data.filter((m) => {
          // Only count incoming messages for badge when closed
          if (!open && m.sender_id !== currentUserId) setUnread((n) => n + 1)
          return true
        })
        if (!fresh.length) return
        lastMsgAt.current = fresh[fresh.length - 1].created_at
        if (open) {
          setMessages((prev) => {
            const ids = new Set(prev.map((m) => m.id))
            return [...prev, ...fresh.filter((m) => !ids.has(m.id))]
          })
        }
      })
      .catch(() => {})
  }, [jobId, open, currentUserId])

  useEffect(() => {
    if (loading) return
    const interval = setInterval(poll, 4_000)
    return () => clearInterval(interval)
  }, [loading, poll])

  async function sendMessage() {
    const text = body.trim()
    if (!text || sending) return
    setSending(true)
    setBody('')

    // Optimistic add
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      sender_id: currentUserId,
      body: text,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])

    const res = await fetch(`/api/messages/${jobId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: text }),
    })

    setSending(false)
    if (!res.ok) {
      setBody(text) // restore on error
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50">
      {/* Floating chat panel */}
      {open && (
        <div className="mb-3 w-80 md:w-96 rounded-2xl border border-sand-200 bg-white shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: 'min(480px, 70vh)' }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-cyprus-700 text-sand shrink-0">
            <div className="h-8 w-8 rounded-full bg-cyprus-500 flex items-center justify-center text-sm font-bold">
              {otherName[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{otherName}</div>
              <div className="text-xs text-cyprus-200">Job chat · end-to-end context</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-cyprus-200 hover:text-white transition-colors text-xl leading-none"
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-sand-50">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-sand-400" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-sand-500 text-sm">
                No messages yet. Say hello!
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.sender_id === currentUserId
                return (
                  <div key={msg.id} className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
                    <div className={cn(
                      'max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm',
                      isOwn
                        ? 'bg-cyprus-700 text-white rounded-br-sm'
                        : 'bg-white border border-sand-200 text-sand-900 rounded-bl-sm'
                    )}>
                      <p className="leading-relaxed whitespace-pre-wrap wrap-break-word">{msg.body}</p>
                      <p className={cn('text-[10px] mt-1', isOwn ? 'text-cyprus-200' : 'text-sand-400')}>
                        {formatRelativeTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex items-end gap-2 px-3 py-2.5 border-t border-sand-200 bg-white shrink-0">
            <textarea
              ref={inputRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (Enter to send)"
              rows={1}
              className="flex-1 resize-none rounded-xl border border-sand-200 bg-sand-50 px-3 py-2 text-sm placeholder:text-sand-400 focus:outline-none focus:ring-2 focus:ring-cyprus-500/30 focus:border-cyprus-500 max-h-24 overflow-y-auto"
              style={{ fieldSizing: 'content' } as React.CSSProperties}
            />
            <button
              onClick={sendMessage}
              disabled={!body.trim() || sending}
              className="h-9 w-9 rounded-xl bg-cyprus-700 text-white flex items-center justify-center hover:bg-cyprus-800 transition-colors disabled:opacity-40 shrink-0"
              aria-label="Send"
            >
              {sending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Send className="h-4 w-4" />
              }
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative h-14 w-14 rounded-full bg-cyprus-700 text-white shadow-lg hover:bg-cyprus-800 transition-colors flex items-center justify-center ml-auto"
        aria-label="Toggle chat"
      >
        <MessageCircle className="h-6 w-6" />
        {unread > 0 && !open && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-clay-400 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </div>
  )
}
