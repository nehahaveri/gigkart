import Link from 'next/link'
import { Briefcase } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-sand-200 bg-sand-50">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <div className="h-9 w-9 rounded-xl bg-cyprus-700 flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-sand" />
              </div>
              <span className="font-bold text-lg tracking-tight text-cyprus-700">
                GigKart
              </span>
            </Link>
            <p className="mt-4 text-sm text-sand-600 leading-relaxed max-w-xs">
              Hyperlocal micro-gig marketplace connecting local taskers with people who need help.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold tracking-[0.15em] text-clay-400 uppercase mb-4">For Posters</h3>
            <ul className="space-y-3 text-sm text-sand-700">
              <li><Link href="/post-job" className="hover:text-cyprus-700 transition-colors">Post a Job</Link></li>
              <li><Link href="/my-jobs" className="hover:text-cyprus-700 transition-colors">My Jobs</Link></li>
              <li><Link href="/dashboard" className="hover:text-cyprus-700 transition-colors">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold tracking-[0.15em] text-clay-400 uppercase mb-4">For Taskers</h3>
            <ul className="space-y-3 text-sm text-sand-700">
              <li><Link href="/jobs" className="hover:text-cyprus-700 transition-colors">Find Work</Link></li>
              <li><Link href="/my-work" className="hover:text-cyprus-700 transition-colors">My Work</Link></li>
              <li><Link href="/onboarding" className="hover:text-cyprus-700 transition-colors">Get Started</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold tracking-[0.15em] text-clay-400 uppercase mb-4">Company</h3>
            <ul className="space-y-3 text-sm text-sand-700">
              <li><Link href="/" className="hover:text-cyprus-700 transition-colors">About</Link></li>
              <li><Link href="/" className="hover:text-cyprus-700 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/" className="hover:text-cyprus-700 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-sand-200 flex items-center justify-between text-xs text-sand-500">
          <span>© {new Date().getFullYear()} GigKart. All rights reserved.</span>
          <span className="hidden md:inline">Made in India · हाथ से बनाया गया</span>
        </div>
      </div>
    </footer>
  )
}
