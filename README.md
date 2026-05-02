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

## Running Locally

There are two ways to run GigKart locally. Pick the one that fits your situation.

---

### Option A — Docker (no account setup needed)

> **Best for:** trying out the app, contributors, demos.
> Everything runs inside Docker — no Supabase account, no external services needed.
> Payments, OTP, and Maps won't work (they require real API keys), but auth, jobs, chat, and KYC all work fully.

**Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop/)

```bash
# 1. Clone the repo
git clone https://github.com/nehahaveri/gigkart.git
cd gigkart

# 2. Start everything (first run takes ~2 min to build)
docker compose -f docker-compose.yml -f docker-compose.local.yml --env-file .env.docker up --build
```

That's it. Services available at:

| Service | URL |
|---|---|
| App | http://localhost:3001 |
| Supabase API | http://localhost:8000 |
| Supabase Studio (DB admin) | http://localhost:54323 |
| Postgres | localhost:54322 |

To stop:
```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml down
```

---

### Option B — Local dev server (with your own Supabase account)

> **Best for:** active development, testing payments/OTP with real keys.

**Prerequisites:** Node.js 20+, PostgreSQL 15+ with PostGIS extension

**1. Install dependencies**
```bash
npm install
```

**2. Apply the database schema**
```bash
psql -U postgres -d gigkart -f db/schema.sql
```

**3. Configure environment variables**

Edit `.env.local` with your values:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Random 32+ char string for JWT signing (`openssl rand -base64 32`) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay Dashboard → Settings → API Keys |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Same as `RAZORPAY_KEY_ID` |
| `MSG91_AUTH_KEY` | MSG91 Dashboard → API |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Google Cloud Console → Maps JS API |

**4. Start the dev server**
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
├── auth/            # JWT session (create/verify/destroy)
├── db/              # node-postgres pool + query helpers
├── middleware/      # Edge route guard (proxy.ts)
├── payments/        # Razorpay SDK wrapper
└── utils/           # cn(), formatters

db/schema.sql        # Master PostgreSQL schema (apply once)
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
