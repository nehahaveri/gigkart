import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import {
  Briefcase, Search, Shield, Star, Zap, MapPin, Clock, CheckCircle,
  Wrench, Truck, BookOpen, Laptop, Leaf, Heart, Package, Calendar, ChefHat, HelpCircle,
  ArrowRight, Sparkles,
} from 'lucide-react'

const CATEGORIES = [
  { name: 'Cleaning',         icon: Briefcase },
  { name: 'Moving & Packing', icon: Truck },
  { name: 'Repairs',          icon: Wrench },
  { name: 'Delivery',         icon: Package },
  { name: 'Cooking',          icon: ChefHat },
  { name: 'Tutoring',         icon: BookOpen },
  { name: 'Tech Help',        icon: Laptop },
  { name: 'Gardening',        icon: Leaf },
  { name: 'Pet Care',         icon: Heart },
  { name: 'Errands',          icon: MapPin },
  { name: 'Event Help',       icon: Calendar },
  { name: 'Other',            icon: HelpCircle },
]

const POSTER_STEPS = [
  { title: 'Post your task', desc: 'Describe what you need, set your budget, and add photos. Takes 60 seconds.' },
  { title: 'Review offers', desc: 'Local taskers send offers. Compare profiles, ratings, and prices side-by-side.' },
  { title: 'Pay securely', desc: 'Funds held in escrow. Released only after you approve the work.' },
]

const TASKER_STEPS = [
  { title: 'Browse nearby jobs', desc: 'Filter by skill, distance, pay, and availability. Find work near you.' },
  { title: 'Send your offer', desc: 'Set your price and availability. Stand out with a personal message.' },
  { title: 'Get paid instantly', desc: 'Work approved → UPI payout within minutes. No waiting periods.' },
]

const VALUE_PROPS = [
  { icon: Shield,      title: 'Escrow Protection',  desc: 'Money held safely until you approve the work. Zero risk of non-payment.' },
  { icon: Star,        title: 'Verified Taskers',   desc: 'Aadhaar e-KYC verified profiles. Honest ratings from completed jobs.' },
  { icon: Clock,       title: 'Fast UPI Payouts',   desc: 'Work approved → UPI credit in minutes. Not 7 days. Not 30 days.' },
  { icon: MapPin,      title: 'Truly Local',        desc: 'PostGIS-powered radius search. Find help within 1 km of your home.' },
  { icon: CheckCircle, title: 'Proof of Work',      desc: 'Photo / video proof submitted before payment is released.' },
  { icon: Zap,         title: 'Instant Matching',   desc: 'SMS alerts to matching taskers the moment your job goes live.' },
]

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="bg-sand">

        {/* HERO ────────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-4 pt-20 pb-32">
          {/* Soft decorative shapes */}
          <div className="pointer-events-none absolute -top-40 -right-40 h-[480px] w-[480px] rounded-full bg-cyprus-100/30 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-clay-100/40 blur-3xl" aria-hidden />

          <div className="relative mx-auto max-w-5xl">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyprus-100 bg-white/80 backdrop-blur px-4 py-1.5 text-xs font-medium text-cyprus-700 mb-8 shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-clay-400" />
                Hyperlocal · Instant · Secure
              </div>

              <h1 className="font-bold leading-[1.02] tracking-tight text-cyprus-700">
                <span className="block text-5xl md:text-7xl lg:text-8xl">Get things done</span>
                <span className="block text-5xl md:text-7xl lg:text-8xl mt-1 italic font-serif text-clay-400">near you.</span>
              </h1>

              <p className="mt-8 text-lg md:text-xl text-sand-700 max-w-2xl mx-auto leading-relaxed">
                Post a task and hire a local tasker in minutes — or earn money completing tasks
                in your neighbourhood. Trusted by thousands across India.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" asChild className="text-base h-14 px-8 min-w-[180px]">
                  <Link href="/post-job">
                    <Briefcase className="h-5 w-5" />
                    Post a Job
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-base h-14 px-8 min-w-[180px]">
                  <Link href="/jobs">
                    <Search className="h-5 w-5" />
                    Find Work
                  </Link>
                </Button>
              </div>

              <p className="mt-6 text-sm text-sand-600 flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4 text-cyprus-700" />
                No credit card required · Free for first 100 jobs
              </p>
            </div>

            {/* Stats card — sand colored, not dark */}
            <div className="mt-20 mx-auto max-w-4xl rounded-3xl bg-white border border-sand-200 p-1 shadow-sm">
              <div className="rounded-[20px] bg-sand-50 p-8 grid grid-cols-3 gap-6 text-center">
                {[
                  { value: '10,000+', label: 'Tasks Completed' },
                  { value: '5,000+',  label: 'Verified Taskers' },
                  { value: '50+',     label: 'Cities in India' },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="text-3xl md:text-4xl font-bold text-cyprus-700 tracking-tight">{s.value}</div>
                    <div className="text-sand-600 text-sm mt-1.5 font-medium">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CATEGORIES ───────────────────────────────────────── */}
        <section className="px-4 py-24 bg-white border-y border-sand-200">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-clay-400 uppercase mb-2">
                  Categories
                </p>
                <h2 className="text-3xl md:text-4xl font-bold text-cyprus-700 tracking-tight">
                  Whatever you need.<br />
                  <span className="italic font-serif text-sand-700">Locally.</span>
                </h2>
              </div>
              <Link href="/jobs" className="text-sm font-semibold text-cyprus-700 hover:text-cyprus-800 inline-flex items-center gap-1.5 group">
                Browse all jobs
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {CATEGORIES.map(({ name, icon: Icon }) => (
                <Link
                  key={name}
                  href={`/jobs?category=${encodeURIComponent(name)}`}
                  className="group flex flex-col items-center gap-2.5 rounded-2xl px-3 py-5 bg-sand-50 hover:bg-cyprus-700 transition-all duration-200 border border-sand-200 hover:border-cyprus-700"
                >
                  <div className="h-10 w-10 rounded-xl bg-white group-hover:bg-cyprus-800 flex items-center justify-center transition-colors">
                    <Icon className="h-5 w-5 text-cyprus-700 group-hover:text-sand transition-colors" />
                  </div>
                  <span className="text-xs font-semibold text-sand-800 group-hover:text-sand text-center leading-tight transition-colors">
                    {name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS ────────────────────────────────────── */}
        <section className="px-4 py-24">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-16">
              <p className="text-xs font-semibold tracking-[0.2em] text-clay-400 uppercase mb-2">
                How it works
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-cyprus-700 tracking-tight">
                Simple for both sides.
              </h2>
              <p className="mt-3 text-sand-700 max-w-md mx-auto">
                Get matched with someone local in minutes — not hours.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* For Posters */}
              <div className="bg-white rounded-3xl p-8 md:p-10 border border-sand-200 shadow-sm">
                <div className="flex items-baseline gap-3 mb-8 pb-6 border-b border-sand-100">
                  <span className="text-xs font-semibold tracking-[0.2em] text-clay-400 uppercase">
                    For Posters
                  </span>
                  <span className="ml-auto text-xs text-sand-500">3 steps</span>
                </div>
                <ol className="space-y-7">
                  {POSTER_STEPS.map((step, i) => (
                    <li key={step.title} className="flex gap-5">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full border-2 border-cyprus-700 text-cyprus-700 font-serif font-bold text-lg flex items-center justify-center">
                        {i + 1}
                      </div>
                      <div className="pt-1.5">
                        <div className="font-semibold text-sand-900 text-base">{step.title}</div>
                        <div className="text-sm text-sand-600 mt-1.5 leading-relaxed">{step.desc}</div>
                      </div>
                    </li>
                  ))}
                </ol>
                <Button className="mt-10 w-full" asChild>
                  <Link href="/post-job">
                    Post your first job
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {/* For Taskers */}
              <div className="bg-white rounded-3xl p-8 md:p-10 border border-sand-200 shadow-sm">
                <div className="flex items-baseline gap-3 mb-8 pb-6 border-b border-sand-100">
                  <span className="text-xs font-semibold tracking-[0.2em] text-clay-400 uppercase">
                    For Taskers
                  </span>
                  <span className="ml-auto text-xs text-sand-500">3 steps</span>
                </div>
                <ol className="space-y-7">
                  {TASKER_STEPS.map((step, i) => (
                    <li key={step.title} className="flex gap-5">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-clay-50 border-2 border-clay-400 text-clay-500 font-serif font-bold text-lg flex items-center justify-center">
                        {i + 1}
                      </div>
                      <div className="pt-1.5">
                        <div className="font-semibold text-sand-900 text-base">{step.title}</div>
                        <div className="text-sm text-sand-600 mt-1.5 leading-relaxed">{step.desc}</div>
                      </div>
                    </li>
                  ))}
                </ol>
                <Button variant="accent" className="mt-10 w-full" asChild>
                  <Link href="/jobs">
                    Find work near you
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* VALUE PROPS / TRUST ─────────────────────────────── */}
        <section className="px-4 py-24 bg-white border-y border-sand-200">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <p className="text-xs font-semibold tracking-[0.2em] text-clay-400 uppercase mb-2">
                Why GigKart
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-cyprus-700 tracking-tight">
                Built for safety, speed,<br />
                <span className="italic font-serif text-sand-700">and the way India works.</span>
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
              {VALUE_PROPS.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="group">
                  <div className="h-11 w-11 rounded-xl bg-sand flex items-center justify-center mb-4 border border-sand-200 group-hover:bg-cyprus-700 group-hover:border-cyprus-700 transition-colors">
                    <Icon className="h-5 w-5 text-cyprus-700 group-hover:text-sand transition-colors" />
                  </div>
                  <h3 className="font-bold text-sand-900 mb-2">{title}</h3>
                  <p className="text-sm text-sand-600 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA ─────────────────────────────────────────────── */}
        <section className="px-4 py-24">
          <div className="mx-auto max-w-5xl">
            <div className="relative rounded-3xl bg-cyprus-700 p-10 md:p-16 text-center text-sand overflow-hidden">
              <div className="pointer-events-none absolute top-0 right-0 h-80 w-80 rounded-full bg-clay-400/15 blur-3xl" aria-hidden />
              <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 rounded-full bg-cyprus-500/40 blur-3xl" aria-hidden />
              <div className="relative">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                  Ready to get started?
                </h2>
                <p className="mt-4 text-cyprus-100 text-lg max-w-xl mx-auto leading-relaxed">
                  Join thousands of people already using GigKart in their neighbourhood.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    size="lg"
                    asChild
                    className="text-base h-14 px-8 min-w-[200px] bg-sand text-cyprus-700 hover:bg-white hover:text-cyprus-700 shadow-lg"
                  >
                    <Link href="/post-job">Post Your First Job</Link>
                  </Button>
                  <Button
                    size="lg"
                    asChild
                    variant="outline"
                    className="text-base h-14 px-8 min-w-[200px] border-sand/30 bg-transparent text-sand hover:bg-sand/10 hover:border-sand/60 hover:text-sand"
                  >
                    <Link href="/onboarding">Become a Tasker</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
