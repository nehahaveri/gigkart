'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Briefcase, Search, Plus, User, Bell } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'

export function Navbar() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-sand-100/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyprus-500 to-success-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <Briefcase className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-sand-900">
            Gig<span className="text-cyprus-700">Kart</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/jobs"
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              pathname.startsWith('/jobs')
                ? 'bg-cyprus-50 text-cyprus-800'
                : 'text-sand-700 hover:bg-sand-50 hover:text-sand-900'
            )}
          >
            <Search className="h-4 w-4" />
            Find Work
          </Link>
          <Link
            href="/my-jobs"
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              pathname.startsWith('/my-jobs')
                ? 'bg-cyprus-50 text-cyprus-800'
                : 'text-sand-700 hover:bg-sand-50 hover:text-sand-900'
            )}
          >
            My Jobs
          </Link>
          <Link
            href="/my-work"
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              pathname.startsWith('/my-work')
                ? 'bg-cyprus-50 text-cyprus-800'
                : 'text-sand-700 hover:bg-sand-50 hover:text-sand-900'
            )}
          >
            My Work
          </Link>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon-sm" asChild className="text-sand-500 hover:text-sand-900">
            <Link href="/dashboard" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon-sm" asChild className="text-sand-500 hover:text-sand-900">
            <Link href="/settings" aria-label="Profile">
              <User className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="sm" asChild className="hidden md:inline-flex ml-1">
            <Link href="/post-job">
              <Plus className="h-4 w-4" />
              Post a Job
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
