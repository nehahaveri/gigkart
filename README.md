# GigKart

A hyperlocal micro-gig marketplace where posters list short tasks (cleaning, tutoring, delivery, repairs) and taskers find, apply for, and complete them. Payments are held in Razorpay escrow and released only when the poster approves the work.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (Postgres + PostGIS + RLS) |
| Auth | Supabase Auth (Google OAuth + Phone OTP via MSG91) |
| Payments | Razorpay (escrow + UPI payouts via Razorpay Route) |
| Realtime | Supabase Realtime (live chat) |
| Storage | Supabase Storage (proof photos, KYC documents) |
| Maps | Google Maps API (location search + radius filter) |

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in your keys:

```bash
cp .env.local.example .env.local
```

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay Dashboard → Settings → API Keys |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Same as `RAZORPAY_KEY_ID` |
| `MSG91_AUTH_KEY` | MSG91 Dashboard → API |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Google Cloud Console → Maps JS API |

### 3. Run database migrations

```bash
supabase db push
```

Or apply the files in `supabase/migrations/` manually, in order.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
app/
├── (auth)/          # Login, onboarding (no navbar)
├── (dashboard)/     # All logged-in pages
│   ├── jobs/        # Browse gigs + job detail + active/dispute/review
│   ├── my-jobs/     # Poster's posted jobs + offer management
│   ├── my-work/     # Tasker's accepted jobs
│   ├── post-job/    # Create a new job listing
│   ├── messages/    # Real-time job chat
│   ├── settings/    # Profile, bank details, KYC verification
│   └── rate/        # Leave a rating after job completion
├── (admin)/         # Admin dashboard + KYC review queue
└── api/             # Payment routes + Razorpay webhook

components/
├── ui/              # shadcn primitives
├── layout/          # Navbar, Footer
├── jobs/            # JobCard
├── messages/        # ConversationView, chat
├── profile/         # VerificationCard (trust badge)
└── payment/         # EscrowCheckout

lib/
├── supabase/        # Server + client + middleware helpers
├── razorpay/        # Razorpay Node SDK wrapper
└── utils/           # cn(), formatters

supabase/migrations/ # All SQL schema files (apply in order)
types/index.ts       # Shared TypeScript interfaces
```

---

## User Roles

| Role | Can do |
|---|---|
| **Poster** | Post jobs, lock escrow, approve/dispute work |
| **Tasker** | Browse jobs, send offers, submit proof, receive UPI payout |
| **Admin** | Resolve disputes, review KYC submissions |

> A single account can hold both Poster and Tasker roles simultaneously.

---

## Payment Flow

```
Poster accepts offer
  → Razorpay order created → Poster pays (escrow locked)
  → Tasker does work → submits proof photos
  → Poster approves → Razorpay Route payout to tasker UPI
                       (tasker receives 90%, 10% platform fee)
  → OR no action in 48h → cron auto-releases payment
  → OR dispute raised → admin reviews → manual resolution
```

---

## Identity Verification (KYC)

Taskers verify their identity via a 5-step flow at `/settings/verify`:

1. Intro & what you need
2. Legal name
3. ID type (Aadhaar / Passport / Driving Licence) + last 4 digits
4. Photo uploads (front, back, selfie with ID)
5. Submitted — pending admin review at `/admin/kyc`

---

## Core Rules

- All payment logic through **Razorpay only**
- All DB access uses **Supabase client with RLS enforced**
- Geo queries use **PostGIS** `ST_DWithin(location, point, radius_metres)`
- Poster pays **0 fees** — tasker payout = `amount × 0.90`
- Escrow **auto-releases 48 hrs** after proof submission (cron job)
- Every `/jobs/[id]` page includes **JobPosting JSON-LD** for SEO
