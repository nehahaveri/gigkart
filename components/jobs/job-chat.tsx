'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Loader2, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatRelativeTime } from '@/lib/utils/format'

type Message = {
  id: string
  sender_id: string
  body: string
  created_at: string
  sender?: { full_name: string }[] | null
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

  // Load history on first open
  useEffect(() => {
    if (!open) return
    setUnread(0)

    const supabase = createClient()
    supabase
      .from('messages')
      .select('id, sender_id, body, created_at, sender:users!messages_sender_id_fkey(full_name)')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        setMessages((data ?? []) as unknown as Message[])
        setLoading(false)
      })

    // Real-time
    const channel = supabase
      .channel(`job-chat-${jobId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `job_id=eq.${jobId}` },
        (payload) => {
          const msg = payload.new as Message
          setMessages((prev) => {
            // avoid duplicate from optimistic add
            if (prev.some((m) => m.id === msg.id)) return prev
            return [...prev, msg]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [open, jobId])

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  // Badge: count incoming messages when panel is closed
  useEffect(() => {
    if (open) return
    const supabase = createClient()
    const channel = supabase
      .channel(`job-chat-badge-${jobId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `job_id=eq.${jobId}` },
        (payload) => {
          const msg = payload.new as Message
          if (msg.sender_id !== currentUserId) {
            setUnread((n) => n + 1)
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [open, jobId, currentUserId])

  async function sendMessage() {
    const text = body.trim()
    if (!text || sending) return
    setSending(true)
    setBody('')

    const supabase = createClient()
    const { error } = await supabase.from('messages').insert({
      job_id: jobId,
      sender_id: currentUserId,
      body: text,
    })
    setSending(false)
    if (error) setBody(text) // restore on error
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
                      <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.body}</p>
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
