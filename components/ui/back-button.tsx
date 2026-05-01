'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface BackButtonProps {
  /** Fallback href used when there is no browser history (e.g. direct link). */
  href: string
  label?: string
  className?: string
}

/**
 * Navigates back in browser history.
 * Falls back to `href` when opened directly (no history entry).
 */
export function BackButton({ href, label = 'Back', className }: BackButtonProps) {
  const router = useRouter()

  function handleClick() {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(href)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-1 text-sm font-medium text-sand-600 hover:text-cyprus-700 transition-colors group',
        className
      )}
    >
      <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
      {label}
    </button>
  )
}
