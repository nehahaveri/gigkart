-- ─────────────────────────────────────────────────────────────────────────────
-- GigKart — Migration 005: Schema fixes + KYC verification
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────
-- FIX 1: rename users.roles → users.role
-- (all app code references the singular "role")
-- ─────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'roles'
  ) THEN
    ALTER TABLE public.users RENAME COLUMN roles TO role;
  END IF;
END $$;

-- ─────────────────────────────────────────
-- FIX 2: add bank_account column to users
-- (settings form saves bank_account; column was missing)
-- ─────────────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS bank_account text;

-- ─────────────────────────────────────────
-- FIX 3: rename job_assignments columns to match app code
-- proof_urls         → proof_photos
-- proof_submitted_at → submitted_at
-- completed_at       → approved_at
-- ─────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_assignments' AND column_name = 'proof_urls'
  ) THEN
    ALTER TABLE public.job_assignments RENAME COLUMN proof_urls TO proof_photos;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_assignments' AND column_name = 'proof_submitted_at'
  ) THEN
    ALTER TABLE public.job_assignments RENAME COLUMN proof_submitted_at TO submitted_at;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_assignments' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE public.job_assignments RENAME COLUMN completed_at TO approved_at;
  END IF;
END $$;

-- ─────────────────────────────────────────
-- FIX 4: Fix is_admin() function — now references role (not roles)
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND 'admin' = ANY(role)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─────────────────────────────────────────
-- FIX 5: partial index on assignments — update column reference
-- ─────────────────────────────────────────
DROP INDEX IF EXISTS idx_assignments_pending_release;
CREATE INDEX IF NOT EXISTS idx_assignments_pending_release
  ON public.job_assignments (submitted_at)
  WHERE submitted_at IS NOT NULL AND approved_at IS NULL;

-- ─────────────────────────────────────────
-- NEW: kyc_requests table
-- Stores identity verification submissions for admin review.
-- Inspired by Airbnb's "Verify your identity" flow.
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.kyc_requests (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  legal_name       text        NOT NULL,
  id_type          text        NOT NULL
                     CHECK (id_type IN ('aadhaar', 'passport', 'driving_license')),
  id_number_last4  text        NOT NULL
                     CHECK (id_number_last4 ~ '^[0-9]{4}$'),
  front_url        text        NOT NULL,
  back_url         text,
  selfie_url       text        NOT NULL,
  status           text        NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  reviewed_by      uuid        REFERENCES public.users(id),
  reviewed_at      timestamptz,
  submitted_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)   -- one active KYC record per user; re-submitted on rejection
);

-- Indexes ─────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_kyc_status  ON public.kyc_requests (status);
CREATE INDEX IF NOT EXISTS idx_kyc_user_id ON public.kyc_requests (user_id);

-- RLS ─────────────────────────────────────────────────────────────────────────
ALTER TABLE public.kyc_requests ENABLE ROW LEVEL SECURITY;

-- User can see and insert their own KYC request
CREATE POLICY IF NOT EXISTS "kyc_select_own" ON public.kyc_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY IF NOT EXISTS "kyc_insert_own" ON public.kyc_requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- User can update only while still pending (to resubmit); admin can always update
CREATE POLICY IF NOT EXISTS "kyc_update_own_pending" ON public.kyc_requests
  FOR UPDATE TO authenticated
  USING (
    (user_id = auth.uid() AND status = 'pending')
    OR public.is_admin()
  );

-- ─────────────────────────────────────────
-- NEW: skills column on users
-- Stores tasker skills as a text array (set during onboarding)
-- ─────────────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS skills text[] NOT NULL DEFAULT '{}';

-- ─────────────────────────────────────────
-- NEW: aadhaar_last4 on users (denormalised for profile display)
-- Set automatically when KYC is approved.
-- ─────────────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS aadhaar_last4 text;
