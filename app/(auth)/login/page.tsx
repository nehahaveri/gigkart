import type { Metadata } from 'next'
import { LoginForm } from './form'
import { Briefcase, Shield, MapPin, Zap, Star } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Log in',
  description: 'Log in to GigKart with your phone number or Google account.',
}

const FEATURES = [
  { icon: Shield, text: 'Payments held in escrow — released only when you approve' },
  { icon: MapPin, text: 'Hyperlocal gigs in your neighbourhood' },
  { icon: Zap,    text: 'Apply in seconds, start earning today' },
]

const TESTIMONIAL = {
  quote: "Got my apartment cleaned in 2 hours — paid securely through escrow. Amazing experience.",
  author: "Priya M., Mumbai",
  rating: 5,
}

export default function LoginPage() {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[1.1fr_1fr]">

      {/* ── Left: brand panel ── */}
      <div className="hidden md:flex flex-col justify-between bg-cyprus-700 px-12 py-10 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute bottom-16 -left-16 h-56 w-56 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute top-1/2 right-8 h-32 w-32 rounded-full bg-white/5" />

        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-2.5 group w-fit">
          <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center group-hover:bg-white/20 transition-colors">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl text-white tracking-tight">GigKart</span>
        </Link>

        {/* Main copy */}
        <div className="relative z-10 space-y-8 mt-auto mb-8">
          <div>
            <h2 className="text-[2.25rem] font-bold text-white leading-[1.15] tracking-tight">
              Find local gigs.<br />Get paid fast.
            </h2>
            <p className="text-cyprus-200 text-sm mt-4 leading-relaxed max-w-sm">
              Hyperlocal micro-tasks for cleaning, tutoring, delivery, repairs and more — with built-in escrow so both sides are always protected.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <div className="shrink-0 h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center mt-0.5">
                  <Icon className="h-3.5 w-3.5 text-cyprus-100" />
                </div>
                <span className="text-sm text-cyprus-100 leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Testimonial */}
        <div className="relative z-10 rounded-2xl bg-white/10 border border-white/10 p-4 backdrop-blur-sm">
          <div className="flex gap-0.5 mb-2">
            {Array.from({ length: TESTIMONIAL.rating }).map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 text-gold-300 fill-gold-300" />
            ))}
          </div>
          <p className="text-sm text-white/90 leading-relaxed italic">&ldquo;{TESTIMONIAL.quote}&rdquo;</p>
          <p className="text-xs text-cyprus-200 mt-2 font-medium">— {TESTIMONIAL.author}</p>
        </div>
      </div>

      {/* ── Right: form panel ── */}
      <div className="flex flex-col items-center justify-center px-6 py-12 bg-sand-50 md:px-10">
        {/* Mobile logo */}
        <div className="md:hidden text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-cyprus-700 flex items-center justify-center">
              <Briefcase className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-xl text-cyprus-700 tracking-tight">GigKart</span>
          </Link>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-sand-900 tracking-tight">Welcome back</h1>
            <p className="text-sm text-sand-500 mt-1">Sign in to your GigKart account</p>
          </div>
          <LoginForm />
          <p className="mt-6 text-center text-[11px] text-sand-400 leading-relaxed">
            By continuing, you agree to our{' '}
            <Link href="/" className="underline hover:text-sand-700 transition-colors">Terms</Link>
            {' '}and{' '}
            <Link href="/" className="underline hover:text-sand-700 transition-colors">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
