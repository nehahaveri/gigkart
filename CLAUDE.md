# GigKart — Claude Code project memory

## What this is
Hyperlocal micro-gig marketplace. Posters post tasks (cleaning, tutoring,
delivery, repairs), taskers find and complete them, money held in Razorpay
escrow, released only when poster approves.

## Stack
Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui
Supabase (Postgres + PostGIS + Auth + Realtime + Storage)
Razorpay (escrow + UPI payouts via Razorpay Route)
MSG91 (phone OTP + WhatsApp notifications)
Google Maps API (location search, radius filter, map view)

## Folder conventions
app/(auth)/         → login, onboarding (no navbar)
app/(dashboard)/    → all logged-in poster/tasker pages
app/(admin)/        → admin-only pages
components/ui/      → shadcn primitives only
components/[feat]/  → feature components
lib/                → third-party client wrappers
types/              → shared TypeScript interfaces
db/schema.sql       → master PostgreSQL schema (single source of truth)

## Core rules — never break these
1. All payment logic through Razorpay only
2. All DB access via lib/db (node-postgres pool, no RLS)
3. Geo queries use PostGIS ST_DWithin(location, point, radius_metres)
4. Poster pays 0 fees. Tasker payout = amount × 0.90 (10% platform cut)
5. Escrow auto-releases 48 hrs after proof submission (cron job)
6. Every /jobs/[id] page needs JobPosting JSON-LD for SEO
7. Phone OTP via MSG91, Google OAuth via Supabase Auth

## User roles
poster  → posts jobs, locks escrow, approves/disputes work
tasker  → browses jobs, sends offers, submits proof, gets UPI payout
admin   → resolves disputes, manages users
(users can hold poster + tasker simultaneously)

## Payment flow
accept offer → Razorpay locks escrow → tasker works →
submits proof → poster approves → Razorpay Route payout
(minus 10%) → OR no action 48hrs → cron auto-releases →
OR dispute → admin resolves → manual payout@AGENTS.md
