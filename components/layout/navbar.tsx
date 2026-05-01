'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Briefcase, Search, Plus, User, LayoutDashboard, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'

const NAV_LINKS = [
  { href: '/jobs',    label: 'Find Work', exact: false },
  { href: '/my-jobs', label: 'My Jobs',   exact: false },
  { href: '/my-work', label: 'My Work',   exact: false },
  { href: '/dashboard', label: 'Dashboard', exact: false },
]

const MOBILE_NAV = [
  { href: '/jobs',      label: 'Find Work',  icon: Search },
  { href: '/my-jobs',   label: 'My Jobs',    icon: Briefcase },
  { href: '/my-work',   label: 'My Work',    icon: Wrench },
  { href: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/profile/me',label: 'Profile',    icon: User },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <>
      {/* ── Desktop / top bar ─────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-sand-200 bg-sand-50/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-9 w-9 rounded-xl bg-cyprus-700 flex items-center justify-center shadow-sm group-hover:bg-cyprus-800 transition-colors">
              <Briefcase className="h-4 w-4 text-sand" />
            </div>
            <span className="font-bold text-lg tracking-tight text-sand-900">
              Gig<span className="text-cyprus-700">Kart</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  pathname.startsWith(href)
                    ? 'bg-cyprus-50 text-cyprus-800'
                    : 'text-sand-700 hover:bg-sand-100 hover:text-sand-900'
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right: Post + Profile */}
          <div className="flex items-center gap-2">
            <Button size="sm" asChild className="hidden md:inline-flex">
              <Link href="/post-job">
                <Plus className="h-4 w-4" />
                Post a Job
              </Link>
            </Button>
            <Link
              href="/profile/me"
              aria-label="Your profile"
              className={cn(
                'h-9 w-9 rounded-xl border flex items-center justify-center transition-colors',
                pathname.startsWith('/profile')
                  ? 'bg-cyprus-700 border-cyprus-700 text-white'
                  : 'bg-white border-sand-200 text-sand-600 hover:border-sand-300 hover:text-sand-900'
              )}
            >
              <User className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Mobile bottom bar ─────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 flex border-t border-sand-200 bg-sand-50/95 backdrop-blur-md">
        {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href) && href !== '/'
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors',
                active ? 'text-cyprus-700' : 'text-sand-500'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom-bar spacer so content isn't hidden behind the bar on mobile */}
      <div className="md:hidden h-[60px]" aria-hidden />
    </>
  )
}
